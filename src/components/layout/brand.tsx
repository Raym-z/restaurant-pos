import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface BrandProps {
  subtitle?: string;
  compact?: boolean;
  className?: string;
  onNavigate?: () => void;
}

export function Brand({ subtitle, compact = false, className, onNavigate }: BrandProps) {
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className={cn("flex min-w-0 items-center gap-3", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
        <UtensilsCrossed className="size-[18px]" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate text-sm font-semibold tracking-tight text-ink">
            {siteConfig.name}
          </span>
          {subtitle ? (
            <span className="mt-1 truncate text-[11px] font-medium text-ink-subtle">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
