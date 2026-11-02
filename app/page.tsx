import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Areas } from "@/components/home/Areas";
import { ReportSample } from "@/components/home/ReportSample";
import { Agencies } from "@/components/home/Agencies";
import { Pricing } from "@/components/home/Pricing";
import { Faq } from "@/components/home/Faq";
import { FinalCta } from "@/components/home/FinalCta";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Areas />
        <ReportSample />
        <Pricing />
        <Agencies />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
