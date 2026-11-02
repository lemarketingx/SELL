"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export const HERO_INPUT_ID = "hero-url";

/**
 * קישור "סריקה חינם" שמוביל לשדה ה-URL ב-Hero ומעביר אליו פוקוס.
 * בלי JavaScript, או מדף אחר, הוא פשוט מנווט ל-/#scan.
 */
export function ScanFocusLink({ className, children }: { className?: string; children: ReactNode }) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const input = document.getElementById(HERO_INPUT_ID);
    if (!input) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("scan")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
    history.replaceState(null, "", "#scan");
  }
  return (
    <Link href="/#scan" onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
