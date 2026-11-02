import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getScanById, paywallEnabled, sortFindings, DEMO_SCAN_ID } from "@/lib/report";
import { ReportShell } from "@/components/report/ReportShell";
import { ReportSummary } from "@/components/report/ReportSummary";
import { FullReport } from "@/components/report/FullReport";
import { Coverage } from "@/components/report/Coverage";
import { NoFindings } from "@/components/report/NoFindings";

export const metadata: Metadata = { title: "דוח מלא · תקין", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FullReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getScanById(id);
  if (!scan) notFound();
  // כשהתשלום יופעל (שלב 4): בלי רכישה חוזרים לדוח החינמי.
  if (paywallEnabled() && !scan.unlocked && id !== DEMO_SCAN_ID) redirect(`/report/${id}`);

  return (
    <ReportShell demo={id === DEMO_SCAN_ID}>
      <ReportSummary url={scan.url} score={scan.score} counts={scan.counts} title="דוח מלא" />
      {scan.findings.length ? <FullReport findings={sortFindings(scan.findings)} /> : <NoFindings />}
      {scan.meta && <Coverage meta={scan.meta} />}
    </ReportShell>
  );
}
