import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { LEGAL_UPDATED } from "@/content/business";
import type { LegalDoc } from "@/content/legal";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-6 py-14 sm:py-section">
        <article className="mx-auto flex max-w-[760px] flex-col gap-6">
          <header className="flex flex-col gap-3">
            <h1 className="m-0 text-h2 font-extrabold tracking-[-0.5px] text-ink">{doc.title}</h1>
            <p className="m-0 text-caption text-muted">עדכון אחרון: {LEGAL_UPDATED}</p>
            <p role="note" className="m-0 rounded-[14px] bg-sev-mid-note-bg px-4 py-3 text-base text-text">
              טיוטה: המסמך עדיין לא נבדק על ידי עורך דין.
            </p>
            <p className="m-0 text-lead text-text">{doc.intro}</p>
          </header>
          {doc.sections.map((s) => (
            <section key={s.heading} className="flex flex-col gap-2">
              <h2 className="m-0 text-h3 font-bold text-ink">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="m-0 text-text">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
