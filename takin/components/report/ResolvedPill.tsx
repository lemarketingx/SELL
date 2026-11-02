import { Check } from "lucide-react";

export function ResolvedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-primary-tint px-2.5 py-0.5 text-caption font-semibold text-primary-hover">
      <Check aria-hidden size={14} strokeWidth={2.4} />
      סומן כמטופל
    </span>
  );
}
