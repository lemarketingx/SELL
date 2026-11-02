import { FileCheck2, Link2, ScanSearch, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: "מזינים כתובת אתר", text: "כתובת של אתר, דף נחיתה או חנות אונליין. בלי סיסמה ובלי לפתוח חשבון." },
  { icon: ScanSearch, title: "תקין סורק את העמודים הרלוונטיים", text: "דף הבית ועד 6 עמודים חשובים, כמו צור קשר, מחירים ומדיניות פרטיות. בדרך כלל פחות מדקה." },
  { icon: FileCheck2, title: "מקבלים דוח עם ממצאים והצעות לתיקון", text: "ציון כללי, ממצאים לפי חומרה, ולכל ממצא הסבר קצר ותיקון שאפשר להעתיק." },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="px-4 py-section sm:px-6">
      <div className="mx-auto flex max-w-site flex-col gap-14">
        <SectionHeading id="how-title" eyebrow="איך זה עובד" title="שלושה שלבים, בלי ידע משפטי ובלי ידע טכני" />
        <div className="relative">
          {/* קו מחבר עדין בין השלבים — דסקטופ בלבד */}
          <div aria-hidden className="absolute inset-x-[16.6%] top-7 hidden h-px bg-[linear-gradient(90deg,transparent,var(--border-strong)_12%,var(--border-strong)_88%,transparent)] md:block" />
          <ol className="relative m-0 grid list-none gap-5 p-0 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex flex-col items-center gap-4 text-center">
                <span className="relative flex size-14 items-center justify-center rounded-[16px] border border-border-strong bg-bg text-primary shadow-card">
                  <Icon aria-hidden size={26} strokeWidth={1.8} />
                  <span className="absolute -top-2 -end-2 flex size-6 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <div className="flex flex-col gap-2 rounded-card border border-border bg-bg p-6 shadow-card md:border-0 md:bg-transparent md:p-0 md:shadow-none">
                  <h3 className="m-0 text-h3 font-bold text-ink">
                    <span className="sr-only">שלב {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="m-0 text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
