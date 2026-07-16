"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("build.html", "utf8");
const script = fs.readFileSync("js/studio.js", "utf8");
const css = fs.readFileSync("css/studio.css", "utf8");
const generate = fs.readFileSync("api/generate.js", "utf8");

test("builder supports logo, hero and gallery uploads", () => {
  assert.match(html, /id="studio-logo"/);
  assert.match(html, /id="studio-hero"/);
  assert.match(html, /id="studio-gallery"/);
});

test("builder includes brand and campaign-message inputs", () => {
  assert.match(html, /id="studio-analyze"/);
  assert.match(html, /id="studio-ad-message"/);
  assert.match(html, /id="f-offer"/);
  assert.match(html, /id="f-audience"/);
  assert.match(html, /id="f-proof"/);
  assert.match(script, /analyzeBrand/);
  assert.match(generate, /מסר קמפיין קיים/);
  assert.doesNotMatch(script, /מסר הקמפיין:/);
});

test("studio provides variants, mobile preview and conversion audit", () => {
  assert.match(html, /data-studio-variant="classic"/);
  assert.match(html, /data-studio-variant="bold"/);
  assert.match(html, /data-studio-variant="editorial"/);
  assert.match(html, /id="studio-mobile"/);
  assert.match(html, /id="studio-audit"/);
  assert.match(script, /runAudit/);
  assert.match(css, /mobile-preview/);
});

test("studio supports section management and local project persistence", () => {
  assert.match(script, /data-studio-action="up"/);
  assert.match(script, /data-studio-action="delete"/);
  assert.match(script, /addCustomSection/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /localStorage\.getItem/);
  assert.match(script, /publish: window\.dafdafExportSettings/);
  assert.match(script, /dafdafApplyExportSettings/);
});

test("enhanced export removes editor controls and embeds assets", () => {
  assert.match(script, /stopImmediatePropagation/);
  assert.match(script, /\.block-toolbar/);
  assert.match(script, /new Blob/);
  assert.match(script, /studio\.gallery/);
  assert.match(script, /googletagmanager\.com/);
});
