import { describe, expect, it } from "vitest";
import { checkScanRateLimit, hashIp, loadScan, saveScan } from "@/lib/store";
import sample from "@/content/sample-report.json";
import type { Scan } from "@/lib/types";

describe("אחסון (זיכרון בפיתוח)", () => {
  it("שומר וטוען סריקה", async () => {
    const scan = { ...(sample as Scan), id: "AbCdEfGh12345678" };
    await saveScan(scan);
    expect((await loadScan("AbCdEfGh12345678"))?.score).toBe(62);
    expect(await loadScan("nope-not-valid!")).toBeNull();
  });

  it("5 סריקות חינם לשעה, השישית נחסמת", async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 200)}`;
    for (let i = 0; i < 5; i++) expect((await checkScanRateLimit(ip)).allowed).toBe(true);
    const sixth = await checkScanRateLimit(ip);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfter).toBeGreaterThan(0);
  });

  it("IP נשמר רק כגיבוב", () => {
    expect(hashIp("1.2.3.4")).toMatch(/^[0-9a-f]{32}$/);
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
  });
});

describe("בחירת משתני Upstash", () => {
  it("מעדיף KV_* (חיבור חדש) על פני השמות הישנים", async () => {
    const calls: string[] = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      calls.push(String(url));
      return new Response(JSON.stringify([{ result: null }]), { status: 200 });
    }) as typeof fetch;
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://old.example";
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "old";
    process.env.KV_REST_API_URL = "https://new.example";
    process.env.KV_REST_API_TOKEN = "new";
    try {
      const { storageHealth } = await import("@/lib/store");
      expect(await storageHealth()).toEqual({ storage: "ok", source: "KV_REST_API_URL" });
      expect(calls[0]).toBe("https://new.example/pipeline");
    } finally {
      globalThis.fetch = orig;
      for (const k of ["UPSTASH_REDIS_REST_KV_REST_API_URL", "UPSTASH_REDIS_REST_KV_REST_API_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"]) delete process.env[k];
    }
  });
});
