"use client";

import { ListOrdered, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalizedFormat } from "@/i18n/use-localized-format";

import { isQueueReadOnly } from "../access";
import { loadQueueAction } from "../actions";
import {
  QUEUE_PAGE_SIZE,
  type QueueListRequest,
  type QueueListResponse,
  type QueueStatus,
} from "../contracts";
import {
  QUEUE_POLL_INTERVAL_MS,
  QUEUE_POLL_INTERVAL_SECONDS,
  QueueRequestQueue,
  isCurrentQueueResponse,
  queuePollTarget,
  queueRequestKey,
  shouldAutoPollQueuePage,
  shouldPollQueueWhileVisible,
} from "../request-coordinator";
import {
  deriveQueueDisplayState,
  isLiveQueueSnapshot,
  queueHasFilters,
  queueSnapshotForResult,
  queueSnapshotFromResponse,
  queueStatusCounts,
  queueVisibleStatusCounts,
  sortQueueEntriesFifo,
} from "../selectors";
import type { QueueActionError, QueueViewer } from "../types";
import { useQueueErrorMessage } from "../use-queue-error-message";
import { QueueEntryCard } from "./queue-entry-card";

type RefreshReason = "manual" | "poll" | "filter" | "page" | "queued";

interface QueueTarget {
  branchId: string;
  status: QueueStatus | null;
  search: string;
  page: number;
}

function targetToRequest(target: QueueTarget): QueueListRequest {
  return {
    branchId: target.branchId,
    status: target.status,
    search: target.search,
    page: target.page,
    limit: QUEUE_PAGE_SIZE,
  };
}

export function QueueScreen({
  initialData,
  viewer,
}: {
  initialData: QueueListResponse;
  viewer: QueueViewer;
}) {
  const t = useTranslations("queue");
  const tCommon = useTranslations("common");
  const format = useLocalizedFormat();
  const errorMessage = useQueueErrorMessage();

  const [snapshot, setSnapshot] = useState(() => queueSnapshotFromResponse(initialData, 1));
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<QueueActionError | null>(null);

  const { data, lastRefreshed, page: displayedPage } = snapshot;

  const targetRef = useRef<QueueTarget>({
    branchId: viewer.branchId,
    status: null,
    search: "",
    page: 1,
  });
  const queueRef = useRef(new QueueRequestQueue<QueueTarget>());
  const mountedRef = useRef(true);
  const refreshRef = useRef<(target: QueueTarget, reason: RefreshReason) => void>(() => undefined);

  const refresh = useCallback((target: QueueTarget, reason: RefreshReason) => {
    targetRef.current = target;

    if (!queueRef.current.enqueue(target)) {
      return;
    }

    const requestKey = queueRequestKey(targetToRequest(target));

    if (reason === "manual") {
      setManualRefreshing(true);
    } else if (reason === "poll") {
      setPolling(true);
    } else {
      setLoading(true);
    }

    void (async () => {
      try {
        const result = await loadQueueAction(targetToRequest(target));

        if (!mountedRef.current) {
          return;
        }

        if (
          !isCurrentQueueResponse(requestKey, queueRequestKey(targetToRequest(targetRef.current)))
        ) {
          return;
        }

        setSnapshot((current) => queueSnapshotForResult(current, result, target.page));

        if (result.ok) {
          setError(null);
        } else {
          setError(result.error);
        }
      } catch {
        if (mountedRef.current) {
          setError({
            code: "SERVICE_UNAVAILABLE",
            message: "The queue could not be refreshed.",
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
  }, []);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;
    const interval = window.setInterval(() => {
      if (
        shouldPollQueueWhileVisible(document.visibilityState) &&
        shouldAutoPollQueuePage(targetRef.current.page)
      ) {
        refreshRef.current(queuePollTarget(targetRef.current), "poll");
      }
    }, QUEUE_POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        shouldAutoPollQueuePage(targetRef.current.page)
      ) {
        refreshRef.current(queuePollTarget(targetRef.current), "poll");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const entries = useMemo(() => sortQueueEntriesFifo(data.entries), [data.entries]);
  const counts = useMemo(() => queueStatusCounts(entries), [entries]);
  const hasFilters = queueHasFilters({ search, status });
  const isLiveSnapshot = isLiveQueueSnapshot(snapshot);
  const visibleStatusCounts = useMemo(
    () => queueVisibleStatusCounts({ counts, status }),
    [counts, status],
  );
  const readOnly = isQueueReadOnly(viewer.roles);
  const displayState = deriveQueueDisplayState({
    entryCount: entries.length,
    isLoading: loading,
    hasError: error !== null,
  });

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const nextSearch = searchInput.trim();
    setSearch(nextSearch);
    setError(null);
    refreshRef.current(
      { branchId: viewer.branchId, status, search: nextSearch, page: 1 },
      "filter",
    );
  }

  function changeStatus(value: string) {
    if (loading) return;
    const nextStatus: QueueStatus | null =
      value === "waiting" || value === "notified" ? value : null;
    setStatus(nextStatus);
    setError(null);
    refreshRef.current(
      { branchId: viewer.branchId, status: nextStatus, search, page: 1 },
      "filter",
    );
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus(null);
    setError(null);
    refreshRef.current({ branchId: viewer.branchId, status: null, search: "", page: 1 }, "filter");
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || loading) {
      return;
    }

    setError(null);
    refreshRef.current({ branchId: viewer.branchId, status, search, page: nextPage }, "page");
  }

  const emptyAction = hasFilters ? (
    <Button variant="secondary" size="sm" onClick={clearFilters}>
      {tCommon("clearFilters")}
    </Button>
  ) : displayedPage > 1 ? (
    <Button variant="secondary" size="sm" onClick={() => changePage(1)}>
      {t("empty.backToFirst")}
    </Button>
  ) : null;

  return (
    <PageStack>
      <PageHeader
        title={t("title")}
        description={t("description", { branch: viewer.branchName })}
        eyebrow={t("eyebrow")}
        actions={
          <>
            {readOnly ? <Badge variant="outline">{t("readOnlyBadge")}</Badge> : null}
            <Button
              variant="secondary"
              onClick={() => {
                setError(null);
                refreshRef.current(
                  { branchId: viewer.branchId, status, search, page: displayedPage },
                  "manual",
                );
              }}
              isLoading={manualRefreshing}
              disabled={loading}
            >
              <RefreshCw />
              {t("refresh")}
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form onSubmit={applySearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <SearchInput
              label={t("filters.searchLabel")}
              placeholder={t("filters.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={200}
              wrapperClassName="sm:w-80"
            />
            <Button type="submit" variant="secondary" size="md" disabled={loading}>
              {t("filters.apply")}
            </Button>
            {hasFilters ? (
              <Button type="button" variant="ghost" size="md" onClick={clearFilters}>
                {tCommon("clearFilters")}
              </Button>
            ) : null}
          </form>

          <div className="space-y-3 xl:text-right">
            <Tabs value={status ?? "all"} onValueChange={changeStatus}>
              <TabsList aria-label={t("filters.statusLabel")}>
                <TabsTrigger value="all" disabled={loading}>
                  {t("filters.all")}
                </TabsTrigger>
                <TabsTrigger value="waiting" disabled={loading}>
                  {t("filters.waiting")}
                </TabsTrigger>
                <TabsTrigger value="notified" disabled={loading}>
                  {t("filters.notified")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1 text-sm text-ink-muted">
              <p className="flex flex-wrap items-center gap-2 xl:justify-end">
                <span>
                  {t("lastRefreshed", {
                    time: format.dateTime(lastRefreshed, viewer.timezone),
                  })}
                </span>
                {isLiveSnapshot ? (
                  <Badge variant="success">{t("pagination.liveBadge")}</Badge>
                ) : null}
              </p>
              <p className="flex items-center gap-2 text-xs text-ink-subtle xl:justify-end">
                {isLiveSnapshot && (polling || loading) ? (
                  <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {isLiveSnapshot
                  ? t("autoRefresh", { seconds: QUEUE_POLL_INTERVAL_SECONDS })
                  : t("pagination.autoPaused")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {readOnly ? (
        <p className="rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-ink-muted">
          {t("readOnlyNotice")}
        </p>
      ) : null}

      {!isLiveSnapshot ? (
        <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t("pagination.notLive", { page: displayedPage })}</p>
          <Button variant="secondary" size="sm" onClick={() => changePage(1)} disabled={loading}>
            {t("pagination.backToLive")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
          {hasFilters ? t("summary.filteredScope") : t("summary.activeScope")}
        </span>
        {visibleStatusCounts.map((item) => (
          <Badge key={item.status} variant={item.status === "notified" ? "warning" : "info"}>
            {item.status === "notified"
              ? t("summary.notified", { count: item.count })
              : t("summary.waiting", { count: item.count })}
          </Badge>
        ))}
        <span className="text-sm text-ink-muted">
          {t("summary.pageEntries", { count: counts.total })}
        </span>
      </div>

      {error && entries.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-warning/20 bg-warning-soft/50 px-3 py-2 text-sm text-warning"
        >
          <p className="font-medium">{t("staleTitle")}</p>
          <p className="mt-0.5">
            {t("staleDescription", {
              time: format.dateTime(lastRefreshed, viewer.timezone),
            })}
          </p>
          <p className="mt-1 text-xs">{errorMessage(error)}</p>
        </div>
      ) : null}

      {displayState === "loading" ? (
        <LoadingState message={t("loading")} className="rounded-xl border border-line bg-surface" />
      ) : displayState === "error" ? (
        <ErrorState
          title={t("errorTitle")}
          description={error ? errorMessage(error) : t("loadErrorTitle")}
          onRetry={() => {
            setError(null);
            refreshRef.current(
              { branchId: viewer.branchId, status, search, page: displayedPage },
              "filter",
            );
          }}
        />
      ) : displayState === "empty" ? (
        <EmptyState
          icon={ListOrdered}
          title={
            hasFilters
              ? t("empty.filteredTitle")
              : displayedPage > 1
                ? t("empty.pageTitle")
                : t("empty.title")
          }
          description={
            hasFilters
              ? t("empty.filteredDescription")
              : displayedPage > 1
                ? t("empty.pageDescription")
                : t("empty.description")
          }
          action={emptyAction}
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {entries.map((entry) => (
            <QueueEntryCard key={entry.entryId} entry={entry} timezone={viewer.timezone} />
          ))}
        </div>
      )}

      {displayState !== "empty" && displayState !== "error" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">{t("pagination.page", { page: displayedPage })}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => changePage(displayedPage - 1)}
              disabled={displayedPage <= 1 || loading}
            >
              {tCommon("previous")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => changePage(displayedPage + 1)}
              disabled={!data.hasMore || loading}
            >
              {tCommon("next")}
            </Button>
          </div>
        </div>
      ) : null}
    </PageStack>
  );
}
