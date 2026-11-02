// נרמול כתובת שהמשתמש מקליד. אימות בצד הלקוח בלבד — הגנות SSRF יהיו בשרת (שלב 3).

export type NormalizeResult = { ok: true; url: string } | { ok: false; reason: "empty" | "invalid" };

const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9א-ת](?:[a-z0-9א-ת-]{0,61}[a-z0-9א-ת])?\.)+[a-zא-ת]{2,63}$/i;

export function normalizeUrl(input: string): NormalizeResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false, reason: "invalid" };
  if (parsed.username || parsed.password) return { ok: false, reason: "invalid" };

  // URL ממיר דומיינים בעברית ל-punycode; בודקים את הצורה המקורית וגם את המקודדת.
  const host = parsed.hostname;
  if (!HOSTNAME_RE.test(host) && !/^(?:xn--[a-z0-9-]+\.)*(?:[a-z0-9-]+\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]+)$/i.test(host)) {
    return { ok: false, reason: "invalid" };
  }

  parsed.hash = "";
  const out = parsed.toString();
  return { ok: true, url: parsed.pathname === "/" && !parsed.search ? out.replace(/\/$/, "") : out };
}
