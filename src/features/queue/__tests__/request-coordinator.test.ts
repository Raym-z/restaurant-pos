import assert from "node:assert/strict";
import { test } from "node:test";

import { type QueueListRequest, toQueueRpcParams } from "../contracts";
import {
  QUEUE_POLL_INTERVAL_MS,
  QUEUE_POLL_INTERVAL_SECONDS,
  QueueRequestQueue,
  isCurrentQueueResponse,
  isSupportedQueuePollInterval,
  queuePollTarget,
  queueRequestKey,
  shouldAutoPollQueuePage,
  shouldPollQueueWhileVisible,
} from "../request-coordinator";
import { uuid } from "./fixtures";

function request(overrides: Partial<QueueListRequest> = {}): QueueListRequest {
  return {
    branchId: uuid(3),
    status: null,
    search: "",
    page: 1,
    limit: 50,
    ...overrides,
  };
}

test("queue polling runs inside the approved 30-45 second window", () => {
  assert.equal(isSupportedQueuePollInterval(QUEUE_POLL_INTERVAL_MS), true);
  assert.equal(QUEUE_POLL_INTERVAL_MS, 45_000);
  assert.equal(QUEUE_POLL_INTERVAL_SECONDS, 45);
  assert.equal(isSupportedQueuePollInterval(29_999), false);
  assert.equal(isSupportedQueuePollInterval(45_001), false);
});

test("queue polling is suspended while the tab is hidden", () => {
  assert.equal(shouldPollQueueWhileVisible("visible"), true);
  assert.equal(shouldPollQueueWhileVisible(undefined), true);
  assert.equal(shouldPollQueueWhileVisible("hidden"), false);
});

test("automatic polling always requests offset 0, never the current page", () => {
  const explicit = request({ page: 3, status: "waiting", search: "Budi" });
  const polled = queuePollTarget(explicit);

  assert.equal(polled.page, 1);
  assert.equal(polled.branchId, explicit.branchId);
  assert.equal(polled.status, "waiting");
  assert.equal(polled.search, "Budi");
  assert.equal(toQueueRpcParams(polled).p_offset, 0);
});

test("automatic polling is limited to the live first page", () => {
  assert.equal(shouldAutoPollQueuePage(1), true);
  assert.equal(shouldAutoPollQueuePage(2), false);
  assert.equal(shouldAutoPollQueuePage(5), false);
});

test("a poll response cannot replace an explicitly requested later page", () => {
  const explicitPage = request({ page: 2 });
  const pollTarget = queuePollTarget(explicitPage);

  assert.notEqual(queueRequestKey(pollTarget), queueRequestKey(explicitPage));
  assert.equal(
    isCurrentQueueResponse(queueRequestKey(pollTarget), queueRequestKey(explicitPage)),
    false,
  );

  // Navigating between explicit pages still discards the older response.
  assert.equal(
    isCurrentQueueResponse(
      queueRequestKey(request({ page: 2 })),
      queueRequestKey(request({ page: 3 })),
    ),
    false,
  );
});

test("overlapping requests queue only the latest target", () => {
  const queue = new QueueRequestQueue<string>();

  assert.equal(queue.enqueue("first"), true);
  assert.equal(queue.enqueue("second"), false);
  assert.equal(queue.enqueue("third"), false);
  assert.equal(queue.queuedTarget, "third");
  assert.equal(queue.finish(), "third");
  assert.equal(queue.busy, false);
  assert.equal(queue.finish(), null);
});

test("the queue releases the active slot after a failed request", () => {
  const queue = new QueueRequestQueue<string>();
  assert.equal(queue.enqueue("first"), true);
  assert.equal(queue.enqueue("retry"), false);

  // The screen calls finish() in the finally block on success and failure.
  assert.equal(queue.finish(), "retry");
  assert.equal(queue.busy, false);
  assert.equal(queue.enqueue("manual-refresh"), true);
});

test("request keys include branch, status, search, and page", () => {
  const base = queueRequestKey(request());

  assert.notEqual(base, queueRequestKey(request({ branchId: uuid(4) })));
  assert.notEqual(base, queueRequestKey(request({ status: "waiting" })));
  assert.notEqual(base, queueRequestKey(request({ search: "Budi" })));
  assert.notEqual(base, queueRequestKey(request({ page: 2 })));
  assert.equal(
    queueRequestKey(request({ search: "  Budi  " })),
    queueRequestKey(request({ search: "Budi" })),
  );
});

test("stale responses are discarded after a branch or filter change", () => {
  const first = queueRequestKey(request({ branchId: uuid(3), page: 1 }));
  const second = queueRequestKey(request({ branchId: uuid(4), page: 1 }));
  const same = queueRequestKey(request({ branchId: uuid(3), page: 1 }));

  assert.equal(isCurrentQueueResponse(first, same), true);
  assert.equal(isCurrentQueueResponse(first, second), false);
  assert.equal(isCurrentQueueResponse(first, null), false);
});
