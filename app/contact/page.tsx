import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BUSINESS } from "@/content/business";

export const metadata: Metadata = { title: "צור קשר · תקין" };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="px-6 py-14 sm:py-section">
        <div className="mx-auto flex max-w-[760px] flex-col gap-5">
          <h1 className="m-0 text-h2 font-extrabold tracking-[-0.5px] text-ink">צור קשר</h1>
          <p className="m-0 text-lead text-muted">שאלה על דוח, הצעה לשיפור או בעיה באתר? נשמח לשמוע.</p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-lg">
            <dt className="font-semibold text-ink">מייל</dt>
            <dd className="m-0">{BUSINESS.email}</dd>
            <dt className="font-semibold text-ink">טלפון</dt>
            <dd className="m-0">{BUSINESS.phone}</dd>
            <dt className="font-semibold text-ink">שם העסק</dt>
            <dd className="m-0">
              {BUSINESS.name}, {BUSINESS.legalId}
            </dd>
            <dt className="font-semibold text-ink">כתובת</dt>
            <dd className="m-0">{BUSINESS.address}</dd>
          </dl>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
