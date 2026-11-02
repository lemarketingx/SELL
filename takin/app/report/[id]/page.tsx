import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScan, toFreeReport, DEMO_SCAN_ID } from "@/lib/report";
import { ReportShell } from "@/components/report/ReportShell";
import { ReportSummary } from "@/components/report/ReportSummary";
import { FindingCard } from "@/components/report/FindingCard";
import { LockedFindings } from "@/components/report/LockedFindings";

export const metadata: Metadata = { title: "הדוח שלכם · תקין" };

export default async function FreeReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) notFound();

  // רק השדות של הדוח החינמי עוברים לרכיבי הלקוח.
  const report = toFreeReport(scan);

  return (
    <ReportShell demo={id === DEMO_SCAN_ID}>
      <ReportSummary url={report.url} score={report.score} counts={report.counts} title="דוח חינמי" />
      {report.openFinding && (
        <section aria-labelledby="first-title" className="flex flex-col gap-3">
          <h2 id="first-title" className="m-0 text-xl font-bold text-ink">
            מתחילים מהדחוף ביותר
          </h2>
          <FindingCard finding={report.openFinding} />
        </section>
      )}
      <LockedFindings items={report.locked} unlockHref={`/report/${report.id}/full`} />
    </ReportShell>
  );
}
