import Link from "next/link";
import { Check, Wrench } from "lucide-react";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { CountPill, SeverityBadge } from "@/components/ui/SeverityBadge";
import { AREA_LABELS } from "@/lib/areas";
import type { Finding } from "@/lib/types";
import sample from "@/content/sample-report.json";

const POINTS = [
  "ציון כללי שקל להבין במבט אחד",
  "ממצאים מסודרים לפי חומרה, מהדחוף לפחות דחוף",
  "ציטוט מדויק מהאתר, כדי שתדעו בדיוק איפה הבעיה",
];

const first = sample.findings[0] as Finding;
export const SAMPLE_REPORT_HREF = `/report/${sample.id}`;

export function ReportSample() {
  const { counts } = sample;
  return (
    <section aria-labelledby="sample-title" className="px-6 py-section">
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-14">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px]">
          <h2 id="sample-title" className="m-0 text-h2 font-extrabold tracking-[-0.5px] text-ink">
            ככה נראה דוח
          </h2>
          <p className="m-0 text-lead text-muted">בלי סעיפי חוק ובלי הפחדות. רק מה מצאנו, מה זה אומר בשבילכם ומה אפשר לעשות עכשיו.</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <Check aria-hidden size={22} strokeWidth={2.2} className="mt-[3px] shrink-0 text-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <Link href={SAMPLE_REPORT_HREF} className="btn-ghost inline-flex min-h-12 items-center self-start rounded-btn px-[22px] font-semibold">
            לדוח לדוגמה
          </Link>
        </div>

        <section
          aria-label="מוקאפ של דוח"
          className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px] rounded-modal border border-border-strong bg-surface p-4 sm:p-7"
        >
          <div className="flex flex-wrap items-center gap-6 rounded-[20px] border border-border bg-bg p-6">
            <ScoreRing score={sample.score} />
            <div className="flex flex-[1_1_220px] flex-col gap-2.5">
              <div className="text-xl font-bold text-ink">נמצאו {counts.total} בעיות</div>
              <div className="flex flex-wrap gap-2">
                <CountPill severity="high">{counts.high} חמורות</CountPill>
                <CountPill severity="mid">{counts.mid} בינוניות</CountPill>
                <CountPill severity="low">{counts.low} קלות</CountPill>
              </div>
            </div>
          </div>
          <article className="flex flex-col gap-3 rounded-[20px] border border-border bg-bg p-6">
            <div className="flex items-center gap-2 text-caption">
              <SeverityBadge severity={first.severity} />
              <span className="font-semibold text-muted">{AREA_LABELS[first.area]}</span>
            </div>
            <h3 className="m-0 text-[19px] font-bold text-ink">{first.title}</h3>
            <p className="m-0 text-muted">אם תשלחו לנרשמים הודעות שיווקיות בלי הסכמה מפורשת, אתם עלולים להיות חשופים לתביעה.</p>
            <Link
              href={`${SAMPLE_REPORT_HREF}#${first.id}`}
              className="btn-primary inline-flex min-h-tap items-center gap-2 self-start rounded-btn px-[18px] text-base font-semibold"
            >
              <Wrench aria-hidden size={18} strokeWidth={1.9} />
              תקן לי
            </Link>
          </article>
        </section>
      </div>
    </section>
  );
}
