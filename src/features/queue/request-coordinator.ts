import type { QueueListRequest } from "./contracts";

/**
 * The queue polls at 45 seconds, matching the established KDS fallback and
 * remaining inside the approved 30–45 second interval.
 */
export const QUEUE_POLL_INTERVAL_MS = 45_000;

export const QUEUE_POLL_INTERVAL_SECONDS = QUEUE_POLL_INTERVAL_MS / 1000;

export function isSupportedQueuePollInterval(intervalMs: number): boolean {
  return intervalMs >= 30_000 && intervalMs <= 45_000;
}

export function shouldPollQueueWhileVisible(visibilityState: string | undefined): boolean {
  return visibilityState !== "hidden";
}

export interface QueuePageTarget {
  page: number;
}

/**
 * Offset pages are not a consistent cross-request snapshot. Automatic polling
 * therefore always refetches offset 0 (page 1) and replaces the live board.
 * Later pages are explicit user navigation and pause automatic polling rather
 * than being silently replaced or renumbered.
 */
export function queuePollTarget<T extends QueuePageTarget>(target: T): T {
  return { ...target, page: 1 };
}

export function shouldAutoPollQueuePage(page: number): boolean {
  return page === 1;
}

/**
 * Prevents overlapping queue requests. A request made while another request is
 * in flight is retained as the latest queued target; intermediate polls are
 * discarded.
 */
export class QueueRequestQueue<T> {
  private inFlight = false;
  private queued: T | null = null;

  get busy(): boolean {
    return this.inFlight;
  }

  get queuedTarget(): T | null {
    return this.queued;
  }

  enqueue(target: T): boolean {
    if (this.inFlight) {
      this.queued = target;
      return false;
    }

    this.inFlight = true;
    return true;
  }

  finish(): T | null {
    this.inFlight = false;
    const next = this.queued;
    this.queued = null;
    return next;
  }
}

/** Includes branch, filter, search, and page so stale responses are discarded. */
export function queueRequestKey(request: QueueListRequest): string {
  const search = request.search?.trim() ?? "";
  return [
    request.branchId,
    request.status ?? "all",
    search.length > 0 ? search : "",
    String(request.page ?? 1),
  ].join("|");
}

export function isCurrentQueueResponse(responseKey: string, activeKey: string | null): boolean {
  return activeKey === responseKey;
}
