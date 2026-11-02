import { Info } from "lucide-react";

/** עד שהסורק אמיתי (שלב 3) כל סריקה מציגה את דוח הדוגמה. חשוב לא להציג אותו כאילו הוא של האתר של המשתמש. */
export function DemoNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-border-strong bg-primary-tint-strong px-5 py-4 text-base text-text">
      <Info aria-hidden size={22} strokeWidth={1.8} className="mt-[3px] shrink-0 text-primary" />
      <p className="m-0">
        <strong className="font-bold">זו הדגמה.</strong> הסורק האמיתי עדיין בבנייה, ולכן מוצג דוח לדוגמה של האתר{" "}
        <span dir="ltr">studio-example.co.il</span> ולא של האתר שהזנתם.
      </p>
    </div>
  );
}
