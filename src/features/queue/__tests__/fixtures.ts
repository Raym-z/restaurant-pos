import type { QueueEntry, QueueListResponse } from "../contracts";

export function uuid(suffix: number): string {
  return `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
}

export function makeQueueEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    entryId: uuid(10),
    branchId: uuid(3),
    source: "walk_in",
    status: "waiting",
    partySize: 4,
    displayName: "Budi",
    contactPhone: "+6281234567890",
    contactPhoneMasked: false,
    joinedAt: "2026-11-12T09:00:00Z",
    notifiedAt: null,
    position: 1,
    elapsedMinutes: 12,
    ...overrides,
  };
}

export function makeQueueResponse(overrides: Partial<QueueListResponse> = {}): QueueListResponse {
  return {
    branchId: uuid(3),
    statuses: ["waiting", "notified"],
    generatedAt: "2026-11-12T09:15:00Z",
    entries: [makeQueueEntry()],
    pageSize: 50,
    hasMore: false,
    nextOffset: null,
    ...overrides,
  };
}
