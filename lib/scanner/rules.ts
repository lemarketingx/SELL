// חוקי הסריקה (SPEC §4.2). כל חוק = פונקציה טהורה: SiteData → Finding[].
// הטקסטים יושבים ב-content/findings-copy.ts. אם אין ראיה ספציפית — אין ממצא.
// ללא דפדפן אין כאן את CONS-02 (שעון מתאפס) ואת A11Y-04 (axe) — הם יתווספו כשיהיה סורק עם דפדפן.
import {
  ACCESSIBILITY_STATEMENT_TEMPLATE,
  ALT_SNIPPET,
  CLAIM_ALTERNATIVES,
  CONSENT_SNIPPET,
  FINDING_COPY,
  PRICE_ALTERNATIVES,
  PRIVACY_POLICY_SKELETON,
  SEPARATE_CONSENTS_SNIPPET,
  trackersParagraph,
} from "@/content/findings-copy";
import type { Area, Finding, Severity } from "@/lib/types";
import { PRIVACY_LINK } from "./collect";
import type { FormInfo, PageData, SiteData } from "./types";

type Draft = Omit<Finding, "id" | "status" | "title" | "meaning"> & { title?: string; titleVars?: Record<string, string | number> };

function make(d: Draft): Omit<Finding, "id"> {
  const copy = FINDING_COPY[d.ruleId];
  let title = d.title ?? copy.title;
  for (const [k, v] of Object.entries(d.titleVars ?? {})) title = title.replace(`{${k}}`, String(v));
  return { ...d, title, meaning: copy.meaning, status: "open", fix: { ...d.fix, summary: d.fix.summary || copy.fixSummary } };
}

function base(ruleId: string, area: Area, severity: Severity) {
  return { ruleId, area, severity };
}

const MARKETING = /(דיוור|עדכונים|מבצעים|הודעות שיווקיות|תוכן שיווקי|ניוזלטר|newsletter|marketing|promotions?|הטבות|subscribe)/i;
const CONSENT_WORDS = /(דיוור|עדכונים|מבצעים|הודעות שיווקיות|הסכמה|ניוזלטר|newsletter|marketing|promotions?|subscribe|מאשר.{0,6}לקבל|מסכימ.{0,6}לקבל)/i;
const TERMS = /(תקנון|תנאי השימוש|תנאי שימוש|מדיניות הפרטיות|terms|privacy)/i;

function formsWithPage(site: SiteData): { page: PageData; form: FormInfo }[] {
  return site.pages.flatMap((page) => page.forms.map((form) => ({ page, form })));
}

function contactForms(site: SiteData) {
  return formsWithPage(site).filter(({ form }) => form.fields.some((f) => f.isContact));
}

export function spam01(site: SiteData) {
  const missing = contactForms(site).filter(({ form }) => !form.checkboxes.some((c) => CONSENT_WORDS.test(c.text)));
  if (!missing.length) return [];
  const { page, form } = missing[0];
  const fields = form.fields.filter((f) => f.isContact).map((f) => `"${f.name}"`).slice(0, 3).join(", ");
  const extra = missing.length > 1 ? ` (ועוד ${missing.length - 1} טפסים)` : "";
  return [
    make({
      ...base("SPAM-01", "spam", "high"),
      evidence: { pageUrl: page.url, location: `${page.label}, ${form.label}${extra}`, quote: `בטופס יש שדות ${fields}, ואין תיבת סימון להסכמה לדיוור.` },
      fix: { type: "snippet", summary: "", snippet: CONSENT_SNIPPET, note: "התיבה לא מסומנת מראש. הגולש צריך לסמן אותה בעצמו, ושליחת דיוור רק למי שסימן." },
    }),
  ];
}

export function spam02(site: SiteData) {
  for (const { page, form } of formsWithPage(site)) {
    const box = form.checkboxes.find((c) => c.checked && MARKETING.test(c.text));
    if (box) {
      return [
        make({
          ...base("SPAM-02", "spam", "high"),
          evidence: { pageUrl: page.url, location: `${page.label}, ${form.label}`, quote: `"${box.text.slice(0, 160)}" — התיבה מסומנת כבר כשהדף נטען.` },
          fix: { type: "snippet", summary: "", snippet: CONSENT_SNIPPET, note: "בלי המאפיין checked: הגולש מסמן בעצמו." },
        }),
      ];
    }
  }
  return [];
}

export function spam03(site: SiteData) {
  for (const { page, form } of formsWithPage(site)) {
    const box = form.checkboxes.find((c) => MARKETING.test(c.text) && TERMS.test(c.text));
    if (box) {
      return [
        make({
          ...base("SPAM-03", "spam", "mid"),
          evidence: { pageUrl: page.url, location: `${page.label}, ${form.label}`, quote: `"${box.text.slice(0, 160)}"` },
          fix: { type: "snippet", summary: "", snippet: SEPARATE_CONSENTS_SNIPPET },
        }),
      ];
    }
  }
  return [];
}

function hasLink(site: SiteData, re: RegExp) {
  return site.pages.some((p) => p.links.some((l) => re.test(l.text) || re.test(safeDecode(l.href))));
}

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function priv01(site: SiteData) {
  if (hasLink(site, PRIVACY_LINK) || site.privacyPage) return [];
  const collects = contactForms(site).length > 0;
  return [
    make({
      ...base("PRIV-01", "privacy", collects ? "high" : "mid"),
      evidence: {
        pageUrl: site.finalUrl,
        location: "תפריט ותחתית הדפים שנסרקו",
        quote: collects ? "באתר יש טופס שאוסף פרטים, ולא נמצא קישור למדיניות פרטיות." : "לא נמצא קישור למדיניות פרטיות.",
      },
      fix: { type: "template", summary: "", snippet: PRIVACY_POLICY_SKELETON },
    }),
  ];
}

const TRACKERS: [string, RegExp][] = [
  ["Meta Pixel", /connect\.facebook\.net\/[^"']*fbevents|fbq\(\s*['"]init/i],
  ["Google Analytics", /google-analytics\.com|googletagmanager\.com\/gtag|gtag\(\s*['"]config/i],
  ["Google Tag Manager", /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/],
  ["TikTok Pixel", /analytics\.tiktok\.com|ttq\.(load|page)/i],
  ["Hotjar", /static\.hotjar\.com|hotjar\.com\/c\/hotjar/i],
  ["LinkedIn Insight", /snap\.licdn\.com|_linkedin_partner_id/i],
  ["Microsoft Clarity", /clarity\.ms/i],
];
const POLICY_MENTIONS_TRACKING = /(עוגיות|עוגייה|קוקיז|cookies?|כלי מעקב|כלי ניתוח|פיקסל|pixel|analytics|אנליטיקס|פרסום ממוקד|פרסום מותאם|tracking)/i;

export function detectTrackers(site: SiteData): string[] {
  const all = site.pages.map((p) => p.scripts).join("\n");
  return TRACKERS.filter(([, re]) => re.test(all)).map(([name]) => name);
}

export function priv02(site: SiteData) {
  const tools = detectTrackers(site);
  if (!tools.length) return [];
  if (site.privacyPage && POLICY_MENTIONS_TRACKING.test(site.privacyPage.text)) return [];
  const policyNote = site.privacyPage ? "במדיניות הפרטיות אין אזכור לכלי מעקב או לעוגיות." : "לא נמצאה מדיניות פרטיות שמסבירה אותם.";
  return [
    make({
      ...base("PRIV-02", "privacy", "high"),
      evidence: { pageUrl: site.finalUrl, location: "קוד הדף ומדיניות הפרטיות", quote: `בקוד האתר נטענים: ${tools.join(", ")}. ${policyNote}` },
      fix: { type: "template", summary: "", snippet: trackersParagraph(tools) },
    }),
  ];
}

export function a11y01(site: SiteData) {
  if (hasLink(site, /(נגישות|accessibility)/i)) return [];
  return [
    make({
      ...base("A11Y-01", "accessibility", "mid"),
      evidence: { pageUrl: site.finalUrl, location: "תפריט ותחתית הדפים שנסרקו", quote: "לא נמצא קישור להצהרת נגישות." },
      fix: { type: "template", summary: "", snippet: ACCESSIBILITY_STATEMENT_TEMPLATE },
    }),
  ];
}

export function a11y02(site: SiteData) {
  const total = site.pages.reduce((n, p) => n + p.imagesWithoutAlt, 0);
  if (!total) return [];
  const worst = [...site.pages].sort((a, b) => b.imagesWithoutAlt - a.imagesWithoutAlt)[0];
  const pagesWith = site.pages.filter((p) => p.imagesWithoutAlt > 0).length;
  return [
    make({
      ...base("A11Y-02", "accessibility", "low"),
      title: total === 1 ? "תמונה אחת בלי טקסט חלופי" : undefined,
      titleVars: { n: total },
      evidence: {
        pageUrl: worst.url,
        location: pagesWith > 1 ? `${worst.label} ועוד ${pagesWith - 1} עמודים` : worst.label,
        quote: `ב${worst.label} יש ${worst.imagesWithoutAlt} תמונות בלי מאפיין alt.`,
      },
      fix: { type: "instructions", summary: "", snippet: ALT_SNIPPET },
    }),
  ];
}

export function a11y03(site: SiteData) {
  const unlabeled = formsWithPage(site).flatMap(({ page, form }) => form.fields.filter((f) => !f.hasLabel).map((f) => ({ page, form, f })));
  if (!unlabeled.length) return [];
  const first = unlabeled[0];
  const names = unlabeled.slice(0, 3).map((u) => `"${u.f.name}"`).join(", ");
  const snippet = unlabeled
    .slice(0, 3)
    .map((u, i) => {
      const id = `field-${i + 1}`;
      const label = u.f.name.replace(/[<>"]/g, "") || "שם השדה";
      return u.f.tag === "textarea"
        ? `<label for="${id}">${label}</label>\n<textarea id="${id}" name="${id}"></textarea>`
        : `<label for="${id}">${label}</label>\n<input id="${id}" name="${id}" type="${u.f.type}">`;
    })
    .join("\n\n");
  return [
    make({
      ...base("A11Y-03", "accessibility", "low"),
      title: unlabeled.length === 1 ? "שדה בטופס בלי תווית" : undefined,
      titleVars: { n: unlabeled.length },
      evidence: { pageUrl: first.page.url, location: `${first.page.label}, ${first.form.label}`, quote: `השדות ${names} מסומנים רק בטקסט בתוך השדה, בלי תווית.` },
      fix: { type: "snippet", summary: "", snippet },
    }),
  ];
}

const ABSOLUTE_CLAIMS = [
  /תוצאות מובטחות/,
  /(?:^|[^\p{L}])מובטח(?:ת|ות|ים)?(?=$|[^\p{L}])/u,
  /ללא סיכון|בלי סיכון|אפס סיכון/,
  /(?:ה)?הכי (?:טוב|זול|טובה|זולה|טובים|זולים) ב(?:ישראל|ארץ)/,
  /הזול ביותר|הטוב ביותר בישראל|הטובה ביותר בישראל|מספר 1 בישראל|מס['׳] 1 בישראל/,
  /מוכח מדעית/,
];
const HUNDRED = /100\s?%/;
const HUNDRED_CONTEXT = /(הצלחה|שביעות רצון|תוצאות|תוצאה|מובטח|אחריות|החזר|יעיל|יעילות|בטוח)/;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && s.length <= 400);
}

export function cons01(site: SiteData) {
  const found: { page: PageData; quote: string }[] = [];
  const seen = new Set<string>();
  for (const page of site.pages) {
    for (const s of sentences(page.text)) {
      const hit = ABSOLUTE_CLAIMS.some((re) => re.test(s)) || (HUNDRED.test(s) && HUNDRED_CONTEXT.test(s));
      if (!hit) continue;
      const quote = s.length > 160 ? `${s.slice(0, 157)}…` : s;
      if (seen.has(quote)) continue;
      seen.add(quote);
      found.push({ page, quote });
    }
  }
  return found.slice(0, 3).map(({ page, quote }) =>
    make({
      ...base("CONS-01", "consumer", "mid"),
      evidence: { pageUrl: page.url, location: page.label, quote: `"${quote}"` },
      fix: { type: "rewrite", summary: "", before: quote, alternatives: CLAIM_ALTERNATIVES },
    }),
  );
}

const PRICE_ASTERISK = /(₪\s?\d[\d,.]*|\d[\d,.]*\s?(?:₪|ש"ח|שקלים))\s*\*/;
const ASTERISK_NOTE = /(^|\n)\s*\*+\s*\S/;
const FROM_PRICE = /החל מ[-־–]?\s?(₪\s?\d[\d,.]*|\d[\d,.]*\s?(?:₪|ש"ח|שקלים))/;
const PRICE_CLARIFY = /(כולל|לא כולל|מחיר סופי|תלוי|בהתאם ל|לפי)/;

export function cons03(site: SiteData) {
  for (const page of site.pages) {
    for (const s of sentences(page.text)) {
      const asterisk = PRICE_ASTERISK.test(s) && !ASTERISK_NOTE.test(page.text);
      const from = FROM_PRICE.test(s) && !PRICE_CLARIFY.test(s);
      if (!asterisk && !from) continue;
      const quote = s.length > 160 ? `${s.slice(0, 157)}…` : s;
      return [
        make({
          ...base("CONS-03", "consumer", "low"),
          evidence: {
            pageUrl: page.url,
            location: page.label,
            quote: asterisk ? `"${quote}" — יש כוכבית ליד המחיר, ולא מצאנו את ההסבר שלה.` : `"${quote}"`,
          },
          fix: { type: "rewrite", summary: "", before: quote, alternatives: PRICE_ALTERNATIVES },
        }),
      ];
    }
  }
  return [];
}

export const RULES = [spam02, spam03, spam01, priv01, priv02, a11y01, a11y02, a11y03, cons01, cons03];

/** בדיקות שלא רצות בסורק הנוכחי (בלי דפדפן) — מוצג בדוח בשקיפות. */
export const SKIPPED_CHECKS = ["שעון ספירה לאחור שמתאפס בכל כניסה", "בדיקת נגישות אוטומטית מלאה (ניגודיות צבעים, כפתורים בלי שם)"];

export function runRules(site: SiteData): Omit<Finding, "id">[] {
  return RULES.flatMap((rule) => rule(site));
}
