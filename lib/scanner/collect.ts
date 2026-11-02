import { fetchPage, ScanFetchError } from "./net";
import { parsePage } from "./parse";
import type { PageData, SiteData } from "./types";

const MAX_EXTRA_PAGES = 6;
const PRIORITY: [RegExp, number][] = [
  [/(privacy|פרטיות)/i, 10],
  [/(accessib|נגישות)/i, 9],
  [/(contact|צור.?קשר|יצירת.?קשר)/i, 8],
  [/(price|pricing|מחיר|מחירון)/i, 7],
  [/(service|שירות)/i, 6],
  [/(terms|תקנון|תנאי)/i, 5],
  [/(about|אודות)/i, 4],
];

export const PRIVACY_LINK = /(privacy|פרטיות)/i;

function safeDecode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function sameSite(a: URL, b: URL) {
  return a.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "");
}

export function pickInternalLinks(home: PageData, max = MAX_EXTRA_PAGES): string[] {
  const base = new URL(home.url);
  const scored = new Map<string, number>();
  for (const link of home.links) {
    let u: URL;
    try {
      u = new URL(link.href);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol) || !sameSite(u, base)) continue;
    if (/\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mp3)$/i.test(u.pathname)) continue;
    u.hash = "";
    const key = u.toString();
    if (key === base.toString() || u.pathname === base.pathname) continue;
    const hay = `${safeDecode(u.pathname)} ${link.text}`;
    const score = PRIORITY.reduce((s, [re, w]) => (re.test(hay) ? Math.max(s, w) : s), 0);
    scored.set(key, Math.max(scored.get(key) ?? -1, score));
  }
  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([u]) => u);
}

/** אוסף את דף הבית ועד 6 דפים פנימיים חשובים. דף שנכשל מדולג — רק כישלון בדף הבית מכשיל את הסריקה. */
export async function collectSite(startUrl: string, onPage?: (count: number) => void): Promise<SiteData> {
  const home = await fetchPage(startUrl, 12_000);
  const homeData = parsePage(home.html, home.url, true);
  onPage?.(1);

  const targets = pickInternalLinks(homeData);
  const pages: PageData[] = [homeData];
  let done = 1;
  const queue = [...targets];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const url = queue.shift()!;
      try {
        const p = await fetchPage(url, 8_000);
        pages.push(parsePage(p.html, p.url, false));
      } catch (err) {
        if (!(err instanceof ScanFetchError)) throw err;
      }
      onPage?.(++done);
    }
  });
  await Promise.all(workers);

  const privacyPage =
    pages.find((p) => p !== homeData && (PRIVACY_LINK.test(safeDecode(new URL(p.url).pathname)) || /מדיניות פרטיות|privacy policy/i.test(p.label))) ?? null;

  // דף שכמעט אין בו טקסט אבל יש בו הרבה סקריפטים כנראה נבנה בדפדפן — הבדיקה שלנו חלקית שם
  const likelyClientRendered = homeData.text.length < 200 && homeData.scripts.length > 2_000;

  return { startUrl, finalUrl: home.url, pages, privacyPage, likelyClientRendered };
}
