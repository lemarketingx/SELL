import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { TERMS } from "@/content/legal";

export const metadata: Metadata = { title: "תנאי שימוש · תקין" };

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
