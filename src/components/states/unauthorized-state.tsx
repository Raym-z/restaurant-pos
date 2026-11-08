import { ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface UnauthorizedStateProps {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function UnauthorizedState({
  title = "You don't have access to this area",
  description = "Your role or branch assignment doesn't include this page. Contact an organization administrator if you believe this is a mistake.",
  action,
  className,
}: UnauthorizedStateProps) {
  return (
    <div
      data-slot="unauthorized-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-line bg-surface px-6 py-14 text-center shadow-card",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-warning-soft text-warning">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </span>
      <div className="mt-4 space-y-1.5">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
