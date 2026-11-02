import type { Area, Severity } from "./types";

/** סדר התחומים קבוע בכל המסכים: ספאם, פרטיות, נגישות, הגנת הצרכן. */
export const AREAS: readonly Area[] = ["spam", "privacy", "accessibility", "consumer"] as const;

export const AREA_LABELS: Record<Area, string> = {
  spam: "ספאם ודיוור",
  privacy: "פרטיות",
  accessibility: "נגישות",
  consumer: "הגנת הצרכן",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  high: "חמור",
  mid: "בינוני",
  low: "קל",
};
