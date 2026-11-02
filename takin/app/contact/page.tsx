import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "צור קשר · תקין" };

export default function Page() {
  return <PlaceholderPage title="צור קשר" body="[פרטי יצירת קשר יתווספו כאן]" />;
}
