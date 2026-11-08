"use client";

import { useTranslations } from "next-intl";

import type { PosActionError } from "./types";

/**
 * Maps backend application codes to localized, user-facing messages.
 * Unknown codes fall back to the backend's safe explanation.
 */
export function usePosErrorMessage() {
  const t = useTranslations("pos.errors");

  return (error: PosActionError): string => (t.has(error.code) ? t(error.code) : error.message);
}
