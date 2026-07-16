"use strict";

const { validateStockPhotoInput } = require("./_validation");
const { checkRateLimit } = require("./_rateLimit");
const { methodNotAllowed, requestId, sendError, sendRateLimit } = require("./_http");

const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";
const APP_NAME = "dafdaf";

const INDUSTRY_QUERY_RULES = [
  [/מסעד|אוכל|שף|בית קפה|קפה|מאפי/, "restaurant food"],
  [/קליניק|רופא|טיפול|פיזיותרפ|פסיכולוג|בריאות|רפוא/, "healthcare clinic"],
  [/כושר|חדר כושר|אימון אישי|מאמן כושר/, "fitness gym"],
  [/צילום|צלם/, "photography studio"],
  [/עיצוב|מעצב|אדריכל/, "design studio"],
  [/הייטק|טכנולוגי|תוכנה|אפליקצי|סטארט/, "technology office"],
  [/נדל.?ן|דירה|נכס|בית פרטי/, "real estate architecture"],
  [/חינוך|קורס|לימוד|מורה|הדרכה|סדנא/, "education classroom"],
  [/אופנה|בגד|בוטיק|תכשיט/, "fashion boutique"],
  [/יופי|קוסמטיקה|איפור|ספא|מניקור|מספרה/, "beauty salon spa"],
  [/עורך דין|משפט|ייעוץ עסקי|רואה חשבון|יועץ|פיננס/, "professional office consulting"],
  [/חנות|מסחר|קמעונ/, "retail store shopping"],
  [/אירוע|חתונ|מסיבה/, "event celebration"],
];

function englishQueryFor(industry, description) {
  const combined = `${industry} ${description || ""}`;
  for (const [pattern, query] of INDUSTRY_QUERY_RULES) {
    if (pattern.test(combined)) return query;
  }
  return "small business office";
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

    const query = englishQueryFor(input.industry, input.description);
    const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape&content_filter=high`;

    let response;
    try {
      response = await fetchImpl(url, {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return res.status(200).json({ photos: [] });
    }

    if (!response.ok) {
      console.error(`[${id}] Unsplash API error`, response.status);
      return res.status(200).json({ photos: [] });
    }

    const data = await response.json().catch(() => null);
    const results = Array.isArray(data?.results) ? data.results : [];

    const photos = results.slice(0, 6).map((photo) => ({
      url: photo?.urls?.regular || "",
      thumbUrl: photo?.urls?.small || "",
      alt: photo?.alt_description || query,
      photographerName: photo?.user?.name || "צלם אנונימי",
      photographerUrl: photo?.user?.links?.html ? withUtm(photo.user.links.html) : "",
      unsplashUrl: withUtm("https://unsplash.com/"),
    })).filter((photo) => photo.url);

    await Promise.all(
      results
        .slice(0, 6)
        .map((photo) => photo?.links?.download_location)
        .filter(Boolean)
        .map((downloadLocation) => triggerDownload(downloadLocation, accessKey, fetchImpl))
    );

    return res.status(200).json({ photos });
  } catch (err) {
    return sendError(res, err, id);
  }
};
