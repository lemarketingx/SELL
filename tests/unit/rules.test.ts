import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePage } from "@/lib/scanner/parse";
import { pickInternalLinks } from "@/lib/scanner/collect";
import { a11y01, a11y02, a11y03, cons01, cons03, detectTrackers, priv01, priv02, runRules, spam01, spam02, spam03 } from "@/lib/scanner/rules";
import type { SiteData } from "@/lib/scanner/types";

const fx = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8");

function site(homeHtml: string, extra: { html: string; url: string }[] = [], privacy?: string): SiteData {
  const home = parsePage(homeHtml, "https://example.co.il/", true);
  const pages = [home, ...extra.map((e) => parsePage(e.html, e.url, false))];
  const privacyPage = privacy ? parsePage(privacy, "https://example.co.il/privacy", false) : null;
  if (privacyPage) pages.push(privacyPage);
  return { startUrl: home.url, finalUrl: home.url, pages, privacyPage, likelyClientRendered: false };
}

const bad = site(fx("bad-site.html"));
const good = site(fx("good-site.html"), [], fx("privacy-with-cookies.html"));

describe("parsePage", () => {
  it("מזהה טפסים, שדות, תיבות סימון ותמונות", () => {
    const p = bad.pages[0];
    expect(p.label).toBe("דף הבית");
    expect(p.forms).toHaveLength(2);
    expect(p.forms[0].label).toBe('טופס "קבעו תור"');
    expect(p.forms[0].fields.map((f) => f.isContact)).toEqual([false, true]);
    expect(p.forms[1].checkboxes[0]).toMatchObject({ checked: true });
    expect(p.imagesWithoutAlt).toBe(2); // alt ריק = דקורטיבי; פיקסל 1x1 לא נספר
    expect(p.text).not.toContain("fbq");
  });

  it("בוחר קישורים פנימיים לפי עדיפות", () => {
    const links = pickInternalLinks(parsePage('<a href="/about">אודות</a><a href="/privacy">פרטיות</a><a href="https://other.com/x">x</a><a href="/file.pdf">pdf</a>', "https://example.co.il/", true));
    expect(links).toEqual(["https://example.co.il/privacy", "https://example.co.il/about"]);
  });
});

describe("חוקים — מקרים חיוביים ושליליים", () => {
  it("SPAM-01: טופס עם טלפון בלי תיבת הסכמה", () => {
    const [f] = spam01(bad);
    expect(f.severity).toBe("high");
    expect(f.evidence.location).toContain('טופס "קבעו תור"');
    expect(f.evidence.quote).toContain('"טלפון"');
    expect(spam01(good)).toEqual([]);
  });

  it("SPAM-02: תיבת דיוור מסומנת מראש", () => {
    expect(spam02(bad)).toHaveLength(1);
    expect(spam02(good)).toEqual([]);
  });

  it("SPAM-03: דיוור ותקנון באותה תיבה", () => {
    expect(spam03(bad)[0].severity).toBe("mid");
    expect(spam03(good)).toEqual([]);
  });

  it("PRIV-01: אין מדיניות פרטיות; חמור כשיש טופס שאוסף פרטים", () => {
    expect(priv01(bad)[0].severity).toBe("high");
    expect(priv01(site("<p>אין טפסים</p>"))[0].severity).toBe("mid");
    expect(priv01(good)).toEqual([]);
  });

  it("PRIV-02: כלי מעקב שלא מוזכרים במדיניות", () => {
    expect(detectTrackers(bad)).toEqual(["Meta Pixel", "Google Analytics"]);
    const [f] = priv02(bad);
    expect(f.evidence.quote).toContain("Meta Pixel");
    expect(f.fix.snippet).toContain("Meta Pixel, Google Analytics");
    expect(priv02(good)).toEqual([]); // המדיניות מזכירה עוגיות
    expect(priv02(site(fx("good-site.html"), [], "<title>מדיניות פרטיות</title><p>אנחנו שומרים את המידע.</p>"))).toHaveLength(1);
  });

  it("A11Y-01: אין הצהרת נגישות", () => {
    expect(a11y01(bad)).toHaveLength(1);
    expect(a11y01(good)).toEqual([]);
  });

  it("A11Y-02: תמונות בלי alt, מקובצות לממצא אחד עם המספר בכותרת", () => {
    const [f] = a11y02(bad);
    expect(f.title).toBe("2 תמונות בלי טקסט חלופי");
    expect(a11y02(good)).toEqual([]);
  });

  it("A11Y-03: שדות בלי תווית (placeholder לא נחשב)", () => {
    const [f] = a11y03(bad);
    expect(f.title).toBe("2 שדות בטופס בלי תווית");
    expect(f.fix.snippet).toContain('<label for="field-1">שם</label>');
    expect(a11y03(good)).toEqual([]);
  });

  it("CONS-01: טענות מוחלטות — אבל לא '100% כותנה'", () => {
    const quotes = cons01(bad).map((f) => f.evidence.quote);
    expect(quotes).toContain('"תוצאות מובטחות ב-100% כבר מהטיפול הראשון"');
    expect(quotes.some((q) => q.includes("הזול ביותר"))).toBe(true);
    for (const f of cons01(bad)) expect(f.fix.alternatives).toHaveLength(3);
    expect(cons01(good)).toEqual([]);
  });

  it("CONS-03: 'החל מ-' בלי פירוט או כוכבית בלי הסבר", () => {
    expect(cons03(bad)).toHaveLength(1);
    expect(cons03(good)).toEqual([]);
  });

  it("לכל ממצא יש ראיה, ואין ניסוחים אסורים", () => {
    const all = runRules(bad);
    expect(all.length).toBeGreaterThanOrEqual(10);
    for (const f of all) {
      expect(f.evidence.quote.trim()).not.toBe("");
      expect(`${f.title} ${f.meaning}`).not.toMatch(/עומד בחוק|מפר את החוק|הגנה מלאה/);
    }
    expect(runRules(good)).toEqual([]);
  });
});

describe("עמידות (הערות review)", () => {
  it("HTML מכווץ: בלוקים לא מודבקים, וטענה בתוך טקסט ארוך עדיין נמצאת", () => {
    const filler = "טקסט ארוך על השירותים שלנו ועל הצוות המקצועי ".repeat(12);
    const html = `<html><body><h1>ברוכים הבאים</h1><p>${filler}</p><p>אצלנו תוצאות מובטחות לכל לקוח</p><div>${filler}</div></body></html>`;
    const s = site(html);
    expect(s.pages[0].text).toContain("ברוכים הבאים\n");
    expect(cons01(s)).toHaveLength(1);
  });

  it("משפט ארוך בלי נקודות מפורק לחתיכות ולא נזרק", async () => {
    const { sentences } = await import("@/lib/scanner/rules");
    const long = `${"מילה ".repeat(150)}, הכי זול בישראל`;
    expect(sentences(long).some((x) => x.includes("הכי זול בישראל"))).toBe(true);
  });

  it("קישור פנימי עם % לא תקין לא מפיל את בחירת העמודים", () => {
    const home = parsePage('<a href="/sale/50%off">מבצע</a><a href="/privacy">פרטיות</a>', "https://example.co.il/", true);
    expect(() => pickInternalLinks(home)).not.toThrow();
    expect(pickInternalLinks(home)).toContain("https://example.co.il/privacy");
  });
});
