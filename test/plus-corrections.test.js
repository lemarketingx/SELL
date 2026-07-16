"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const corrections = fs.readFileSync("js/plus-corrections.js", "utf8");
const home = fs.readFileSync("index.html", "utf8");
const build = fs.readFileSync("build.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");

test("loads corrections after the original Plus runtime", () => {
  const originalIndex = build.indexOf('src="js/plus.js"');
  const correctionIndex = build.indexOf('src="js/plus-corrections.js"');
  assert.ok(originalIndex >= 0);
  assert.ok(correctionIndex > originalIndex);
});

test("countdown uses the Israel time zone", () => {
  assert.match(corrections, /Asia\/Jerusalem/);
  assert.match(corrections, /secondsUntilIsraelMidnight/);
});

test("Shabbat window is based on sunset, city and date", () => {
  assert.match(corrections, /function sunset/);
  assert.match(corrections, /candleMinutes/);
  assert.match(corrections, /havdalahMinutes/);
  assert.match(corrections, /setInterval\(update,60000\)/);
});

test("accessibility copy includes an explicit limitation", () => {
  assert.match(corrections, /אינם אישור לעמידה בתקן/);
  assert.match(readme, /אינם תחליף לבדיקת נגישות מקצועית/);
  assert.match(home, /אינו תחליף לבדיקת נגישות מקצועית/);
});

test("homepage uses accurate product, timing and commercial copy", () => {
  assert.match(home, /ישראלי מהיסוד/);
  assert.match(home, /מומלץ לאמת זמנים ומנהג מקומי/);
  assert.match(home, /מה עדיין בפיתוח/);
  assert.match(home, /בטא פתוחה/);
  assert.doesNotMatch(home, /ראשון בעולם/);
  assert.doesNotMatch(home, /הכי פופולרי/);
});

test("rotating messages are described without fake live activity", () => {
  assert.match(corrections, /מסרים מתחלפים/);
  assert.match(corrections, /אין להציג רכישות, ביקורות או פעילות שלא התרחשו/);
});
