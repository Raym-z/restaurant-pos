"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { TopSellingItem } from "../types";

export function TopSellingItems({ items }: { items: TopSellingItem[] }) {
  const t = useTranslations("dashboard.topItems");
  const format = useLocalizedFormat();

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
        <span className="text-xs text-ink-subtle">{t("today")}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li key={item.menuItemId} className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink-muted">
                {format.number(index + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                <p className="truncate text-xs text-ink-subtle">{item.categoryName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-ink">{format.money(item.revenue)}</p>
                <p className="text-xs text-ink-subtle">{t("sold", { count: item.quantitySold })}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
