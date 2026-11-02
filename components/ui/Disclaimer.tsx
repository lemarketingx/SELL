import { Info } from "lucide-react";

/** הנוסח מחייב, מילה במילה (CLAUDE.md). */
export const DISCLAIMER_TEXT =
  "תקין אינו ייעוץ משפטי. הממצאים נועדו לזהות סיכונים אפשריים, ומומלץ להתייעץ עם עורך דין לפני קבלת החלטות.";

export function Disclaimer({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const toneClass =
    tone === "dark" ? "border-white/25 text-white" : "border-border-strong bg-surface text-text";
  return (
    <div role="note" className={`flex items-start gap-3 rounded-2xl border px-5 py-[18px] text-base ${toneClass}`}>
      <Info aria-hidden size={22} strokeWidth={1.8} className="mt-[3px] shrink-0" />
      <p className="m-0">{DISCLAIMER_TEXT}</p>
    </div>
  );
}
