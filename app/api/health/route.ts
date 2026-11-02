import { storageHealth } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — האם האחסון (Upstash) מחובר ועונה. לא מחזיר ערכים סודיים, רק שם המשתנה שבשימוש. */
export async function GET() {
  const health = await storageHealth();
  return Response.json(health, { status: health.storage === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
