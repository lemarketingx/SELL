"use client";

import { useCallback, useState } from "react";
import { Wrench } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { Finding } from "@/lib/types";
import { FixSnippetModal } from "./FixSnippetModal";
import { FixClaimModal } from "./FixClaimModal";

type Props = { finding: Finding; onResolve?: () => void };

/** כפתור "תקן לי" + המודאל המתאים לסוג התיקון. */
export function FixLauncher({ finding, onResolve }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const titleId = finding.fix.type === "rewrite" ? `claim-title-${finding.id}` : `fix-title-${finding.id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`תקן לי: ${finding.title}`}
        className="btn-primary inline-flex min-h-tap items-center gap-2 rounded-btn px-[18px] text-base font-semibold"
      >
        <Wrench aria-hidden size={18} strokeWidth={1.9} />
        תקן לי
      </button>
      <Modal open={open} onClose={close} labelledBy={titleId}>
        {finding.fix.type === "rewrite" ? (
          <FixClaimModal finding={finding} onClose={close} />
        ) : (
          <FixSnippetModal
            finding={finding}
            onClose={close}
            onResolve={() => {
              onResolve?.();
              close();
            }}
          />
        )}
      </Modal>
    </>
  );
}
