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
- ⏳ שלב 3: מנוע סריקה אמיתי. עד אז כל סריקה מציגה את דוח הדוגמה, עם הודעת "זו הדגמה".
- `/agency` והעמודים המשפטיים הם כרגע placeholders.
