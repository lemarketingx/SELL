import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { DemoNotice } from "./DemoNotice";

/** מעטפת לדפי הדוח: רקע surface, רוחב 960, הודעת דוגמה והסרת אחריות בתחתית (CLAUDE.md). */
export function ReportShell({ demo, children }: { demo: boolean; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto flex max-w-app flex-col gap-6">
          {demo && <DemoNotice />}
          {children}
          <Disclaimer tone="light" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
