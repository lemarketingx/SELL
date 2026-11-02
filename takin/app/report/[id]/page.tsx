import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "דוח · תקין" };

export default function Page() {
  return <PlaceholderPage title="דוח" body="[הדוח החינמי ייבנה בשלב 2]" />;
}
