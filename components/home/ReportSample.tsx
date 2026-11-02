import Link from "next/link";
import { ArrowLeft, Check, FileSearch, Lightbulb, Quote } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { CountPill, SeverityBadge } from "@/components/ui/SeverityBadge";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { FixLauncher } from "@/components/report/FixLauncher";
import { AREA_LABELS } from "@/lib/areas";
import { scoreHeadline } from "@/lib/score";
import { sortFindings } from "@/lib/report";
import type { Finding, Scan } from "@/lib/types";
import sample from "@/content/sample-report.json";

const scan = sample as Scan;
const finding: Finding = sortFindings(scan.findings)[0];
export const SAMPLE_REPORT_HREF = `/report/${scan.id}`;

const POINTS = [
  { title: "מה מצאנו", text: "ציטוט מדויק מהאתר והמקום שבו הוא מופיע, כדי שתוכלו לבדוק בעצמכם." },
  { title: "מה זה אומר", text: "הסבר קצר בעברית פשוטה, בלי סעיפי חוק ובלי הפחדות." },
  { title: "איך מתקנים", text: "ניסוח חלופי, קטע קוד להעתקה או תבנית מוכנה למילוי." },
];

export function ReportSample() {
  return (
    <section id="sample" aria-labelledby="sample-title" className="px-4 py-section sm:px-6">
      <div className="mx-auto grid max-w-site items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-[calc(var(--header-h)+32px)]">
          <span className="self-start text-caption font-bold uppercase tracking-wide text-primary">דוח לדוגמה</span>
          <h2 id="sample-title" className="m-0 text-h2 font-extrabold leading-tight tracking-[-0.5px] text-ink">
            לא רק מזהים בעיה. מבינים מה צריך לתקן.
          </h2>
          <p className="m-0 text-lead text-muted">כל ממצא בדוח בנוי משלושה חלקים, כדי שתדעו בדיוק מה לעשות עכשיו.</p>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-caption font-bold text-primary-hover">{i + 1}</span>
                <span className="flex flex-col">
                  <span className="font-bold text-ink">{p.title}</span>
                  <span className="text-[15px] text-muted">{p.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href={`${SAMPLE_REPORT_HREF}/full`} className="btn-ghost inline-flex min-h-12 items-center gap-2 rounded-[12px] px-5 font-semibold">
              לדוח המלא לדוגמה
              <ArrowLeft aria-hidden size={18} strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 rounded-modal border border-border bg-surface p-3 sm:p-5">
          <div className="flex flex-wrap items-center gap-5 rounded-panel border border-border bg-bg p-5 shadow-card sm:p-6">
            <ScoreRing score={scan.score} size={104} />
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2">
              <span className="self-start rounded-pill border border-border-strong px-2.5 py-0.5 text-caption font-semibold text-muted">דוח לדוגמה · אתר בדוי</span>
              <p className="m-0 text-xl font-bold text-ink">{scoreHeadline(scan.score, scan.counts.total)}</p>
              <div className="flex flex-wrap gap-1.5">
                <CountPill severity="high">{scan.counts.high} חמורים</CountPill>
                <CountPill severity="mid">{scan.counts.mid} בינוניים</CountPill>
                <CountPill severity="low">{scan.counts.low} קלים</CountPill>
              </div>
            </div>
          </div>

          <article aria-labelledby="sample-finding" className="flex flex-col gap-5 rounded-panel border border-border bg-bg p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2 text-caption">
              <SeverityBadge severity={finding.severity} />
              <span className="font-semibold text-muted">{AREA_LABELS[finding.area]}</span>
            </div>
            <h3 id="sample-finding" className="m-0 text-xl font-bold leading-snug text-ink">
              {finding.title}
            </h3>

            <div className="flex flex-col gap-2">
              <h4 className="m-0 flex items-center gap-1.5 text-caption font-bold text-muted">
                <FileSearch aria-hidden size={16} strokeWidth={1.9} />
                מה מצאנו באתר
              </h4>
              <div className="flex gap-2.5 rounded-[12px] bg-surface px-4 py-3">
                <Quote aria-hidden size={16} strokeWidth={1.9} className="mt-1 shrink-0 text-muted" />
                <div className="flex flex-col">
                  <span className="text-caption font-semibold text-muted">{finding.evidence.location}</span>
                  <p className="m-0 text-text">{finding.evidence.quote}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="m-0 flex items-center gap-1.5 text-caption font-bold text-muted">
                <Lightbulb aria-hidden size={16} strokeWidth={1.9} />
                מה זה אומר
              </h4>
              <p className="m-0 text-text">{finding.meaning}</p>
            </div>

            {finding.fix.snippet && (
              <div className="flex flex-col gap-2">
                <h4 className="m-0 flex items-center gap-1.5 text-caption font-bold text-muted">
                  <Check aria-hidden size={16} strokeWidth={2.2} />
                  התיקון המוצע: {finding.fix.summary}
                </h4>
                <CodeBlock code={finding.fix.snippet} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-[15px] text-muted">בדוח עצמו: העתקה בלחיצה, לפני ואחרי, ושליחה לבונה האתר.</span>
              <FixLauncher finding={finding} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
