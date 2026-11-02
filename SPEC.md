# תקין — אפיון לבנייה

## 1. מסכים ונתיבים

| נתיב | מסך | קובץ עיצוב | הערות |
|---|---|---|---|
| `/` | דף הבית | `Main.dc.html` | שדה ה-URL ב-Hero ובתחתית שולח ל-`/scan?url=` |
| `/scan/[id]` | מסך סריקה | `Scan.dc.html` | התקדמות אמיתית מהשרת (polling או SSE). בסיום מעבר אוטומטי לדוח |
| `/report/[id]` | דוח חינמי | `Report-Free.dc.html` | ממצא אחד פתוח (החמור ביותר), השאר מטושטשים |
| `/report/[id]/full` | דוח מלא | `Report-Full.dc.html` | רק אחרי תשלום או במנוי. סינון לפי חומרה, accordion |
| (מודאל) | תקן לי: קוד | `Fix-Snippet.dc.html` | נפתח מעל הדוח. לפני/אחרי + קוד + העתק |
| (מודאל) | תקן לי: ניסוח | `Fix-Claim.dc.html` | מקור מול 3 חלופות, בחירה ב-radio, העתק |
| `/agency` | לוח ניהול משרדים | `Dashboard.dc.html` | דורש התחברות. טבלה, חיפוש, הוסף אתר |
| `/terms`, `/privacy`, `/accessibility` | עמודים משפטיים | — | תוכן ממלא מקום `[טקסט משפטי יתווסף כאן]` |

### דגשים לכל מסך
- **דף הבית:** הסדר בדיוק כמו בעיצוב: Header, Hero + כרטיס צד, איך זה עובד, 4 תחומים, דוגמת דוח, משרדים (רקע `--ink`), המלצות (3 ממלאי מקום מקווקווים), מחירים, שאלות נפוצות (`<details>`), CTA, פוטר. אימות URL בצד הלקוח: קבלת כתובת בלי `https://` והשלמה אוטומטית.
- **סריקה:** ארבעה שלבים לפי סדר התחומים. מצבים: ממתין / בודקים… / נבדק. פס התקדמות עם `role="progressbar"`. אנימציה רגועה בלבד. אם הסריקה נכשלת: הודעה בגוף שני ("לא הצלחנו להגיע לאתר. כדאי לוודא שהכתובת נכונה ולנסות שוב") וכפתור ניסיון חוזר.
- **דוח חינמי:** מד עגול (SVG, `role="img"` + `aria-label`), כותרת לפי טווח ציון (ראו §4.4), שורת הסיכום "נמצאו X בעיות: …", ממצא אחד במלואו, בלוק מטושטש עם `aria-hidden` וכרטיס "פתח את הדוח המלא · 79 ₪". הממצאים המטושטשים לא יישלחו מהשרת עם התוכן המלא — רק כותרת + חומרה.
- **דוח מלא:** כפתורי סינון עם `aria-pressed`. קבוצות לפי חומרה. הממצא הראשון פתוח. כפתור הורדת PDF.
- **מודאלים:** ראו כללי נגישות ב-CLAUDE.md. כפתור "העתק" משנה ל"הועתק" ל-4 שניות ומכריז ב-`aria-live`. "סימנתי כמטופל" מעדכן את סטטוס הממצא.
- **לוח משרדים:** 4 כרטיסי סיכום, טבלה עם `overflow-x: auto`, עמודות: לקוח, ציון, בעיות, סריקה אחרונה, סטטוס, קישור לדוח. סרגל צד שנערם מעל התוכן בטלפון.

## 2. רכיבים משותפים
`Logo`, `SiteHeader`, `SiteFooter` (עם הסרת האחריות), `Button` (primary / ghost / text, size md/lg), `UrlInput`, `SeverityBadge` (צבע + צורה + טקסט), `AreaIcon` (mail / lock / accessibility / tag), `ScoreRing` (size prop), `FindingCard`, `FindingAccordion`, `LockedFindings`, `Modal`, `CopyButton`, `CodeBlock` (ltr), `PricingCard`, `FaqItem`, `PlaceholderTestimonial`, `Disclaimer`, `DataTable`.

## 3. מודל נתונים (TypeScript)

```ts
type Area = 'spam' | 'privacy' | 'accessibility' | 'consumer';
type Severity = 'high' | 'mid' | 'low';
type FixType = 'snippet' | 'rewrite' | 'template' | 'instructions';

interface Finding {
  id: string;
  ruleId: string;            // למשל SPAM-01
  area: Area;
  severity: Severity;
  title: string;             // משפט אחד, גוף שני / תיאורי
  evidence: {                // "מה מצאנו באתר"
    pageUrl: string;
    location: string;        // 'דף הבית, טופס "קבעו תור"'
    quote: string;           // ציטוט מדויק או תיאור קצר
  };
  meaning: string;           // "מה זה אומר", 1–3 משפטים
  fix: {
    type: FixType;
    summary: string;         // "מוסיף תיבת הסכמה מוכנה לטופס"
    before?: string;
    snippet?: string;        // ל-snippet/template
    alternatives?: { tag: string; text: string; note: string }[]; // ל-rewrite, בדיוק 3
  };
  status: 'open' | 'resolved';
}

interface Scan {
  id: string;
  url: string;               // מנורמל
  createdAt: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  progress: { area: Area; state: 'pending' | 'running' | 'done' }[];
  score: number;             // 0–100
  counts: { high: number; mid: number; low: number; total: number };
  findings: Finding[];
  unlocked: boolean;         // שולם / במנוי
}

interface Site { id: string; ownerId: string; clientName: string; url: string; lastScanId?: string; monitor: boolean }
interface Account { id: string; email: string; plan: 'free' | 'report' | 'monitor' | 'agency'; brand?: { name: string; logoUrl?: string; color?: string } }
interface Purchase { id: string; scanId?: string; accountId?: string; product: 'report' | 'monitor' | 'agency'; amountIls: number; status: 'pending' | 'paid' | 'failed'; provider: string; providerRef: string }
```

דוגמה מלאה: `content/sample-report.json`.

## 4. מנוע הסריקה

### 4.1 איסוף
- Playwright (Chromium headless) טוען את הכתובת, מחכה ל-network idle (timeout 20 שנ').
- סורק את דף הבית ועד 10 דפים פנימיים, בעדיפות לקישורים שמכילים: צור קשר, אודות, שירותים, מחירים, מדיניות פרטיות, תקנון, הצהרת נגישות, וכל דף עם `<form>`.
- שומר לכל דף: HTML מרונדר, טקסט נראה, רשימת סקריפטים ובקשות רשת, טפסים ושדות.
- טעינה שנייה של דף הבית אחרי 5 שנ' (לבדיקת שעון מתאפס).
- **אבטחה (חובה):** רק http/https; חסימת IP פרטיים/loopback/link-local/metadata אחרי DNS resolve (הגנת SSRF), גם בהפניות; מגבלת גודל עמוד; rate limit לפי IP (למשל 5 סריקות חינם לשעה); סריקה רצה ב-worker נפרד, לא בבקשת ה-HTTP.

### 4.2 חוקים
כל חוק = פונקציה טהורה שמקבלת את הנתונים שנאספו ומחזירה `Finding[]`. טקסטי הממצאים (title/meaning/fix) יושבים בקובץ תוכן נפרד `content/findings-copy.ts`, לא בקוד הלוגיקה, כדי שיהיה קל לעדכן ולהעביר לבדיקה משפטית.

| ID | תחום | בדיקה | חומרה | תיקון |
|---|---|---|---|---|
| SPAM-01 | ספאם | טופס עם שדה טלפון/מייל בלי checkbox שהטקסט לידו מכיל מילות הסכמה (דיוור, עדכונים, מבצעים, הודעות שיווקיות, הסכמה) | high | snippet: תיבת הסכמה |
| SPAM-02 | ספאם | תיבת הסכמה לדיוור מסומנת מראש (`checked`) | high | snippet: אותה תיבה בלי checked |
| SPAM-03 | ספאם | הסכמה לדיוור מאוחדת עם הסכמה לתקנון באותה תיבה | mid | snippet: שתי תיבות נפרדות |
| PRIV-01 | פרטיות | אין קישור למדיניות פרטיות (חיפוש בטקסט קישורים ובנתיבים) | high אם יש טופס שאוסף פרטים, אחרת mid | template: שלד מדיניות עם ממלאי מקום |
| PRIV-02 | פרטיות | זוהו כלי מעקב (Meta Pixel `fbq`, GA/`gtag`, GTM, TikTok `ttq`, Hotjar, LinkedIn Insight, Clarity) והמדיניות לא מזכירה עוגיות/כלי מעקב/פרסום | high | template: פסקה על כלי מעקב, עם שמות הכלים שזוהו |
| A11Y-01 | נגישות | אין קישור להצהרת נגישות | mid | template: הצהרה עם שדות למילוי |
| A11Y-02 | נגישות | `<img>` בלי `alt` (alt ריק = דקורטיבי, לא נספר) | low | instructions + snippet לדוגמה |
| A11Y-03 | נגישות | שדות טופס בלי `<label>`/`aria-label`/`aria-labelledby` | low | snippet: השדות עם תוויות |
| A11Y-04 | נגישות | axe-core: הפרות serious/critical (ניגודיות, כפתורים בלי שם וכו') | low, mid אם יותר מ-10 | instructions |
| CONS-01 | הגנת הצרכן | ביטויים מוחלטים: מובטח, 100%, ללא סיכון, הכי טוב/זול בישראל, תוצאות מובטחות, מוכח מדעית | mid | rewrite: 3 חלופות |
| CONS-02 | הגנת הצרכן | שעון ספירה לאחור שמראה ערך שונה (גבוה יותר) בטעינה השנייה | mid | rewrite: ניסוח עם תאריך סיום אמיתי |
| CONS-03 | הגנת הצרכן | "החל מ-" בלי פירוט, מחיר עם כוכבית בלי הסבר בסביבה | low | rewrite |

- לכל ממצא חובה ראיה (`evidence.quote`) — אם אין ציטוט ספציפי, לא מציגים ממצא.
- מקבצים כפילויות (12 תמונות בלי alt = ממצא אחד עם המספר בכותרת).
- טקסטי החוקים לדוגמה מופיעים ב-`content/sample-report.json`. כל טקסט ממצא חייב לעבור בדיקה של עורך דין לפני השקה — לסמן את הקובץ בהתאם.

### 4.3 חלופות ניסוח (rewrite)
ברירת מחדל: יצירה עם מודל שפה (Claude API) לפי prompt קבוע: 3 חלופות בעברית, בטון של העסק, בלי הבטחות מוחלטות, בלי מספרים שלא הופיעו במקור, כל חלופה עם תגית ("זהיר וחם" / "מבוסס על לקוחות" / "ממוקד בתהליך") והערה קצרה. גיבוי: תבניות קבועות לכל חוק. **החלטה פתוחה** — לאשר לפני מימוש.

### 4.4 ציון
`score = max(0, round(100 − 10·high − 5·mid − 1.5·low))`. (בדוגמה: 2/3/2 → 62.)
כותרת לפי טווח: 0–49 "יש כמה דברים שדחוף לטפל בהם", 50–79 "יש כמה דברים שכדאי לטפל בהם", 80–100 "נראה טוב. נשארו כמה נקודות קטנות". אף פעם לא "האתר עומד בחוק".

## 5. מחירים ומסלולים
| מסלול | מחיר | מה פותח |
|---|---|---|
| סריקה חינמית | 0 ₪ | ציון, סיכום, ממצא אחד מלא |
| דוח מלא | 79 ₪ חד-פעמי | כל הממצאים + "תקן לי" + PDF, לסריקה אחת |
| ניטור | 39 ₪ לחודש | דוח מלא + סריקה חוזרת אוטומטית + מייל כשיש ממצא חדש |
| משרדים | 299 ₪ לחודש | עד `[מספר אתרים]` אתרים, לוח ניהול, PDF ממותג |

PDF: נוצר מהדוח המלא (Playwright `page.pdf()` על נתיב הדפסה ייעודי), כולל הסרת האחריות. במסלול משרדים: לוגו, שם וצבע המשרד במקום המיתוג של תקין (הסרת האחריות נשארת).

## 6. שלבי עבודה
לעבוד לפי הסדר. לעצור בסוף כל שלב, להריץ בדיקות ולסכם.

0. **שלד:** Next.js + TS + Tailwind, טעינת Heebo, `tokens.css` ממופה ל-theme של Tailwind, RTL, layout, רכיבים משותפים בסיסיים. ESLint, Vitest, Playwright, axe.
1. **דף הבית** נאמן לעיצוב, כולל מובייל. בדיקת axe ו-Lighthouse נגישות 100.
2. **זרימת הדוח עם mock:** מסך סריקה (סימולציה), דוח חינמי, דוח מלא, שני המודאלים — הכול מ-`sample-report.json`.
3. **מנוע סריקה אמיתי:** worker + תור, איסוף, כל החוקים מטבלה §4.2, ציון, API (`POST /api/scans`, `GET /api/scans/:id`). לכל חוק בדיקות Vitest על HTML fixtures (חיובי ושלילי). הגנות SSRF ו-rate limit.
4. **תשלום ופתיחת דוח מלא + PDF.** ספק סליקה — להחליט קודם (§7).
5. **חשבונות, ניטור ומשרדים:** התחברות במייל (magic link), אתרים, סריקות מתוזמנות, התראות מייל, לוח משרדים, מיתוג PDF.
6. **ליטוש:** עמודים משפטיים (ממלאי מקום), 404/שגיאות, SEO בסיסי (title/description/OG בעברית), ניטור שגיאות, בדיקת מובייל מלאה.

## 7. החלטות פתוחות — לשאול את הבעלים לפני שמגיעים אליהן
- ספק סליקה (Grow/Meshulam, Cardcom, Tranzila, Stripe…) וחשבוניות.
- איפה רץ ה-worker עם Playwright (Vercel Functions לא מתאימות לדפדפן מלא; אפשרויות: Railway, Fly.io, Render, או שירות דפדפן מנוהל).
- מסד נתונים (Postgres: Supabase/Neon) וספק מייל (Resend וכד').
- שימוש ב-Claude API לחלופות ניסוח.
- מספר האתרים במסלול משרדים, ומחירים כולל/לא כולל מע"מ.
- כל טקסטי הממצאים והעמודים המשפטיים — בדיקת עורך דין.

## 8. הגדרת "גמור" לכל מסך
- נאמן לקובץ העיצוב בדסקטופ (1440) ובטלפון (375).
- ניווט מלא במקלדת, פוקוס נראה, axe בלי הפרות.
- אין טקסט שמבטיח עמידה בחוק; הסרת האחריות מופיעה בפוטר ובכל דוח.
- אין נתונים מומצאים מחוץ ל-mock ולממלאי מקום מסומנים.
