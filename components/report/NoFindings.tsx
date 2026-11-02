import { Check } from "lucide-react";

/** כשאין ממצאים: "ללא ממצא חמור" ולא "תקין" ולא "עומד בחוק" (CLAUDE.md). */
export function NoFindings() {
  return (
    <section className="flex items-start gap-4 rounded-[20px] border border-border bg-bg p-5 sm:p-7">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-icon bg-sev-low-bg text-sev-low">
        <Check aria-hidden size={24} strokeWidth={2.2} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-xl font-bold text-ink">ללא ממצא חמור</h2>
        <p className="m-0 text-text">בבדיקות שהרצנו לא מצאנו בעיות. זה לא אישור שהאתר עומד בכל דרישה, ולכן כדאי לבדוק שוב כשמשנים את האתר.</p>
      </div>
    </section>
  );
}
