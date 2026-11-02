import { Check } from "lucide-react";
import { UrlInput } from "@/components/ui/UrlInput";
import { HERO_INPUT_ID } from "@/components/ui/ScanFocusLink";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { AREAS, AREA_LABELS } from "@/lib/areas";
import type { Area, Finding } from "@/lib/types";
import sample from "@/content/sample-report.json";

const findings = sample.findings as Finding[];

function areaSummary(area: Area) {
  const inArea = findings.filter((f) => f.area === area);
  const high = inArea.filter((f) => f.severity === "high").length;
  if (high > 0) return { tone: "high" as const, text: `${high} חמור` };
  return { tone: "mid" as const, text: `${inArea.length} לתשומת לב` };
}

const TRUST = ["ללא הרשמה", "תוצאה בפחות מדקה", "בעברית פשוטה"];

export function Hero() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-14 px-6 pb-20 pt-12 sm:pt-[72px]">
        <div id="scan" className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
          <span className="self-start rounded-pill bg-primary-tint px-3.5 py-1.5 text-small font-semibold text-primary-hover">
            לעסקים קטנים, עצמאים ומשרדי דיגיטל
          </span>
          <h1 className="m-0 text-hero font-extrabold leading-[1.12] tracking-[-1px] text-ink">
            תדעו מה באתר שלכם
            <br />
            עלול לסבך אתכם, לפני שמישהו אחר יגלה.
          </h1>
          <p className="m-0 max-w-[600px] text-xl text-muted">
            תקין סורק את האתר או דף הנחיתה שלכם, מסמן סיכונים משפטיים אפשריים בדיוור, בפרטיות, בנגישות ובהגנת הצרכן, ומסביר כל אחד בעברית פשוטה. את רוב הבעיות אפשר לתקן בלחיצה.
          </p>

          <UrlInput inputId={HERO_INPUT_ID} />

          <ul aria-label="למה זה פשוט" className="m-0 flex list-none flex-wrap gap-x-[22px] gap-y-2.5 p-0 text-base font-medium text-primary-hover">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check aria-hidden size={18} strokeWidth={2.2} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-label="דוגמה לסריקה"
          className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px] rounded-panel border border-border-strong bg-bg p-7 shadow-float"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-caption text-muted">סריקה לדוגמה</div>
              <div dir="ltr" className="text-right text-base font-semibold">
                studio-example.co.il
              </div>
            </div>
            <span className="rounded-pill bg-primary-tint px-3 py-1 text-caption font-semibold text-primary-hover">הושלמה</span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {AREAS.map((area) => {
              const s = areaSummary(area);
              return (
                <li key={area} className="flex items-center gap-3 rounded-[14px] bg-surface px-3.5 py-3">
                  <span className="flex size-9 items-center justify-center rounded-[10px] border border-border-strong bg-bg text-primary">
                    <AreaIcon area={area} size={20} />
                  </span>
                  <span className="flex-1 font-medium">{AREA_LABELS[area]}</span>
                  <span
                    className={`rounded-pill px-2.5 py-0.5 text-caption font-semibold ${
                      s.tone === "high" ? "bg-sev-high-bg text-sev-high" : "bg-sev-mid-bg text-sev-mid"
                    }`}
                  >
                    {s.text}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="m-0 text-small text-muted">כל ממצא מגיע עם הסבר קצר ותיקון מוכן.</p>
        </section>
      </div>
    </section>
  );
}
