"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message, className }: LoadingStateProps) {
  const t = useTranslations("states");

  return (
    <div
      role="status"
      data-slot="loading-state"
      className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}
    >
      <LoaderCircle className="size-5 animate-spin text-brand" aria-hidden="true" />
      <p className="text-sm text-ink-muted">{message ?? t("loading")}</p>
    </div>
  );
}

/**
 * Standard page-level skeleton used by route-level loading.tsx files.
 * It assumes the page container padding is provided by the application shell.
 */
export function PageLoading() {
  const t = useTranslations("states");

  return (
    <div role="status" aria-label={t("loadingPage")} className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <span className="sr-only">{t("loadingPage")}</span>
    </div>
  );
}
