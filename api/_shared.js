"use strict";

const DEFAULT_MODEL = "gpt-5.6-luna";
const API_URL = "https://api.openai.com/v1/responses";

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

function stringSchema(maxLength) {
  return { type: "string", minLength: 1, maxLength };
}

function objectSchema(properties, required = Object.keys(properties)) {
  return {
    type: "object",
    additionalProperties: false,
    required,
    properties,
  };
}

const BLOCK_JSON_SCHEMAS = {
  hero: objectSchema({
    badge: stringSchema(80),
    headline: stringSchema(180),
    highlight: stringSchema(180),
    subheadline: stringSchema(500),
    ctaPrimary: stringSchema(80),
    ctaSecondary: stringSchema(80),
    trustPoints: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: stringSchema(120),
    },
  }),
  features: objectSchema({
    eyebrow: stringSchema(80),
    title: stringSchema(180),
    subtitle: stringSchema(300),
    items: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: objectSchema({
        icon: stringSchema(12),
        title: stringSchema(100),
        text: stringSchema(240),
      }),
    },
  }),
  process: objectSchema({
    eyebrow: stringSchema(80),
    title: stringSchema(180),
    steps: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: objectSchema({
        title: stringSchema(100),
        text: stringSchema(220),
      }),
    },
  }),
  testimonials: objectSchema({
    eyebrow: stringSchema(80),
    title: stringSchema(180),
    items: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: objectSchema({
        quote: stringSchema(420),
        name: stringSchema(100),
        role: stringSchema(120),
      }),
    },
  }),
  cta: objectSchema({
    title: stringSchema(180),
    subtitle: stringSchema(300),
    buttonText: stringSchema(80),
    formTitle: stringSchema(120),
  }),
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

function blockJsonSchema(blockType) {
  return BLOCK_JSON_SCHEMAS[blockType] || null;
}

function pageJsonSchema() {
  return objectSchema({
    hero: BLOCK_JSON_SCHEMAS.hero,
    features: BLOCK_JSON_SCHEMAS.features,
    process: BLOCK_JSON_SCHEMAS.process,
    testimonials: BLOCK_JSON_SCHEMAS.testimonials,
    cta: BLOCK_JSON_SCHEMAS.cta,
  });
}

function extractJson(text) {
  const fenced = String(text || "").match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : String(text || "");
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

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  return (data?.output || [])
    .filter((item) => item?.type === "message")
    .flatMap((item) => item.content || [])
    .filter((part) => part?.type === "output_text")
    .map((part) => part.text || "")
    .join("\n");
}

async function requestOpenAI({
  system,
  user,
  maxTokens,
  requestId,
  schema,
  schemaName = "landing_page",
  fetchImpl = fetch,
  timeoutMs = 30_000,
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ProviderError("OPENAI_API_KEY is not configured", 500, "MISSING_API_KEY");

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const payload = {
    model,
    instructions: system,
    input: user,
    max_output_tokens: maxTokens || 4096,
    store: false,
    text: {
      format: schema
        ? {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema,
          }
        : { type: "json_object" },
    },
  };
  if (model.startsWith("gpt-5")) payload.reasoning = { effort: "none" };

  let response;
  try {
    response = await fetchImpl(API_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (cause) {
    if (cause?.name === "TimeoutError" || cause?.name === "AbortError") {
      throw new ProviderError("OpenAI request timed out", 504, "AI_TIMEOUT");
    }
    throw new ProviderError(`OpenAI network error: ${cause?.message || cause}`, 502, "AI_NETWORK_ERROR");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[${requestId}] OpenAI API error`, response.status, detail.slice(0, 1_000));
    throw new ProviderError(`OpenAI API error (${response.status})`, 502, "AI_PROVIDER_ERROR");
  }

  let data;
  try {
    data = await response.json();
  } catch (cause) {
    throw new ProviderError(`invalid OpenAI response: ${cause.message}`, 502, "INVALID_MODEL_OUTPUT");
  }
  if (data?.status === "incomplete") {
    console.error(`[${requestId}] OpenAI response incomplete`, data.incomplete_details || null);
    throw new ProviderError("OpenAI response was incomplete", 502, "INVALID_MODEL_OUTPUT");
  }
  return extractJson(extractResponseText(data));
}

async function callOpenAI({
  system,
  user,
  maxTokens,
  validate,
  requestId,
  schema,
  schemaName,
  fetchImpl,
  timeoutMs,
}) {
  let firstError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const correctedUser =
      attempt === 0
        ? user
        : `${user}\n\nהתשובה הקודמת לא עמדה במבנה הנדרש. החזר עכשיו JSON תקין בלבד, עם כל השדות ובדיוק לפי הסכמה.`;
    try {
      const parsed = await requestOpenAI({
        system,
        user: correctedUser,
        maxTokens,
        requestId,
        schema,
        schemaName,
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
  API_URL,
  DEFAULT_MODEL,
  ProviderError,
  blockJsonSchema,
  blockSchema,
  callOpenAI,
  extractJson,
  extractResponseText,
  pageJsonSchema,
  requestOpenAI,
  VIBE_HINTS,
  GOAL_HINTS,
};
