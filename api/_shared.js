"use strict";

const MODEL = "claude-sonnet-5";
const API_URL = "https://api.anthropic.com/v1/messages";

const BLOCK_SCHEMAS = {
  hero: `{
  "badge": "string, קצר, עד 6 מילים",
  "headline": "string, שורה ראשונה של הכותרת הראשית",
  "highlight": "string, המשך הכותרת שיודגש בצבע המותג",
  "subheadline": "string, משפט עד שני משפטים שמסביר את הערך",
  "ctaPrimary": "string, טקסט כפתור פעולה ראשי, עד 4 מילים",
  "ctaSecondary": "string, טקסט כפתור פעולה משני, עד 4 מילים",
  "trustPoints": ["מחרוזת קצרה", "מחרוזת קצרה"]
}`,
  features: `{
  "eyebrow": "string, תווית קצרה מעל הכותרת",
  "title": "string, כותרת המקטע",
  "subtitle": "string, משפט אחד",
  "items": [ { "icon": "אימוג'י אחד או תו יוניקוד", "title": "string קצר", "text": "string עד 20 מילים" } ]
}`,
  process: `{
  "eyebrow": "string",
  "title": "string",
  "steps": [ { "title": "string קצר", "text": "string עד 16 מילים" } ]
}`,
  testimonials: `{
  "eyebrow": "string",
  "title": "string",
  "items": [ { "quote": "string עד 30 מילים, גוף ראשון, בעברית טבעית", "name": "שם פרטי ושם משפחה ישראלי בדוי", "role": "תפקיד או סוג לקוח קצר" } ]
}`,
  cta: `{
  "title": "string",
  "subtitle": "string",
  "buttonText": "string עד 4 מילים",
  "formTitle": "string קצר לכותרת הטופס"
}`,
};

class ProviderError extends Error {
  constructor(message, statusCode = 502, code = "AI_PROVIDER_ERROR") {
    super(message);
    this.name = "ProviderError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function blockSchema(blockType) {
  return BLOCK_SCHEMAS[blockType] || null;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new ProviderError("no JSON object found in model output", 502, "INVALID_MODEL_OUTPUT");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (cause) {
    throw new ProviderError(`invalid JSON from model: ${cause.message}`, 502, "INVALID_MODEL_OUTPUT");
  }
}

async function requestClaude({ system, user, maxTokens, requestId, fetchImpl = fetch, timeoutMs = 30_000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ProviderError("ANTHROPIC_API_KEY is not configured", 500, "MISSING_API_KEY");

  let response;
  try {
    response = await fetchImpl(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens || 4096,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    if (cause?.name === "TimeoutError" || cause?.name === "AbortError") {
      throw new ProviderError("Claude request timed out", 504, "AI_TIMEOUT");
    }
    throw new ProviderError(`Claude network error: ${cause?.message || cause}`, 502, "AI_NETWORK_ERROR");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[${requestId}] Claude API error`, response.status, detail.slice(0, 1_000));
    throw new ProviderError(`Claude API error (${response.status})`, 502, "AI_PROVIDER_ERROR");
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  return extractJson(text);
}

async function callClaude({ system, user, maxTokens, validate, requestId, fetchImpl, timeoutMs }) {
  let firstError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const correctedUser =
      attempt === 0
        ? user
        : `${user}\n\nהתשובה הקודמת לא עמדה במבנה הנדרש. החזר עכשיו JSON תקין בלבד, עם כל השדות ובדיוק לפי הסכמה.`;
    try {
      const parsed = await requestClaude({
        system,
        user: correctedUser,
        maxTokens,
        requestId,
        fetchImpl,
        timeoutMs,
      });
      return typeof validate === "function" ? validate(parsed) : parsed;
    } catch (err) {
      if (attempt === 0 && (err?.code === "INVALID_MODEL_OUTPUT" || err?.statusCode === 400)) {
        firstError = err;
        continue;
      }
      throw err;
    }
  }
  throw firstError || new ProviderError("Invalid model output", 502, "INVALID_MODEL_OUTPUT");
}

const VIBE_HINTS = {
  trust: "טון מקצועי, רגוע ובוטח. שפה ברורה, משפטים מלאים, בלי סלנג.",
  energetic: "טון נמרץ, חיובי וקליל. משפטים קצרים, קצב מהיר, תחושת דחיפות נעימה.",
  luxury: "טון מאופק, בררני ואלגנטי. משפטים קצרים וממוקדים, בלי סופרלטיבים זולים.",
};

const GOAL_HINTS = {
  leads: "המטרה היא לאסוף פרטי יצירת קשר (שם וטלפון) מלקוחות פוטנציאליים.",
  appointments: "המטרה היא לגרום ללקוחות לקבוע תור או פגישה.",
  sales: "המטרה היא להוביל לרכישה ישירה של מוצר או שירות.",
  signup: "המטרה היא להוביל להרשמה לאירוע, קורס או שירות.",
};

module.exports = {
  MODEL,
  ProviderError,
  blockSchema,
  extractJson,
  callClaude,
  requestClaude,
  VIBE_HINTS,
  GOAL_HINTS,
};
