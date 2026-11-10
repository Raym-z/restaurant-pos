"use client";

import { CalendarClock, History } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import type { KitchenBoardResponse, KitchenStation } from "../contracts";
import {
  KITCHEN_HISTORY_MAX_RANGE_DAYS,
  type KitchenHistoryFilterErrorCode,
  type KitchenHistoryFilters,
  kitchenHistoryHref,
} from "../history-filters";
import type { KitchenActionError, KitchenViewer } from "../types";
import { useKitchenErrorMessage } from "../use-kitchen-error-message";
import { KitchenTabs } from "./kitchen-tabs";
import { KitchenTicketCard } from "./kitchen-ticket-card";

export function KitchenHistoryScreen({
  viewer,
  filters,
  defaults,
  filterError,
  board,
  loadError,
  stations,
  canManageStations,
}: {
  viewer: KitchenViewer;
  filters: KitchenHistoryFilters | null;
  defaults: { fromDate: string; toDate: string };
  filterError: KitchenHistoryFilterErrorCode | null;
  board: KitchenBoardResponse | null;
  loadError: KitchenActionError | null;
  stations: KitchenStation[];
  canManageStations: boolean;
}) {
  const t = useTranslations("kitchen.history");
  const errorMessage = useKitchenErrorMessage();
  const format = useLocalizedFormat();
  const activeFilters = filters;
  const now = new Date().toISOString();

  const previousHref =
    activeFilters && activeFilters.page > 1
      ? kitchenHistoryHref({ ...activeFilters, page: activeFilters.page - 1 })
      : null;
  const nextHref =
    activeFilters && board?.hasMore
      ? kitchenHistoryHref({ ...activeFilters, page: activeFilters.page + 1 })
      : null;

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: viewer.branchName })}
        eyebrow={t("eyebrow")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/kitchen">{t("backToBoard")}</Link>
          </Button>
        }
      />

      <KitchenTabs canManageStations={canManageStations} />

      <Card className="p-4">
        <form action="/kitchen/history" method="get" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="history-from" required>
                {t("from")}
              </Label>
              <Input
                id="history-from"
                name="from"
                type="date"
                defaultValue={activeFilters?.fromDate ?? defaults.fromDate}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-to" required>
                {t("to")}
              </Label>
              <Input
                id="history-to"
                name="to"
                type="date"
                defaultValue={activeFilters?.toDate ?? defaults.toDate}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-status">{t("status")}</Label>
              <Select
                id="history-status"
                name="status"
                defaultValue={activeFilters?.status ?? "all"}
              >
                <option value="all">{t("statusAll")}</option>
                <option value="completed">{t("statusCompleted")}</option>
                <option value="cancelled">{t("statusCancelled")}</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-station">{t("station")}</Label>
              <Select
                id="history-station"
                name="station"
                defaultValue={activeFilters?.stationId ?? ""}
              >
                <option value="">{t("allStations")}</option>
                {stations.map((station) => (
                  <option key={station.stationId} value={station.stationId}>
                    {station.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-subtle">
              {t("maxRangeNote", { days: KITCHEN_HISTORY_MAX_RANGE_DAYS })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/kitchen/history">{t("reset")}</Link>
              </Button>
              <Button type="submit">
                <CalendarClock />
                {t("apply")}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {filterError ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2 text-sm text-danger"
        >
          {t(`errors.${filterError}`)}
        </div>
      ) : null}

      {loadError ? (
        <ErrorState
          title={t("loadErrorTitle")}
          description={errorMessage(loadError)}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/kitchen/history">{t("retry")}</Link>
            </Button>
          }
        />
      ) : null}

      {!loadError && board ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">
              {t("rangeSummary", {
                from: format.dateOnly(filters?.fromDate ?? defaults.fromDate),
                to: format.dateOnly(filters?.toDate ?? defaults.toDate),
              })}
            </p>
            <p className="text-sm text-ink-muted">
              {t("resultCount", { count: board.tickets.length })}
            </p>
          </div>

          {board.tickets.length === 0 ? (
            <EmptyState
              icon={History}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {board.tickets.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.ticketId}
                  ticket={ticket}
                  now={now}
                  timezone={viewer.timezone}
                  canOperate={false}
                  interactive={false}
                  showCancellation
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {previousHref ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={previousHref}>{t("previous")}</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                {t("previous")}
              </Button>
            )}
            {nextHref ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={nextHref}>{t("next")}</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                {t("next")}
              </Button>
            )}
          </div>
        </>
      ) : null}
    </PageStack>
  );
}
