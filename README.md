# תקין

סורק אתרים לעסקים קטנים בישראל, שמסמן סיכונים משפטיים אפשריים בארבעה תחומים (ספאם ודיוור, פרטיות, נגישות, הגנת הצרכן) ומסביר אותם בעברית פשוטה.

- כללים קבועים לפרויקט: [`CLAUDE.md`](CLAUDE.md)
- אפיון ושלבי עבודה: [`SPEC.md`](SPEC.md)
- עיצוב: [`design/tokens.css`](design/tokens.css), [`design/reference/`](design/reference/)
- חבילת ההעברה המקורית: [`docs/handoff/`](docs/handoff/)

## סטאק
Next.js (App Router) · TypeScript · Tailwind CSS 4 · pnpm · Vitest · Playwright + axe-core

## הרצה

```bash
pnpm install
pnpm dev
```

## בדיקות

```bash
pnpm check      # lint + typecheck + vitest
pnpm test:e2e   # Playwright + axe, בדסקטופ (1440) ובמובייל (375)
```

## מצב
- ✅ שלב 0: שלד, tokens ממופים ל-Tailwind, RTL, רכיבים משותפים, בדיקות
- ✅ שלב 1: דף הבית
- ✅ שלב 2: זרימת הדוח עם mock: מסך סריקה (סימולציה), דוח חינמי, דוח מלא ושני מודאלי "תקן לי", הכול מ-`content/sample-report.json`.
  מסכי הסריקה והדוח נבנו לפי SPEC והשפה העיצובית של דף הבית, כי קבצי העיצוב `Scan`, `Report-Free` ו-`Report-Full` לא היו בחבילה.
- ✅ שלב 3 (חלקי, בלי דפדפן): סורק אמיתי שרץ ב-Vercel. קורא את דף הבית ועד 6 עמודים פנימיים, מריץ 10 מתוך 12 החוקים ב-SPEC §4.2, ושומר דוחות ב-Upstash ל-30 יום. CONS-02 ו-A11Y-04 דורשים דפדפן ויתווספו בהמשך.
- עמודים משפטיים: טיוטות לבדיקת עורך דין (`content/legal.ts`). פרטי העסק ב-`content/business.ts` — למלא.
- תשלום (שלב 4) עוד לא פעיל: הדוח המלא פתוח בחינם עד שמגדירים `REPORT_PAYWALL_ENABLED=1`.

## פריסה
הפרויקט `sell` ב-Vercel בונה את שורש הריפו. `vercel.json` קובע Next.js ו-pnpm, כך שלא צריך לשנות הגדרות בלוח הבקרה.
