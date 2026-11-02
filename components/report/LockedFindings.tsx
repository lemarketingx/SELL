import Link from "next/link";
import { Lock } from "lucide-react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { LockedFinding } from "@/lib/report";

/**
 * הממצאים הנעולים בדוח החינמי. השרת שולח רק כותרת וחומרה.
 * הרשימה המטושטשת מוסתרת מקוראי מסך; הכרטיס שמעליה מסביר במילים מה נעול.
 */
export function LockedFindings({ items, unlockHref, paywall }: { items: LockedFinding[]; unlockHref: string; paywall: boolean }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="locked-title" className="relative">
      <ul aria-hidden className="m-0 flex list-none select-none flex-col gap-3 p-0 blur-[5px]">
        {items.map((f) => (
          <li key={f.id} className="flex flex-col gap-2 rounded-[20px] border border-border bg-bg p-5">
            <div>
              <SeverityBadge severity={f.severity} />
            </div>
            <span className="text-lg font-bold text-ink">{f.title}</span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex w-full max-w-[460px] flex-col items-center gap-4 rounded-panel border border-border-strong bg-bg p-7 text-center shadow-float">
          <span className="flex size-14 items-center justify-center rounded-icon bg-primary-tint text-primary">
            <Lock aria-hidden size={26} strokeWidth={1.8} />
          </span>
          <h2 id="locked-title" className="m-0 text-h3 font-bold text-ink">
            עוד {items.length} ממצאים מחכים בדוח המלא
          </h2>
          <p className="m-0 text-muted">
            כל ממצא עם הסבר מלא ותיקון מוכן, ודוח להורדה כ-PDF.
            {!paywall && " בתקופת ההרצה הדוח המלא פתוח בחינם."}
          </p>
          <Link href={unlockHref} className="btn-primary inline-flex min-h-12 items-center rounded-btn px-6 text-[17px] font-bold">
            {paywall ? "פתח את הדוח המלא · 79 ₪" : "פתח את הדוח המלא"}
          </Link>
        </div>
      </div>
    </section>
  );
}
