import { Logo } from "./Logo";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";

const NAV = [
  { href: "/#how", label: "איך זה עובד" },
  { href: "/#areas", label: "מה בודקים" },
  { href: "/#agencies", label: "למשרדי דיגיטל" },
  { href: "/#pricing", label: "מחירים" },
  { href: "/#faq", label: "שאלות נפוצות" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav aria-label="ניווט ראשי" className="order-3 flex w-full flex-wrap gap-x-6 gap-y-1 text-base font-medium lg:order-none lg:w-auto">
          {NAV.map((item) => (
            <a key={item.href} className="navlink inline-flex min-h-tap items-center" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ScanFocusLink className="btn-primary inline-flex min-h-tap items-center rounded-btn px-5 text-base font-semibold">
            סריקה חינם
          </ScanFocusLink>
        </div>
      </div>
    </header>
  );
}
