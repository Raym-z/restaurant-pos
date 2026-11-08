import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "./badge";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

interface StatCardTrend {
  value: string;
  direction: "up" | "down" | "neutral";
  label?: string;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  description?: React.ReactNode;
  trend?: StatCardTrend;
  isLoading?: boolean;
  className?: string;
}

const trendConfig = {
  up: { icon: ArrowUpRight, variant: "success" as const },
  down: { icon: ArrowDownRight, variant: "danger" as const },
  neutral: { icon: Minus, variant: "neutral" as const },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  isLoading = false,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendConfig[trend.direction].icon : null;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {Icon ? (
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      )}
      {trend || description ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {trend ? (
            <Badge variant={trendConfig[trend.direction].variant}>
              {TrendIcon ? <TrendIcon aria-hidden="true" /> : null}
              {trend.value}
            </Badge>
          ) : null}
          {trend?.label ? <span className="text-xs text-ink-subtle">{trend.label}</span> : null}
          {description ? <span className="text-xs text-ink-muted">{description}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}
