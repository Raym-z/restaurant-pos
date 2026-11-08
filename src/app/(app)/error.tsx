"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("states");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        className="w-full max-w-xl"
        title={t("pageErrorTitle")}
        description={t("pageErrorDescription")}
        retryLabel={t("retry")}
        onRetry={reset}
      />
    </div>
  );
}
