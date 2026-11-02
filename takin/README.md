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
- ⏳ שלב 2: זרימת הדוח עם mock. חסרים קבצי העיצוב `Scan`, `Report-Free` ו-`Report-Full`.
- המסכים `/scan`, `/report/*`, `/agency` והעמודים המשפטיים הם כרגע placeholders.
