// אתר דמה מקומי לבדיקות e2e של הסורק. / = אתר עם בעיות, /good/ = אתר בלי ממצאים.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "unit", "fixtures");
const routes = {
  "/": "bad-site.html",
  "/good/": "good-site.html",
  "/privacy": "privacy-with-cookies.html",
};
const port = Number(process.env.FIXTURE_PORT ?? 3199);
createServer((req, res) => {
  const path = new URL(req.url ?? "/", "http://x").pathname;
  const file = routes[path];
  if (!file) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end("<h1>404</h1>");
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(readFileSync(join(dir, file)));
}).listen(port, () => console.log(`fixture site on ${port}`));
