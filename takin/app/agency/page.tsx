import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "לוח ניהול למשרדים · תקין" };

export default function Page() {
  return <PlaceholderPage title="לוח ניהול למשרדים" body="[לוח הניהול ייבנה בשלב 5]" />;
}
