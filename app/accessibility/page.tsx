import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { ACCESSIBILITY } from "@/content/legal";

export const metadata: Metadata = { title: "הצהרת נגישות · תקין" };

export default function Page() {
  return <LegalPage doc={ACCESSIBILITY} />;
}
