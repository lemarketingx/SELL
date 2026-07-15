const { callClaude, blockSchema, VIBE_HINTS, GOAL_HINTS } = require("./_shared");

const INSTRUCTIONS = {
  rewrite: "נסח מחדש את התוכן הזה בצורה שונה, עם אותה מטרה ואותם עובדות.",
  shorten: "קצר משמעותית את התוכן הזה, שמור רק על העיקר.",
  sales: "הפוך את התוכן הזה למכירתי ומשכנע יותר, בלי להגזים או להישמע לא אמין.",
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { blockType, current, instruction, context } = req.body || {};
  const schema = blockSchema(blockType);

  if (!schema || !current || !instruction || !context) {
    res.status(400).json({
      error: "Missing required fields: blockType, current, instruction, context",
    });
    return;
  }

  const instructionText = INSTRUCTIONS[instruction] || INSTRUCTIONS.rewrite;
  const toneHint = VIBE_HINTS[context.vibe] || VIBE_HINTS.trust;
  const goalHint = GOAL_HINTS[context.goal] || GOAL_HINTS.leads;

  const system = `אתה קופירייטר מומחה לדפי נחיתה בעברית. אתה מקבל קטע קיים מדף נחיתה ומחזיר אך ורק אובייקט JSON יחיד ותקין באותו מבנה בדיוק, עם תוכן מעודכן. ללא טקסט נוסף וללא markdown.`;

  const user = `פרטי העסק:
- שם העסק: ${context.businessName}
- תחום: ${context.industry}
- תיאור העסק: ${context.description}
- טון מבוקש: ${toneHint}
- מטרת הדף: ${goalHint}

התוכן הנוכחי של המקטע (${blockType}):
${JSON.stringify(current, null, 2)}

המשימה: ${instructionText}

החזר JSON יחיד בדיוק במבנה הבא (רק את המקטע הזה, לא את כל הדף):
${schema}`;

  try {
    const block = await callClaude({ system, user, maxTokens: 1536 });
    res.status(200).json(block);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
