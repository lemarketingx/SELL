import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
  if (variant === "dark") {
    return (
      <div className="flex items-center gap-2.5 text-white">
        <ShieldCheck aria-hidden size={28} strokeWidth={1.9} />
        <span className="text-2xl font-extrabold">תקין</span>
      </div>
    );
  }
  return (
    <Link href="/" className="flex min-h-tap items-center gap-2.5 text-ink no-underline hover:text-ink">
      <span className="flex size-10 items-center justify-center rounded-btn bg-primary text-white">
        <ShieldCheck aria-hidden size={24} strokeWidth={1.9} />
      </span>
      <span className="text-[26px] font-extrabold tracking-[-0.5px]">תקין</span>
      <span className="sr-only">· לדף הבית</span>
    </Link>
  );
}
