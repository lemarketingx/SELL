import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "תנאי שימוש · תקין" };

export default function Page() {
  return <PlaceholderPage title="תנאי שימוש" body="[טקסט משפטי יתווסף כאן]" />;
}
