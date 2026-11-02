import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/site/PlaceholderPage";

export const metadata: Metadata = { title: "למשרדי דיגיטל · תקין" };

export default function Page() {
  return <PlaceholderPage title="לוח ניהול למשרדי דיגיטל" body="המסלול למשרדים, עם לוח ניהול לכל אתרי הלקוחות ודוח ממותג, יושק בקרוב. בינתיים אפשר לסרוק כל אתר בנפרד בחינם." />;
}
