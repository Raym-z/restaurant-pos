"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { SalesTrendPoint } from "../types";

interface SalesTrendProps {
  points: SalesTrendPoint[];
  currency: string;
}

export function SalesTrend({ points, currency }: SalesTrendProps) {
  const t = useTranslations("dashboard.salesTrend");
  const format = useLocalizedFormat();
  const maxRevenue = Math.max(...points.map((point) => point.revenue.amountMinor), 1);
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue.amountMinor, 0);
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="text-sm text-ink-muted">{t("subtitle")}</p>
        </div>
        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-xs font-medium text-ink-subtle">{t("netSales")}</dt>
            <dd className="text-sm font-semibold text-ink">
              {format.currencyAmount(totalRevenue, currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-subtle">{t("orders")}</dt>
            <dd className="text-sm font-semibold text-ink">{format.number(totalOrders)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex h-56 gap-2 sm:gap-4">
        {points.map((point, index) => {
          const height = Math.max(4, Math.round((point.revenue.amountMinor / maxRevenue) * 100));
          const isToday = index === points.length - 1;
          const dateLabel = format.monthDay(point.date);
          const revenue = format.money(point.revenue);
          const orders = format.number(point.orders);
          return (
            <div key={point.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative flex h-full w-full items-end justify-center">
                <div
                  className={[
                    "w-full max-w-14 rounded-t-md transition-colors",
                    isToday ? "bg-brand" : "bg-brand-soft group-hover:bg-brand/25",
                  ].join(" ")}
                  style={{ height: `${height}%` }}
                  role="img"
                  aria-label={t("barLabel", {
                    date: dateLabel,
                    revenue,
                    orders,
                  })}
                  title={t("barTitle", {
                    date: dateLabel,
                    revenue,
                    orders,
                  })}
                />
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  isToday ? "text-brand-ink" : "text-ink-subtle",
                ].join(" ")}
              >
                {format.shortWeekday(point.date)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
