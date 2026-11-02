import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchPage, ScanFetchError } from "@/lib/scanner/net";

let server: Server;
let port = 0;

beforeAll(async () => {
  process.env.TAKIN_TEST_ALLOW_PRIVATE = "1";
  server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.write("<html><body>התחלה");
    if (req.url === "/drop") setTimeout(() => res.socket?.destroy(), 50); // החיבור נופל באמצע
    // /stall: לא מסיימים בכלל
  });
  await new Promise<void>((r) => server.listen(0, r));
  port = (server.address() as { port: number }).port;
});

afterAll(() => {
  server.closeAllConnections();
  server.close();
  delete process.env.TAKIN_TEST_ALLOW_PRIVATE;
});

describe("כישלון באמצע הורדת הגוף", () => {
  it("חיבור שנפל → ScanFetchError", async () => {
    await expect(fetchPage(`http://localhost:${port}/drop`, 3000)).rejects.toBeInstanceOf(ScanFetchError);
  });

  it("דף שנתקע → ScanFetchError מסוג timeout", async () => {
    const err = await fetchPage(`http://localhost:${port}/stall`, 500).catch((e) => e);
    expect(err).toBeInstanceOf(ScanFetchError);
    expect((err as ScanFetchError).code).toBe("timeout");
  });
});
