"use client";

import { DoorOpen, RefreshCw, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import type { TableAvailability } from "../contracts";
import { canOperateFloor } from "../access";
import type { PosViewer, TableOverviewData } from "../types";
import { TableAvailabilityBadge } from "./pos-status-badges";

type AvailabilityFilter = TableAvailability | "all";

export function TablesScreen({ data, viewer }: { data: TableOverviewData; viewer: PosViewer }) {
  const t = useTranslations("tables");
  const tCommon = useTranslations("common");
  const format = useLocalizedFormat();
  const router = useRouter();
  const { activeBranch, organization } = useWorkspace();
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [isRefreshing, startRefresh] = useTransition();

  const visibleTables = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.tables.filter((table) => {
      const matchesQuery =
        !normalized ||
        table.label.toLowerCase().includes(normalized) ||
        (table.activeSessionId ?? "").toLowerCase().includes(normalized);
      const matchesAvailability = availability === "all" || table.availability === availability;
      return matchesQuery && matchesAvailability;
    });
  }, [availability, data.tables, query]);

  const canOperate = canOperateFloor(viewer.roles);
  const hasFilters = query.trim().length > 0 || availability !== "all";

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: activeBranch.name })}
        eyebrow={t("eyebrow")}
        actions={
          <Button
            variant="secondary"
            onClick={() => startRefresh(() => router.refresh())}
            isLoading={isRefreshing}
          >
            <RefreshCw />
            {t("refresh")}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("stats.total")}
          value={format.number(data.stats.total)}
          icon={TableProperties}
          description={t("stats.totalDescription")}
        />
        <StatCard
          label={t("stats.available")}
          value={format.number(data.stats.available)}
          icon={DoorOpen}
          description={t("stats.availableDescription")}
        />
        <StatCard
          label={t("stats.occupied")}
          value={format.number(data.stats.occupied)}
          icon={Users}
          description={t("stats.occupiedDescription")}
        />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label={t("search")}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            wrapperClassName="sm:max-w-sm"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="sr-only">{t("filterAvailability")}</span>
            <Select
              value={availability}
              onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}
              className="h-10 w-44"
            >
              <option value="all">{t("allAvailability")}</option>
              <option value="available">{t("availability.available")}</option>
              <option value="occupied">{t("availability.occupied")}</option>
            </Select>
          </label>
        </div>

        <CardContent className="p-4">
          {visibleTables.length === 0 ? (
            <EmptyState
              bordered={false}
              compact
              icon={TableProperties}
              title={hasFilters ? t("empty.filteredTitle") : t("empty.title")}
              description={hasFilters ? t("empty.filteredDescription") : t("empty.description")}
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setAvailability("all");
                    }}
                  >
                    {tCommon("clearFilters")}
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTables.map((table) => (
                <Link
                  key={table.tableId}
                  href={`/tables/${table.tableId}`}
                  className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
                        {t("tableLabel")}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-ink group-hover:text-brand">
                        {table.label}
                      </h2>
                    </div>
                    <TableAvailabilityBadge availability={table.availability} />
                  </div>

                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted">{t("capacity")}</dt>
                      <dd className="font-medium text-ink">
                        {t("seats", { count: table.capacity })}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted">{t("session")}</dt>
                      <dd className="text-right font-medium text-ink">
                        {table.activeSessionOpenedAt
                          ? format.dateTime(table.activeSessionOpenedAt, organization.timezone)
                          : t("noSession")}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="text-xs text-ink-subtle">
                      {canOperate ? t("openHint") : t("readOnlyHint")}
                    </span>
                    <Badge variant="outline">{t("viewTable")}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!canOperate ? <p className="text-sm text-ink-muted">{t("restrictedNotice")}</p> : null}
    </PageStack>
  );
}
