"use client";

import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";

export function MenuReadOnlyNotice() {
  const t = useTranslations("menuAdmin");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-subtle px-4 py-3 text-sm">
      <LockKeyhole className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <div>
        <p className="font-medium text-ink">{t("readOnlyTitle")}</p>
        <p className="mt-0.5 text-ink-muted">{t("readOnlyDescription")}</p>
      </div>
    </div>
  );
}
