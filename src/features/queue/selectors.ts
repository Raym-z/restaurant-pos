import type { QueueEntry, QueueListResponse, QueueStatus } from "./contracts";
import type { QueueLoadResult } from "./types";

export type QueueDisplayState = "loading" | "error" | "empty" | "stale" | "ready";

export interface QueueStatusCounts {
  waiting: number;
  notified: number;
  total: number;
}

export interface QueueSnapshot {
  data: QueueListResponse;
  lastRefreshed: string;
  /** The offset page represented by `data`, not the page merely requested. */
  page: number;
}

export interface QueueVisibleStatusCount {
  status: QueueStatus;
  count: number;
}

/**
 * `generatedAt` is the backend's authoritative snapshot time for the response.
 * Staleness and snapshot display must use it, never the browser or server clock.
 * The page travels with the response so shifted rows are never labelled as the
 * page the user requested but did not successfully load.
 */
export function queueSnapshotFromResponse(
  response: QueueListResponse,
  page: number,
): QueueSnapshot {
  return { data: response, lastRefreshed: response.generatedAt, page };
}

/**
 * Applies a load outcome to the displayed snapshot. Success replaces data,
 * timestamp, and page together; failure keeps the last successful snapshot so
 * stale rows cannot be relabelled as the newly requested page.
 */
export function queueSnapshotForResult(
  current: QueueSnapshot,
  result: QueueLoadResult<QueueListResponse>,
  page: number,
): QueueSnapshot {
  return result.ok ? queueSnapshotFromResponse(result.data, page) : current;
}

/** True only when the displayed rows are the live offset-0 queue page. */
export function isLiveQueueSnapshot(snapshot: QueueSnapshot): boolean {
  return snapshot.page === 1;
}

function instantMs(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Defensive display ordering only. The backend already returns FIFO order; the
 * UI preserves the backend-provided `position` and never derives a new one from
 * the visible page.
 */
export function sortQueueEntriesFifo(entries: readonly QueueEntry[]): QueueEntry[] {
  return [...entries].sort((left, right) => {
    const timeDelta = instantMs(left.joinedAt) - instantMs(right.joinedAt);
    if (timeDelta !== 0) return timeDelta;
    return left.entryId < right.entryId ? -1 : left.entryId > right.entryId ? 1 : 0;
  });
}

export function queueStatusCounts(entries: readonly QueueEntry[]): QueueStatusCounts {
  const counts: QueueStatusCounts = { waiting: 0, notified: 0, total: 0 };

  for (const entry of entries) {
    counts[entry.status] += 1;
    counts.total += 1;
  }

  return counts;
}

/**
 * Status badges describe the current page under the active filters; they are
 * never whole-queue totals. When a status filter is active the other status is
 * excluded from the query, so it is omitted instead of rendered as a
 * misleading zero.
 */
export function queueVisibleStatusCounts({
  counts,
  status,
}: {
  counts: QueueStatusCounts;
  status: QueueStatus | null;
}): QueueVisibleStatusCount[] {
  if (status !== null) {
    return [{ status, count: counts[status] }];
  }

  return [
    { status: "waiting", count: counts.waiting },
    { status: "notified", count: counts.notified },
  ];
}

export function queueHasFilters({
  search,
  status,
}: {
  search: string;
  status: QueueStatus | null;
}): boolean {
  return search.trim().length > 0 || status !== null;
}

/**
 * Single source for the screen's primary state. A failed refresh with existing
 * rows is "stale" so the last successful board remains visible.
 */
export function deriveQueueDisplayState({
  entryCount,
  isLoading,
  hasError,
}: {
  entryCount: number;
  isLoading: boolean;
  hasError: boolean;
}): QueueDisplayState {
  if (entryCount === 0 && isLoading) return "loading";
  if (entryCount === 0 && hasError) return "error";
  if (entryCount === 0) return "empty";
  if (hasError) return "stale";
  return "ready";
}
