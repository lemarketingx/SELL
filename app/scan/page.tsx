import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ScanProgress } from "@/components/report/ScanProgress";

export const metadata: Metadata = { title: "סורקים את האתר · תקין", robots: { index: false } };

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ url?: string | string[] }> }) {
  const { url } = await searchParams;
  const raw = Array.isArray(url) ? url[0] : url;
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-surface px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-app">
          <ScanProgress key={raw ?? ""} rawUrl={raw ?? null} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
