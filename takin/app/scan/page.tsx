import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "סריקה · תקין" };

export default function Page() {
  return <PlaceholderPage title="סריקה" body="[מסך הסריקה ייבנה בשלב 2]" />;
}
