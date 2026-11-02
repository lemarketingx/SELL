import Link from "next/link";
import { Logo } from "./Logo";
import { Disclaimer } from "@/components/ui/Disclaimer";

const LINKS = [
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/cancellation", label: "מדיניות ביטולים" },
  { href: "/accessibility", label: "הצהרת נגישות" },
  { href: "/contact", label: "צור קשר" },
];

export function SiteFooter() {
  return (
    <footer className="no-print bg-ink px-4 pb-10 pt-14 text-on-dark-muted sm:px-6">
      <div className="mx-auto flex max-w-site flex-col gap-8">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex max-w-[360px] flex-col gap-2.5">
            <Logo variant="dark" />
            <p className="m-0 text-base">סורק אתרים לעסקים קטנים ומסביר סיכונים משפטיים אפשריים בעברית פשוטה.</p>
          </div>
          <nav aria-label="קישורים בתחתית" className="flex flex-wrap gap-x-7 gap-y-1 text-base">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex min-h-tap items-center text-white underline decoration-white/40 underline-offset-4 hover:text-on-dark-accent hover:decoration-current">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <Disclaimer tone="dark" />
        <div className="text-caption">© 2026 תקין</div>
      </div>
    </footer>
  );
}
