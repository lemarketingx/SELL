import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  if (variant === "dark") {
    return (
      <div className="flex items-center gap-2.5 text-white">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-white/10">
          <ShieldCheck aria-hidden size={22} strokeWidth={1.9} />
        </span>
        <span className="text-[22px] font-extrabold tracking-[-0.5px]">תקין</span>
      </div>
    );
  }
  return (
    <Link href="/" className="flex min-h-tap items-center gap-2.5 text-ink no-underline hover:text-ink">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-white shadow-card">
        <ShieldCheck aria-hidden size={22} strokeWidth={1.9} />
      </span>
      <span className="text-[24px] font-extrabold tracking-[-0.5px]">תקין</span>
      <span className="sr-only">· לדף הבית</span>
    </Link>
  );
}
