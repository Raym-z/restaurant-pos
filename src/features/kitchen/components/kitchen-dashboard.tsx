"use client";

import { CircleCheck, Clock, Flame, RefreshCw, ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { cn } from "@/lib/utils";
import { ActionError, ActionSuccess } from "@/features/pos/components/action-feedback";

import { canManageKitchenStations, canOperateKitchen, type KitchenItemAction } from "../access";
import {
  completeKitchenTicketItemAction,
  loadKitchenBoardAction,
  markKitchenTicketItemReadyAction,
  startKitchenTicketItemAction,
} from "../actions";
import {
  KITCHEN_ACTIVE_STATUSES,
  KITCHEN_BOARD_PAGE_SIZE,
  type KitchenBoardResponse,
  type KitchenStation,
  type KitchenTicket,
} from "../contracts";
import {
  KITCHEN_POLL_INTERVAL_MS,
  KITCHEN_POLL_INTERVAL_SECONDS,
  KitchenActionGuard,
  KitchenRequestQueue,
  isCurrentKitchenResponse,
  kitchenBoardRequestKey,
  shouldPollWhileVisible,
} from "../request-coordinator";
import { groupKitchenTickets, kitchenTicketCounts } from "../selectors";
import type { KitchenActionError, KitchenViewer } from "../types";
import { useKitchenErrorMessage } from "../use-kitchen-error-message";
import { KitchenTabs } from "./kitchen-tabs";
import { KitchenTicketCard } from "./kitchen-ticket-card";

type RefreshReason = "manual" | "poll" | "station" | "page" | "action" | "queued";

interface BoardTarget {
  stationId: string | null;
  page: number;
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function KitchenDashboard({
  initialBoard,
  stations,
  viewer,
  initialLoadedAt,
}: {
  initialBoard: KitchenBoardResponse;
  stations: KitchenStation[];
  viewer: KitchenViewer;
  initialLoadedAt: string;
}) {
  const t = useTranslations("kitchen");
  const tCommon = useTranslations("common");
  const format = useLocalizedFormat();
  const errorMessage = useKitchenErrorMessage();

  const [board, setBoard] = useState(initialBoard);
  const [stationId, setStationId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastRefreshed, setLastRefreshed] = useState(initialLoadedAt);
  const [now, setNow] = useState(initialLoadedAt);
  const [loading, setLoading] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [boardError, setBoardError] = useState<KitchenActionError | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(() => new Set());

  const targetRef = useRef<BoardTarget>({ stationId: null, page: 1 });
  const queueRef = useRef(new KitchenRequestQueue<BoardTarget>());
  const guardRef = useRef(new KitchenActionGuard());
  const mountedRef = useRef(true);
  const refreshRef = useRef<(target: BoardTarget, reason: RefreshReason) => void>(() => undefined);

  const refresh = useCallback(
    (target: BoardTarget, reason: RefreshReason) => {
      targetRef.current = target;
      if (!queueRef.current.enqueue(target)) {
        return;
      }

      const requestKey = kitchenBoardRequestKey(target.stationId, target.page);
      if (reason === "manual") {
        setManualRefreshing(true);
      } else if (reason === "poll") {
        setPolling(true);
      } else if (reason === "station" || reason === "page") {
        setLoading(true);
      }

      void (async () => {
        try {
          const result = await loadKitchenBoardAction({
            branchId: viewer.branchId,
            stationId: target.stationId,
            page: target.page,
            limit: KITCHEN_BOARD_PAGE_SIZE,
          });

          if (!mountedRef.current) {
            return;
          }

          const activeTarget = targetRef.current;
          if (
            !isCurrentKitchenResponse(
              requestKey,
              kitchenBoardRequestKey(activeTarget.stationId, activeTarget.page),
            )
          ) {
            return;
          }

          if (result.ok) {
            setBoard(result.data);
            setLastRefreshed(new Date().toISOString());
            setBoardError(null);
          } else {
            setBoardError(result.error);
          }
        } catch {
          if (mountedRef.current) {
            setBoardError({
              code: "SERVICE_UNAVAILABLE",
              message: "The kitchen board could not be refreshed.",
              retryable: true,
            });
          }
        } finally {
          const next = queueRef.current.finish();
          if (!mountedRef.current) {
            return;
          }

          setManualRefreshing(false);
          setLoading(false);
          setPolling(false);

          if (next) {
            refreshRef.current(next, "queued");
          }
        }
      })();
    },
    [viewer.branchId],
  );

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;
    const interval = window.setInterval(() => {
      if (shouldPollWhileVisible(document.visibilityState)) {
        refreshRef.current(targetRef.current, "poll");
      }
    }, KITCHEN_POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshRef.current(targetRef.current, "poll");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const grouped = useMemo(() => groupKitchenTickets(board.tickets), [board.tickets]);
  const counts = useMemo(() => kitchenTicketCounts(board.tickets), [board.tickets]);
  const canOperate = canOperateKitchen(viewer.roles);
  const canManageStations = canManageKitchenStations(viewer.roles);

  function findItem(ticketItemId: string): { ticket: KitchenTicket; name: string } | null {
    for (const ticket of board.tickets) {
      const item = ticket.items.find((entry) => entry.ticketItemId === ticketItemId);
      if (item) {
        return { ticket, name: item.name };
      }
    }

    return null;
  }

  async function handleItemAction(ticketItemId: string, action: KitchenItemAction) {
    if (!guardRef.current.tryStart(ticketItemId)) {
      return;
    }

    const item = findItem(ticketItemId);
    setFeedback(null);
    setPendingItemIds(new Set([ticketItemId]));

    try {
      const result =
        action === "start"
          ? await startKitchenTicketItemAction(ticketItemId)
          : action === "markReady"
            ? await markKitchenTicketItemReadyAction(ticketItemId)
            : await completeKitchenTicketItemAction(ticketItemId);

      if (!result.ok) {
        setFeedback({ type: "error", message: errorMessage(result.error) });
        if (result.committed) {
          setPage(1);
          refreshRef.current({ stationId, page: 1 }, "action");
        }
        return;
      }

      setFeedback({
        type: "success",
        message: t(`feedback.${action}`, { item: item?.name ?? tCommon("unknown") }),
      });
      setPage(1);
      refreshRef.current({ stationId, page: 1 }, "action");
    } finally {
      guardRef.current.finish(ticketItemId);
      if (mountedRef.current) {
        setPendingItemIds(new Set());
      }
    }
  }

  function handleStationChange(value: string) {
    const nextStationId = value === "all" ? null : value;
    setStationId(nextStationId);
    setPage(1);
    setFeedback(null);
    refreshRef.current({ stationId: nextStationId, page: 1 }, "station");
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    setFeedback(null);
    refreshRef.current({ stationId, page: nextPage }, "page");
  }

  const activeStation = stationId
    ? stations.find((station) => station.stationId === stationId)
    : null;

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: viewer.branchName })}
        eyebrow={t("eyebrow")}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setFeedback(null);
              refreshRef.current({ stationId, page }, "manual");
            }}
            isLoading={manualRefreshing}
            disabled={loading}
          >
            <RefreshCw />
            {t("board.refresh")}
          </Button>
        }
      />

      <KitchenTabs canManageStations={canManageStations} />

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1.5 sm:max-w-sm">
            <label htmlFor="kitchen-station" className="text-sm font-medium text-ink">
              {t("board.station")}
            </label>
            <Select
              id="kitchen-station"
              value={stationId ?? "all"}
              onChange={(event) => handleStationChange(event.target.value)}
              disabled={loading}
              className="h-11"
            >
              <option value="all">{t("board.allStations")}</option>
              {stations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.status === "inactive"
                    ? t("board.inactiveStationOption", { name: station.name })
                    : station.name}
                </option>
              ))}
            </Select>
            {activeStation?.status === "inactive" ? (
              <p className="text-xs text-warning">{t("board.inactiveStationNotice")}</p>
            ) : null}
          </div>

          <div className="space-y-1 text-sm text-ink-muted lg:text-right">
            <p>
              {t("board.lastRefreshed", {
                time: format.dateTime(lastRefreshed, viewer.timezone),
              })}
            </p>
            <p className="flex items-center gap-2 text-xs text-ink-subtle lg:justify-end">
              {polling ? <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              {t("board.autoRefresh", { seconds: KITCHEN_POLL_INTERVAL_SECONDS })}
            </p>
          </div>
        </div>
      </Card>

      {boardError ? (
        <div className="space-y-2">
          <div
            role="alert"
            className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning"
          >
            <p className="font-medium">{t("board.staleTitle")}</p>
            <p className="mt-0.5">
              {t("board.staleDescription", {
                time: format.dateTime(lastRefreshed, viewer.timezone),
              })}
            </p>
            <p className="mt-1 text-xs">{errorMessage(boardError)}</p>
          </div>
        </div>
      ) : null}

      {feedback?.type === "success" ? <ActionSuccess message={feedback.message} /> : null}
      {feedback?.type === "error" ? <ActionError message={feedback.message} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("board.counts.pending")}
          value={format.number(counts.pending)}
          icon={Clock}
          description={t("board.counts.pendingDescription")}
        />
        <StatCard
          label={t("board.counts.preparing")}
          value={format.number(counts.preparing)}
          icon={Flame}
          description={t("board.counts.preparingDescription")}
        />
        <StatCard
          label={t("board.counts.ready")}
          value={format.number(counts.ready)}
          icon={CircleCheck}
          description={t("board.counts.readyDescription")}
        />
      </div>

      {loading ? (
        <LoadingState
          message={t("board.loading")}
          className="rounded-xl border border-line bg-surface"
        />
      ) : counts.total === 0 ? (
        <EmptyState
          icon={ChefHat}
          title={stationId ? t("board.emptyStationTitle") : t("board.emptyTitle")}
          description={stationId ? t("board.emptyStationDescription") : t("board.emptyDescription")}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {KITCHEN_ACTIVE_STATUSES.map((status) => (
            <section
              key={status}
              aria-labelledby={`kitchen-column-${status}`}
              className={cn(
                "flex min-h-64 flex-col gap-3 rounded-xl border border-line bg-surface-muted/40 p-3",
              )}
            >
              <header className="flex items-center justify-between gap-2 px-1">
                <h2
                  id={`kitchen-column-${status}`}
                  className="text-sm font-semibold tracking-[0.12em] text-ink uppercase"
                >
                  {t(`board.counts.${status}`)}
                </h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink-muted ring-1 ring-line">
                  {format.number(counts[status])}
                </span>
              </header>

              {grouped[status].length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-sm text-ink-subtle">
                  {t("board.columnEmpty")}
                </p>
              ) : (
                grouped[status].map((ticket) => (
                  <KitchenTicketCard
                    key={ticket.ticketId}
                    ticket={ticket}
                    now={now}
                    timezone={viewer.timezone}
                    canOperate={canOperate}
                    interactive
                    pendingItemIds={pendingItemIds}
                    onItemAction={handleItemAction}
                  />
                ))
              )}
            </section>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{t("board.page", { page: format.number(page) })}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            {tCommon("previous")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!board.hasMore || loading}
          >
            {tCommon("next")}
          </Button>
        </div>
      </div>
    </PageStack>
  );
}
