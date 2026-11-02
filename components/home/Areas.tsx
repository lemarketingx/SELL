import { Check } from "lucide-react";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { AREA_LABELS } from "@/lib/areas";
import type { Area } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

// הבדיקות כאן תואמות לחוקים שרצים בפועל ב-lib/scanner/rules.ts. אין להוסיף בדיקה שלא ממומשת.
const AREAS_CONTENT: { area: Area; text: string; checks: string[] }[] = [
  {
    area: "privacy",
    text: "האם מספרים לגולשים מה עושים עם המידע שלהם.",
    checks: ["קישור למדיניות פרטיות באתר", "כלי מעקב כמו Meta Pixel ו-Google Analytics שלא מוזכרים במדיניות"],
  },
  {
    area: "spam",
    text: "האם טפסים שאוספים טלפון או מייל מבקשים הסכמה לדיוור כמו שצריך.",
    checks: ["תיבת הסכמה לדיוור בטפסים", "תיבת הסכמה שמסומנת מראש", "הסכמה לדיוור שמחוברת להסכמה לתקנון"],
  },
  {
    area: "accessibility",
    text: "בדיקות בסיסיות שמראות אם האתר נוח גם לאנשים עם מוגבלות.",
    checks: ["קישור להצהרת נגישות", "תמונות בלי טקסט חלופי", "שדות בטופס בלי תווית"],
  },
  {
    area: "consumer",
    text: "ניסוחים שיווקיים ומחירים שעלולים להטעות לקוח.",
    checks: ["הבטחות מוחלטות כמו \"תוצאות מובטחות\" או \"הזול ביותר\"", "\"החל מ-\" או כוכבית ליד מחיר בלי הסבר"],
  },
];

export function Areas() {
  return (
    <section id="areas" aria-labelledby="areas-title" className="border-y border-border bg-surface px-4 py-section sm:px-6">
      <div className="mx-auto flex max-w-site flex-col gap-12">
        <SectionHeading
          id="areas-title"
          eyebrow="מה נבדק"
          title="מה תקין בודק באתר שלכם?"
          lead="ארבעה תחומים שבהם עסקים קטנים נתקלים הכי הרבה בבעיות, בדרך כלל בלי לדעת. אלה הבדיקות שרצות בכל סריקה:"
          maxLead={640}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {AREAS_CONTENT.map(({ area, text, checks }) => (
            <article key={area} className="flex flex-col gap-4 rounded-card border border-border bg-bg p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-icon bg-primary-tint text-primary">
                  <AreaIcon area={area} size={24} strokeWidth={1.8} />
                </span>
                <h3 className="m-0 text-h3 font-bold text-ink">{AREA_LABELS[area]}</h3>
              </div>
              <p className="m-0 text-muted">{text}</p>
              <ul className="m-0 flex list-none flex-col gap-2 border-t border-border p-0 pt-4">
                {checks.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[15px] text-text">
                    <Check aria-hidden size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-accent-text" />
                    {c}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
