import { describe, expect, it } from "vitest";
import { normalizeUrl } from "@/lib/url";

describe("normalizeUrl", () => {
  it("משלים https:// כשהמשתמש לא הקליד", () => {
    expect(normalizeUrl("www.your-business.co.il")).toEqual({ ok: true, url: "https://www.your-business.co.il" });
    expect(normalizeUrl("  studio-example.co.il  ")).toEqual({ ok: true, url: "https://studio-example.co.il" });
  });

  it("שומר על http ועל נתיב", () => {
    expect(normalizeUrl("http://example.com/services?x=1")).toEqual({ ok: true, url: "http://example.com/services?x=1" });
  });

  it("מסיר hash", () => {
    expect(normalizeUrl("https://example.com/#contact")).toEqual({ ok: true, url: "https://example.com" });
  });

  it("מקבל דומיין בעברית", () => {
    const r = normalizeUrl("דוגמה.co.il");
    expect(r.ok).toBe(true);
  });

  it("דוחה קלט ריק", () => {
    expect(normalizeUrl("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it.each(["ftp://example.com", "javascript:alert(1)", "not a url", "localhost", "https://user:pass@example.com", "example"])(
    "דוחה %s",
    (input) => {
      expect(normalizeUrl(input).ok).toBe(false);
    },
  );
});
