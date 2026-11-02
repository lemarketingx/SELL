import { Accessibility, Lock, Mail, Tag, type LucideProps } from "lucide-react";
import type { Area } from "@/lib/types";

const icons = { spam: Mail, privacy: Lock, accessibility: Accessibility, consumer: Tag } as const;

export function AreaIcon({ area, ...props }: { area: Area } & LucideProps) {
  const Icon = icons[area];
  return <Icon aria-hidden strokeWidth={1.8} {...props} />;
}
