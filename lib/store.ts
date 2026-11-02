// אחסון סריקות והגבלת שימוש ב-Upstash Redis (REST). אותו חיבור שדפדף השתמש בו בפרויקט Vercel.
// בלי Upstash: בפיתוח ובבדיקות — זיכרון מקומי; בייצור — השירות מחזיר "לא זמין" ולא פועל בלי הגנה.
import { createHash } from "node:crypto";
import type { Scan } from "./types";

const SCAN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 יום
export const FREE_SCANS_PER_HOUR = 5;

export class StoreUnavailableError extends Error {
  constructor() {
    super("store unavailable");
    this.name = "StoreUnavailableError";
  }
}

// סדר העדיפות: השמות שחיבור Upstash חדש ב-Vercel יוצר (KV_*), ורק אחר כך השמות הישנים של דפדף —
// כך משתנים שנשארו ממסד שהוסר לא גוברים על מסד חדש.
const ENV_PAIRS: [string, string][] = [
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ["UPSTASH_REDIS_REST_KV_REST_API_URL", "UPSTASH_REDIS_REST_KV_REST_API_TOKEN"],
];

function upstashConfig() {
  for (const [u, t] of ENV_PAIRS) {
    const url = process.env[u];
    const token = process.env[t];
    if (url && token) return { url: url.replace(/\/$/, ""), token, source: u };
  }
  return null;
}

/** בדיקת מצב לאחסון, בלי לחשוף ערכים: האם מוגדר, ואם כן — האם עונה. */
export async function storageHealth(): Promise<{ storage: "ok" | "missing" | "error"; source?: string }> {
  const cfg = upstashConfig();
  if (!cfg) return { storage: memoryAllowed() ? "ok" : "missing", source: memoryAllowed() ? "memory" : undefined };
  try {
    // כתיבה ולא רק קריאה: הסורק צריך לשמור דוחות ולספור סריקות
    await redis([["SET", "takin:health", String(Date.now()), "EX", 60]]);
    return { storage: "ok", source: cfg.source };
  } catch {
    return { storage: "error", source: cfg.source };
  }
}

function memoryAllowed() {
  return process.env.TAKIN_TEST_MEMORY_STORE === "1" || process.env.NODE_ENV !== "production";
}

type Mem = { data: Map<string, { value: string; expires: number }> };
const g = globalThis as unknown as { __takinMem?: Mem };
const mem: Mem = (g.__takinMem ??= { data: new Map() });

async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  const cfg = upstashConfig();
  if (!cfg) {
    if (!memoryAllowed()) throw new StoreUnavailableError();
    const now = Date.now();
    return commands.map(([cmd, key, ...rest]) => {
      const k = String(key);
      const entry = mem.data.get(k);
      const alive = entry && entry.expires > now ? entry : undefined;
      switch (cmd) {
        case "GET":
          return alive?.value ?? null;
        case "SET": {
          const ex = rest.indexOf("EX") >= 0 ? Number(rest[rest.indexOf("EX") + 1]) : 86400;
          mem.data.set(k, { value: String(rest[0]), expires: now + ex * 1000 });
          return "OK";
        }
        case "INCR": {
          const v = Number(alive?.value ?? 0) + 1;
          mem.data.set(k, { value: String(v), expires: alive?.expires ?? now + 3600_000 });
          return v;
        }
        case "EXPIRE": {
          if (alive && rest[0] !== undefined && rest[1] !== "NX") alive.expires = now + Number(rest[0]) * 1000;
          return 1;
        }
        case "TTL":
          return alive ? Math.ceil((alive.expires - now) / 1000) : -2;
        default:
          return null;
      }
    });
  }
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5_000),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Upstash error", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new StoreUnavailableError();
  }
  const json = (await res.json()) as { result?: unknown; error?: string }[];
  // Upstash מחזיר 200 גם כשפקודה נכשלה (למשל NOPERM בטוקן לקריאה בלבד) — בודקים כל תשובה.
  const failed = Array.isArray(json) ? json.find((r) => r && typeof r.error === "string") : { error: "bad response" };
  if (failed) {
    console.error("Upstash command error", String(failed.error).slice(0, 200));
    throw new StoreUnavailableError();
  }
  return json.map((r) => r.result ?? null);
}

const scanKey = (id: string) => `takin:scan:${id}`;

export async function saveScan(scan: Scan): Promise<void> {
  await redis([["SET", scanKey(scan.id), JSON.stringify(scan), "EX", SCAN_TTL_SECONDS]]);
}

export async function loadScan(id: string): Promise<Scan | null> {
  if (!/^[A-Za-z0-9]{8,40}$/.test(id)) return null;
  const [raw] = await redis([["GET", scanKey(id)]]);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as Scan;
  } catch {
    return null;
  }
}

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "takin-rate-limit-v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** 5 סריקות חינם לשעה לכל IP (SPEC §4.1). ה-IP נשמר רק כגיבוב. */
export async function checkScanRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const bucket = Math.floor(Date.now() / 3_600_000);
  const key = `takin:rl:scan:${hashIp(ip)}:${bucket}`;
  const [count, , ttl] = await redis([["INCR", key], ["EXPIRE", key, 3600, "NX"], ["TTL", key]]);
  const limit = process.env.TAKIN_TEST_MEMORY_STORE === "1" ? 1000 : FREE_SCANS_PER_HOUR; // בבדיקות e2e רצות הרבה סריקות מאותו IP
  return { allowed: Number(count) <= limit, retryAfter: Math.max(1, Number(ttl) || 3600) };
}
