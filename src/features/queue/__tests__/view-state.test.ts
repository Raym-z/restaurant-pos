import assert from "node:assert/strict";
import { test } from "node:test";

import type { QueueListResponse } from "../contracts";
import { isCurrentQueueResponse, queueRequestKey } from "../request-coordinator";
import {
  isLiveQueueSnapshot,
  queueSnapshotForResult,
  queueSnapshotFromResponse,
  type QueueSnapshot,
} from "../selectors";
import type { QueueLoadResult } from "../types";
import { makeQueueEntry, makeQueueResponse, uuid } from "./fixtures";

type QueueResult = QueueLoadResult<QueueListResponse>;

interface QueueTargetKey {
  branchId: string;
  page: number;
}

const failure: QueueResult = {
  ok: false,
  error: { code: "SERVICE_UNAVAILABLE", message: "failed", retryable: true },
};

function success(response: QueueListResponse): QueueResult {
  return { ok: true, data: response };
}

function requestKey(target: QueueTargetKey): string {
  return queueRequestKey({
    branchId: target.branchId,
    status: null,
    search: "",
    page: target.page,
    limit: 50,
  });
}

/**
 * Mirrors the screen's decision: a result is applied only when its request is
 * still the active branch/page target; success then replaces the snapshot.
 */
function apply(
  current: QueueSnapshot,
  request: QueueTargetKey,
  result: QueueResult,
  active: QueueTargetKey = request,
): QueueSnapshot {
  if (!isCurrentQueueResponse(requestKey(request), requestKey(active))) {
    return current;
  }

  return queueSnapshotForResult(current, result, request.page);
}

function pageResponse({
  branchId = uuid(3),
  generatedAt = "2026-11-12T09:15:00Z",
  entryId = uuid(1),
  position = 1,
  hasMore = false,
  nextOffset = null,
}: {
  branchId?: string;
  generatedAt?: string;
  entryId?: string;
  position?: number;
  hasMore?: boolean;
  nextOffset?: number | null;
} = {}): QueueListResponse {
  return makeQueueResponse({
    branchId,
    generatedAt,
    entries: [makeQueueEntry({ branchId, entryId, position })],
    hasMore,
    nextOffset,
  });
}

const branchId = uuid(3);

function liveSnapshot(): QueueSnapshot {
  return queueSnapshotFromResponse(
    pageResponse({ generatedAt: "2026-11-12T09:15:00Z", hasMore: true, nextOffset: 50 }),
    1,
  );
}

test("successful page-1 to page-2 navigation updates rows, page, and label together", () => {
  const page1 = liveSnapshot();
  const page2Response = pageResponse({
    generatedAt: "2026-11-12T09:16:00Z",
    entryId: uuid(51),
    position: 51,
  });

  const page2 = apply(page1, { branchId, page: 2 }, success(page2Response));

  assert.equal(page2.page, 2);
  assert.equal(page2.data.entries[0]?.entryId, uuid(51));
  assert.equal(page2.lastRefreshed, "2026-11-12T09:16:00Z");
  assert.equal(isLiveQueueSnapshot(page2), false);
});

test("failed page-1 to page-2 navigation keeps page-1 rows and their live/not-live label", () => {
  const page1 = liveSnapshot();

  const afterFailure = apply(page1, { branchId, page: 2 }, failure);

  assert.equal(afterFailure, page1, "a failure does not replace the displayed snapshot");
  assert.equal(afterFailure.page, 1);
  assert.equal(afterFailure.data.entries[0]?.position, 1);
  assert.equal(afterFailure.lastRefreshed, page1.lastRefreshed);
  assert.equal(isLiveQueueSnapshot(afterFailure), true);
});

test("successful page-2 to page-1 navigation restores the live snapshot", () => {
  const page1 = liveSnapshot();
  const page2 = apply(
    page1,
    { branchId, page: 2 },
    success(pageResponse({ generatedAt: "2026-11-12T09:16:00Z", entryId: uuid(51), position: 51 })),
  );
  assert.equal(isLiveQueueSnapshot(page2), false);

  const backToLiveResponse = pageResponse({
    generatedAt: "2026-11-12T09:17:00Z",
    hasMore: true,
    nextOffset: 50,
  });
  const backToLive = apply(page2, { branchId, page: 1 }, success(backToLiveResponse));

  assert.equal(backToLive.page, 1);
  assert.equal(backToLive.data.entries[0]?.entryId, uuid(1));
  assert.equal(backToLive.lastRefreshed, "2026-11-12T09:17:00Z");
  assert.equal(isLiveQueueSnapshot(backToLive), true);
});

test("failed page-2 to page-1 navigation does not relabel page-2 rows as live", () => {
  const page2Response = pageResponse({
    generatedAt: "2026-11-12T09:16:00Z",
    entryId: uuid(51),
    position: 51,
  });
  const page2 = queueSnapshotFromResponse(page2Response, 2);

  const afterFailure = apply(page2, { branchId, page: 1 }, failure);

  assert.equal(afterFailure, page2, "a failure does not replace the displayed snapshot");
  assert.equal(afterFailure.page, 2);
  assert.equal(afterFailure.data.entries[0]?.entryId, uuid(51));
  assert.equal(afterFailure.lastRefreshed, page2.lastRefreshed);
  assert.equal(isLiveQueueSnapshot(afterFailure), false);
});

test("a retry after a failed navigation applies the newly loaded page", () => {
  const page1 = liveSnapshot();
  const afterFailure = apply(page1, { branchId, page: 2 }, failure);
  assert.equal(afterFailure.page, 1);

  const retried = apply(
    afterFailure,
    { branchId, page: 2 },
    success(pageResponse({ generatedAt: "2026-11-12T09:18:00Z", entryId: uuid(51), position: 51 })),
  );

  assert.equal(retried.page, 2);
  assert.equal(retried.data.entries[0]?.entryId, uuid(51));
  assert.equal(isLiveQueueSnapshot(retried), false);
});

test("a stale response cannot overwrite a newer successful navigation", () => {
  const page1 = liveSnapshot();
  const page3Response = pageResponse({ generatedAt: "2026-11-12T09:19:00Z", entryId: uuid(101) });
  const page3 = apply(page1, { branchId, page: 3 }, success(page3Response));
  assert.equal(page3.page, 3);

  const latePage2 = apply(
    page3,
    { branchId, page: 2 },
    success(pageResponse({ generatedAt: "2026-11-12T09:16:00Z", entryId: uuid(51) })),
    { branchId, page: 3 },
  );

  assert.equal(latePage2, page3, "the older response is discarded");
  assert.equal(latePage2.page, 3);
  assert.equal(latePage2.data.entries[0]?.entryId, uuid(101));
  assert.equal(latePage2.lastRefreshed, "2026-11-12T09:19:00Z");
});

test("a branch change starts from that branch's page-1 snapshot and rejects branch-A writes", () => {
  const branchA = uuid(3);
  const branchB = uuid(4);
  const branchBResponse = pageResponse({ branchId: branchB, entryId: uuid(61), position: 1 });
  const branchBSnapshot = queueSnapshotFromResponse(branchBResponse, 1);

  assert.equal(branchBSnapshot.data.branchId, branchB);
  assert.equal(branchBSnapshot.data.entries[0]?.entryId, uuid(61));
  assert.equal(isLiveQueueSnapshot(branchBSnapshot), true);

  const lateBranchAResponse = pageResponse({ branchId: branchA, entryId: uuid(1) });
  const afterLateBranchA = apply(
    branchBSnapshot,
    { branchId: branchA, page: 1 },
    success(lateBranchAResponse),
    { branchId: branchB, page: 1 },
  );

  assert.equal(afterLateBranchA, branchBSnapshot);
  assert.equal(afterLateBranchA.data.branchId, branchB);
  assert.equal(afterLateBranchA.data.entries[0]?.entryId, uuid(61));
});
