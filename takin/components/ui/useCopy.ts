"use client";

import { useCallback, useEffect, useRef, useState } from "react";

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // גיבוי לדפדפנים בלי Clipboard API או בלי הרשאה
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** העתקה ללוח, עם מצב "הועתק" ל-4 שניות (SPEC §1). */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    await writeClipboard(text);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 4000);
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
