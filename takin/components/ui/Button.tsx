import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "text";
type Size = "md" | "lg";

const base = "inline-flex items-center justify-center gap-2 font-semibold no-underline min-h-tap";
const variants: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  text: "navlink",
};
const sizes: Record<Size, string> = {
  md: "rounded-btn px-5 text-base",
  lg: "rounded-[14px] px-7 min-h-[58px] text-[19px] font-bold",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; children: ReactNode };

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = "primary", size = "md", className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
