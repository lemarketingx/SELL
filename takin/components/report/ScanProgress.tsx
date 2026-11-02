"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { AREAS, AREA_LABELS } from "@/lib/areas";
import { normalizeUrl } from "@/lib/url";
import { hostOf } from "@/lib/report";
import { DemoNotice } from "./DemoNotice";

type State = "pending" | "running" | "done";

const STEP_MS = 1100;
const STATE_LABEL: Record<State, string> = { pending: "ממתין", running: "בודקים…", done: "נבדק" };

/**
 * מסך הסריקה. בשלב 2 זו סימולציה; בשלב 3 ההתקדמות תגיע מהשרת (polling / SSE).
 * בסיום — מעבר אוטומטי לדוח.
 */
export function ScanProgress({ rawUrl, reportId }: { rawUrl: string | null; reportId: string }) {
  const router = useRouter();
  const normalized = rawUrl ? normalizeUrl(rawUrl) : null;
  const valid = normalized?.ok === true;
  const [step, setStep] = useState(0); // כמה תחומים הסתיימו

  useEffect(() => {
    if (!valid) return;
    if (step >= AREAS.length) {
      const t = setTimeout(() => router.replace(`/report/${reportId}`), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, valid, router, reportId]);

  if (!valid) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-border bg-bg p-7">
        <h1 className="m-0 text-h3 font-bold text-ink">לא הצלחנו להגיע לאתר</h1>
        <p className="m-0 text-text">כדאי לוודא שהכתובת נכונה ולנסות שוב.</p>
        <Link href="/#scan" className="btn-primary inline-flex min-h-12 items-center rounded-btn px-6 font-bold">
          לנסות שוב
        </Link>
      </div>
    );
  }

  const url = normalized.url;
  const percent = Math.round((step / AREAS.length) * 100);
  const stateOf = (i: number): State => (i < step ? "done" : i === step ? "running" : "pending");
  const lastDone = step > 0 ? AREA_LABELS[AREAS[Math.min(step, AREAS.length) - 1]] : null;

  return (
    <div className="flex flex-col gap-6">
      <DemoNotice />
      <section aria-labelledby="scan-title" className="flex flex-col gap-6 rounded-panel border border-border bg-bg p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <h1 id="scan-title" className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold text-ink">
            סורקים את האתר שלכם
          </h1>
          <p dir="ltr" className="m-0 text-right text-lg font-semibold text-text">
            {hostOf(url)}
          </p>
          <p className="m-0 text-muted">זה לוקח בדרך כלל פחות מדקה.</p>
        </div>

        <div
          role="progressbar"
          aria-label="התקדמות הסריקה"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-3 overflow-hidden rounded-pill bg-border"
        >
          <div className="h-full rounded-pill bg-primary transition-[width] duration-700 ease-out" style={{ width: `${percent}%` }} />
        </div>

        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {AREAS.map((area, i) => {
            const s = stateOf(i);
            return (
              <li key={area} className={`flex items-center gap-3 rounded-[14px] px-4 py-3 ${s === "running" ? "bg-primary-tint-strong" : "bg-surface"}`}>
                <span className="flex size-9 items-center justify-center rounded-[10px] border border-border-strong bg-bg text-primary">
                  <AreaIcon area={area} size={20} />
                </span>
                <span className="flex-1 font-medium">{AREA_LABELS[area]}</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-caption font-semibold ${
                    s === "done" ? "text-sev-low" : s === "running" ? "text-primary" : "text-muted"
                  }`}
                >
                  {s === "done" && <Check aria-hidden size={16} strokeWidth={2.4} />}
                  {s === "running" && <LoaderCircle aria-hidden size={16} strokeWidth={2.2} className="animate-spin motion-reduce:animate-none" />}
                  {STATE_LABEL[s]}
                </span>
              </li>
            );
          })}
        </ol>

        <p aria-live="polite" className="sr-only">
          {step >= AREAS.length ? "הסריקה הסתיימה. עוברים לדוח." : lastDone ? `נבדק: ${lastDone}` : ""}
        </p>
      </section>
    </div>
  );
}
