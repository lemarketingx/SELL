import { getScanById, toFreeReport } from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/scans/:id — הדוח החינמי בלבד (ממצא אחד מלא, לשאר כותרת וחומרה). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getScanById(id);
  if (!scan) return Response.json({ error: "לא נמצא" }, { status: 404 });
  return Response.json(toFreeReport(scan), { headers: { "cache-control": "no-store" } });
}
