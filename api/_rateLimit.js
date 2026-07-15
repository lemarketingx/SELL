"use strict";

const crypto = require("node:crypto");
const net = require("node:net");

class RateLimitUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitUnavailableError";
    this.statusCode = 503;
    this.code = "RATE_LIMIT_UNAVAILABLE";
  }
}

function header(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function extractClientIp(req) {
  const candidates = [];
  const vercel = header(req, "x-vercel-forwarded-for");
  const forwarded = header(req, "x-forwarded-for");
  if (typeof vercel === "string") candidates.push(...vercel.split(","));
  if (typeof forwarded === "string") candidates.push(...forwarded.split(","));
  candidates.push(req.socket?.remoteAddress, req.connection?.remoteAddress);

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const clean = candidate.trim().replace(/^::ffff:/, "");
    if (net.isIP(clean)) return clean;
  }
  return "unknown";
}

function keyFor(scope, ip, windowSeconds, now = Date.now()) {
  const salt = process.env.RATE_LIMIT_SALT || "dafdaf-rate-limit-v1";
  const digest = crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
  const bucket = Math.floor(now / (windowSeconds * 1000));
  return `dafdaf:rl:${scope}:${digest}:${bucket}`;
}

async function upstashPipeline(commands, fetchImpl = fetch) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new RateLimitUnavailableError("שירות הגבלת השימוש אינו מוגדר");
  }
  const response = await fetchImpl(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Upstash rate-limit failure", response.status, detail.slice(0, 500));
    throw new RateLimitUnavailableError("שירות הגבלת השימוש אינו זמין כרגע");
  }
  return response.json();
}

async function checkRateLimit(req, { scope, limit, windowSeconds }, options = {}) {
  const ip = extractClientIp(req);
  const key = keyFor(scope, ip, windowSeconds, options.now);
  const result = await upstashPipeline(
    [
      ["INCR", key],
      ["EXPIRE", key, windowSeconds, "NX"],
      ["TTL", key],
    ],
    options.fetchImpl
  );
  const count = Number(result?.[0]?.result ?? result?.[0]);
  const ttl = Math.max(1, Number(result?.[2]?.result ?? result?.[2] ?? windowSeconds));
  if (!Number.isFinite(count)) {
    throw new RateLimitUnavailableError("שירות הגבלת השימוש החזיר תשובה לא תקינה");
  }
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfter: ttl,
  };
}

module.exports = {
  RateLimitUnavailableError,
  checkRateLimit,
  extractClientIp,
  keyFor,
  upstashPipeline,
};
