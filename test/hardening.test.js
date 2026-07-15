"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  ValidationError,
  normalizeUrl,
  validateBlock,
  validateGenerateInput,
  validateRegenerateInput,
} = require("../api/_validation");
const { checkRateLimit, extractClientIp, keyFor } = require("../api/_rateLimit");
const { callClaude, requestClaude } = require("../api/_shared");
const { sendError } = require("../api/_http");

const context = {
  businessName: "סטודיו נועה",
  industry: "יוגה",
  description: "סטודיו ליוגה בקבוצות קטנות עם ליווי אישי לכל מתאמנת.",
  vibe: "trust",
  goal: "leads",
  whatsapp: "050-1234567",
  leadEmail: "Lead@example.com",
  ctaUrl: "https://example.com/order",
};

const hero = {
  badge: "חדש",
  headline: "כותרת",
  highlight: "הדגשה",
  subheadline: "משפט הסבר",
  ctaPrimary: "דברו איתנו",
  ctaSecondary: "פרטים",
  trustPoints: ["ליווי אישי"],
};

const originalEnv = { ...process.env };
test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("normalizes valid generate input", () => {
  const value = validateGenerateInput(context);
  assert.equal(value.whatsapp, "972501234567");
  assert.equal(value.leadEmail, "lead@example.com");
});

test("rejects invalid enum and excessive description", () => {
  assert.throws(() => validateGenerateInput({ ...context, vibe: "hacked" }), ValidationError);
  assert.throws(() => validateGenerateInput({ ...context, description: "x".repeat(2001) }), ValidationError);
});

test("blocks javascript URLs", () => {
  assert.throws(() => normalizeUrl("javascript:alert(1)"), ValidationError);
});

test("validates known block structure", () => {
  assert.deepEqual(validateBlock("hero", hero), hero);
  assert.throws(() => validateBlock("hero", { ...hero, trustPoints: [] }), ValidationError);
});

test("rejects unknown regeneration actions and oversized objects", () => {
  assert.throws(() => validateRegenerateInput({
    blockType: "hero",
    instruction: "delete",
    current: hero,
    context,
  }), ValidationError);
  assert.throws(() => validateRegenerateInput({
    blockType: "hero",
    instruction: "rewrite",
    current: { ...hero, headline: "x".repeat(20000) },
    context,
  }), ValidationError);
});

test("extracts only a valid IP", () => {
  const request = {
    headers: { "x-vercel-forwarded-for": "not-an-ip, 203.0.113.10" },
    socket: {},
  };
  assert.equal(extractClientIp(request), "203.0.113.10");
});

test("uses endpoint scope in rate-limit key", () => {
  const first = keyFor("generate", "203.0.113.10", 3600, 0);
  const second = keyFor("regenerate-block", "203.0.113.10", 3600, 0);
  assert.notEqual(first, second);
});

test("returns blocked state after the rate limit", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://redis.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  const fetchImpl = async () => ({
    ok: true,
    json: async () => [{ result: 6 }, { result: 1 }, { result: 120 }],
  });
  const result = await checkRateLimit(
    { headers: { "x-forwarded-for": "203.0.113.10" }, socket: {} },
    { scope: "generate", limit: 5, windowSeconds: 3600 },
    { fetchImpl, now: 0 }
  );
  assert.equal(result.allowed, false);
  assert.equal(result.retryAfter, 120);
});

test("retries once when model JSON is invalid", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    const text = calls === 1 ? "not json" : '{"ok":true}';
    return { ok: true, json: async () => ({ content: [{ type: "text", text }] }) };
  };
  const result = await callClaude({
    system: "s",
    user: "u",
    maxTokens: 50,
    requestId: "req",
    fetchImpl,
    validate: (value) => value,
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
});

test("maps provider timeout to 504", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  const fetchImpl = async () => {
    const error = new Error("secret timeout detail");
    error.name = "TimeoutError";
    throw error;
  };
  await assert.rejects(
    () => requestClaude({ system: "s", user: "u", requestId: "req", fetchImpl }),
    (error) => error.statusCode === 504
  );
});

test("does not expose provider details to client", () => {
  const payload = {};
  const response = {
    status(code) {
      payload.status = code;
      return this;
    },
    json(body) {
      payload.body = body;
      return body;
    },
  };
  const error = new Error("Claude API error with private detail");
  error.statusCode = 502;
  const originalConsoleError = console.error;
  console.error = () => {};
  sendError(response, error, "req-1");
  console.error = originalConsoleError;
  assert.equal(payload.status, 502);
  assert.doesNotMatch(payload.body.error, /private detail/);
});

test("prevents parallel generation and duplicate retry buttons", () => {
  const builder = fs.readFileSync("js/builder.js", "utf8");
  assert.match(builder, /if \(state\.submitting\) return/);
  assert.match(builder, /retryButton\?\.remove\(\)/);
});

test("export removes inactive controls and blocks javascript links", () => {
  const builder = fs.readFileSync("js/builder.js", "utf8");
  assert.match(builder, /data-export-remove/);
  assert.match(builder, /\^javascript:/i);
});

test("wizard contains optional contact destinations", () => {
  const html = fs.readFileSync("build.html", "utf8");
  assert.match(html, /id="f-whatsapp"/);
  assert.match(html, /id="f-email"/);
  assert.match(html, /id="f-cta-url"/);
});
