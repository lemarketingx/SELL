// ציון וכותרת לפי SPEC.md §4.4. אף פעם לא "האתר עומד בחוק".

export function computeScore(counts: { high: number; mid: number; low: number }): number {
  const raw = 100 - 10 * counts.high - 5 * counts.mid - 1.5 * counts.low;
  return Math.max(0, Math.round(raw));
}

export function scoreHeadline(score: number): string {
  if (score < 50) return "יש כמה דברים שדחוף לטפל בהם";
  if (score < 80) return "יש כמה דברים שכדאי לטפל בהם";
  return "נראה טוב. נשארו כמה נקודות קטנות";
}
