import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "מדיניות פרטיות · תקין" };

export default function Page() {
  return <PlaceholderPage title="מדיניות פרטיות" body="[טקסט משפטי יתווסף כאן]" />;
}
