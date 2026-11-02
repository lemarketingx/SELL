import type { ReactNode } from "react";
import { Check } from "lucide-react";

type Props = {
  title: string;
  description: string;
  price: string;
  period?: string;
  priceNote?: string;
  features: string[];
  highlight?: string;
  /** מסלול שעוד לא זמין: מוצג עם תגית "בקרוב" ובלי כפתור פעולה. */
  soon?: boolean;
  cta?: ReactNode;
};

export function PricingCard({ title, description, price, period, priceNote, features, highlight, soon, cta }: Props) {
  return (
    <article
      className={`relative flex flex-col gap-5 rounded-panel bg-bg p-7 ${
        highlight ? "border-2 border-primary shadow-float" : "border border-border-strong shadow-card"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3.5 start-6 rounded-pill bg-primary px-3 py-1 text-caption font-semibold text-white">{highlight}</span>
      )}
      <div className="flex flex-col gap-1.5">
        <h3 className="m-0 flex items-center gap-2 text-xl font-bold text-ink">
          {title}
          {soon && <span className="rounded-pill bg-primary-tint px-2.5 py-0.5 text-caption font-semibold text-primary-hover">בקרוב</span>}
        </h3>
        <p className="m-0 text-[15px] text-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[40px] font-extrabold leading-none tracking-[-1px] text-ink">{price}</span>
          {period && <span className="text-muted">{period}</span>}
        </div>
        {priceNote && <span className="text-caption text-muted">{priceNote}</span>}
      </div>
      <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 border-t border-border p-0 pt-5 text-[15px] text-text">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check aria-hidden size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      {soon ? (
        <p className="m-0 flex min-h-12 items-center justify-center rounded-[12px] border border-dashed border-border-strong text-center font-semibold text-muted">
          יושק בקרוב
        </p>
      ) : (
        cta
      )}
    </article>
  );
}
