import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const DISCLAIMER =
  "תקין אינו ייעוץ משפטי. הממצאים נועדו לזהות סיכונים אפשריים, ומומלץ להתייעץ עם עורך דין לפני קבלת החלטות.";

async function axe(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

test.describe("סריקה", () => {
  test("סריקה אמיתית: מהדף הראשי, דרך מסך הסריקה, לדוח עם ממצאים מהאתר", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("כתובת האתר שלך").fill("http://localhost:3199/");
    await page.getByRole("button", { name: "סרקו את האתר" }).click();
    await expect(page.getByRole("heading", { name: "סורקים את האתר שלכם" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "התקדמות הסריקה" })).toHaveAttribute("aria-valuemin", "0");
    await expect(page).toHaveURL(/\/report\/[A-Za-z0-9]{16}$/, { timeout: 30_000 });

    // ממצא אמיתי מהאתר, עם ציטוט ומיקום
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("יש כמה דברים שדחוף לטפל בהם");
    await expect(page.getByText("תיבת ההסכמה לדיוור כבר מסומנת מראש")).toBeVisible();
    await expect(page.getByRole("heading", { name: "מה בדקנו" })).toBeVisible();
    await expect(page.getByText("זה דוח לדוגמה")).toHaveCount(0);

    // בתקופת ההרצה הדוח המלא פתוח
    await page.getByRole("link", { name: "פתח את הדוח המלא" }).click();
    await expect(page.getByRole("button", { name: /^הכול \(\d+\)$/ })).toBeVisible();
    await expect(page.getByText('"תוצאות מובטחות ב-100% כבר מהטיפול הראשון"').first()).toBeAttached();
    expect(await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze().then((r) => r.violations.map((v) => v.id))).toEqual([]);
  });

  test("אתר בלי ממצאים: 'ללא ממצא חמור', בלי הבטחה לעמידה בחוק", async ({ page }) => {
    await page.goto("/scan?url=http%3A%2F%2Flocalhost%3A3199%2Fgood%2F");
    await expect(page).toHaveURL(/\/report\/[A-Za-z0-9]{16}$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "ללא ממצא חמור" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("לא מצאנו בעיות בבדיקות שהרצנו");
    await expect(page.locator("body")).not.toContainText("עומד בחוק");
  });

  test("כתובת לא תקינה: הודעה בגוף שני וכפתור ניסיון חוזר", async ({ page }) => {
    await page.goto("/scan?url=not%20a%20url");
    await expect(page.getByRole("heading", { name: "לא הצלחנו לסרוק את האתר" })).toBeVisible();
    await expect(page.getByText("כדאי לוודא שהכתובת נכונה ולנסות שוב.")).toBeVisible();
    await expect(page.getByRole("link", { name: "לנסות שוב" })).toBeVisible();
  });

  test("אתר שלא קיים: הודעה ברורה", async ({ page }) => {
    await page.goto("/scan?url=http%3A%2F%2Flocalhost%3A3199%2Fmissing");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("לא הצלחנו להגיע לאתר");
  });

  test("דוח לא קיים: 404", async ({ page }) => {
    const res = await page.goto("/report/doesNotExist12345");
    expect(res?.status()).toBe(404);
  });
});

test.describe("דוח חינמי", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/report/demo-62");
  });

  test("ציון, כותרת לפי טווח ושורת סיכום", async ({ page }) => {
    await expect(page.getByRole("img", { name: "ציון 62 מתוך 100" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("יש כמה דברים שכדאי לטפל בהם");
    await expect(page.getByText("נמצאו 7 בעיות: 2 חמורות, 3 בינוניות, 2 קלות")).toBeVisible();
  });

  test("ממצא אחד פתוח במלואו, השאר נעולים, והודעת דוח לדוגמה", async ({ page }) => {
    await expect(page.getByText("זה דוח לדוגמה")).toBeVisible();
    await expect(page.getByRole("heading", { name: "הטופס אוסף מספר טלפון בלי לבקש הסכמה לקבל הודעות שיווקיות" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "עוד 6 ממצאים מחכים בדוח המלא" })).toBeVisible();
    await expect(page.getByRole("link", { name: "פתח את הדוח המלא" })).toHaveAttribute("href", "/report/demo-62/full");
  });

  test("התוכן המלא של ממצאים נעולים לא נשלח לדפדפן", async ({ page }) => {
    const html = await page.content();
    expect(html).not.toContain("גולשים אמורים לדעת שאוספים עליהם מידע");
    expect(html).not.toContain("טיפול מקצועי ואישי, שמכוון לתוצאות שתרגישו");
  });

  test("הסרת האחריות בתחתית הדוח ובפוטר", async ({ page }) => {
    await expect(page.locator("main [role=note]").last()).toHaveText(DISCLAIMER);
    await expect(page.locator("footer [role=note]")).toHaveText(DISCLAIMER);
  });
});

test.describe("דוח מלא", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/report/demo-62/full");
  });

  test("סינון לפי חומרה עם aria-pressed", async ({ page }) => {
    const all = page.getByRole("button", { name: "הכול (7)" });
    const high = page.getByRole("button", { name: "חמור (2)" });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await high.click();
    await expect(high).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("heading", { name: /^חמורים/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^בינוניים/ })).toHaveCount(0);
  });

  test("accordion: הראשון פתוח, אפשר לפתוח אחר", async ({ page }) => {
    const first = page.getByRole("button", { name: /^חמור ספאם ודיוור הטופס אוסף/ });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const other = page.getByRole("button", { name: /^קל נגישות 12 תמונות/ });
    await expect(other).toHaveAttribute("aria-expanded", "false");
    await other.click();
    await expect(other).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("לאף תמונה בגלריה אין תיאור.")).toBeVisible();
  });

  test("מודאל קוד: פוקוס, העתקה עם הכרזה, Esc מחזיר פוקוס", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const opener = page.getByRole("button", { name: /תקן לי: הטופס אוסף/ });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "מוסיפים לטופס תיבת הסכמה לדיוור" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "סגירה" })).toBeFocused();

    await dialog.getByRole("button", { name: "העתק" }).click();
    await expect(dialog.getByRole("button", { name: "הועתק" })).toBeVisible();
    await expect(dialog.getByText("הקוד הועתק. מדביקים אותו בטופס, מעל כפתור השליחה.")).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('name="marketing_consent"');

    expect(await axe(page)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("מודאל קוד: 'סימנתי כמטופל' מעדכן את הסטטוס", async ({ page }) => {
    await page.getByRole("button", { name: /תקן לי: הטופס אוסף/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "סימנתי כמטופל" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("סומן כמטופל").first()).toBeVisible();
  });

  test("מודאל ניסוח: בחירה בין 3 חלופות והעתקה", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: /^בינוני הגנת הצרכן טענה שיווקית/ }).click();
    await page.getByRole("button", { name: /תקן לי: טענה שיווקית/ }).click();
    const dialog = page.getByRole("dialog", { name: "ניסוח שמוכר, בלי הבטחה שקשה לעמוד בה" });
    await expect(dialog).toBeVisible();
    const radios = dialog.getByRole("radio");
    await expect(radios).toHaveCount(3);
    await expect(radios.nth(0)).toBeChecked();
    await dialog.getByText("ממוקד בתהליך").click();
    await expect(radios.nth(2)).toBeChecked();
    await dialog.getByRole("button", { name: "העתק את הניסוח" }).click();
    await expect(dialog.getByText("הניסוח הועתק.", { exact: false })).toBeVisible();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe("נבנה יחד תוכנית טיפול שמתאימה לך, ונעקוב אחרי ההתקדמות מפגישה לפגישה");

    expect(await axe(page)).toEqual([]);

    await dialog.getByRole("button", { name: "אחר כך" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Tab לא בורח מהמודאל", async ({ page }) => {
    await page.getByRole("button", { name: /תקן לי: הטופס אוסף/ }).click();
    const dialog = page.getByRole("dialog");
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => !!document.activeElement?.closest("dialog"));
      expect(inside).toBe(true);
    }
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
    }
    await expect(dialog).toBeVisible();
  });

  test("הדפסה / PDF כוללת את כל הממצאים, גם סגורים וגם מסוננים", async ({ page }) => {
    await page.getByRole("button", { name: "חמור (2)" }).click();
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator('[role="region"]:not([hidden])')).toHaveCount(7);
    await expect(page.getByText("לאף תמונה בגלריה אין תיאור.")).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(page.locator('[role="region"]:not([hidden])')).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /^בינוניים/ })).toHaveCount(0);
  });

  test("גיבוי העתקה בתוך מודאל: ה-textarea בתוך הדיאלוג, ו'הועתק' רק כשהצליח", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("blocked")) },
        configurable: true,
      });
      (window as unknown as { __copyOk: boolean }).__copyOk = true;
      document.execCommand = ((cmd: string) => {
        const el = document.activeElement;
        (window as unknown as { __insideDialog: boolean }).__insideDialog = !!el?.closest("dialog[open]") && el.tagName === "TEXTAREA";
        return cmd === "copy" && (window as unknown as { __copyOk: boolean }).__copyOk;
      }) as typeof document.execCommand;
    });
    await page.goto("/report/demo-62/full");
    await page.getByRole("button", { name: /תקן לי: הטופס אוסף/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "העתק" }).click();
    await expect(dialog.getByRole("button", { name: "הועתק" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __insideDialog: boolean }).__insideDialog)).toBe(true);
    await expect(dialog.getByRole("button", { name: "העתק" })).toBeVisible({ timeout: 6000 });

    await page.evaluate(() => ((window as unknown as { __copyOk: boolean }).__copyOk = false));
    await dialog.getByRole("button", { name: "העתק" }).click();
    await expect(dialog.getByText("לא הצלחנו להעתיק אוטומטית.", { exact: false })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "הועתק" })).toHaveCount(0);
  });
});
