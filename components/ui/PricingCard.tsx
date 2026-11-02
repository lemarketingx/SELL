import type { ReactNode } from "react";

type Props = {
  title: string;
  price: string;
  period?: string;
  features: string[];
  highlight?: string;
  /** מסלול שעוד לא זמין: מוצג עם תגית "בקרוב" ובלי כפתור פעולה. */
  soon?: boolean;
  cta?: ReactNode;
};

export function PricingCard({ title, price, period, features, highlight, soon, cta }: Props) {
  return (
    <article
      className={`relative flex flex-col gap-[18px] rounded-card bg-bg p-7 ${
        highlight ? "border-2 border-primary" : "border border-border-strong"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3.5 start-6 rounded-pill bg-primary px-3 py-1 text-caption font-semibold text-white">
          {highlight}
        </span>
      )}
      <h3 className="m-0 flex items-center gap-2 text-xl font-bold text-ink">
        {title}
        {soon && <span className="rounded-pill bg-primary-tint px-2.5 py-0.5 text-caption font-semibold text-primary-hover">בקרוב</span>}
      </h3>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[44px] font-extrabold text-ink">{price}</span>
        {period && <span className="text-muted">{period}</span>}
      </div>
      <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0 text-base text-text">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {soon ? (
        <p className="m-0 flex min-h-12 items-center justify-center rounded-btn border border-dashed border-border-strong text-center font-semibold text-muted">
          יושק בקרוב
        </p>
      ) : (
        cta
      )}
    </article>
  );
}
