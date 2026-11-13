"use client";

import { CalendarDays, MapPin, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import {
  DASHBOARD_RANGE_PRESETS,
  type DashboardData,
  type DashboardRangePreset,
  type DashboardViewer,
} from "../types";

export function DashboardFilters({
  data,
  viewer,
}: {
  data: DashboardData;
  viewer: DashboardViewer;
}) {
  const t = useTranslations("dashboard.filters");
  const format = useLocalizedFormat();
  const router = useRouter();
  const { activeBranch, setActiveBranch } = useWorkspace();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fromLabel = format.dateOnly(`${data.range.fromLocalDate}T00:00:00Z`, "UTC");
  const toLabel = format.dateOnly(`${data.range.toLocalDate}T00:00:00Z`, "UTC");
  const rangeLabel =
    fromLabel === toLabel
      ? t("singleDay", { date: fromLabel })
      : t("range", { from: fromLabel, to: toLabel });

  function handleRangeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as DashboardRangePreset;
    if (next === data.range.preset) {
      return;
    }

    setError(null);
    startTransition(() => {
      router.replace(`/dashboard?range=${next}`, { scroll: false });
    });
  }

  function handleBranchChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === activeBranch.id) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await setActiveBranch(next);
      if (!result.ok) {
        setError(t("branchSwitchFailed"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-ink-subtle" aria-hidden="true" />
            {t("rangeLabel")}
          </span>
          <Select
            value={data.range.preset}
            onChange={handleRangeChange}
            disabled={isPending}
            className="h-9 w-full sm:w-44"
          >
            {DASHBOARD_RANGE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {t(`ranges.${preset}`)}
              </option>
            ))}
          </Select>
        </label>

        {viewer.branches.length > 1 ? (
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-ink-subtle" aria-hidden="true" />
              {t("branchLabel")}
            </span>
            <Select
              value={activeBranch.id}
              onChange={handleBranchChange}
              disabled={isPending}
              className="h-9 w-full sm:w-56"
            >
              {viewer.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <div className="text-xs text-ink-muted">
          <p className="font-medium text-ink">{rangeLabel}</p>
          <p className="mt-0.5">
            {t("timezone", { timezone: activeBranch.timezone })} ·{" "}
            {t("asOf", { date: format.dateTime(data.asOf, activeBranch.timezone) })}
          </p>
          {error ? (
            <p role="alert" className="mt-1 text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => startTransition(() => router.refresh())}
          isLoading={isPending}
        >
          <RefreshCw />
          {t("refresh")}
        </Button>
      </div>
    </Card>
  );
}
