"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { ValidationError, validateStockPhotoInput } = require("../api/_validation");

test("validates stock photo input", () => {
  const value = validateStockPhotoInput({ industry: "מסעדה", description: "מסעדה איטלקית משפחתית" });
  assert.equal(value.industry, "מסעדה");
  assert.equal(value.description, "מסעדה איטלקית משפחתית");
});

test("stock photo input requires an industry but description is optional", () => {
  assert.deepEqual(validateStockPhotoInput({ industry: "יוגה" }), { industry: "יוגה", description: "" });
  assert.throws(() => validateStockPhotoInput({}), ValidationError);
  assert.throws(() => validateStockPhotoInput({ industry: "" }), ValidationError);
});

test("stock-photos endpoint keeps the Unsplash key server-side and rate-limited", () => {
  const source = fs.readFileSync("api/stock-photos.js", "utf8");
  assert.match(source, /process\.env\.UNSPLASH_ACCESS_KEY/);
  assert.match(source, /checkRateLimit/);
  assert.doesNotMatch(source, /Client-ID [A-Za-z0-9_-]{20,}/);
});

test("stock-photos endpoint follows Unsplash attribution and download-tracking rules", () => {
  const source = fs.readFileSync("api/stock-photos.js", "utf8");
  assert.match(source, /utm_source/);
  assert.match(source, /utm_medium/);
  assert.match(source, /download_location/);
  assert.match(source, /photographerName/);
  assert.match(source, /photographerUrl/);
});

test("stock-photos endpoint degrades gracefully without a configured key", () => {
  const source = fs.readFileSync("api/stock-photos.js", "utf8");
  assert.match(source, /if \(!accessKey\)/);
  assert.match(source, /photos: \[\]/);
});

test("studio fetches auto-gallery photos from the server instead of a client-side placeholder service", () => {
  const studio = fs.readFileSync("js/studio.js", "utf8");
  assert.match(studio, /\/api\/stock-photos/);
  assert.doesNotMatch(studio, /picsum\.photos/);
  assert.match(studio, /galleryAttribution/);
  assert.match(studio, /studio-gallery-credit/);
});

test("gallery credit line ships in the exported page, not stripped as editor-only chrome", () => {
  const studio = fs.readFileSync("js/studio.js", "utf8");
  const removalLine = studio.match(/\$\$\("[^)]*no-export[^)]*", clone\)\.forEach/);
  assert.ok(removalLine, "expected an export-time removal selector for no-export chrome");
  assert.doesNotMatch(removalLine[0], /studio-gallery-credit/);
});

test("gallery grid uses a varied bento layout instead of uniform tiles", () => {
  const css = fs.readFileSync("css/studio.css", "utf8");
  assert.match(css, /grid-column: span 2/);
  assert.match(css, /grid-row: span 2/);
});
