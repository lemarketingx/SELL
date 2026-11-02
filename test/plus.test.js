"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const buildHtml = fs.readFileSync("build.html", "utf8");
const homeHtml = fs.readFileSync("index.html", "utf8");
const plusJs = fs.readFileSync("js/plus.js", "utf8");
const plusCss = fs.readFileSync("css/plus.css", "utf8");
const studioJs = fs.readFileSync("js/studio.js", "utf8");

test("builder exposes boosters and campaign kit entry points", () => {
  assert.match(buildHtml, /id="plus-boosters"/);
  assert.match(buildHtml, /id="plus-campaign"/);
  assert.match(buildHtml, /css\/plus\.css/);
  assert.match(buildHtml, /js\/plus\.js/);
});

test("plus layer ships Israel-specific boosters", () => {
  assert.match(plusJs, /Asia\/Jerusalem/);
  assert.match(plusJs, /plus-shabbat/);
  assert.match(plusJs, /plus-a11y/);
  assert.match(plusJs, /wa\.me/);
  assert.match(plusJs, /waze\.com\/ul/);
  assert.match(plusCss, /plus-a11y-menu/);
  assert.match(plusCss, /plus-countdown/);
  assert.match(plusCss, /plus-proof/);
});

test("accessibility booster includes the available helper controls", () => {
  assert.match(plusJs, /plus-a11y-statement/);
  assert.match(plusCss, /plus-a11y-font/);
  assert.match(plusCss, /plus-a11y-contrast/);
  assert.match(plusCss, /plus-a11y-links/);
  assert.match(plusCss, /plus-a11y-motion/);
});

test("campaign kit builds copy-ready assets from the generated page", () => {
  assert.match(plusJs, /buildCampaignKit/);
  assert.match(plusJs, /Google Ads/);
  assert.match(plusJs, /SMS/);
  assert.match(plusJs, /clipboard\.writeText/);
});

test("export embeds plus runtime, metadata and audit checks", () => {
  assert.match(plusJs, /window\.dafdafPlus/);
  assert.match(plusJs, /exportAssets/);
  assert.match(plusJs, /og:title/);
  assert.match(studioJs, /dafdafPlus/);
  assert.match(studioJs, /plusExport/);
  assert.match(studioJs, /page\(\?:-v3\)\?/);
});

test("generated pages use the rich design system", () => {
  const builderJs = fs.readFileSync("js/builder.js", "utf8");
  const pageCss = fs.readFileSync("css/page.css", "utf8");
  assert.match(buildHtml, /css\/page\.css/);
  assert.match(builderJs, /pg-hero/);
  assert.match(builderJs, /pg-testimonials/);
  assert.match(builderJs, /dataset\.vibe/);
  assert.match(pageCss, /--pg-grad/);
  assert.match(pageCss, /data-vibe="luxury"/);
  assert.match(pageCss, /data-vibe="energetic"/);
  assert.match(pageCss, /pg-animate/);
  assert.match(plusJs, /revealRuntime/);
  assert.match(studioJs, /data-vibe/);
});

test("home page explains the available product without unsupported claims", () => {
  assert.match(homeHtml, /טופס, WhatsApp ומדידה/);
  assert.match(homeHtml, /GTM וייצוא HTML/);
  assert.match(homeHtml, /זמין בבטא/);
  assert.match(homeHtml, /ניהול לידים פנימי/);
  assert.doesNotMatch(homeHtml, /ראשון בעולם/);
  assert.doesNotMatch(homeHtml, /דרישת חוק/);
});
