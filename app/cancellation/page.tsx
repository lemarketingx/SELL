import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { CANCELLATION } from "@/content/legal";

export const metadata: Metadata = { title: "מדיניות ביטולים · תקין" };

export default function Page() {
  return <LegalPage doc={CANCELLATION} />;
}
