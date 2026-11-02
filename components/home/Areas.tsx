import { AreaIcon } from "@/components/ui/AreaIcon";
import { AREAS, AREA_LABELS } from "@/lib/areas";
import type { Area } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

const TEXT: Record<Area, string> = {
  spam: "האם בטפסים יש תיבת הסכמה לקבלת דיוור, והאם היא מנוסחת כמו שצריך.",
  privacy: "מדיניות פרטיות, פיקסלים וכלי מעקב שפועלים באתר, והאם מספרים עליהם לגולשים.",
  accessibility: "הצהרת נגישות, טקסט חלופי לתמונות ותוויות לשדות בטפסים.",
  consumer: "טענות שיווקיות מוגזמות, דחיפות מזויפת ומחירים שלא ברור מה הם כוללים.",
};

export function Areas() {
  return (
    <section id="areas" aria-labelledby="areas-title" className="scroll-mt-4 border-y border-border bg-surface px-6 py-section">
      <div className="mx-auto flex max-w-site flex-col gap-12">
        <SectionHeading
          id="areas-title"
          title="ארבעה תחומים שבודקים בכל סריקה"
          lead="אלה המקומות שבהם עסקים קטנים נתקלים הכי הרבה בבעיות, בדרך כלל בלי לדעת."
          maxLead={620}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {AREAS.map((area) => (
            <article key={area} className="flex flex-col gap-3.5 rounded-card border border-border bg-bg p-7">
              <span className="flex size-14 items-center justify-center rounded-icon bg-primary-tint text-primary">
                <AreaIcon area={area} size={28} strokeWidth={1.7} />
              </span>
              <h3 className="m-0 text-h3 font-bold text-ink">{AREA_LABELS[area]}</h3>
              <p className="m-0 text-muted">{TEXT[area]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
