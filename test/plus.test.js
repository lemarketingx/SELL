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

test("accessibility booster covers the Israeli regulation basics", () => {
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
  assert.match(studioJs, /\(\?:studio\|plus\)\\\.css/);
});

test("home page markets the plus boosters", () => {
  assert.match(homeHtml, /id="plus"/);
  assert.match(homeHtml, /מצב שבת/);
  assert.match(homeHtml, /נגישות מובנית/);
  assert.match(homeHtml, /ערכת קמפיין אוטומטית/);
});
