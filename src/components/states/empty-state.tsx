import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
  bordered?: boolean;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  compact = false,
  bordered = true,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 py-8" : "gap-4 px-6 py-14",
        bordered && "rounded-xl border border-dashed border-line-strong bg-surface-subtle/60",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-soft text-brand",
          compact ? "size-10" : "size-12",
        )}
      >
        <Icon className={compact ? "size-5" : "size-6"} aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
