"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        className="w-full max-w-xl"
        title="This page couldn't be loaded"
        description="An unexpected error interrupted the request. You can retry, or return to the dashboard if the problem continues."
        onRetry={reset}
      />
    </div>
  );
}
