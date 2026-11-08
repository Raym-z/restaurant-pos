"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this information. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-danger/15 bg-danger-soft/40 text-center",
        compact ? "gap-3 px-5 py-8" : "gap-4 px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-surface text-danger ring-1 ring-danger/15",
          compact ? "size-10" : "size-12",
        )}
      >
        <TriangleAlert className={compact ? "size-5" : "size-6"} aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {onRetry || action ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <RefreshCw />
              {retryLabel}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
