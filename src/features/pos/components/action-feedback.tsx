"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export function ActionError({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2 text-sm text-danger",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ActionSuccess({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-success/20 bg-success-soft/50 px-3 py-2 text-sm text-success",
        className,
      )}
    >
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
