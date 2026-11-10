"use client";

import { DoorOpen, PowerOff, RefreshCw, TableProperties, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import { canManageTables, canOperateFloor } from "../access";
import type { PosViewer, TableOverviewData } from "../types";
import { DeactivateTableDialog } from "./deactivate-table-dialog";
import { TableAvailabilityBadge } from "./pos-status-badges";
import { TableFormDialog } from "./table-form-dialog";
import { filterTables, type TableAvailabilityFilter } from "../table-management";

export function TablesScreen({ data, viewer }: { data: TableOverviewData; viewer: PosViewer }) {
  const t = useTranslations("tables");
  const tManage = useTranslations("tables.manage");
  const tCommon = useTranslations("common");
  const format = useLocalizedFormat();
  const router = useRouter();
  const { activeBranch, organization } = useWorkspace();
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<TableAvailabilityFilter>("all");
  const [isRefreshing, startRefresh] = useTransition();

  const visibleTables = useMemo(
    () => filterTables(data.tables, query, availability),
    [availability, data.tables, query],
  );

  const canOperate = canOperateFloor(viewer.roles);
  const canManage = canManageTables(viewer.roles);
  const hasFilters = query.trim().length > 0 || availability !== "all";

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: activeBranch.name })}
        eyebrow={t("eyebrow")}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => startRefresh(() => router.refresh())}
              isLoading={isRefreshing}
            >
              <RefreshCw />
              {t("refresh")}
            </Button>
            {canManage ? <TableFormDialog mode="create" branchId={data.branchId} /> : null}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <StatCard
          label={t("stats.inactive")}
          value={format.number(data.stats.inactive)}
          icon={PowerOff}
          description={t("stats.inactiveDescription")}
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
              onChange={(event) => setAvailability(event.target.value as TableAvailabilityFilter)}
              className="h-10 w-44"
            >
              <option value="all">{t("allAvailability")}</option>
              <option value="available">{t("availability.available")}</option>
              <option value="occupied">{t("availability.occupied")}</option>
              <option value="inactive">{t("availability.inactive")}</option>
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
                <Card key={table.tableId} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
                          {t("tableLabel")}
                        </p>
                        <Link
                          href={`/tables/${table.tableId}`}
                          className="mt-1 block truncate text-lg font-semibold tracking-tight text-ink hover:text-brand focus-visible:underline focus-visible:outline-none"
                        >
                          {table.label}
                        </Link>
                      </div>
                      <TableAvailabilityBadge availability={table.availability} />
                    </div>

                    <dl className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-ink-muted">{t("capacity")}</dt>
                        <dd className="font-medium text-ink">
                          {t("seats", { count: table.capacity })}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-ink-muted">{t("sessionOpened")}</dt>
                        <dd className="text-right font-medium text-ink">
                          {table.activeSessionOpenedAt
                            ? format.dateTime(table.activeSessionOpenedAt, organization.timezone)
                            : t("noSession")}
                        </dd>
                      </div>
                      {table.status === "inactive" && table.deactivatedAt ? (
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-ink-muted">{tManage("deactivatedLabel")}</dt>
                          <dd className="text-right font-medium text-ink">
                            {format.dateTime(table.deactivatedAt, organization.timezone)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/tables/${table.tableId}`}>{t("viewTable")}</Link>
                      </Button>
                      {canManage ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <TableFormDialog mode="edit" branchId={data.branchId} table={table} />
                          {table.status === "active" ? (
                            <DeactivateTableDialog table={table} />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-subtle">{t("readOnlyHint")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canManage && data.stats.inactive > 0 ? (
        <p className="text-sm text-ink-muted">{tManage("reactivationUnavailable")}</p>
      ) : null}
      {!canManage ? <p className="text-sm text-ink-muted">{tManage("restrictedNotice")}</p> : null}
      {!canOperate ? <p className="text-sm text-ink-muted">{t("restrictedNotice")}</p> : null}
    </PageStack>
  );
}
