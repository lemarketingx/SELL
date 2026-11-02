import Link from "next/link";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** עמוד זמני למסכים שייבנו בשלבים הבאים (SPEC §6), כדי שקישורים מדף הבית לא יובילו ל-404. */
export function PlaceholderPage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-6 py-section">
        <div className="mx-auto flex max-w-app flex-col gap-5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.5px] text-ink">{title}</h1>
          <p className="m-0 text-lead text-muted">{body}</p>
          <Link href="/" className="btn-ghost inline-flex min-h-12 items-center self-start rounded-btn px-[22px] font-semibold">
            חזרה לדף הבית
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
