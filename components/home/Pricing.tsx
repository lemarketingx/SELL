import { PricingCard } from "@/components/ui/PricingCard";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";
import { buttonClass } from "@/components/ui/Button";
import { paywallEnabled } from "@/lib/report";
import { SectionHeading } from "./SectionHeading";

const cta = (variant: "primary" | "ghost") => buttonClass(variant, "md", "min-h-12 w-full rounded-[12px] p-3 text-center");

export function Pricing() {
  // התשלומים עדיין לא פעילים (שלב 4). כל עוד הדגל כבוי, הדוח המלא פתוח בחינם — וכך מוצג כאן.
  const paywall = paywallEnabled();
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-y border-border bg-surface px-4 py-section sm:px-6">
      <div className="mx-auto flex max-w-site flex-col gap-12">
        <SectionHeading id="pricing-title" eyebrow="מחירים" title="מתחילים בחינם. בלי הפתעות." lead="תקין נמצא בתקופת בטא. כרגע אפשר לסרוק ולקבל דוח מלא בלי לשלם." />
        <div className="mx-auto grid w-full max-w-[560px] items-stretch gap-6 lg:max-w-[1040px] lg:grid-cols-3">
          <PricingCard
            title="סריקה חינמית"
            description="תמונת מצב ראשונה של האתר."
            price="0 ₪"
            features={["דף הבית ועד 6 עמודים", "ציון כללי וסיכום לפי חומרה", "ממצא אחד מוסבר במלואו"]}
            cta={<ScanFocusLink className={cta("ghost")}>סרקו את האתר</ScanFocusLink>}
          />
          <PricingCard
            title="דוח מלא"
            description="כל הממצאים, עם תיקון לכל אחד."
            price={paywall ? "79 ₪" : "חינם"}
            period={paywall ? "חד-פעמי" : "בתקופת הבטא"}
            priceNote={paywall ? undefined : "אחרי הבטא: 79 ₪ לדוח"}
            highlight={paywall ? undefined : "פתוח בחינם בבטא"}
            features={["כל הממצאים, עם ציטוט מהאתר", "הסבר ותיקון מוצע לכל ממצא", "הורדה כ-PDF"]}
            cta={<ScanFocusLink className={cta("primary")}>מתחילים בסריקה</ScanFocusLink>}
          />
          <PricingCard
            title="ניטור"
            description="סריקה חוזרת כשהאתר משתנה."
            price="39 ₪"
            period="לחודש"
            features={["כל מה שבדוח המלא", "סריקה חוזרת באופן קבוע", "התראה כשמופיעה בעיה חדשה"]}
            soon
          />
        </div>
        <p className="m-0 text-center text-small text-muted">בתקופת הבטא ייתכנו שינויים בתכונות ובמחירים.</p>
      </div>
    </section>
  );
}
