import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "תקין · סריקת סיכונים משפטיים לאתר שלכם",
  description:
    "תקין סורק את האתר או דף הנחיתה שלכם, מסמן סיכונים משפטיים אפשריים בדיוור, בפרטיות, בנגישות ובהגנת הצרכן, ומסביר כל אחד בעברית פשוטה.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B2230",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <a href="#main" className="skip-link">
          דלגו לתוכן הראשי
        </a>
        {children}
      </body>
    </html>
  );
}
