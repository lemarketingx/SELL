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

function blockSchema(blockType) {
  return BLOCK_SCHEMAS[blockType] || null;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("no JSON object found in model output");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callClaude({ system, user, maxTokens }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "ANTHROPIC_API_KEY is not configured on the server"
    );
    err.statusCode = 500;
    throw err;
  }

  const response = await fetch(API_URL, {
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
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const err = new Error(`Claude API error (${response.status}): ${detail}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return extractJson(text);
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
  blockSchema,
  extractJson,
  callClaude,
  VIBE_HINTS,
  GOAL_HINTS,
};
