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
  assert.deepEqual(validateStockPhotoInput({ industry: "יוגה" }), { industry: "יוגה", description: "", queries: null });
  assert.throws(() => validateStockPhotoInput({}), ValidationError);
  assert.throws(() => validateStockPhotoInput({ industry: "" }), ValidationError);
});

test("stock photo input passes through AI-provided queries when valid, ignores malformed ones", () => {
  const withQueries = validateStockPhotoInput({ industry: "יוגה", queries: ["yoga studio", "meditation class"] });
  assert.deepEqual(withQueries.queries, ["yoga studio", "meditation class"]);
  assert.equal(validateStockPhotoInput({ industry: "יוגה", queries: [] }).queries, null);
  assert.equal(validateStockPhotoInput({ industry: "יוגה", queries: "not-an-array" }).queries, null);
  assert.equal(validateStockPhotoInput({ industry: "יוגה", queries: ["x".repeat(90)] }).queries, null);
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

test("AI generation produces business-specific photo search queries", () => {
  const shared = fs.readFileSync("api/_shared.js", "utf8");
  const generate = fs.readFileSync("api/generate.js", "utf8");
  const validation = fs.readFileSync("api/_validation.js", "utf8");
  assert.match(shared, /photoQueries/);
  assert.match(generate, /photoQueries/);
  assert.match(validation, /photoQueries/);
});

test("validateGeneratedPage requires 2-3 short photo queries", () => {
  const { validateGeneratedPage, ValidationError } = require("../api/_validation");
  const hero = {
    badge: "חדש", headline: "כותרת", highlight: "הדגשה", subheadline: "משפט",
    ctaPrimary: "דברו איתנו", ctaSecondary: "פרטים", trustPoints: ["ליווי אישי"],
  };
  const block = { eyebrow: "e", title: "t", subtitle: "s", items: [{ icon: "i", title: "t", text: "x" }, { icon: "i", title: "t", text: "x" }, { icon: "i", title: "t", text: "x" }] };
  const steps = { eyebrow: "e", title: "t", steps: [{ title: "a", text: "x" }, { title: "b", text: "x" }, { title: "c", text: "x" }] };
  const testimonials = { eyebrow: "e", title: "t", items: [{ quote: "q", name: "n", role: "r" }, { quote: "q", name: "n", role: "r" }, { quote: "q", name: "n", role: "r" }] };
  const cta = { title: "t", subtitle: "s", buttonText: "b", formTitle: "f" };
  const basePage = { hero, features: block, process: steps, testimonials, cta };

  assert.throws(() => validateGeneratedPage(basePage), ValidationError);
  assert.throws(() => validateGeneratedPage({ ...basePage, photoQueries: [] }), ValidationError);
  assert.throws(() => validateGeneratedPage({ ...basePage, photoQueries: ["only one"] }), ValidationError);

  const valid = validateGeneratedPage({ ...basePage, photoQueries: ["nail salon manicure", "gel polish application"] });
  assert.deepEqual(valid.photoQueries, ["nail salon manicure", "gel polish application"]);
});

test("builder forwards AI photo queries to the canvas for the gallery to read", () => {
  const builder = fs.readFileSync("js/builder.js", "utf8");
  const studio = fs.readFileSync("js/studio.js", "utf8");
  assert.match(builder, /page\.photoQueries/);
  assert.match(builder, /dataset\.photoQueries/);
  assert.match(studio, /readAiPhotoQueries/);
  assert.match(studio, /dataset\.photoQueries/);
});
