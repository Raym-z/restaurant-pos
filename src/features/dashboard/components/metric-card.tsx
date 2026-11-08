import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMoney, formatNumber, formatPercent } from "@/features/shared/format";
import type { DashboardMetric } from "../types";

function formatMetricValue(metric: DashboardMetric): string {
  if (metric.format === "currency" && metric.currency) {
    return formatMoney({
      amountMinor: metric.value,
      currency: metric.currency,
    });
  }
  return formatNumber(metric.value);
}

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  const change = metric.changeRatio;
  const isPositive = change !== null && change > 0;
  const isNegative = change !== null && change < 0;

  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-muted">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        {formatMetricValue(metric)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {change !== null ? (
          <Badge variant={isPositive ? "success" : isNegative ? "danger" : "neutral"}>
            <span aria-hidden="true">{isPositive ? "▲" : isNegative ? "▼" : "■"}</span>
            {formatPercent(Math.abs(change))}
          </Badge>
        ) : null}
        <span className="text-ink-subtle">{metric.comparisonLabel}</span>
      </div>
    </Card>
  );
}
