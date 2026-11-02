import { describe, expect, it } from "vitest";
import { assertSafeUrl, isBlockedIp } from "@/lib/scanner/net";

describe("הגנת SSRF", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.5", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1"])(
    "חוסם %s",
    (ip) => expect(isBlockedIp(ip)).toBe(true),
  );

  it.each(["8.8.8.8", "172.32.0.1", "2a00:1450:4001:80b::200e"])("מאפשר %s", (ip) => expect(isBlockedIp(ip)).toBe(false));

  it.each(["http://localhost/", "http://127.0.0.1/", "http://[::1]/", "http://169.254.169.254/latest/meta-data", "ftp://example.com", "http://user:pw@example.com", "http://example.com:8080/", "http://printer.local/"])(
    "דוחה כתובת %s",
    (u) => expect(() => assertSafeUrl(u)).toThrow(),
  );

  it("מקבל כתובת ציבורית", () => {
    expect(assertSafeUrl("https://example.co.il/path").hostname).toBe("example.co.il");
  });
});
