import Link from "next/link";
import { FaqItem } from "@/components/ui/FaqItem";

const ITEMS = [
  {
    q: "האם הסריקה מחליפה ייעוץ משפטי?",
    a: "לא. תקין מצביע על סיכונים אפשריים ועוזר לתקן אותם, אבל הוא לא ייעוץ משפטי. לשאלות ספציפיות כדאי להתייעץ עם עורך דין.",
  },
  {
    q: "האם דוח בלי ממצאים אומר שהאתר עומד בדרישות החוק?",
    a: "לא. הסריקה בודקת חלק מהדרישות, בעזרת כללים קבועים. דוח בלי ממצאים אומר שלא מצאנו בעיות בבדיקות שהרצנו, ולא שהאתר עומד בכל דרישה.",
  },
  {
    q: "אילו עמודים נבדקים?",
    a: "דף הבית ועד 6 עמודים ציבוריים נוספים, בעדיפות לצור קשר, מחירים, שירותים, מדיניות פרטיות והצהרת נגישות. אנחנו רואים רק את מה שכל גולש רואה, ולא צריך גישה לניהול האתר.",
  },
  {
    q: "כמה זמן לוקחת סריקה?",
    a: "בדרך כלל פחות מדקה. אתר איטי עלול לקחת קצת יותר, ובמסך הסריקה רואים את ההתקדמות.",
  },
  {
    q: "צריך להירשם?",
    a: "לא. אין הרשמה ולא צריך פרטי אשראי. מדביקים כתובת ומקבלים דוח. אפשר לסרוק עד 5 אתרים בשעה.",
  },
  {
    q: "עד כמה הבדיקה מדויקת?",
    a: "הבדיקה אוטומטית. היא עלולה לפספס דברים, ולפעמים מסמנת משהו שבפועל בסדר. לכן כל ממצא מגיע עם ציטוט מדויק מהאתר, כדי שתוכלו לבדוק בעצמכם.",
  },
  {
    q: "צריך להבין בקוד כדי לתקן?",
    a: "לא. חלק מהתיקונים הם ניסוח חדש שמעתיקים לאתר. כשצריך קוד, הוא מגיע מוכן להעתקה, עם הסבר קצר שאפשר להעביר כמו שהוא לבונה האתר.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="px-4 py-section sm:px-6">
      <div className="mx-auto grid max-w-site gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
          <span className="text-caption font-bold tracking-wide text-primary">שאלות נפוצות</span>
          <h2 id="faq-title" className="m-0 text-h2 font-extrabold leading-tight tracking-[-0.5px] text-ink">
            מה כדאי לדעת לפני שסורקים
          </h2>
          <p className="m-0 text-muted">
            לא מצאתם תשובה?{" "}
            <Link href="/contact" className="inline-flex min-h-tap items-center font-semibold">
              כתבו לנו
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ITEMS.map((item, i) => (
            <FaqItem key={item.q} question={item.q} defaultOpen={i === 0}>
              {item.a}
            </FaqItem>
          ))}
        </div>
      </div>
    </section>
  );
}
