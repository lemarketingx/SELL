import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "דוח מלא · תקין" };

export default function Page() {
  return <PlaceholderPage title="דוח מלא" body="[הדוח המלא ייבנה בשלב 2]" />;
}
