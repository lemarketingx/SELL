"use strict";

const BLOCK_TYPES = ["hero", "features", "process", "testimonials", "cta"];
const VIBES = ["trust", "energetic", "luxury"];
const GOALS = ["leads", "appointments", "sales", "signup"];
const INSTRUCTIONS = ["rewrite", "shorten", "sales"];

class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.code = "INVALID_REQUEST";
    this.details = details || null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertBodySize(body, maxBytes = 32_768) {
  let bytes;
  try {
    bytes = Buffer.byteLength(JSON.stringify(body ?? null), "utf8");
  } catch {
    throw new ValidationError("גוף הבקשה אינו JSON תקין");
  }
  if (bytes > maxBytes) {
    throw new ValidationError(`גוף הבקשה גדול מדי. המגבלה היא ${maxBytes} בתים`);
  }
}

function text(value, field, min, max, optional = false) {
  if (optional && (value == null || value === "")) return "";
  if (typeof value !== "string") {
    throw new ValidationError(`השדה ${field} חייב להיות טקסט`);
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ValidationError(`אורך השדה ${field} חייב להיות בין ${min} ל-${max} תווים`);
  }
  return normalized;
}

function enumValue(value, field, allowed) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new ValidationError(`הערך בשדה ${field} אינו נתמך`);
  }
  return value;
}

function normalizeWhatsapp(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new ValidationError("מספר WhatsApp חייב להיות טקסט");
  let digits = value.trim().replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
  if (!/^\d{8,15}$/.test(digits)) {
    throw new ValidationError("מספר WhatsApp אינו תקין");
  }
  return digits;
}

function normalizeEmail(value) {
  if (value == null || value === "") return "";
  const email = text(value, "leadEmail", 3, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("כתובת האימייל אינה תקינה");
  }
  return email;
}

function normalizeUrl(value) {
  if (value == null || value === "") return "";
  const raw = text(value, "ctaUrl", 4, 500, true);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError("קישור הפעולה אינו תקין");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ValidationError("מותר להשתמש רק בקישורי http או https");
  }
  return parsed.toString();
}

function validateContext(body) {
  if (!isPlainObject(body)) throw new ValidationError("גוף הבקשה חייב להיות אובייקט JSON");
  return {
    businessName: text(body.businessName, "businessName", 1, 100),
    industry: text(body.industry, "industry", 1, 100),
    offer: text(body.offer, "offer", 0, 350, true),
    audience: text(body.audience, "audience", 0, 250, true),
    description: text(body.description, "description", 10, 2_000),
    proof: text(body.proof, "proof", 0, 700, true),
    adMessage: text(body.adMessage, "adMessage", 0, 600, true),
    vibe: enumValue(body.vibe, "vibe", VIBES),
    goal: enumValue(body.goal, "goal", GOALS),
    whatsapp: normalizeWhatsapp(body.whatsapp),
    leadEmail: normalizeEmail(body.leadEmail),
    ctaUrl: normalizeUrl(body.ctaUrl),
  };
}

function validateStockPhotoQueries(value) {
  if (value == null) return null;
  if (!Array.isArray(value) || !value.length || value.length > 4) return null;
  try {
    return value.map((item, index) => text(item, `queries.${index}`, 1, 80));
  } catch {
    return null;
  }
}

function validateStockPhotoInput(body) {
  if (!isPlainObject(body)) throw new ValidationError("גוף הבקשה חייב להיות אובייקט JSON");
  return {
    industry: text(body.industry, "industry", 1, 100),
    description: text(body.description, "description", 0, 2_000, true),
    queries: validateStockPhotoQueries(body.queries),
  };
}

function validateGenerateInput(body) {
  assertBodySize(body);
  return validateContext(body);
}

function maxDepth(value, depth = 0) {
  if (depth > 8) return depth;
  if (!value || typeof value !== "object") return depth;
  return Object.values(value).reduce(
    (max, item) => Math.max(max, maxDepth(item, depth + 1)),
    depth
  );
}

function validateObjectText(value, field, max = 300) {
  return text(value, field, 1, max);
}

function validateItemArray(items, field, min, max, mapper) {
  if (!Array.isArray(items) || items.length < min || items.length > max) {
    throw new ValidationError(`${field} חייב להכיל בין ${min} ל-${max} פריטים`);
  }
  return items.map((item, index) => {
    if (!isPlainObject(item)) throw new ValidationError(`${field}.${index} חייב להיות אובייקט`);
    return mapper(item, index);
  });
}

function validateBlock(blockType, value) {
  if (!BLOCK_TYPES.includes(blockType)) throw new ValidationError("סוג המקטע אינו נתמך");
  if (!isPlainObject(value)) throw new ValidationError(`המקטע ${blockType} חייב להיות אובייקט`);

  switch (blockType) {
    case "hero":
      return {
        badge: validateObjectText(value.badge, "hero.badge", 80),
        headline: validateObjectText(value.headline, "hero.headline", 180),
        highlight: validateObjectText(value.highlight, "hero.highlight", 180),
        subheadline: validateObjectText(value.subheadline, "hero.subheadline", 500),
        ctaPrimary: validateObjectText(value.ctaPrimary, "hero.ctaPrimary", 80),
        ctaSecondary: validateObjectText(value.ctaSecondary, "hero.ctaSecondary", 80),
        trustPoints: (() => {
          if (!Array.isArray(value.trustPoints) || value.trustPoints.length < 1 || value.trustPoints.length > 4) {
            throw new ValidationError("hero.trustPoints חייב להכיל בין 1 ל-4 פריטים");
          }
          return value.trustPoints.map((item) => text(item, "hero.trustPoints", 1, 120));
        })(),
      };
    case "features":
      return {
        eyebrow: validateObjectText(value.eyebrow, "features.eyebrow", 80),
        title: validateObjectText(value.title, "features.title", 180),
        subtitle: validateObjectText(value.subtitle, "features.subtitle", 300),
        items: validateItemArray(value.items, "features.items", 3, 4, (item, index) => ({
          icon: validateObjectText(item.icon, `features.items.${index}.icon`, 12),
          title: validateObjectText(item.title, `features.items.${index}.title`, 100),
          text: validateObjectText(item.text, `features.items.${index}.text`, 240),
        })),
      };
    case "process":
      return {
        eyebrow: validateObjectText(value.eyebrow, "process.eyebrow", 80),
        title: validateObjectText(value.title, "process.title", 180),
        steps: validateItemArray(value.steps, "process.steps", 3, 3, (item, index) => ({
          title: validateObjectText(item.title, `process.steps.${index}.title`, 100),
          text: validateObjectText(item.text, `process.steps.${index}.text`, 220),
        })),
      };
    case "testimonials":
      return {
        eyebrow: validateObjectText(value.eyebrow, "testimonials.eyebrow", 80),
        title: validateObjectText(value.title, "testimonials.title", 180),
        items: validateItemArray(value.items, "testimonials.items", 3, 3, (item, index) => ({
          quote: validateObjectText(item.quote, `testimonials.items.${index}.quote`, 420),
          name: validateObjectText(item.name, `testimonials.items.${index}.name`, 100),
          role: validateObjectText(item.role, `testimonials.items.${index}.role`, 120),
        })),
      };
    case "cta":
      return {
        title: validateObjectText(value.title, "cta.title", 180),
        subtitle: validateObjectText(value.subtitle, "cta.subtitle", 300),
        buttonText: validateObjectText(value.buttonText, "cta.buttonText", 80),
        formTitle: validateObjectText(value.formTitle, "cta.formTitle", 120),
      };
    default:
      throw new ValidationError("סוג המקטע אינו נתמך");
  }
}

function validateGeneratedPage(value) {
  if (!isPlainObject(value)) throw new ValidationError("תשובת ה-AI אינה אובייקט תקין");
  const result = {};
  for (const blockType of BLOCK_TYPES) {
    result[blockType] = validateBlock(blockType, value[blockType]);
  }
  if (!Array.isArray(value.photoQueries) || value.photoQueries.length < 2 || value.photoQueries.length > 3) {
    throw new ValidationError("photoQueries חייב להכיל בין 2 ל-3 פריטים");
  }
  result.photoQueries = value.photoQueries.map((item, index) => text(item, `photoQueries.${index}`, 1, 60));
  return result;
}

function validateRegenerateInput(body) {
  assertBodySize(body);
  if (!isPlainObject(body)) throw new ValidationError("גוף הבקשה חייב להיות אובייקט JSON");
  const blockType = enumValue(body.blockType, "blockType", BLOCK_TYPES);
  const instruction = enumValue(body.instruction, "instruction", INSTRUCTIONS);
  if (maxDepth(body.current) > 6) throw new ValidationError("מבנה המקטע עמוק מדי");
  const serialized = JSON.stringify(body.current ?? null);
  if (Buffer.byteLength(serialized, "utf8") > 16_384) {
    throw new ValidationError("המקטע גדול מדי");
  }
  return {
    blockType,
    instruction,
    current: validateBlock(blockType, body.current),
    context: validateContext(body.context),
  };
}

module.exports = {
  BLOCK_TYPES,
  GOALS,
  INSTRUCTIONS,
  VIBES,
  ValidationError,
  assertBodySize,
  normalizeEmail,
  normalizeUrl,
  normalizeWhatsapp,
  validateBlock,
  validateGeneratedPage,
  validateGenerateInput,
  validateRegenerateInput,
  validateStockPhotoInput,
};
