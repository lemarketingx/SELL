import type { NextRequest } from "next/server";
import { normalizeUrl } from "@/lib/url";
import { runScan, type ScanEvent } from "@/lib/scanner/scan";
import { ScanFetchError } from "@/lib/scanner/net";
import { checkScanRateLimit, saveScan, StoreUnavailableError } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  return fwd.split(",")[0]?.trim() || "unknown";
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

const FETCH_ERRORS: Record<ScanFetchError["code"], string> = {
  blocked: "אי אפשר לסרוק את הכתובת הזו. כדאי לבדוק שזו כתובת של אתר ציבורי.",
  dns: "לא הצלחנו למצוא את האתר. כדאי לוודא שהכתובת נכונה ולנסות שוב.",
  timeout: "האתר לא הגיב בזמן. אפשר לנסות שוב בעוד כמה דקות.",
  too_large: "הדף גדול מדי לסריקה.",
  not_html: "בכתובת הזו אין דף אינטרנט שאפשר לסרוק.",
  http: "לא הצלחנו להגיע לאתר. כדאי לוודא שהכתובת נכונה ולנסות שוב.",
  network: "לא הצלחנו להגיע לאתר. כדאי לוודא שהכתובת נכונה ולנסות שוב.",
  redirects: "האתר מפנה יותר מדי פעמים, ולא הצלחנו להגיע לדף עצמו.",
};

/**
 * POST /api/scans  { url }
 * מחזיר זרם NDJSON של התקדמות אמיתית: pages / area / done / error.
 */
export async function POST(req: NextRequest) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "הבקשה לא תקינה" });
  }
  const normalized = typeof body.url === "string" ? normalizeUrl(body.url) : null;
  if (!normalized?.ok) return json(400, { error: "נראה שהכתובת לא תקינה. נסו למשל: www.your-business.co.il" });

  try {
    const rl = await checkScanRateLimit(clientIp(req));
    if (!rl.allowed) {
      const minutes = Math.ceil(rl.retryAfter / 60);
      return json(429, { error: `הגעתם למגבלת הסריקות החינמיות לשעה. אפשר לנסות שוב בעוד ${minutes} דקות.` }, { "retry-after": String(rl.retryAfter) });
    }
  } catch (err) {
    if (err instanceof StoreUnavailableError) return json(503, { error: "השירות לא זמין כרגע. נסו שוב בעוד כמה דקות." });
    throw err;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ScanEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        const scan = await runScan(normalized.url, send);
        await saveScan(scan);
        send({ type: "done", id: scan.id });
      } catch (err) {
        if (err instanceof ScanFetchError) send({ type: "error", message: FETCH_ERRORS[err.code] });
        else if (err instanceof StoreUnavailableError) send({ type: "error", message: "השירות לא זמין כרגע. נסו שוב בעוד כמה דקות." });
        else {
          console.error("scan failed", err);
          send({ type: "error", message: "משהו השתבש בסריקה. נסו שוב בעוד כמה דקות." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
