"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { AreaIcon } from "@/components/ui/AreaIcon";
import { AREAS, AREA_LABELS } from "@/lib/areas";
import { normalizeUrl } from "@/lib/url";
import { hostOf } from "@/lib/report";
import type { Area } from "@/lib/types";

type AreaState = "pending" | "running" | "done";
const STATE_LABEL: Record<AreaState, string> = { pending: "ממתין", running: "בודקים…", done: "נבדק" };
const INVALID = "נראה שהכתובת לא תקינה. כדאי לוודא שהכתובת נכונה ולנסות שוב.";

/** מסך הסריקה: שולח את הכתובת לשרת וקורא התקדמות אמיתית (זרם NDJSON). בסיום — מעבר אוטומטי לדוח. */
export function ScanProgress({ rawUrl }: { rawUrl: string | null }) {
  const router = useRouter();
  const normalized = rawUrl ? normalizeUrl(rawUrl) : null;
  const url = normalized?.ok ? normalized.url : null;
  const [pages, setPages] = useState(0);
  const [areas, setAreas] = useState<Record<Area, AreaState>>({ spam: "pending", privacy: "pending", accessibility: "pending", consumer: "pending" });
  const [error, setError] = useState<string | null>(url ? null : INVALID);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // אין דגל "כבר התחיל": במצב Strict האפקט רץ, מתבטל (abort) ורץ שוב — והבקשה השנייה היא זו שממשיכה.
    if (!url) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/scans", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? "משהו השתבש בסריקה. נסו שוב בעוד כמה דקות.");
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const e = JSON.parse(line) as
              | { type: "pages"; count: number }
              | { type: "area"; area: Area; state: AreaState }
              | { type: "done"; id: string }
              | { type: "error"; message: string };
            if (e.type === "pages") setPages(e.count);
            if (e.type === "area") setAreas((prev) => ({ ...prev, [e.area]: e.state }));
            if (e.type === "error") setError(e.message);
            if (e.type === "done") {
              setFinished(true);
              setTimeout(() => router.replace(`/report/${e.id}`), 700);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("לא הצלחנו להשלים את הסריקה. כדאי לבדוק את החיבור לאינטרנט ולנסות שוב.");
      }
    })();

    return () => ctrl.abort();
  }, [url, router]);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-panel border border-border bg-bg p-7">
        <h1 className="m-0 text-h3 font-bold text-ink">לא הצלחנו לסרוק את האתר</h1>
        <p role="alert" className="m-0 text-text">
          {error}
        </p>
        <Link href="/#scan" className="btn-primary inline-flex min-h-12 items-center rounded-btn px-6 font-bold">
          לנסות שוב
        </Link>
      </div>
    );
  }

  const doneCount = AREAS.filter((a) => areas[a] === "done").length;
  // עד שהדפים נאספו, הפס מתקדם לפי מספר הדפים (עד 60%); אחר כך לפי התחומים שנבדקו.
  const percent = finished ? 100 : doneCount ? 60 + doneCount * 10 : Math.min(55, pages * 8);
  const collecting = doneCount === 0;

  return (
    <section aria-labelledby="scan-title" className="flex flex-col gap-6 rounded-panel border border-border bg-bg p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 id="scan-title" className="m-0 text-[clamp(24px,3vw,32px)] font-extrabold text-ink">
          סורקים את האתר שלכם
        </h1>
        <p dir="ltr" className="m-0 text-right text-lg font-semibold text-text">
          {url ? hostOf(url) : ""}
        </p>
        <p className="m-0 text-muted">{collecting ? (pages ? `קוראים את האתר: ${pages} עמודים עד עכשיו` : "מתחברים לאתר…") : "זה לוקח בדרך כלל פחות מדקה."}</p>
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
        {AREAS.map((area) => {
          const s = areas[area];
          return (
            <li key={area} className={`flex items-center gap-3 rounded-[14px] px-4 py-3 ${s === "running" ? "bg-primary-tint-strong" : "bg-surface"}`}>
              <span className="flex size-9 items-center justify-center rounded-[10px] border border-border-strong bg-bg text-primary">
                <AreaIcon area={area} size={20} />
              </span>
              <span className="flex-1 font-medium">{AREA_LABELS[area]}</span>
              <span className={`inline-flex items-center gap-1.5 text-caption font-semibold ${s === "done" ? "text-sev-low" : s === "running" ? "text-primary" : "text-muted"}`}>
                {s === "done" && <Check aria-hidden size={16} strokeWidth={2.4} />}
                {s === "running" && <LoaderCircle aria-hidden size={16} strokeWidth={2.2} className="animate-spin motion-reduce:animate-none" />}
                {STATE_LABEL[s]}
              </span>
            </li>
          );
        })}
      </ol>

      <p aria-live="polite" className="sr-only">
        {finished ? "הסריקה הסתיימה. עוברים לדוח." : doneCount ? `נבדקו ${doneCount} מתוך 4 תחומים` : pages ? `נקראו ${pages} עמודים` : ""}
      </p>
    </section>
  );
}
