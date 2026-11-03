import { Info } from "lucide-react";

/** מוצג רק על דוח הדוגמה, כדי שלא ייראה כמו דוח של אתר אמיתי. */
export function DemoNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-border-strong bg-primary-tint-strong px-5 py-4 text-base text-text">
      <Info aria-hidden size={22} strokeWidth={1.8} className="mt-[3px] shrink-0 text-primary" />
      <p className="m-0">
        <strong className="font-bold">זה דוח לדוגמה</strong> של אתר בדוי (<span dir="ltr" className="whitespace-nowrap">studio-example.co.il</span>), כדי להראות איך נראה דוח. כדי לקבל דוח על
        האתר שלכם, הדביקו את הכתובת בדף הבית.
      </p>
    </div>
  );
}
