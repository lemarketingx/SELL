import { describe, expect, it } from "vitest";
import { getScan, summaryLine, toFreeReport, DEMO_SCAN_ID } from "@/lib/report";
import { FIX_COPY } from "@/content/fix-copy";

const scan = getScan(DEMO_SCAN_ID)!;

describe("toFreeReport", () => {
  const free = toFreeReport(scan);

  it("פותח את הממצא החמור ביותר", () => {
    expect(free.openFinding?.severity).toBe("high");
    expect(free.openFinding?.id).toBe("f1");
  });

  it("לא שולח את התוכן המלא של הממצאים הנעולים", () => {
    expect(free.locked).toHaveLength(scan.findings.length - 1);
    for (const l of free.locked) {
      expect(Object.keys(l).sort()).toEqual(["area", "id", "severity", "title"]);
    }
    const json = JSON.stringify(free);
    for (const f of scan.findings.slice(1)) expect(json).not.toContain(f.meaning);
  });
});

describe("summaryLine", () => {
  it("כמו בעיצוב", () => {
    expect(summaryLine(scan.counts)).toBe("נמצאו 7 בעיות: 2 חמורות, 3 בינוניות, 2 קלות");
  });
  it("יחיד", () => {
    expect(summaryLine({ high: 1, mid: 0, low: 1, total: 2 })).toBe("נמצאו 2 בעיות: 1 חמורה, 1 קלה");
  });
});

describe("נתוני ה-mock", () => {
  it("לכל ממצא יש ראיה", () => {
    for (const f of scan.findings) expect(f.evidence.quote.trim().length).toBeGreaterThan(0);
  });
  it("לכל ממצא בדוח הדוגמה יש טקסט למודאל", () => {
    for (const f of scan.findings) expect(FIX_COPY[f.ruleId], f.ruleId).toBeDefined();
  });
  it("ניסוח חלופי: בדיוק 3 חלופות", () => {
    for (const f of scan.findings.filter((x) => x.fix.type === "rewrite")) expect(f.fix.alternatives).toHaveLength(3);
  });
});
