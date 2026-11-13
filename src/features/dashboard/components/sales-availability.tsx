"use client";

import { LockKeyhole, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function SalesAvailability() {
  const t = useTranslations("dashboard.sales");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-subtle">
            <ReceiptText className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">{t("description")}</p>
          </div>
        </div>
        <Badge variant="neutral">
          <LockKeyhole aria-hidden="true" />
          {t("badge")}
        </Badge>
      </div>
      <p className="mt-3 border-t border-line pt-3 text-xs text-ink-subtle">{t("note")}</p>
    </Card>
  );
}
