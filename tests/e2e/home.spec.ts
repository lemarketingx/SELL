import { expect, test } from "@playwright/test";

const DISCLAIMER =
  "תקין אינו ייעוץ משפטי. הממצאים נועדו לזהות סיכונים אפשריים, ומומלץ להתייעץ עם עורך דין לפני קבלת החלטות.";

test("RTL ועברית", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("גלו סיכונים משפטיים אפשריים באתר שלכם");
});

test("סדר המקטעים כמו בעיצוב", async ({ page }) => {
  await page.goto("/");
  const headings = await page.locator("main h2").allTextContents();
  expect(headings).toEqual([
    "תצוגה מקדימה של דוח לדוגמה",
    "שלושה שלבים, בלי ידע משפטי ובלי ידע טכני",
    "מה תקין בודק באתר שלכם?",
    "לא רק מזהים בעיה. מבינים מה צריך לתקן.",
    "מתחילים בחינם. בלי הפתעות.",
    "מנהלים אתרים ללקוחות? תקין יכול לעזור גם לכם.",
    "מה כדאי לדעת לפני שסורקים",
    "רוצים לדעת מה כדאי לבדוק באתר שלכם?",
  ]);
});

test("הסרת האחריות בפוטר, מילה במילה", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer [role=note]")).toHaveText(DISCLAIMER);
});

test("אין הבטחות לעמידה בחוק ואין המלצות מומצאות", async ({ page }) => {
  await page.goto("/");
  // בלי קטעי קוד לדוגמה (הם כוללים בכוונה שדות למילוי כמו [שם העסק])
  const text = await page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("pre, script, style, noscript, template").forEach((el) => el.remove());
    return clone.innerText;
  });
  for (const phrase of ["האתר שלך עומד בחוק", "תקין לגמרי מבחינה משפטית", "הגנה מלאה מתביעות"]) {
    expect(text).not.toContain(phrase);
  }
  // אין טקסטים פנימיים או ממלאי מקום בדף הבית
  expect(text).not.toMatch(/\[[^\]]*\]/);
});

test("כתובת בלי https משלימה ושולחת ל-/scan", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("כתובת האתר שלך").fill("www.your-business.co.il");
  await page.getByRole("button", { name: "סרקו את האתר" }).click();
  await expect(page).toHaveURL(/\/scan\?url=https%3A%2F%2Fwww\.your-business\.co\.il$/);
});

test("כתובת לא תקינה מציגה שגיאה ונשארת בעמוד", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("כתובת האתר שלך");
  await input.fill("לא כתובת");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("נראה שהכתובת לא תקינה")).toBeVisible();
  await expect(input).toBeFocused();
});

test("'סרקו את האתר' בכותרת מעביר פוקוס לשדה הכתובת (במובייל דרך התפריט)", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    const toggle = page.getByRole("button", { name: "תפריט" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
  await page.getByRole("banner").getByRole("link", { name: "סרקו את האתר" }).click();
  await expect(page.getByLabel("כתובת האתר שלך")).toBeFocused();
});

test("קישור דילוג לתוכן הוא הרכיב הראשון במקלדת", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "דלגו לתוכן הראשי" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

test("שאלות נפוצות: הראשונה פתוחה, האחרות נפתחות במקלדת", async ({ page }) => {
  await page.goto("/");
  const details = page.locator("#faq details");
  await expect(details.nth(0)).toHaveAttribute("open", "");
  await details.nth(1).locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details.nth(1)).toHaveAttribute("open", "");
});

test("תפריט מובייל: נפתח, נסגר ב-Esc ומחזיר פוקוס", async ({ page, isMobile }) => {
  test.skip(!isMobile, "מובייל בלבד");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "תפריט" });
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "ניווט ראשי במובייל" });
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("הכותרת דביקה בגלילה", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 2000));
  const box = await page.getByRole("banner").boundingBox();
  expect(box?.y).toBe(0);
});

test("אזור הבדיקות מציג רק בדיקות שממומשות", async ({ page }) => {
  await page.goto("/");
  const areas = page.locator("#areas");
  for (const t of ["כלי מעקב", "תיבת הסכמה שמסומנת מראש", "תמונות בלי טקסט חלופי", "כוכבית ליד מחיר"]) await expect(areas).toContainText(t);
  await expect(areas).not.toContainText("ניגודיות");
});

test("ניווט פנימי פותח את הדף החדש בראשו (למרות הכותרת הדביקה)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "לצפייה בדוח לדוגמה" }).click();
  await expect(page).toHaveURL(/\/report\/demo-62$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole("link", { name: "פתח את הדוח המלא" }).click();
  await expect(page).toHaveURL(/\/full$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
