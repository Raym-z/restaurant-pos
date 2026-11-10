"use client";

import { useTranslations } from "next-intl";

import type { KitchenActionError } from "./types";

/** Maps backend kitchen codes to localized messages; unknown codes fall back safely. */
export function useKitchenErrorMessage() {
  const t = useTranslations("kitchen.errors");

  return (error: KitchenActionError): string => (t.has(error.code) ? t(error.code) : error.message);
}
