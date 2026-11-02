import { expect, test } from "@playwright/test";

const DISCLAIMER =
  "תקין אינו ייעוץ משפטי. הממצאים נועדו לזהות סיכונים אפשריים, ומומלץ להתייעץ עם עורך דין לפני קבלת החלטות.";

test("RTL ועברית", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("תדעו מה באתר שלכם");
});

test("סדר המקטעים כמו בעיצוב", async ({ page }) => {
  await page.goto("/");
  const headings = await page.locator("main h2").allTextContents();
  expect(headings).toEqual([
    "איך זה עובד",
    "ארבעה תחומים שבודקים בכל סריקה",
    "ככה נראה דוח",
    "סורקים את כל האתרים של הלקוחות מלוח אחד, עם דוח ממותג",
    "מחירים",
    "שאלות נפוצות",
    "דקה אחת, ותדעו איפה אתם עומדים",
  ]);
});

test("הסרת האחריות בפוטר, מילה במילה", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer [role=note]")).toHaveText(DISCLAIMER);
});

test("אין הבטחות לעמידה בחוק ואין המלצות מומצאות", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("body").innerText();
  for (const phrase of ["האתר שלך עומד בחוק", "תקין לגמרי מבחינה משפטית", "הגנה מלאה מתביעות"]) {
    expect(text).not.toContain(phrase);
  }
  // אין טקסטים פנימיים או ממלאי מקום בדף הבית
  expect(text).not.toMatch(/\[[^\]]*\]/);
});

test("כתובת בלי https משלימה ושולחת ל-/scan", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("כתובת האתר שלך").fill("www.your-business.co.il");
  await page.getByRole("button", { name: "סרוק את האתר שלי בחינם" }).click();
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

test("'סריקה חינם' בכותרת מעביר פוקוס לשדה הכתובת", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "סריקה חינם" }).click();
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
