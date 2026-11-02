// טקסטים למודאל "תקן לי", לפי חוק. טעון בדיקת עורך דין לפני השקה (SPEC §4.2).
// הטקסטים של SPAM-01 ו-CONS-01 הועתקו מקבצי העיצוב Fix-Snippet / Fix-Claim.

export interface FixCopy {
  /** כותרת המודאל */
  title: string;
  /** הסבר קצר מתחת לציטוט (במודאל ניסוח) */
  why?: string;
  /** כותרת מעל בלוק הקוד (במודאל קוד) */
  codeHeading?: string;
  /** הודעת aria-live אחרי העתקה */
  copiedMessage: string;
  /** להציג המחשה של טופס לפני/אחרי */
  formPreview?: boolean;
}

export const FIX_COPY: Record<string, FixCopy> = {
  "SPAM-01": {
    title: "מוסיפים לטופס תיבת הסכמה לדיוור",
    codeHeading: "קוד מוכן להדבקה בטופס",
    copiedMessage: "הקוד הועתק. מדביקים אותו בטופס, מעל כפתור השליחה.",
    formPreview: true,
  },
  "PRIV-02": {
    title: "מוסיפים למדיניות הפרטיות פסקה על כלי מעקב",
    codeHeading: "פסקה מוכנה להדבקה במדיניות",
    copiedMessage: "הפסקה הועתקה. מדביקים אותה במדיניות הפרטיות.",
  },
  "A11Y-01": {
    title: "מפרסמים הצהרת נגישות",
    codeHeading: "תבנית מוכנה למילוי",
    copiedMessage: "התבנית הועתקה. ממלאים את הפרטים ומפרסמים בעמוד נפרד באתר.",
  },
  "A11Y-02": {
    title: "מוסיפים תיאור קצר לכל תמונה",
    codeHeading: "כך נראית תמונה עם תיאור",
    copiedMessage: "הדוגמה הועתקה. מוסיפים תיאור דומה לכל תמונה.",
  },
  "A11Y-03": {
    title: "מוסיפים תוויות לשדות בטופס",
    codeHeading: "קוד מתוקן לשדות, להעתקה",
    copiedMessage: "הקוד הועתק. מחליפים בו את השדות הקיימים בטופס.",
  },
  "CONS-01": {
    title: "ניסוח שמוכר, בלי הבטחה שקשה לעמוד בה",
    why: "\"מובטח\" ו-\"100%\" הן מילים שקשה מאוד להוכיח, ולקוח מאוכזב יכול לטעון שהוטעה.",
    copiedMessage: "הניסוח הועתק. מחליפים בו את המשפט הישן בעמוד השירותים.",
  },
  "CONS-02": {
    title: "מבצע עם תאריך סיום אמיתי",
    why: "שעון שמתחיל מחדש בכל כניסה יוצר דחיפות שלא באמת קיימת.",
    copiedMessage: "הניסוח הועתק. מחליפים בו את השעון באתר.",
  },
};

export function fixCopyFor(ruleId: string, fallbackTitle: string): FixCopy {
  return FIX_COPY[ruleId] ?? { title: fallbackTitle, copiedMessage: "הועתק. מדביקים באתר במקום המתאים." };
}
