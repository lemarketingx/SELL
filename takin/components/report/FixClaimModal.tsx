"use client";

import { useState } from "react";
import { Copy, Wrench } from "lucide-react";
import { ModalHeader } from "@/components/ui/Modal";
import { useCopy } from "@/components/ui/useCopy";
import { fixCopyFor } from "@/content/fix-copy";
import { AREA_LABELS } from "@/lib/areas";
import type { Finding } from "@/lib/types";

type Props = { finding: Finding; onClose: () => void };

export function FixClaimModal({ finding, onClose }: Props) {
  const copyText = fixCopyFor(finding.ruleId, finding.fix.summary);
  const alternatives = finding.fix.alternatives ?? [];
  const [picked, setPicked] = useState(0);
  const { copied, copy, reset } = useCopy();
  const titleId = `claim-title-${finding.id}`;
  const before = finding.fix.before ?? finding.evidence.quote;

  return (
    <>
      <ModalHeader
        id={titleId}
        onClose={onClose}
        title={copyText.title}
        eyebrow={
          <>
            <Wrench aria-hidden size={16} strokeWidth={1.9} />
            תקן לי · {AREA_LABELS[finding.area]}
          </>
        }
      />
      <div className="flex flex-col gap-5 px-5 py-6 sm:px-7">
        <figure className="m-0 flex flex-col gap-1.5 rounded-[18px] border border-sev-high-border bg-sev-high-bg px-[18px] py-4">
          <figcaption className="flex items-center gap-2 text-[15px] font-bold text-sev-high">
            <span aria-hidden className="size-[9px] rounded-[2px] bg-sev-high" />
            מה כתוב היום · {finding.evidence.location}
          </figcaption>
          <blockquote className="m-0 text-xl font-semibold text-ink">&quot;{before}&quot;</blockquote>
          {copyText.why && <p className="m-0 text-[15px] text-muted">{copyText.why}</p>}
        </figure>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 text-lg font-bold text-ink">בחרו ניסוח חלופי</legend>
          {alternatives.map((alt, i) => {
            const selected = i === picked;
            return (
              <label
                key={alt.tag}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl px-[18px] py-4 ${
                  selected ? "border-2 border-primary bg-primary-tint-strong" : "border border-border-strong bg-bg"
                }`}
              >
                <input
                  type="radio"
                  name={`claim-alt-${finding.id}`}
                  checked={selected}
                  onChange={() => {
                    setPicked(i);
                    reset();
                  }}
                  className="mt-[3px] size-[22px] shrink-0 accent-primary"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-caption font-bold text-primary">{alt.tag}</span>
                  <span className="text-lg font-semibold text-ink">{alt.text}</span>
                  <span className="text-[15px] text-muted">{alt.note}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <p aria-live="polite" className="m-0 min-h-6 text-[15px] font-semibold text-primary">
          {copied ? copyText.copiedMessage : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border px-5 pb-6 pt-[18px] sm:px-7">
        <button type="button" onClick={onClose} className="btn-ghost inline-flex min-h-12 items-center rounded-btn px-5 font-semibold">
          אחר כך
        </button>
        <button
          type="button"
          onClick={() => alternatives[picked] && copy(alternatives[picked].text)}
          className="btn-primary inline-flex min-h-12 items-center gap-2 rounded-btn px-[22px] text-[17px] font-bold"
        >
          <Copy aria-hidden size={18} strokeWidth={1.9} />
          {copied ? "הועתק" : "העתק את הניסוח"}
        </button>
      </div>
    </>
  );
}
