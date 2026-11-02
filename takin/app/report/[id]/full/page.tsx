import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getScan, sortFindings, DEMO_SCAN_ID } from "@/lib/report";
import { ReportShell } from "@/components/report/ReportShell";
import { ReportSummary } from "@/components/report/ReportSummary";
import { FullReport } from "@/components/report/FullReport";

export const metadata: Metadata = { title: "דוח מלא · תקין" };

export default async function FullReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = getScan(id);
  if (!scan) notFound();
  // שלב 4: כאן תיבדק גישה (תשלום / מנוי) לפני שמציגים את הדוח המלא. ב-mock הדוח פתוח.

  return (
    <ReportShell demo={id === DEMO_SCAN_ID}>
      <ReportSummary url={scan.url} score={scan.score} counts={scan.counts} title="דוח מלא" />
      <FullReport findings={sortFindings(scan.findings)} />
    </ReportShell>
  );
}
