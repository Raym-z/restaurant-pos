import { Card } from "@/components/ui/card";
import { formatMoney, formatNumber } from "@/features/shared/format";
import type { SalesTrendPoint } from "../types";

interface SalesTrendProps {
  points: SalesTrendPoint[];
  currency: string;
}

function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function fullDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function SalesTrend({ points, currency }: SalesTrendProps) {
  const maxRevenue = Math.max(...points.map((point) => point.revenue.amountMinor), 1);
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue.amountMinor, 0);
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Sales trend</h2>
          <p className="text-sm text-ink-muted">Last 7 days across all branches</p>
        </div>
        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-xs font-medium text-ink-subtle">Net sales</dt>
            <dd className="text-sm font-semibold text-ink">
              {formatMoney({ amountMinor: totalRevenue, currency })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-subtle">Orders</dt>
            <dd className="text-sm font-semibold text-ink">{formatNumber(totalOrders)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex h-56 gap-2 sm:gap-4">
        {points.map((point, index) => {
          const height = Math.max(4, Math.round((point.revenue.amountMinor / maxRevenue) * 100));
          const isToday = index === points.length - 1;
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
                  aria-label={`${fullDateLabel(point.date)}: ${formatMoney(
                    point.revenue,
                  )} from ${formatNumber(point.orders)} orders`}
                  title={`${fullDateLabel(point.date)} · ${formatMoney(
                    point.revenue,
                  )} · ${formatNumber(point.orders)} orders`}
                />
              </div>
              <span
                className={[
                  "text-xs font-medium",
                  isToday ? "text-brand-ink" : "text-ink-subtle",
                ].join(" ")}
              >
                {dayLabel(point.date)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
