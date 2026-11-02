"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Next.js מדלג על אלמנטים דביקים כשהוא מחליט לאן לגלול אחרי ניווט, ועם הכותרת הדביקה
 * הדף החדש נפתח גלול באמצע. כאן: בניווט רגיל לעמוד חדש — לראש הדף.
 * בחזרה/קדימה (popstate) לא נוגעים, כדי שהדפדפן ישחזר את מיקום הגלילה. קישור עם # מטופל על ידי הדפדפן.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
