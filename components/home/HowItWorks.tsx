import { FileText, Link2, Wrench, type LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2, title: "מדביקים קישור", text: "כתובת של אתר, דף נחיתה או חנות אונליין. לא צריך סיסמה ולא צריך לפתוח חשבון." },
  { icon: FileText, title: "מקבלים דוח", text: "ציון כללי ורשימת ממצאים לפי חומרה. כל ממצא מוסבר במשפט או שניים, בלי מונחים משפטיים." },
  { icon: Wrench, title: "מתקנים בלחיצה", text: "ניסוח חלופי, קטע קוד להעתקה או הנחיה קצרה לבונה האתר. מעתיקים, מדביקים, וזהו." },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-4 px-6 py-section">
      <div className="mx-auto flex max-w-site flex-col gap-12">
        <SectionHeading id="how-title" title="איך זה עובד" lead="שלושה שלבים, בלי ידע משפטי ובלי ידע טכני." />
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 p-0">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex flex-col gap-3.5 rounded-card border border-border p-8">
              <div className="flex items-center gap-3.5">
                <span className="flex size-[52px] items-center justify-center rounded-icon bg-primary-tint text-primary">
                  <Icon aria-hidden size={26} strokeWidth={1.8} />
                </span>
                <span className="text-small font-bold text-primary">שלב {i + 1}</span>
              </div>
              <h3 className="m-0 text-[23px] font-bold text-ink">{title}</h3>
              <p className="m-0 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
