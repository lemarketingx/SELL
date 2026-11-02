"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function fallbackCopy(text: string): boolean {
  // בזמן ש-<dialog> פתוח עם showModal(), כל מה שמחוצה לו inert — לכן ה-textarea נכנס לתוך הדיאלוג הפתוח.
  const host = document.querySelector<HTMLDialogElement>("dialog[open]") ?? document.body;
  const active = document.activeElement as HTMLElement | null;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.setAttribute("aria-hidden", "true");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";
  host.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus();
  return ok;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

/** העתקה ללוח, עם מצב "הועתק" ל-4 שניות (SPEC §1). "הועתק" מוצג רק אם ההעתקה באמת הצליחה. */
export function useCopy() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    const ok = await writeClipboard(text);
    setStatus(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setStatus("idle"), 4000);
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setStatus("idle");
  }, []);

  return { copied: status === "copied", failed: status === "failed", copy, reset };
}

export const COPY_FAILED_MESSAGE = "לא הצלחנו להעתיק אוטומטית. אפשר לסמן את הטקסט ולהעתיק ידנית.";
