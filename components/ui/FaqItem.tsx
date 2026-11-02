import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function FaqItem({ question, children, defaultOpen = false }: { question: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="rounded-[18px] border border-border-strong bg-bg px-6">
      <summary className="flex min-h-[68px] items-center justify-between gap-4 text-[19px] font-semibold text-ink">
        {question}
        <ChevronDown aria-hidden size={22} strokeWidth={2} className="chev shrink-0 transition-transform" />
      </summary>
      <p className="m-0 mb-[22px] text-muted">{children}</p>
    </details>
  );
}
