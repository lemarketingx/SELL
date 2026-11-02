"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronDown, Download } from "lucide-react";
import { SeverityBadge, SeverityShape } from "@/components/ui/SeverityBadge";
import { AREA_LABELS } from "@/lib/areas";
import type { Finding, Severity } from "@/lib/types";
import { FindingBody } from "./FindingBody";
import { FixLauncher } from "./FixLauncher";
import { ResolvedPill } from "./ResolvedPill";

type Filter = "all" | Severity;

const GROUPS: { severity: Severity; title: string }[] = [
  { severity: "high", title: "חמורים" },
  { severity: "mid", title: "בינוניים" },
  { severity: "low", title: "קלים" },
];

const FILTER_LABELS: Record<Filter, string> = { all: "הכול", high: "חמור", mid: "בינוני", low: "קל" };

export function FullReport({ findings }: { findings: Finding[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(findings[0] ? [findings[0].id] : []));
  const [resolved, setResolved] = useState<Set<string>>(() => new Set(findings.filter((f) => f.status === "resolved").map((f) => f.id)));

  // בהדפסה / שמירה כ-PDF: כל הקבוצות וכל הממצאים פתוחים, בלי קשר לסינון ולמצב ה-accordion.
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const activeFilter: Filter = printing ? "all" : filter;

  const count = (f: Filter) => (f === "all" ? findings.length : findings.filter((x) => x.severity === f).length);
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="סינון לפי חומרה" className="flex flex-wrap gap-2">
          {(["all", "high", "mid", "low"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`inline-flex min-h-tap cursor-pointer items-center gap-2 rounded-pill border px-4 text-base font-semibold ${
                filter === f ? "border-primary bg-primary text-white" : "border-border-strong bg-bg text-text hover:bg-surface"
              }`}
            >
              {f !== "all" && <SeverityShape severity={f} />}
              {FILTER_LABELS[f]} ({count(f)})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            flushSync(() => setPrinting(true));
            window.print();
          }}
          className="btn-ghost inline-flex min-h-tap items-center gap-2 rounded-btn px-[18px] text-base font-semibold"
        >
          <Download aria-hidden size={18} strokeWidth={1.9} />
          הורדת PDF
        </button>
      </div>

      {GROUPS.filter((g) => activeFilter === "all" || activeFilter === g.severity).map((group) => {
        const items = findings.filter((f) => f.severity === group.severity);
        if (items.length === 0) return null;
        return (
          <section key={group.severity} aria-labelledby={`group-${group.severity}`} className="flex flex-col gap-3">
            <h2 id={`group-${group.severity}`} className="m-0 flex items-center gap-2 text-xl font-bold text-ink">
              {group.title}
              <span className="text-base font-semibold text-muted">({items.length})</span>
            </h2>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {items.map((f) => {
                const isOpen = printing || openIds.has(f.id);
                const isResolved = resolved.has(f.id);
                return (
                  <li key={f.id} id={f.id} className="rounded-[20px] border border-border bg-bg">
                    <h3 className="m-0">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`${f.id}-panel`}
                        onClick={() => toggle(f.id)}
                        className="flex min-h-tap w-full cursor-pointer items-start gap-3 rounded-[20px] bg-transparent p-5 text-start sm:px-7"
                      >
                        <span className="flex flex-1 flex-col gap-2">
                          <span className="flex flex-wrap items-center gap-2 text-caption">
                            <SeverityBadge severity={f.severity} />
                            <span className="font-semibold text-muted">{AREA_LABELS[f.area]}</span>
                            {isResolved && <ResolvedPill />}
                          </span>
                          <span className="text-lg font-bold leading-[1.4] text-ink">{f.title}</span>
                        </span>
                        <ChevronDown
                          aria-hidden
                          size={22}
                          strokeWidth={2}
                          className={`mt-1 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </h3>
                    <div id={`${f.id}-panel`} role="region" aria-labelledby={`${f.id}-panel-label`} hidden={!isOpen} className="px-5 pb-6 sm:px-7">
                      <span id={`${f.id}-panel-label`} className="sr-only">
                        {f.title}
                      </span>
                      <FindingBody
                        finding={f}
                        fixAction={<FixLauncher finding={f} onResolve={() => setResolved((prev) => new Set(prev).add(f.id))} />}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
