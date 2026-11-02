import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { PRIVACY } from "@/content/legal";

export const metadata: Metadata = { title: "מדיניות פרטיות · תקין" };

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
