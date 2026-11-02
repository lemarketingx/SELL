"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link2 } from "lucide-react";
import { normalizeUrl } from "@/lib/url";

type Props = {
  inputId: string;
  submitLabel?: string;
};

const ERRORS = {
  empty: "כדאי להדביק כאן את כתובת האתר שלכם, למשל www.example.co.il",
  invalid: "נראה שהכתובת לא תקינה. נסו למשל: www.example.co.il",
} as const;

/** שדה URL ב-Hero. מקבל כתובת בלי https:// ומשלים אוטומטית, ואז שולח ל-/scan?url= */
export function UrlInput({ inputId, submitLabel = "סרקו את האתר" }: Props) {
  const router = useRouter();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<keyof typeof ERRORS | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = normalizeUrl(value);
    if (!result.ok) {
      setError(result.reason);
      document.getElementById(inputId)?.focus();
      return;
    }
    setError(null);
    router.push(`/scan?url=${encodeURIComponent(result.url)}`);
  }

  return (
    <div className="flex w-full max-w-[600px] flex-col gap-2">
      <form
        action="/scan"
        method="get"
        noValidate
        onSubmit={onSubmit}
        className={`flex flex-wrap gap-2 rounded-[16px] border bg-bg p-2 shadow-float transition-colors focus-within:border-primary ${
          error ? "border-sev-high" : "border-border-strong"
        }`}
      >
        <label htmlFor={inputId} className="sr-only">
          כתובת האתר שלך
        </label>
        <div className="flex min-h-14 flex-[1_1_240px] items-center gap-2.5 px-3 text-muted">
          <Link2 aria-hidden size={22} strokeWidth={1.8} className="shrink-0" />
          <input
            id={inputId}
            name="url"
            type="text"
            inputMode="url"
            dir="ltr"
            placeholder="www.example.co.il"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-12 min-w-0 flex-1 border-0 bg-transparent text-right text-[18px] text-text placeholder:text-muted focus-visible:outline-offset-[6px]"
          />
        </div>
        <button
          type="submit"
          className="btn-primary inline-flex min-h-14 flex-[1_1_auto] items-center justify-center gap-2 rounded-[12px] px-7 text-[18px] font-bold sm:flex-[0_1_auto]"
        >
          {submitLabel}
          <ArrowLeft aria-hidden size={20} strokeWidth={2} />
        </button>
      </form>
      <p id={errorId} aria-live="polite" className="m-0 min-h-0 text-small font-medium text-sev-high">
        {error ? ERRORS[error] : ""}
      </p>
    </div>
  );
}
