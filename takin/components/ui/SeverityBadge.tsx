import type { Severity } from "@/lib/types";
import { SEVERITY_LABELS } from "@/lib/areas";

// חומרה מסומנת בצבע + צורה + טקסט: עיגול = חמור, ריבוע = בינוני, משולש = קל.
const styles: Record<Severity, string> = {
  high: "bg-sev-high-bg text-sev-high",
  mid: "bg-sev-mid-bg text-sev-mid",
  low: "bg-sev-low-bg text-sev-low",
};

export function SeverityShape({ severity, size = 8 }: { severity: Severity; size?: number }) {
  if (severity === "high") {
    return <span aria-hidden className="inline-block shrink-0 rounded-full bg-current" style={{ width: size, height: size }} />;
  }
  if (severity === "mid") {
    return <span aria-hidden className="inline-block shrink-0 rounded-[1px] bg-current" style={{ width: size, height: size }} />;
  }
  return (
    <svg aria-hidden width={size + 2} height={size + 2} viewBox="0 0 10 10" className="shrink-0">
      <path d="M5 0.8 9.6 9.2H0.4Z" fill="currentColor" />
    </svg>
  );
}

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-caption font-bold ${styles[severity]}`}>
      <SeverityShape severity={severity} />
      {label ?? SEVERITY_LABELS[severity]}
    </span>
  );
}

/** תגית ספירה ("2 חמורות") — הטקסט נושא את המשמעות, הצורה מחזקת. */
export function CountPill({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-caption font-semibold ${styles[severity]}`}>
      <SeverityShape severity={severity} size={7} />
      {children}
    </span>
  );
}
