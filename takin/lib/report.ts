import type { Area, Finding, Scan, Severity } from "./types";
import sample from "@/content/sample-report.json";

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, mid: 1, low: 2 };

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** דוח ה-mock. בשלב 3 יוחלף בקריאה ל-API. */
export function getScan(id: string): Scan | null {
  return id === sample.id ? (sample as Scan) : null;
}

export const DEMO_SCAN_ID = sample.id;

export interface LockedFinding {
  id: string;
  area: Area;
  severity: Severity;
  title: string;
}

export interface FreeReport {
  id: string;
  url: string;
  score: number;
  counts: Scan["counts"];
  openFinding: Finding | null;
  locked: LockedFinding[];
}

/**
 * מה שנשלח ללקוח בדוח החינמי: ממצא אחד מלא (החמור ביותר), ולשאר רק כותרת וחומרה.
 * חשוב שזה ירוץ בשרת, כדי שהתוכן המלא לא יגיע לדפדפן (SPEC §1).
 */
export function toFreeReport(scan: Scan): FreeReport {
  const [first, ...rest] = sortFindings(scan.findings);
  return {
    id: scan.id,
    url: scan.url,
    score: scan.score,
    counts: scan.counts,
    openFinding: first ?? null,
    locked: rest.map(({ id, area, severity, title }) => ({ id, area, severity, title })),
  };
}

export function summaryLine(counts: Scan["counts"]): string {
  if (counts.total === 0) return "לא נמצאו בעיות";
  const parts: string[] = [];
  if (counts.high) parts.push(`${counts.high} ${counts.high === 1 ? "חמורה" : "חמורות"}`);
  if (counts.mid) parts.push(`${counts.mid} ${counts.mid === 1 ? "בינונית" : "בינוניות"}`);
  if (counts.low) parts.push(`${counts.low} ${counts.low === 1 ? "קלה" : "קלות"}`);
  return `נמצאו ${counts.total} בעיות: ${parts.join(", ")}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
