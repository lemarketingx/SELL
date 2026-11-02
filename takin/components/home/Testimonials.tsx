import { PlaceholderTestimonial } from "@/components/ui/PlaceholderTestimonial";

export function Testimonials() {
  return (
    <section aria-labelledby="quotes-title" className="px-6 py-section">
      <div className="mx-auto flex max-w-site flex-col gap-9">
        <h2 id="quotes-title" className="m-0 text-center text-[clamp(28px,3.2vw,38px)] font-extrabold text-ink">
          מה אומרים בעלי עסקים
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          <PlaceholderTestimonial />
          <PlaceholderTestimonial />
          <PlaceholderTestimonial />
        </div>
      </div>
    </section>
  );
}
