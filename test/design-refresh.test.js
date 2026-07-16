"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("homepage uses the premium redesign and accurate beta copy", () => {
  const html = read("index.html");
  assert.match(html, /css\/product-v3\.css/);
  assert.match(html, /בטא פתוחה/);
  assert.match(html, /דף נחיתה טוב מתחיל/);
  assert.match(html, /לא ממלאים תבנית/);
  assert.match(html, /סביבת עבודה שמרגישה כמו מוצר/);
  assert.match(html, /עדיין בפיתוח/);
  assert.match(html, /GTM/);
  assert.match(html, /לא ממציאים לקוחות או הבטחות/);
  assert.doesNotMatch(html, /ראשון בעולם/);
  assert.doesNotMatch(html, /דרישת חוק/);
  assert.doesNotMatch(html, /₪49/);
  assert.doesNotMatch(html, /Claude של Anthropic/);
});

test("builder loads the visual refresh without changing functional ids", () => {
  const html = read("build.html");
  assert.match(html, /css\/builder-v2\.css/);
  assert.match(html, /css\/product-v3\.css/);
  assert.match(html, /css\/page-v3\.css/);
  [
    "f-name",
    "f-industry",
    "f-offer",
    "f-audience",
    "f-description",
    "f-proof",
    "studio-logo",
    "studio-hero",
    "studio-gallery",
    "vibe-grid",
    "goal-chips",
    "btn-next",
    "result-canvas",
    "btn-download",
  ].forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(html, /לידים ומדידה/);
  assert.match(read("js/studio.js"), /GTM/);
  assert.match(html, /class="v3-workspace-sidebar"/);
  assert.match(html, /data-block-jump="hero"/);
  assert.doesNotMatch(html, /Page DNA/);
});

test("redesign stylesheets contain responsive rules", () => {
  const product = read("css/product-v3.css");
  const page = read("css/page-v3.css");
  assert.match(product, /prefers-reduced-motion/);
  assert.match(product, /max-width:\s*820px/);
  assert.match(product, /--v3-acid:/);
  assert.match(page, /max-width:\s*620px/);
  assert.match(page, /--v3p-ink:/);
});
