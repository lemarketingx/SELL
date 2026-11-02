import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NAV_ITEMS } from "./nav";
import { ScanFocusLink } from "@/components/ui/ScanFocusLink";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="relative mx-auto flex h-header max-w-site items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="ניווט ראשי" className="hidden lg:block">
          <ul className="m-0 flex list-none items-center gap-1 p-0">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-tap items-center rounded-btn px-3 text-[15px] font-medium text-muted no-underline transition-colors hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ScanFocusLink className="btn-primary hidden min-h-tap items-center rounded-btn px-5 text-[15px] font-semibold sm:inline-flex">
            סרקו את האתר
          </ScanFocusLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
