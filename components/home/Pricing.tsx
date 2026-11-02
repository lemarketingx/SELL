import { PricingCard } from "@/components/ui/PricingCard";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";
import { buttonClass } from "@/components/ui/Button";
import { SectionHeading } from "./SectionHeading";

const cta = (variant: "primary" | "ghost") => buttonClass(variant, "md", "min-h-12 w-full p-3 text-center");

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-4 border-y border-border bg-surface px-6 py-section">
      <div className="mx-auto flex max-w-site flex-col gap-12">
        <SectionHeading id="pricing-title" title="מחירים" lead="מתחילים בחינם. משלמים רק אם רוצים לראות הכול ולתקן." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-stretch gap-5">
          <PricingCard
            title="סריקה חינמית"
            price="0 ₪"
            features={["ציון כללי לאתר", "סיכום הבעיות לפי חומרה", "ממצא אחד מוסבר במלואו"]}
            cta={<ScanFocusLink className={cta("ghost")}>סריקה חינם</ScanFocusLink>}
          />
          <PricingCard
            title="דוח מלא"
            price="79 ₪"
            period="חד-פעמי"
            highlight="הכי פופולרי לעסק בודד"
            features={["כל הממצאים, עם הסבר מלא", "\"תקן לי\" לכל ממצא", "דוח להורדה כ-PDF"]}
            cta={<ScanFocusLink className={cta("primary")}>לקבלת הדוח המלא</ScanFocusLink>}
          />
          <PricingCard
            title="ניטור"
            price="39 ₪"
            period="לחודש"
            features={["כל מה שבדוח המלא", "סריקה חוזרת באופן קבוע", "התראה כשמופיעה בעיה חדשה"]}
            soon
          />
          <PricingCard
            title="משרדים"
            price="299 ₪"
            period="לחודש"
            features={["עד 20 אתרי לקוחות", "לוח ניהול אחד לכל האתרים", "דוח ממותג עם הלוגו שלכם"]}
            soon
          />
        </div>
        <div className="flex flex-col gap-1 text-center text-small text-muted">
          <p className="m-0">המחירים כוללים מע&quot;מ.</p>
          <p className="m-0">בתקופת ההרצה הדוח המלא פתוח בחינם, בלי תשלום ובלי הרשמה.</p>
        </div>
      </div>
    </section>
  );
}
