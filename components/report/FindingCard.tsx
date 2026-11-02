"use client";

import { useState } from "react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { AREA_LABELS } from "@/lib/areas";
import type { Finding } from "@/lib/types";
import { FindingBody } from "./FindingBody";
import { FixLauncher } from "./FixLauncher";
import { ResolvedPill } from "./ResolvedPill";

export function FindingCard({ finding }: { finding: Finding }) {
  const [resolved, setResolved] = useState(finding.status === "resolved");
  return (
    <article id={finding.id} aria-labelledby={`${finding.id}-title`} className="flex flex-col gap-4 rounded-[20px] border border-border bg-bg p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2 text-caption">
        <SeverityBadge severity={finding.severity} />
        <span className="font-semibold text-muted">{AREA_LABELS[finding.area]}</span>
        {resolved && <ResolvedPill />}
      </div>
      <h3 id={`${finding.id}-title`} className="m-0 text-xl font-bold leading-[1.4] text-ink">
        {finding.title}
      </h3>
      <FindingBody finding={finding} fixAction={<FixLauncher finding={finding} onResolve={() => setResolved(true)} />} />
    </article>
  );
}
