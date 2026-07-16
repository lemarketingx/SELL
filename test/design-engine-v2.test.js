"use strict";

const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const build = fs.readFileSync("build.html", "utf8");
const engine = fs.readFileSync("js/design-engine-v2.js", "utf8");
const exportRuntime = fs.readFileSync("js/design-engine-v2-export.js", "utf8");
const css = fs.readFileSync("css/studio-design-v2.css", "utf8");
const pageV3 = fs.readFileSync("css/page-v3.css", "utf8");
const exportCss = fs.readFileSync("css/studio-design-v2-export.css", "utf8");
const generate = fs.readFileSync("api/generate.js", "utf8");
const studio = fs.readFileSync("js/studio.js", "utf8");

test("builder loads the design engine and exposes three distinct concepts", () => {
  assert.match(build, /css\/studio-design-v2\.css/);
  assert.match(build, /css\/page-v3\.css/);
  assert.match(build, /js\/design-engine-v2\.js/);
  assert.match(build, /data-studio-variant="classic"/);
  assert.match(build, /data-studio-variant="bold"/);
  assert.match(build, /data-studio-variant="editorial"/);
  assert.match(build, />מדויק</);
  assert.match(build, />ויזואלי</);
  assert.match(build, />מערכתי</);
});

test("engine selects industry archetypes, hero layouts and section orders", () => {
  ["authority", "showcase", "personal", "commerce", "technology"].forEach((name) => {
    assert.match(engine, new RegExp(`name: "${name}"`));
  });
  ["split", "collage", "editorial", "immersive", "centered"].forEach((layout) => {
    assert.match(`${engine}${css}`, new RegExp(layout));
  });
  assert.match(engine, /reorderSections/);
  assert.match(engine, /design-proof-rail/);
});

test("engine avoids repeated DOM mutation loops", () => {
  assert.match(engine, /current\.join\("\|"\) === order\.join\("\|"\)/);
  assert.match(engine, /rail\.dataset\.signature !== signature/);
  assert.match(exportRuntime, /hero\.dataset\.heroLayout !== layout/);
});

test("generated designs contain meaningful layout systems and responsive rules", () => {
  const styles = `${css}\n${pageV3}`;
  assert.match(styles, /data-hero-layout="split"/);
  assert.match(styles, /data-hero-layout="collage"/);
  assert.match(styles, /data-hero-layout="immersive"/);
  assert.match(styles, /grid-template-columns:\s*repeat\(6/);
  assert.match(styles, /data-design-archetype="showcase"/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("export keeps layout and archetype markers", () => {
  assert.match(engine, /studio-design-v2-export\.css/);
  assert.match(engine, /design-engine-v2-export\.js/);
  assert.match(exportRuntime, /de-archetype-/);
  assert.match(exportRuntime, /data-block="process"/);
  assert.match(exportCss, /design-hero\[data-hero-layout="split"\]/);
  assert.match(studio, /page\(\?:-v3\)\?/);
  assert.match(studio, /data-design-archetype/);
  assert.match(studio, /data-hero-layout/);
});

test("AI prompt demands concrete, non-generic business copy", () => {
  assert.match(generate, /כל כותרת ויתרון חייבים להתבסס על פרט ממשי/);
  assert.match(generate, /אל תחזור על אותו רעיון/);
  assert.match(generate, /בין 4 ל-10 מילים/);
  assert.match(generate, /פרט, שיטה, התמחות או יתרון מוחשי/);
  assert.match(generate, /אסור להמציא עדויות/);
});
