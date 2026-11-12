import assert from "node:assert/strict";
import { test } from "node:test";

import {
  QUEUE_PAGE_SIZE,
  QueueListRequestSchema,
  QueueListResponseSchema,
  queuePageOffset,
  toQueueRpcParams,
} from "../contracts";
import { makeQueueEntry, makeQueueResponse, uuid } from "./fixtures";

test("queue responses parse the approved M5.2 projection", () => {
  const parsed = QueueListResponseSchema.parse(makeQueueResponse());

  assert.equal(parsed.branchId, uuid(3));
  assert.equal(parsed.entries[0]?.position, 1);
  assert.equal(parsed.entries[0]?.contactPhone, "+6281234567890");
  assert.equal(parsed.entries[0]?.source, "walk_in");
});

test("queue response parsing strips unknown additive fields", () => {
  const parsed = QueueListResponseSchema.parse({
    ...makeQueueResponse(),
    futureField: "ignored",
    entries: [{ ...makeQueueEntry(), customerId: uuid(99), queuePosition: 4 }],
  });

  assert.equal("futureField" in parsed, false);
  assert.equal("customerId" in parsed.entries[0]!, false);
  assert.equal("queuePosition" in parsed.entries[0]!, false);
});

test("cashier and manager fixtures differ only in backend phone projection", () => {
  const manager = QueueListResponseSchema.parse(makeQueueResponse()).entries[0]!;
  const cashier = QueueListResponseSchema.parse(
    makeQueueResponse({
      entries: [
        makeQueueEntry({
          contactPhone: "••••7890",
          contactPhoneMasked: true,
        }),
      ],
    }),
  ).entries[0]!;

  assert.equal(manager.contactPhoneMasked, false);
  assert.equal(cashier.contactPhoneMasked, true);
  assert.equal(cashier.contactPhone, "••••7890");
  assert.equal(cashier.position, manager.position);
  assert.equal(cashier.entryId, manager.entryId);
});

test("terminal statuses and malformed entries are rejected", () => {
  assert.equal(
    QueueListResponseSchema.safeParse(
      makeQueueResponse({ entries: [makeQueueEntry({ status: "seated" as never })] }),
    ).success,
    false,
  );
  assert.equal(
    QueueListResponseSchema.safeParse(
      makeQueueResponse({ entries: [makeQueueEntry({ position: 0 })] }),
    ).success,
    false,
  );
  assert.equal(
    QueueListResponseSchema.safeParse(makeQueueResponse({ pageSize: 101 })).success,
    false,
  );
});

test("responses reject cross-branch entries and statuses outside the effective set", () => {
  assert.equal(
    QueueListResponseSchema.safeParse(
      makeQueueResponse({ entries: [makeQueueEntry({ branchId: uuid(4) })] }),
    ).success,
    false,
  );

  assert.equal(
    QueueListResponseSchema.safeParse(
      makeQueueResponse({
        statuses: ["waiting"],
        entries: [makeQueueEntry({ status: "notified" })],
      }),
    ).success,
    false,
  );
});

test("nextOffset is required exactly when hasMore is true", () => {
  const base = makeQueueResponse();
  assert.equal(
    QueueListResponseSchema.safeParse({ ...base, hasMore: true, nextOffset: 50 }).success,
    true,
  );
  assert.equal(
    QueueListResponseSchema.safeParse({ ...base, hasMore: true, nextOffset: null }).success,
    false,
  );
  assert.equal(
    QueueListResponseSchema.safeParse({ ...base, hasMore: false, nextOffset: 50 }).success,
    false,
  );
});

test("request mapping sends one canonical status, literal search, limit, and offset", () => {
  const request = QueueListRequestSchema.parse({
    branchId: uuid(3),
    status: "notified",
    search: "  Budi  ",
    page: 3,
  });

  assert.deepEqual(toQueueRpcParams(request), {
    p_branch_id: uuid(3),
    p_statuses: ["notified"],
    p_search: "Budi",
    p_limit: QUEUE_PAGE_SIZE,
    p_offset: 100,
  });
});

test("request mapping treats all-status and blank-search as null", () => {
  const request = QueueListRequestSchema.parse({
    branchId: uuid(3),
    status: null,
    search: "   ",
  });

  assert.deepEqual(toQueueRpcParams(request), {
    p_branch_id: uuid(3),
    p_statuses: null,
    p_search: null,
    p_limit: QUEUE_PAGE_SIZE,
    p_offset: 0,
  });
});

test("request validation enforces pagination and search bounds", () => {
  assert.equal(QueueListRequestSchema.safeParse({ branchId: uuid(3), limit: 100 }).success, true);
  assert.equal(QueueListRequestSchema.safeParse({ branchId: uuid(3), limit: 101 }).success, false);
  assert.equal(QueueListRequestSchema.safeParse({ branchId: uuid(3), limit: 0 }).success, false);
  assert.equal(QueueListRequestSchema.safeParse({ branchId: uuid(3), page: 0 }).success, false);
  assert.equal(
    QueueListRequestSchema.safeParse({ branchId: uuid(3), search: "x".repeat(201) }).success,
    false,
  );
  assert.equal(
    QueueListRequestSchema.safeParse({ branchId: uuid(3), status: "seated" }).success,
    false,
  );
});

test("pagination offsets are zero-based and never negative", () => {
  assert.equal(queuePageOffset(1), 0);
  assert.equal(queuePageOffset(2), 50);
  assert.equal(queuePageOffset(0), 0);
});
