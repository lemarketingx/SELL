import type { ReactNode } from "react";
import type { Finding } from "@/lib/types";

/** "מה מצאנו באתר" + "מה זה אומר" + שורת התיקון. משותף לכרטיס ול-accordion. */
export function FindingBody({ finding, fixAction }: { finding: Finding; fixAction: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h4 className="m-0 text-caption font-bold text-muted">מה מצאנו באתר</h4>
        <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3">
          <span className="text-caption font-semibold text-muted">{finding.evidence.location}</span>
          <p className="m-0 text-text">{finding.evidence.quote}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h4 className="m-0 text-caption font-bold text-muted">מה זה אומר</h4>
        <p className="m-0 text-text">{finding.meaning}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-base font-medium text-muted">{finding.fix.summary}</span>
        {fixAction}
      </div>
    </div>
  );
}
