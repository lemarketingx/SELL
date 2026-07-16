"use strict";

const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const html = fs.readFileSync("build.html", "utf8");
const editor = fs.readFileSync("js/editor-v4.js", "utf8");
const studio = fs.readFileSync("js/studio.js", "utf8");
const plus = fs.readFileSync("js/plus.js", "utf8");
const corrections = fs.readFileSync("js/plus-corrections.js", "utf8");
const engine = fs.readFileSync("js/design-engine-v2.js", "utf8");
const css = fs.readFileSync("css/studio-v4.css", "utf8");

test("workspace exposes page zones and a real element library", () => {
  assert.match(html, /css\/studio-v4\.css/);
  assert.match(html, /js\/editor-v4\.js/);
  ["header", "main", "footer"].forEach((zone) => assert.match(html, new RegExp(`data-studio-zone-jump="${zone}"`)));
  ["testimonials", "image", "button", "banner", "whatsapp", "share", "shape", "gallery"].forEach((tool) => {
    assert.match(html, new RegExp(`data-studio-tool="${tool}"`));
  });
  assert.match(editor, /studio-insert-handle/);
  assert.match(editor, /dataset\.studioPositioned/);
  assert.match(css, /#studio-backdrop\.studio-panel-backdrop\s*\{[^}]*z-index:\s*2190/s);
  assert.match(css, /\.studio-panel#studio-panel\s*\{[^}]*z-index:\s*2200\s*!important/s);
});

test("editor ships eight style kits and editable colors", () => {
  ["clean", "midnight", "sand", "electric", "coral", "luxe", "lilac", "olive"].forEach((kit) => {
    assert.match(editor, new RegExp(`${kit}: \\{ name:`));
  });
  assert.match(editor, /openColorPanel/);
  assert.match(editor, /--v3p-paper/);
  assert.match(editor, /--de-paper/);
  assert.match(studio, /data-studio-theme/);
});

test("testimonials are first-class, editable and never prefilled with fake customers", () => {
  assert.match(editor, /openTestimonialsPanel/);
  assert.match(editor, /studio-real-testimonial/);
  assert.match(editor, /data-testimonial-layout="cards"/);
  assert.match(editor, /data-testimonial-layout="spotlight"/);
  assert.match(editor, /data-testimonial-layout="compact"/);
  assert.match(editor, /הוסיפו רק המלצות אמיתיות/);
  assert.match(editor, /quote: "", name: ""/);
  assert.doesNotMatch(editor, /לקוחות מרוצים/);
});

test("images can be automatic or inserted at a chosen location", () => {
  assert.match(studio, /heroSource = "auto"/);
  assert.match(studio, /photos\[0\]\.url/);
  assert.match(editor, /openImagePanel/);
  assert.match(editor, /openGalleryPanel/);
  assert.match(editor, /insertAfterId/);
  assert.match(css, /studio-image-split/);
});

test("buttons, banners, whatsapp, sharing and shapes survive export", () => {
  ["openButtonPanel", "openBannerPanel", "openWhatsappPanel", "openSharePanel", "openShapePanel"].forEach((name) => {
    assert.match(editor, new RegExp(name));
  });
  assert.match(editor, /exportRuntime/);
  assert.match(studio, /dafdafEditor\?\.exportRuntime/);
  assert.match(studio, /studio\(\?:-\[\\w-\]\+\)\?/);
  assert.match(css, /studio-wa-float/);
  assert.match(css, /studio-share-section/);
});

test("mobile preview applies responsive rules at canvas width", () => {
  assert.match(css, /canvas-frame\.mobile-preview \.result-canvas \.design-hero/);
  assert.match(css, /grid-template-columns:\s*1fr !important/);
  assert.match(css, /@container \(max-width: 620px\)/);
  assert.match(css, /\.v3-workspace\.tools-open \.v3-workspace-sidebar/);
  assert.match(html, /id="studio-tools-toggle"/);
});

test("legacy plus tools read the current publish settings and keep fields interactive", () => {
  assert.match(plus, /function exportSettings\(\)/);
  assert.match(plus, /exportSettings\(\)\.whatsapp/);
  assert.match(plus, /event\.stopPropagation\(\)/);
  assert.doesNotMatch(plus, /field\.addEventListener\("click", \(event\) => event\.preventDefault/);
  assert.match(corrections, /dafdafExportSettings/);
  assert.doesNotMatch(corrections, /getElementById\("f-whatsapp"\)/);
});

test("header, footer, custom placement and domain hosting entry points are explicit", () => {
  assert.match(editor, /studio-site-header/);
  assert.match(editor, /studio-site-footer/);
  assert.match(engine, /canvas\.dataset\.userOrder === "true"/);
  assert.match(engine, /studio-insert-handle/);
  assert.match(html, /id="studio-domain-hosting"/);
  assert.match(editor, /https:\/\/vercel\.com\/domains/);
  assert.match(editor, /https:\/\/vercel\.com\/new/);
});
