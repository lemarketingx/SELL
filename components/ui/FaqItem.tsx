import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function FaqItem({ question, children, defaultOpen = false }: { question: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-card border border-border bg-bg shadow-card transition-colors open:border-border-strong">
      <summary className="flex min-h-[64px] items-center justify-between gap-4 rounded-card px-5 text-[18px] font-semibold text-ink hover:bg-surface sm:px-6">
        {question}
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted group-open:bg-primary-tint group-open:text-primary">
          <ChevronDown aria-hidden size={18} strokeWidth={2} className="chev transition-transform" />
        </span>
      </summary>
      <p className="m-0 px-5 pb-5 text-muted sm:px-6">{children}</p>
    </details>
  );
}
