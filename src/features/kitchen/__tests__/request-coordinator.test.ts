import assert from "node:assert/strict";
import { test } from "node:test";

import {
  KITCHEN_POLL_INTERVAL_MS,
  KITCHEN_POLL_INTERVAL_SECONDS,
  KitchenActionGuard,
  KitchenRequestQueue,
  isCurrentKitchenResponse,
  isSupportedKitchenPollInterval,
  kitchenBoardRequestKey,
  shouldPollWhileVisible,
} from "../request-coordinator";

test("polling runs inside the required 30-60 second window", () => {
  assert.equal(isSupportedKitchenPollInterval(KITCHEN_POLL_INTERVAL_MS), true);
  assert.equal(KITCHEN_POLL_INTERVAL_MS, 45_000);
  assert.equal(KITCHEN_POLL_INTERVAL_SECONDS, 45);
  assert.equal(isSupportedKitchenPollInterval(29_999), false);
  assert.equal(isSupportedKitchenPollInterval(60_001), false);
});

test("polling is suspended while the kitchen display is hidden", () => {
  assert.equal(shouldPollWhileVisible("visible"), true);
  assert.equal(shouldPollWhileVisible(undefined), true);
  assert.equal(shouldPollWhileVisible("hidden"), false);
});

test("overlapping board requests queue only the latest target", () => {
  const queue = new KitchenRequestQueue<string>();

  assert.equal(queue.busy, false);
  assert.equal(queue.enqueue("first"), true);
  assert.equal(queue.busy, true);

  assert.equal(queue.enqueue("second"), false);
  assert.equal(queue.enqueue("third"), false);
  assert.equal(queue.queuedTarget, "third");

  assert.equal(queue.finish(), "third");
  assert.equal(queue.busy, false);
  assert.equal(queue.finish(), null);
});

test("duplicate item submissions are rejected until the first finishes", () => {
  const guard = new KitchenActionGuard();

  assert.equal(guard.tryStart("item-1"), true);
  assert.equal(guard.tryStart("item-1"), false);
  assert.equal(guard.size, 1);

  guard.finish("item-1");
  assert.equal(guard.has("item-1"), false);
  assert.equal(guard.tryStart("item-1"), true);
});

test("stale board responses are ignored after the active target changes", () => {
  const first = kitchenBoardRequestKey(null, 1);
  const second = kitchenBoardRequestKey(null, 2);

  assert.notEqual(first, second);
  assert.equal(isCurrentKitchenResponse(first, first), true);
  assert.equal(isCurrentKitchenResponse(first, second), false);
  assert.equal(isCurrentKitchenResponse(first, null), false);
});
