import { ScoreRing } from "@/components/ui/ScoreRing";
import { CountPill } from "@/components/ui/SeverityBadge";
import { scoreHeadline } from "@/lib/score";
import { hostOf, summaryLine } from "@/lib/report";
import type { Scan } from "@/lib/types";

export function ReportSummary({ url, score, counts, title }: { url: string; score: number; counts: Scan["counts"]; title: string }) {
  return (
    <section aria-labelledby="report-title" className="flex flex-wrap items-center gap-6 rounded-panel border border-border bg-bg p-6 sm:p-8">
      <ScoreRing score={score} size={140} />
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
          <span>{title}</span>
          <span aria-hidden>·</span>
          <span dir="ltr" className="font-semibold text-text">
            {hostOf(url)}
          </span>
        </div>
        <h1 id="report-title" className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold leading-[1.25] text-ink">
          {scoreHeadline(score, counts.total)}
        </h1>
        <p className="m-0 text-lg text-text">{summaryLine(counts)}</p>
        <div className="flex flex-wrap gap-2">
          {counts.high > 0 && <CountPill severity="high">{counts.high} חמורות</CountPill>}
          {counts.mid > 0 && <CountPill severity="mid">{counts.mid} בינוניות</CountPill>}
          {counts.low > 0 && <CountPill severity="low">{counts.low} קלות</CountPill>}
        </div>
      </div>
    </section>
  );
}
