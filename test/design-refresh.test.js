"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("homepage uses the premium redesign and accurate beta copy", () => {
  const html = read("index.html");
  assert.match(html, /css\/home-v2\.css/);
  assert.match(html, /בטא פתוחה/);
  assert.match(html, /OpenAI API/);
  assert.match(html, /ממודעה לדף נחיתה ישראלי/);
  assert.match(html, /GTM/);
  assert.doesNotMatch(html, /ראשון בעולם/);
  assert.doesNotMatch(html, /דרישת חוק/);
  assert.doesNotMatch(html, /₪49/);
  assert.doesNotMatch(html, /Claude של Anthropic/);
});

test("builder loads the visual refresh without changing functional ids", () => {
  const html = read("build.html");
  assert.match(html, /css\/builder-v2\.css/);
  [
    "f-name",
    "f-industry",
    "f-description",
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
  assert.match(html, /טופס לידים.*GTM/);
  assert.match(html, /class="tool-group"/);
  assert.doesNotMatch(html, /Page DNA/);
});

test("redesign stylesheets contain responsive rules", () => {
  const home = read("css/home-v2.css");
  const builder = read("css/builder-v2.css");
  assert.match(home, /prefers-reduced-motion/);
  assert.match(home, /max-width:520px/);
  assert.match(builder, /max-width:720px/);
  assert.match(builder, /--grad:/);
});
