"use client";

import { useTranslations } from "next-intl";

import type { QueueActionError } from "./types";

/**
 * Maps backend application codes to localized, user-facing messages. Unknown
 * codes fall back to the backend's safe explanation.
 */
export function useQueueErrorMessage() {
  const t = useTranslations("queue.errors");

  return (error: QueueActionError): string => (t.has(error.code) ? t(error.code) : error.message);
}
