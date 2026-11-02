import { describe, expect, it } from "vitest";
import { computeScore, scoreHeadline } from "@/lib/score";
import sample from "@/content/sample-report.json";

describe("computeScore", () => {
  it("מחשב 62 לדוח הדוגמה (2/3/2)", () => {
    expect(computeScore({ high: 2, mid: 3, low: 2 })).toBe(62);
    expect(computeScore(sample.counts)).toBe(sample.score);
  });

  it("לא יורד מתחת ל-0", () => {
    expect(computeScore({ high: 20, mid: 0, low: 0 })).toBe(0);
  });

  it("100 כשאין ממצאים", () => {
    expect(computeScore({ high: 0, mid: 0, low: 0 })).toBe(100);
  });
});

describe("scoreHeadline", () => {
  it("לפי טווחים", () => {
    expect(scoreHeadline(0)).toBe("יש כמה דברים שדחוף לטפל בהם");
    expect(scoreHeadline(49)).toBe("יש כמה דברים שדחוף לטפל בהם");
    expect(scoreHeadline(50)).toBe("יש כמה דברים שכדאי לטפל בהם");
    expect(scoreHeadline(79)).toBe("יש כמה דברים שכדאי לטפל בהם");
    expect(scoreHeadline(80)).toBe("נראה טוב. נשארו כמה נקודות קטנות");
  });

  it("אף פעם לא מבטיח עמידה בחוק", () => {
    for (let s = 0; s <= 100; s++) expect(scoreHeadline(s)).not.toMatch(/עומד בחוק|תקין לגמרי/);
  });
});
