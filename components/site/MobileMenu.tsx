"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";
import { NAV_ITEMS } from "./nav";

/** תפריט מובייל: כפתור עם aria-expanded, נסגר ב-Esc, בלחיצה על קישור ובלחיצה מחוץ לתפריט. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-btn border border-border-strong bg-bg text-ink hover:bg-surface"
      >
        {open ? <X aria-hidden size={22} strokeWidth={1.9} /> : <Menu aria-hidden size={22} strokeWidth={1.9} />}
        <span className="sr-only">תפריט</span>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        onClick={(e) => {
          // כל קישור בתפריט (כולל "סרקו את האתר") סוגר אותו
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="absolute inset-x-0 top-full border-b border-border bg-bg px-6 pb-6 pt-2 shadow-float"
      >
        <nav aria-label="ניווט ראשי במובייל">
          <ul className="m-0 flex list-none flex-col p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="border-b border-border last:border-0">
                <a href={item.href} className="navlink flex min-h-12 items-center text-lg font-medium">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ScanFocusLink className="btn-primary mt-4 flex min-h-12 w-full items-center justify-center rounded-[12px] text-[17px] font-bold">
          סרקו את האתר
        </ScanFocusLink>
      </div>
    </div>
  );
}
