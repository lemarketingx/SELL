import { randomBytes } from "node:crypto";
import { computeScore } from "@/lib/score";
import { sortFindings } from "@/lib/report";
import { AREAS } from "@/lib/areas";
import type { Area, Finding, Scan } from "@/lib/types";
import { collectSite } from "./collect";
import { runRules, SKIPPED_CHECKS } from "./rules";

export type ScanEvent =
  | { type: "pages"; count: number }
  | { type: "area"; area: Area; state: "running" | "done" }
  | { type: "done"; id: string }
  | { type: "error"; message: string };

const ID_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newScanId(): string {
  const bytes = randomBytes(16);
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

export async function runScan(url: string, emit: (e: ScanEvent) => void = () => {}): Promise<Scan> {
  const site = await collectSite(url, (count) => emit({ type: "pages", count }));
  const raw = runRules(site);
  const findings: Finding[] = sortFindings(raw.map((f, i) => ({ ...f, id: `f${i + 1}` })));

  for (const area of AREAS) {
    emit({ type: "area", area, state: "running" });
    emit({ type: "area", area, state: "done" });
  }

  const counts = {
    high: findings.filter((f) => f.severity === "high").length,
    mid: findings.filter((f) => f.severity === "mid").length,
    low: findings.filter((f) => f.severity === "low").length,
    total: findings.length,
  };

  return {
    id: newScanId(),
    url: site.finalUrl,
    createdAt: new Date().toISOString(),
    status: "done",
    progress: AREAS.map((area) => ({ area, state: "done" as const })),
    score: computeScore(counts),
    counts,
    findings,
    unlocked: false,
    meta: {
      pagesScanned: site.pages.map((p) => ({ url: p.url, label: p.label })),
      skippedChecks: SKIPPED_CHECKS,
      likelyClientRendered: site.likelyClientRendered,
    },
  };
}
