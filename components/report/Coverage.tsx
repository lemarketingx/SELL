import { Info } from "lucide-react";
import type { Scan } from "@/lib/types";

/** "מה בדקנו": שקיפות לגבי הכיסוי של הסריקה — אילו עמודים נקראו ומה לא נבדק. */
export function Coverage({ meta }: { meta: NonNullable<Scan["meta"]> }) {
  return (
    <section aria-labelledby="coverage-title" className="flex flex-col gap-3 rounded-[20px] border border-border bg-bg p-5 sm:p-7">
      <h2 id="coverage-title" className="m-0 text-lg font-bold text-ink">
        מה בדקנו
      </h2>
      {meta.likelyClientRendered && (
        <p className="m-0 flex items-start gap-2 rounded-[14px] bg-sev-mid-note-bg px-4 py-3 text-text">
          <Info aria-hidden size={20} strokeWidth={1.9} className="mt-[3px] shrink-0 text-sev-mid" />
          נראה שהאתר נבנה בעיקר בדפדפן (JavaScript), ולכן ייתכן שחלק מהתוכן לא נקרא. הבדיקה באתר הזה חלקית.
        </p>
      )}
      <p className="m-0 text-muted">
        {meta.pagesScanned.length === 1 ? "קראנו עמוד ציבורי אחד" : `קראנו ${meta.pagesScanned.length} עמודים ציבוריים`}, בדיוק כמו שגולש רואה אותם:
      </p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-base">
        {meta.pagesScanned.map((p) => (
          <li key={p.url} className="flex flex-wrap gap-x-2">
            <span>{p.label}</span>
            <span dir="ltr" className="break-all text-muted">
              {p.url}
            </span>
          </li>
        ))}
      </ul>
      {meta.skippedChecks.length > 0 && (
        <p className="m-0 text-muted">עוד לא בודקים: {meta.skippedChecks.join("; ")}.</p>
      )}
    </section>
  );
}
