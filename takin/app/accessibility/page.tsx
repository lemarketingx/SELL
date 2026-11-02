import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "הצהרת נגישות · תקין" };

export default function Page() {
  return <PlaceholderPage title="הצהרת נגישות" body="[טקסט משפטי יתווסף כאן]" />;
}
