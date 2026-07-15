const { callClaude, blockSchema, VIBE_HINTS, GOAL_HINTS } = require("./_shared");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { businessName, industry, description, vibe, goal } = req.body || {};

  if (!businessName || !industry || !description || !vibe || !goal) {
    res.status(400).json({
      error:
        "Missing required fields: businessName, industry, description, vibe, goal",
    });
    return;
  }

  const toneHint = VIBE_HINTS[vibe] || VIBE_HINTS.trust;
  const goalHint = GOAL_HINTS[goal] || GOAL_HINTS.leads;

  const system = `אתה קופירייטר ומעצב דפי נחיתה מומחה, שכותב בעברית טבעית ומשכנעת לעסקים קטנים ועצמאים בישראל.
אתה מקבל תיאור עסק ומחזיר אך ורק אובייקט JSON יחיד ותקין (ללא טקסט נוסף, ללא markdown, ללא הסברים) שמתאר תוכן לדף נחיתה שלם.
כל הטקסטים בעברית. אל תמציא מספרי טלפון, כתובות אמיתיות או הבטחות שלא ניתן לקיים.`;

  const user = `פרטי העסק:
- שם העסק: ${businessName}
- תחום: ${industry}
- תיאור העסק במילות בעל העסק: ${description}
- טון מבוקש: ${toneHint}
- מטרת הדף: ${goalHint}

החזר JSON יחיד בדיוק במבנה הבא, כשכל שדה מוחלף בתוכן אמיתי ומותאם לעסק הזה (השאר את שמות המפתחות באנגלית כפי שהם):

{
  "hero": ${blockSchema("hero")},
  "features": ${blockSchema("features")},
  "process": ${blockSchema("process")},
  "testimonials": ${blockSchema("testimonials")},
  "cta": ${blockSchema("cta")}
}

הנחיות:
- "features.items" - בין 3 ל-4 פריטים, מותאמים ספציפית לעסק הזה (לא כלליים).
- "process.steps" - בדיוק 3 צעדים שמתארים איך לקוח עובד מול העסק הזה.
- "testimonials.items" - בדיוק 3 עדויות בדויות אך אמינות, עם שמות ותפקידים ישראליים.
- אל תחזיר שום דבר מלבד אובייקט ה-JSON.`;

  try {
    const page = await callClaude({ system, user, maxTokens: 4096 });
    res.status(200).json(page);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
