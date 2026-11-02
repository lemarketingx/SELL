import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { CountPill, SeverityShape } from "@/components/ui/SeverityBadge";
import { AREA_LABELS, SEVERITY_LABELS } from "@/lib/areas";
import { hostOf, sortFindings } from "@/lib/report";
import type { Finding, Scan } from "@/lib/types";
import sample from "@/content/sample-report.json";

const scan = sample as Scan;
const top: Finding[] = sortFindings(scan.findings).slice(0, 3);

const SEV_TEXT = { high: "text-sev-high", mid: "text-sev-mid", low: "text-sev-low" } as const;

/** תצוגה מקדימה של דוח לדוגמה ב-Hero. מסומנת בבירור כדוגמה, מנתוני content/sample-report.json. */
export function ReportPreview() {
  return (
    <section aria-labelledby="preview-title" className="relative w-full overflow-hidden rounded-panel border border-border-strong bg-bg shadow-float">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="flex gap-1">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
          </span>
          <span dir="ltr" className="truncate text-caption font-medium text-muted">
            {hostOf(scan.url)}
          </span>
        </div>
        <span className="shrink-0 rounded-pill border border-border-strong bg-bg px-2.5 py-0.5 text-caption font-semibold text-muted">דוח לדוגמה</span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <h2 id="preview-title" className="sr-only">
          תצוגה מקדימה של דוח לדוגמה
        </h2>
        <div className="flex items-center gap-5">
          <ScoreRing score={scan.score} size={96} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="m-0 text-lg font-bold text-ink">נמצאו {scan.counts.total} ממצאים</p>
            <div className="flex flex-wrap gap-1.5">
              <CountPill severity="high">{scan.counts.high} חמורים</CountPill>
              <CountPill severity="mid">{scan.counts.mid} בינוניים</CountPill>
              <CountPill severity="low">{scan.counts.low} קלים</CountPill>
            </div>
          </div>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {top.map((f) => (
            <li key={f.id} className="flex items-start gap-3 rounded-[12px] border border-border bg-bg px-3.5 py-3">
              <span className={`mt-1.5 ${SEV_TEXT[f.severity]}`}>
                <SeverityShape severity={f.severity} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-semibold leading-snug text-ink">{f.title}</span>
                <span className="text-caption text-muted">
                  <span className={`font-semibold ${SEV_TEXT[f.severity]}`}>{SEVERITY_LABELS[f.severity]}</span> · {AREA_LABELS[f.area]}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Link href={`/report/${scan.id}`} className="inline-flex min-h-tap items-center gap-1.5 self-start text-[15px] font-semibold">
          לצפייה בדוח לדוגמה
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
