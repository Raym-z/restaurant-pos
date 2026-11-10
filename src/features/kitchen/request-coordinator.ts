/**
 * Polling is the supported KDS delivery mechanism while BLK-008 (Realtime
 * delivery verification) remains open. Keep the interval inside the 30–60s
 * requirement.
 */
export const KITCHEN_POLL_INTERVAL_MS = 45_000;

export const KITCHEN_POLL_INTERVAL_SECONDS = KITCHEN_POLL_INTERVAL_MS / 1000;

export function isSupportedKitchenPollInterval(intervalMs: number): boolean {
  return intervalMs >= 30_000 && intervalMs <= 60_000;
}

export function shouldPollWhileVisible(visibilityState: string | undefined): boolean {
  return visibilityState !== "hidden";
}

/**
 * Prevents overlapping board requests. A request made while another request is
 * in flight is retained as the latest queued target; intermediate polls are
 * discarded.
 */
export class KitchenRequestQueue<T> {
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

/**
 * Per-item action guard. It prevents a duplicate submission for the same
 * ticket item before React has committed the pending state.
 */
export class KitchenActionGuard {
  private active = new Set<string>();

  get size(): number {
    return this.active.size;
  }

  has(ticketItemId: string): boolean {
    return this.active.has(ticketItemId);
  }

  tryStart(ticketItemId: string): boolean {
    if (this.active.has(ticketItemId)) {
      return false;
    }

    this.active.add(ticketItemId);
    return true;
  }

  finish(ticketItemId: string): void {
    this.active.delete(ticketItemId);
  }
}

export function kitchenBoardRequestKey(stationId: string | null, page: number): string {
  return `${stationId ?? "all"}:${page}`;
}

export function isCurrentKitchenResponse(responseKey: string, activeKey: string | null): boolean {
  return activeKey === responseKey;
}
