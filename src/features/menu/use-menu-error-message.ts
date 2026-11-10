"use client";

import { useTranslations } from "next-intl";

import type { MenuActionError } from "./errors";

/**
 * Maps backend application codes to localized menu messages. Unknown codes
 * fall back to the backend's safe explanation.
 */
export function useMenuErrorMessage() {
  const t = useTranslations("menuAdmin.errors");

  return (error: MenuActionError): string => (t.has(error.code) ? t(error.code) : error.message);
}
