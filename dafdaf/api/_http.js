"use strict";

const crypto = require("node:crypto");

function requestId(req) {
  const existing = req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"];
  return String(existing || crypto.randomUUID()).slice(0, 24);
}

function methodNotAllowed(res) {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ error: "Method not allowed" });
}

function sendRateLimit(res, result) {
  res.setHeader("Retry-After", String(result.retryAfter));
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  return res.status(429).json({
    error: `הגעתם למגבלת השימוש. אפשר לנסות שוב בעוד ${result.retryAfter} שניות`,
    retryAfter: result.retryAfter,
  });
}

function sendError(res, err, id) {
  const status = Number(err?.statusCode) || 500;
  const safeMessages = {
    400: err.message || "הבקשה אינה תקינה",
    429: err.message || "הגעתם למגבלת השימוש",
    502: "שירות ה-AI לא הצליח להשלים את הבקשה. נסו שוב מאוחר יותר",
    503: err.message || "השירות אינו זמין כרגע",
    504: "שירות ה-AI לא הגיב בזמן. נסו שוב",
  };
  if (status >= 500) console.error(`[${id}]`, err?.stack || err);
  return res.status(status).json({
    error: safeMessages[status] || "אירעה שגיאה פנימית",
    requestId: id,
  });
}

module.exports = { methodNotAllowed, requestId, sendError, sendRateLimit };
