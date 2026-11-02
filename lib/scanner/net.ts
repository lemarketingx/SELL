// רשת מוגנת לסורק: רק http/https, חסימת כתובות פנימיות (SSRF) גם אחרי DNS וגם בכל הפניה,
// מגבלת זמן ומגבלת גודל. SPEC §4.1.
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import net from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

export class ScanFetchError extends Error {
  constructor(
    message: string,
    readonly code: "blocked" | "dns" | "timeout" | "too_large" | "not_html" | "http" | "network" | "redirects",
  ) {
    super(message);
    this.name = "ScanFetchError";
  }
}

/** אפשרות בדיקות בלבד: מאפשר localhost כדי שבדיקות e2e יסרקו אתר דמה מקומי. אסור להגדיר בייצור. */
function allowPrivateForTests() {
  return process.env.TAKIN_TEST_ALLOW_PRIVATE === "1" && process.env.VERCEL !== "1";
}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = ipv4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(lower)) return true; // צורה הקסדצימלית של IPv4 ממופה — חוסמים
    const first = parseInt(lower.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // multicast
    if (lower.startsWith("64:ff9b:")) return true; // NAT64
    if (lower.startsWith("2001:db8:")) return true; // documentation
    return false;
  }
  return true;
}

/**
 * lookup מותאם: נקרא בזמן פתיחת החיבור, כך שגם DNS rebinding נחסם —
 * הכתובת שנבדקת היא הכתובת שאליה מתחברים בפועל.
 */
function safeLookup(
  hostname: string,
  options: { all?: boolean; family?: number },
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  dnsLookup(hostname, { all: true, family: options.family ?? 0 }, (err, addresses) => {
    if (err) return callback(err, "");
    const list = addresses as LookupAddress[];
    if (!list.length) return callback(Object.assign(new Error("no address"), { code: "ENOTFOUND" }), "");
    if (!allowPrivateForTests() && list.some((a) => isBlockedIp(a.address))) {
      return callback(Object.assign(new Error("blocked address"), { code: "EBLOCKED" }), "");
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

let agent: Agent | null = null;
function getAgent() {
  agent ??= new Agent({
    connect: { lookup: safeLookup as never, timeout: 8_000 },
    headersTimeout: 10_000,
    bodyTimeout: 10_000,
  });
  return agent;
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ScanFetchError("invalid url", "blocked");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ScanFetchError("protocol", "blocked");
  if (url.username || url.password) throw new ScanFetchError("credentials", "blocked");
  if (url.port && !["80", "443"].includes(url.port) && !allowPrivateForTests()) throw new ScanFetchError("port", "blocked");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isBlockedIp(host) && !allowPrivateForTests()) throw new ScanFetchError("ip", "blocked");
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host) && !allowPrivateForTests()) {
    throw new ScanFetchError("host", "blocked");
  }
  return url;
}

export interface FetchedPage {
  url: string; // הכתובת הסופית אחרי הפניות
  status: number;
  html: string;
}

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const USER_AGENT = "TakinScanner/0.1 (+https://takin.co.il; site risk check)";

/** מוריד דף HTML בצורה מוגנת. עוקב ידנית אחרי הפניות ובודק כל אחת. */
export async function fetchPage(rawUrl: string, timeoutMs = 10_000): Promise<FetchedPage> {
  let current = assertSafeUrl(rawUrl);
  const deadline = AbortSignal.timeout(timeoutMs);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res;
    try {
      res = await undiciFetch(current, {
        redirect: "manual",
        dispatcher: getAgent(),
        signal: deadline,
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "he,en;q=0.8" },
      });
    } catch (err) {
      const e = err as { name?: string; cause?: { code?: string } };
      if (e.name === "TimeoutError" || e.name === "AbortError") throw new ScanFetchError("timeout", "timeout");
      const code = e.cause?.code;
      if (code === "EBLOCKED") throw new ScanFetchError("blocked", "blocked");
      if (code === "ENOTFOUND" || code === "EAI_AGAIN") throw new ScanFetchError("dns", "dns");
      throw new ScanFetchError("network", "network");
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel().catch(() => {});
      current = assertSafeUrl(new URL(res.headers.get("location")!, current).toString());
      continue;
    }

    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      await res.body?.cancel().catch(() => {});
      throw new ScanFetchError(`content-type ${type}`, "not_html");
    }
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) {
      await res.body?.cancel().catch(() => {});
      throw new ScanFetchError("too large", "too_large");
    }

    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    if (reader) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > MAX_BYTES) {
            await reader.cancel().catch(() => {});
            throw new ScanFetchError("too large", "too_large");
          }
          chunks.push(value);
        }
      } catch (err) {
        // דף שנתקע או שהחיבור נפל באמצע ההורדה — שגיאת סריקה רגילה, כדי שעמוד פנימי שנכשל ידולג בלבד
        if (err instanceof ScanFetchError) throw err;
        const name = (err as { name?: string }).name;
        throw new ScanFetchError("body read failed", name === "TimeoutError" || name === "AbortError" ? "timeout" : "network");
      }
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
    if (res.status >= 400) throw new ScanFetchError(`http ${res.status}`, "http");
    return { url: current.toString(), status: res.status, html };
  }
  throw new ScanFetchError("too many redirects", "redirects");
}
