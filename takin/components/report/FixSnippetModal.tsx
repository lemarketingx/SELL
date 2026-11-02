"use client";

import { Check, Copy, Info, Wrench } from "lucide-react";
import { ModalHeader } from "@/components/ui/Modal";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { useCopy } from "@/components/ui/useCopy";
import { fixCopyFor } from "@/content/fix-copy";
import { AREA_LABELS } from "@/lib/areas";
import type { Finding } from "@/lib/types";

function FormPreview({ withConsent }: { withConsent: boolean }) {
  return (
    <div aria-hidden className="flex flex-col gap-2 rounded-btn border border-border bg-bg p-3.5 text-[15px]">
      <span className="text-caption text-muted">שם מלא</span>
      <span className="h-[34px] rounded-lg border border-border-strong" />
      <span className="text-caption text-muted">טלפון</span>
      <span className="h-[34px] rounded-lg border border-border-strong" />
      {withConsent && (
        <span className="flex items-start gap-2 rounded-lg bg-primary-tint p-2 text-caption text-text">
          <span className="mt-0.5 size-[18px] shrink-0 rounded border-2 border-primary bg-bg" />
          אני מאשר/ת לקבל מ[שם העסק] עדכונים ומבצעים במסרונים, בוואטסאפ ובמייל. אפשר להסיר את ההרשמה בכל עת.
        </span>
      )}
      <span className="mt-1 self-start rounded-lg bg-text px-3.5 py-1.5 text-caption text-white">שליחה</span>
    </div>
  );
}

type Props = { finding: Finding; onClose: () => void; onResolve: () => void };

export function FixSnippetModal({ finding, onClose, onResolve }: Props) {
  const copyText = fixCopyFor(finding.ruleId, finding.fix.summary);
  const { copied, copy } = useCopy();
  const snippet = finding.fix.snippet ?? "";
  const mailBody = `שלום,\n\nבסריקה של האתר עלה שכדאי לטפל בזה: ${finding.title}\n\n${snippet}\n\nתודה!`;
  const titleId = `fix-title-${finding.id}`;

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
      <div className="flex flex-col gap-[22px] px-5 py-6 sm:px-7">
        {copyText.formPreview && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
            <figure className="m-0 flex flex-col gap-2.5 rounded-[18px] border border-border bg-surface p-4">
              <figcaption className="flex items-center gap-2 text-[15px] font-bold text-sev-high">
                <span aria-hidden className="size-[9px] rounded-full bg-sev-high" />
                לפני
              </figcaption>
              <FormPreview withConsent={false} />
            </figure>
            <figure className="m-0 flex flex-col gap-2.5 rounded-[18px] border-[1.5px] border-primary bg-primary-tint-strong p-4">
              <figcaption className="flex items-center gap-2 text-[15px] font-bold text-primary">
                <Check aria-hidden size={16} strokeWidth={2.6} />
                אחרי
              </figcaption>
              <FormPreview withConsent />
            </figure>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h3 className="m-0 text-lg font-bold text-ink">{copyText.codeHeading ?? "קוד מוכן להעתקה"}</h3>
            <button
              type="button"
              onClick={() => copy(snippet)}
              className="btn-primary inline-flex min-h-tap items-center gap-2 rounded-btn px-[18px] text-base font-bold"
            >
              {copied ? <Check aria-hidden size={18} strokeWidth={2.6} /> : <Copy aria-hidden size={18} strokeWidth={1.9} />}
              {copied ? "הועתק" : "העתק"}
            </button>
          </div>
          <CodeBlock code={snippet} />
          <p aria-live="polite" className="m-0 min-h-6 text-[15px] font-semibold text-primary">
            {copied ? copyText.copiedMessage : ""}
          </p>
        </div>

        {finding.fix.note && (
          <div className="flex items-start gap-2.5 rounded-[14px] bg-sev-mid-note-bg px-4 py-3.5 text-base text-text">
            <Info aria-hidden size={20} strokeWidth={1.9} className="mt-[3px] shrink-0 text-sev-mid" />
            <p className="m-0">שימו לב: {finding.fix.note}</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border px-5 pb-6 pt-[18px] sm:px-7">
        <a
          href={`mailto:?subject=${encodeURIComponent(`תיקון לאתר: ${copyText.title}`)}&body=${encodeURIComponent(mailBody)}`}
          className="inline-flex min-h-tap items-center text-base font-semibold"
        >
          שליחה לבונה האתר במייל
        </a>
        <div className="flex gap-2.5">
          <button type="button" onClick={onClose} className="btn-ghost inline-flex min-h-12 items-center rounded-btn px-5 font-semibold">
            אחר כך
          </button>
          <button type="button" onClick={onResolve} className="btn-primary inline-flex min-h-12 items-center rounded-btn px-5 font-bold">
            סימנתי כמטופל
          </button>
        </div>
      </div>
    </>
  );
}
