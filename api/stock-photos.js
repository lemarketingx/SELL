"use strict";

const { validateStockPhotoInput } = require("./_validation");
const { checkRateLimit } = require("./_rateLimit");
const { methodNotAllowed, requestId, sendError, sendRateLimit } = require("./_http");

const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
const APP_NAME = "dafdaf";
const PHOTOS_PER_QUERY = 2;
const TOTAL_PHOTOS = 6;

const INDUSTRY_QUERY_RULES = [
  [/מסעד|אוכל|שף|בית קפה|קפה|מאפי|קייטרינג/, ["restaurant interior", "chef cooking", "food dish table"]],
  [/קליניק|רופא|טיפול|פיזיותרפ|פסיכולוג|בריאות|רפוא|דנטלי|שיניים/, ["medical clinic", "doctor patient", "physical therapy session"]],
  [/כושר|חדר כושר|אימון אישי|מאמן כושר|יוגה|פילאטיס/, ["gym workout", "personal trainer", "yoga studio"]],
  [/צילום|צלם/, ["photography camera", "photo studio", "wedding photographer"]],
  [/עיצוב גרפי|מעצב גרפי|מיתוג/, ["graphic design workspace", "branding creative", "designer laptop"]],
  [/עיצוב פנים|אדריכל/, ["interior design", "modern architecture", "architect blueprint"]],
  [/הייטק|טכנולוגי|תוכנה|אפליקצי|סטארט|מתכנת/, ["software developer", "startup office", "tech team meeting"]],
  [/נדל.?ן|דירה|נכס|בית פרטי|משרד תיווך/, ["real estate house", "modern apartment interior", "architecture exterior"]],
  [/חינוך|קורס|לימוד|מורה|הדרכה|סדנא|מנטור/, ["classroom teaching", "online course laptop", "workshop training"]],
  [/אופנה|בגד|בוטיק|תכשיט|טקסטיל/, ["fashion boutique", "clothing rack store", "jewelry design"]],
  [/יופי|קוסמטיקה|איפור|ספא|מניקור|מספרה|קוסמטיקאית/, ["beauty salon", "spa treatment", "makeup artist"]],
  [/עורך דין|משפט|רואה חשבון|פיננס|ביטוח|חשבונאי/, ["lawyer office", "financial documents desk", "accountant meeting"]],
  [/ייעוץ עסקי|יועץ עסקי|יועץ ארגוני|אסטרטגיה עסקית/, ["business consulting meeting", "strategy whiteboard", "corporate handshake"]],
  [/חנות|מסחר|קמעונ/, ["retail store interior", "shop shelves products", "small business owner"]],
  [/אירוע|חתונ|מסיבה/, ["wedding event decoration", "party celebration", "event venue"]],
  [/רכב|מוסך|תיקון רכבים/, ["car garage mechanic", "auto repair shop", "car workshop"]],
  [/חיות מחמד|וטרינר|כלבים|חתולים/, ["veterinary clinic", "dog grooming", "pet care"]],
];

const DEFAULT_QUERIES = ["small business team", "modern office workspace", "professional at work"];

function queriesFor(industry, description) {
  const combined = `${industry} ${description || ""}`;
  for (const [pattern, queries] of INDUSTRY_QUERY_RULES) {
    if (pattern.test(combined)) return queries;
  }
  return DEFAULT_QUERIES;
}

function withUtm(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("utm_source", APP_NAME);
  parsed.searchParams.set("utm_medium", "referral");
  return parsed.toString();
}

async function triggerDownload(downloadLocation, accessKey, fetchImpl) {
  try {
    await fetchImpl(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // best-effort per Unsplash guidelines; a failed ping should not block the response
  }
}

async function searchQuery(query, accessKey, fetchImpl) {
  const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=${PHOTOS_PER_QUERY}&orientation=landscape&content_filter=high`;
  try {
    const response = await fetchImpl(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res, fetchImpl = fetch) {
  const id = requestId(req);
  res.setHeader("X-Request-Id", id);
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const input = validateStockPhotoInput(req.body);
    const rate = await checkRateLimit(req, { scope: "stock-photos", limit: 30, windowSeconds: 3600 });
    if (!rate.allowed) return sendRateLimit(res, rate);

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(200).json({ photos: [] });
    }

    const queries = queriesFor(input.industry, input.description);
    const resultsByQuery = await Promise.all(
      queries.map((query) => searchQuery(query, accessKey, fetchImpl))
    );

    const seen = new Set();
    const results = [];
    let round = 0;
    while (results.length < TOTAL_PHOTOS && round < PHOTOS_PER_QUERY) {
      for (const bucket of resultsByQuery) {
        const photo = bucket[round];
        if (photo && !seen.has(photo.id)) {
          seen.add(photo.id);
          results.push(photo);
        }
      }
      round += 1;
    }

    const photos = results.slice(0, TOTAL_PHOTOS).map((photo) => ({
      url: photo?.urls?.regular || "",
      thumbUrl: photo?.urls?.small || "",
      alt: photo?.alt_description || "",
      photographerName: photo?.user?.name || "צלם אנונימי",
      photographerUrl: photo?.user?.links?.html ? withUtm(photo.user.links.html) : "",
      unsplashUrl: withUtm("https://unsplash.com/"),
    })).filter((photo) => photo.url);

    await Promise.all(
      results
        .slice(0, TOTAL_PHOTOS)
        .map((photo) => photo?.links?.download_location)
        .filter(Boolean)
        .map((downloadLocation) => triggerDownload(downloadLocation, accessKey, fetchImpl))
    );

    return res.status(200).json({ photos });
  } catch (err) {
    return sendError(res, err, id);
  }
};
