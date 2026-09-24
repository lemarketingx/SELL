"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yarit = require("../js/yarit.js");

// Sunday 2026-09-20; Saturday is 2026-09-26.
const SUNDAY = new Date(2026, 8, 20);

test("seedOrders skips Saturdays", () => {
  const orders = yarit.seedOrders(new Date(2026, 8, 22));
  assert.equal(orders["2026-09-26"], undefined);
  assert.equal(orders["2026-09-22"], 8);
  assert.equal(orders["2026-09-23"], 10);
});

test("freeDates respects the daily limit and closed Saturdays", () => {
  const orders = { "2026-09-20": 10, "2026-09-21": 7 };
  assert.deepEqual(yarit.freeDates(orders, SUNDAY, 1, 2, 30), ["2026-09-21", "2026-09-22"]);
  assert.deepEqual(yarit.freeDates(orders, SUNDAY, 4, 1, 30), ["2026-09-22"]);
  const all = yarit.freeDates({}, SUNDAY, 1, 10, 10);
  assert.ok(!all.includes("2026-09-26"));
});

test("pricing applies delivery fee below the free-shipping threshold", () => {
  const cart = Object.fromEntries(yarit.PRODUCTS.map((p) => [p.id, 0]));
  assert.deepEqual(yarit.pricing(cart, true), { lines: [], subtotal: 0, fee: 0, total: 0 });
  cart.puff = 1;
  assert.equal(yarit.pricing(cart, true).total, 90 + yarit.SHIP);
  assert.equal(yarit.pricing(cart, false).total, 90);
  cart.petit = 1;
  const big = yarit.pricing(cart, true);
  assert.equal(big.subtotal, 270);
  assert.equal(big.fee, 0);
});

test("calendarCells marks past, closed, full and blocked days", () => {
  const orders = { "2026-09-21": 10, "2026-09-22": 8 };
  const cells = yarit.calendarCells({ orders, today: SUNDAY, monthOff: 0, need: 3, selected: "2026-09-20", target: "2026-09-22", strict: true });
  const byIso = Object.fromEntries(cells.filter((c) => !c.empty).map((c) => [c.iso, c]));
  assert.equal(cells.filter((c) => c.empty).length, new Date(2026, 8, 1).getDay());
  assert.equal(byIso["2026-09-19"].state, "off");
  assert.equal(byIso["2026-09-26"].sub, "סגור");
  assert.equal(byIso["2026-09-21"].sub, "מלא");
  assert.equal(byIso["2026-09-22"].disabled, true);
  assert.equal(byIso["2026-09-22"].target, true);
  assert.equal(byIso["2026-09-20"].selected, true);
  const loose = yarit.calendarCells({ orders, today: SUNDAY, monthOff: 0, need: 3, selected: null, target: null, strict: false });
  assert.equal(loose.find((c) => c.iso === "2026-09-22").state, "open");
});

test("validateOrder enforces cart, bookable date, contact and address", () => {
  const base = { cart: { puff: 1 }, date: "2026-09-21", name: "דנה", phone: "050-1234567", delivery: false, address: "" };
  assert.equal(yarit.validateOrder(base, SUNDAY), "");
  assert.match(yarit.validateOrder({ ...base, cart: { puff: 0 } }, SUNDAY), /פריט/);
  assert.match(yarit.validateOrder({ ...base, date: null }, SUNDAY), /תאריך/);
  assert.match(yarit.validateOrder({ ...base, phone: "123" }, SUNDAY), /טלפון/);
  assert.match(yarit.validateOrder({ ...base, delivery: true }, SUNDAY), /כתובת/);
  // Saturday is closed and yesterday has passed, even with capacity left.
  assert.match(yarit.validateOrder({ ...base, date: "2026-09-26" }, SUNDAY), /אינו פנוי/);
  assert.match(yarit.validateOrder({ ...base, date: "2026-09-19" }, SUNDAY), /אינו פנוי/);
});

test("escapeHtml neutralises markup", () => {
  assert.equal(yarit.escapeHtml("<b a=\"x\">&'"), "&lt;b a=&quot;x&quot;&gt;&amp;&#39;");
});

test("yarit.html wires every element id the script uses", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "yarit.html"), "utf8");
  const script = fs.readFileSync(path.join(__dirname, "..", "js", "yarit.js"), "utf8");
  const ids = new Set([...script.matchAll(/\$\("([A-Za-z]+)"\)/g)].map((m) => m[1]));
  ["name", "phone", "address", "notes", "evName", "evPhone", "evDate", "evGuests"].forEach((id) => ids.add(id));
  for (const id of ids) assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
});
