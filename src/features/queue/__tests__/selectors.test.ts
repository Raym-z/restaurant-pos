import assert from "node:assert/strict";
import { test } from "node:test";

import {
  deriveQueueDisplayState,
  isLiveQueueSnapshot,
  queueHasFilters,
  queueSnapshotFromResponse,
  queueStatusCounts,
  queueVisibleStatusCounts,
  sortQueueEntriesFifo,
} from "../selectors";
import { makeQueueEntry, makeQueueResponse, uuid } from "./fixtures";

test("FIFO display order uses joinedAt then entryId without recalculating position", () => {
  const entries = [
    makeQueueEntry({ entryId: uuid(3), joinedAt: "2026-11-12T09:02:00Z", position: 9 }),
    makeQueueEntry({ entryId: uuid(2), joinedAt: "2026-11-12T09:01:00Z", position: 7 }),
    makeQueueEntry({ entryId: uuid(1), joinedAt: "2026-11-12T09:01:00Z", position: 6 }),
  ];

  const sorted = sortQueueEntriesFifo(entries);

  assert.deepEqual(
    sorted.map((entry) => entry.entryId),
    [uuid(1), uuid(2), uuid(3)],
  );
  assert.deepEqual(
    sorted.map((entry) => entry.position),
    [6, 7, 9],
  );
  assert.equal(entries[0]?.entryId, uuid(3), "the input array is not mutated");
});

test("status counts reflect only the loaded page", () => {
  const counts = queueStatusCounts([
    makeQueueEntry({ status: "waiting" }),
    makeQueueEntry({ status: "waiting", entryId: uuid(11) }),
    makeQueueEntry({ status: "notified", entryId: uuid(12) }),
  ]);

  assert.deepEqual(counts, { waiting: 2, notified: 1, total: 3 });
});

test("the displayed snapshot time is the backend generatedAt, never a local clock", () => {
  const response = makeQueueResponse({ generatedAt: "2026-11-12T09:15:00Z" });
  const snapshot = queueSnapshotFromResponse(response, 1);

  assert.equal(snapshot.lastRefreshed, "2026-11-12T09:15:00Z");
  assert.equal(snapshot.lastRefreshed, response.generatedAt);
  assert.equal(snapshot.data, response);
  assert.equal(snapshot.page, 1);
  assert.equal(isLiveQueueSnapshot(snapshot), true);
});

test("status badges show both statuses only while no status filter is active", () => {
  const counts = queueStatusCounts([
    makeQueueEntry({ status: "waiting" }),
    makeQueueEntry({ status: "waiting", entryId: uuid(11) }),
    makeQueueEntry({ status: "notified", entryId: uuid(12) }),
  ]);

  assert.deepEqual(queueVisibleStatusCounts({ counts, status: null }), [
    { status: "waiting", count: 2 },
    { status: "notified", count: 1 },
  ]);
});

test("an active status filter omits the excluded status instead of showing zero", () => {
  const counts = queueStatusCounts([
    makeQueueEntry({ status: "waiting" }),
    makeQueueEntry({ status: "waiting", entryId: uuid(11) }),
  ]);

  assert.deepEqual(queueVisibleStatusCounts({ counts, status: "waiting" }), [
    { status: "waiting", count: 2 },
  ]);
  // A waiting-only page must not advertise a misleading "0 notified" total.
  assert.equal(
    queueVisibleStatusCounts({ counts, status: "waiting" }).some(
      (item) => item.status === "notified",
    ),
    false,
  );
  assert.deepEqual(queueVisibleStatusCounts({ counts, status: "notified" }), [
    { status: "notified", count: 0 },
  ]);
});

test("page-scoped counts are not whole-queue totals", () => {
  const firstPage = queueStatusCounts([makeQueueEntry({ status: "waiting" })]);
  const secondPage = queueStatusCounts([
    makeQueueEntry({ status: "waiting", entryId: uuid(21) }),
    makeQueueEntry({ status: "notified", entryId: uuid(22) }),
  ]);

  assert.deepEqual(queueVisibleStatusCounts({ counts: firstPage, status: null }), [
    { status: "waiting", count: 1 },
    { status: "notified", count: 0 },
  ]);
  assert.equal(firstPage.total + secondPage.total, 3);
});

test("filters are detected from trimmed search and status", () => {
  assert.equal(queueHasFilters({ search: "", status: null }), false);
  assert.equal(queueHasFilters({ search: "   ", status: null }), false);
  assert.equal(queueHasFilters({ search: "Budi", status: null }), true);
  assert.equal(queueHasFilters({ search: "", status: "waiting" }), true);
});

test("display state keeps stale data visible after a failed refresh", () => {
  assert.equal(
    deriveQueueDisplayState({ entryCount: 0, isLoading: true, hasError: false }),
    "loading",
  );
  assert.equal(
    deriveQueueDisplayState({ entryCount: 0, isLoading: false, hasError: true }),
    "error",
  );
  assert.equal(
    deriveQueueDisplayState({ entryCount: 0, isLoading: false, hasError: false }),
    "empty",
  );
  assert.equal(
    deriveQueueDisplayState({ entryCount: 2, isLoading: false, hasError: true }),
    "stale",
  );
  assert.equal(
    deriveQueueDisplayState({ entryCount: 2, isLoading: false, hasError: false }),
    "ready",
  );
});
