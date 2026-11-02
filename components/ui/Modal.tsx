"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
};

/**
 * מודאל נגיש על בסיס <dialog> מקורי: showModal() הופך את שאר הדף ל-inert (מלכודת פוקוס),
 * Esc סוגר, ובסגירה הפוקוס חוזר לכפתור שפתח.
 */
export function Modal({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onDialogClose = () => {
      document.body.style.overflow = "";
      opener.current?.focus();
      onClose();
    };
    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-modal="true"
      onKeyDown={(e) => {
        // מלכודת פוקוס מלאה: Tab מהרכיב האחרון חוזר לראשון ולהפך (גם לא יוצא לשורת הכתובת של הדפדפן).
        if (e.key !== "Tab") return;
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        // רדיו באותה קבוצה הוא עצירת Tab אחת — משאירים רק את המסומן
        const stops = items.filter((el) => !(el instanceof HTMLInputElement && el.type === "radio" && !el.checked));
        if (stops.length === 0) return;
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        // לחיצה על הרקע (מחוץ לתוכן) סוגרת
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="modal m-auto mt-12 w-[calc(100%-32px)] max-w-[760px] overflow-hidden rounded-modal border-0 bg-bg p-0 text-text shadow-modal"
    >
      {open && children}
    </dialog>
  );
}

export function ModalHeader({ id, eyebrow, title, onClose }: { id: string; eyebrow: ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="flex items-start gap-4 border-b border-border px-5 pb-[18px] pt-6 sm:px-7">
      <div className="flex flex-1 flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary">{eyebrow}</span>
        <h2 id={id} className="m-0 text-2xl font-extrabold leading-[1.3] text-ink">
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="סגירה"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-border-strong bg-bg text-text hover:bg-surface"
      >
        <X aria-hidden size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
