import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/terms", "/privacy", "/accessibility", "/contact", "/scan", "/agency", "/report/demo-62"];

for (const path of PAGES) {
  test(`axe: אין הפרות ב-${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = results.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
}

test("אין גלילה אופקית", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("יעדי מגע של לפחות 44px לכל קישור וכפתור בתוכן", async ({ page }) => {
  await page.goto("/");
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("main a, main button, header a, footer a, summary"))
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ text: el.textContent?.trim().slice(0, 30), h: el.getBoundingClientRect().height }))
      .filter((x) => x.h < 44),
  );
  expect(small).toEqual([]);
});
