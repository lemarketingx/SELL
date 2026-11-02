import { ArrowLeft } from "lucide-react";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-section sm:px-6">
      <div className="relative mx-auto flex max-w-site flex-col items-center gap-5 overflow-hidden rounded-modal bg-primary-hover px-6 py-14 text-center sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)]"
        />
        <h2 id="final-cta-title" className="relative m-0 max-w-[640px] text-h2 font-extrabold leading-tight tracking-[-0.5px] text-white">
          רוצים לדעת מה כדאי לבדוק באתר שלכם?
        </h2>
        <p className="relative m-0 max-w-[520px] text-lead text-on-dark-muted">סריקה חינמית, בלי הרשמה. דוח ברור, בדרך כלל תוך פחות מדקה.</p>
        <ScanFocusLink className="relative inline-flex min-h-[54px] items-center gap-2 rounded-[12px] bg-white px-8 text-[18px] font-bold text-ink no-underline shadow-float transition-colors hover:bg-primary-tint hover:text-ink">
          סרקו את האתר
          <ArrowLeft aria-hidden size={20} strokeWidth={2} />
        </ScanFocusLink>
      </div>
    </section>
  );
}
