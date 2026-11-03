import { Check, FileText, Rocket, SearchCheck, type LucideIcon } from "lucide-react";

// יתרונות שזמינים כבר היום (סריקה של כל אתר, דוח שאפשר לשתף ולהוריד כ-PDF).
const NOW: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Rocket, title: "בדיקה לפני העלאת אתר", text: "סורקים אתר חדש לפני שהוא עולה, ומתקנים בעיות לפני שהלקוח רואה אותן." },
  { icon: FileText, title: "דוח ברור להעברה ללקוח", text: "קישור לדוח או קובץ PDF, בשפה שבעל עסק מבין, בלי ז'רגון." },
  { icon: SearchCheck, title: "איתור מוקדם של בעיות", text: "טופס בלי הסכמה, פיקסל שלא מוזכר במדיניות או הבטחה מוגזמת — לפני שזה הופך לבעיה." },
];

const SOON = ["לוח ניהול אחד לכל אתרי הלקוחות", "דוח ממותג עם הלוגו שלכם", "סריקה חוזרת והתראה כשמשהו משתנה"];

export function Agencies() {
  return (
    <section id="agencies" aria-labelledby="agencies-title" className="px-4 pt-section sm:px-6">
      <div className="mx-auto grid max-w-site items-center gap-10 rounded-modal border border-border bg-primary-tint-strong p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:p-14">
        <div className="flex min-w-0 flex-col gap-6">
          <span className="self-start text-caption font-bold tracking-wide text-primary">למשרדי דיגיטל ובוני אתרים</span>
          <h2 id="agencies-title" className="m-0 text-h2 font-extrabold leading-tight tracking-[-0.5px] text-ink">
            מנהלים אתרים ללקוחות? תקין יכול לעזור גם לכם.
          </h2>
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            {NOW.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-icon border border-border-strong bg-bg text-primary shadow-card">
                  <Icon aria-hidden size={22} strokeWidth={1.8} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold text-ink">{title}</span>
                  <span className="text-[15px] text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside aria-labelledby="agency-plan-title" className="flex flex-col gap-5 rounded-panel border border-border-strong bg-bg p-6 shadow-card sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 id="agency-plan-title" className="m-0 text-xl font-bold text-ink">
              מסלול משרדים
            </h3>
            <span className="rounded-pill bg-primary-tint px-2.5 py-0.5 text-caption font-semibold text-primary-hover">בקרוב</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[34px] font-extrabold leading-none tracking-[-1px] text-ink">299 ₪</span>
            <span className="text-muted">לחודש</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2.5 border-t border-border p-0 pt-5 text-[15px] text-text">
            {SOON.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <Check aria-hidden size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-primary" />
                {s}
              </li>
            ))}
          </ul>
          <p className="m-0 text-caption text-muted">המסלול עוד לא פעיל. עד אז אפשר לסרוק כל אתר בנפרד, בחינם.</p>
        </aside>
      </div>
    </section>
  );
}
