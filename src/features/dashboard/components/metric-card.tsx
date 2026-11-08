"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

import { useLocalizedFormat } from "@/i18n/use-localized-format";
import type { DashboardMetric } from "../types";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const t = useTranslations("dashboard");
  const format = useLocalizedFormat();
  const change = metric.changeRatio;
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;
  const value =
    metric.format === "currency" && metric.currency
      ? format.currencyAmount(metric.value, metric.currency)
      : format.number(metric.value);
  const comparison = t(`comparison.${metric.comparison}`, {
    count: metric.comparisonCount ?? 0,
  });

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-muted">{t(`metrics.${metric.id}`)}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {change !== null ? (
          <Badge variant={isPositive ? "success" : isNegative ? "danger" : "neutral"}>
            <span aria-hidden="true">{isPositive ? "▲" : isNegative ? "▼" : "■"}</span>
            {format.percent(Math.abs(change))}
          </Badge>
        ) : null}
        <span className="text-ink-subtle">{comparison}</span>
      </div>
    </Card>
  );
}
