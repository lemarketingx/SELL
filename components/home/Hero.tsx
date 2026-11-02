import { Check, ScanSearch, ShieldCheck } from "lucide-react";
import { UrlInput } from "@/components/ui/UrlInput";
import { HERO_INPUT_ID } from "@/components/ui/ScanFocusLink";
import { ReportPreview } from "./ReportPreview";

const BENEFITS = ["4 תחומים בכל סריקה", "ציטוט מהאתר לכל ממצא", "תיקון מוצע בעברית פשוטה"];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(180deg,var(--bg)_0%,var(--surface)_100%)]">
      {/* רשת עדינה ברקע — דקורטיבית בלבד */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto grid max-w-site items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div id="scan" className="flex min-w-0 flex-col gap-6">
          <span className="inline-flex items-center gap-2 self-start rounded-pill border border-border-strong bg-bg px-3.5 py-1.5 text-caption font-semibold text-primary-hover shadow-card">
            <ScanSearch aria-hidden size={16} strokeWidth={1.9} />
            סריקת אתרים חכמה | בעברית פשוטה
          </span>
          <h1 className="m-0 text-hero font-extrabold leading-[1.1] tracking-[-1px] text-ink">
            גלו סיכונים משפטיים <span className="text-primary">אפשריים</span> באתר שלכם
          </h1>
          <p className="m-0 max-w-[580px] text-lead leading-relaxed text-muted">
            תקין סורק עמודים ציבוריים באתר שלכם, מזהה בעיות אפשריות בפרטיות, נגישות, דיוור והגנת הצרכן, ומציג דוח ברור עם המלצות לתיקון.
          </p>

          <div className="flex flex-col gap-3">
            <UrlInput inputId={HERO_INPUT_ID} />
            <p className="m-0 flex items-center gap-2 text-small font-medium text-muted">
              <ShieldCheck aria-hidden size={18} strokeWidth={1.9} className="shrink-0 text-accent-text" />
              ללא הרשמה וללא פרטי אשראי
            </p>
          </div>

          <ul aria-label="מה מקבלים" className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[15px] font-medium text-text">
            {BENEFITS.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <Check aria-hidden size={13} strokeWidth={2.6} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 lg:ps-4">
          <ReportPreview />
        </div>
      </div>
    </section>
  );
}
