import { ScanFocusLink } from "@/components/ui/ScanFocusLink";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-6 pb-section">
      <div className="mx-auto flex max-w-site flex-col items-center gap-5 rounded-modal bg-primary-tint px-8 py-14 text-center">
        <h2 id="final-cta-title" className="m-0 text-[clamp(28px,3.2vw,38px)] font-extrabold text-ink">
          דקה אחת, ותדעו איפה אתם עומדים
        </h2>
        <ScanFocusLink className="btn-primary inline-flex min-h-[58px] items-center rounded-[14px] px-8 text-[19px] font-bold">
          סרוק את האתר שלי בחינם
        </ScanFocusLink>
      </div>
    </section>
  );
}
