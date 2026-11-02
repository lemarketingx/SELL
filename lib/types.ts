// מודל הנתונים — לפי SPEC.md §3.

export type Area = "spam" | "privacy" | "accessibility" | "consumer";
export type Severity = "high" | "mid" | "low";
export type FixType = "snippet" | "rewrite" | "template" | "instructions";

export interface Finding {
  id: string;
  ruleId: string;
  area: Area;
  severity: Severity;
  title: string;
  evidence: {
    pageUrl: string;
    location: string;
    quote: string;
  };
  meaning: string;
  fix: {
    type: FixType;
    summary: string;
    before?: string;
    snippet?: string;
    note?: string;
    alternatives?: { tag: string; text: string; note: string }[];
  };
  status: "open" | "resolved";
}

export interface Scan {
  id: string;
  url: string;
  createdAt: string;
  status: "queued" | "running" | "done" | "failed";
  progress: { area: Area; state: "pending" | "running" | "done" }[];
  score: number;
  counts: { high: number; mid: number; low: number; total: number };
  findings: Finding[];
  unlocked: boolean;
  /** פרטים על הכיסוי של הסריקה, כדי להציג בדוח בשקיפות מה נבדק ומה לא. */
  meta?: {
    pagesScanned: { url: string; label: string }[];
    skippedChecks: string[];
    likelyClientRendered: boolean;
  };
}

export interface Site {
  id: string;
  ownerId: string;
  clientName: string;
  url: string;
  lastScanId?: string;
  monitor: boolean;
}

export interface Account {
  id: string;
  email: string;
  plan: "free" | "report" | "monitor" | "agency";
  brand?: { name: string; logoUrl?: string; color?: string };
}

export interface Purchase {
  id: string;
  scanId?: string;
  accountId?: string;
  product: "report" | "monitor" | "agency";
  amountIls: number;
  status: "pending" | "paid" | "failed";
  provider: string;
  providerRef: string;
}
