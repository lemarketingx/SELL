type Props = { score: number; size?: number };

/** מד ציון עגול. role="img" + aria-label; המספר שבתוכו מוסתר מקוראי מסך כדי שלא יוקרא פעמיים. */
export function ScoreRing({ score, size = 120 }: Props) {
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  const scale = size / 120;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg role="img" aria-label={`ציון ${clamped} מתוך 100`} width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-extrabold text-ink" style={{ fontSize: 36 * scale }}>
          {clamped}
        </span>
        <span className="mt-1 text-muted" style={{ fontSize: Math.max(12, 13 * scale) }}>
          מתוך 100
        </span>
      </div>
    </div>
  );
}
