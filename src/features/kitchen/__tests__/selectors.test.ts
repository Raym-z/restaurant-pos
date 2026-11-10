import assert from "node:assert/strict";
import { test } from "node:test";

import {
  elapsedMinutes,
  groupKitchenTickets,
  kitchenTicketCounts,
  kitchenTicketItemProgress,
  kitchenTicketUrgency,
  kitchenUrgencyForMinutes,
} from "../selectors";
import { makeTicket, uuid } from "./fixtures";

test("tickets are grouped by aggregate status in oldest-first order", () => {
  const olderPending = makeTicket({
    ticketId: uuid(1),
    status: "pending",
    createdAt: "2026-11-10T09:00:00Z",
  });
  const newerPending = makeTicket({
    ticketId: uuid(2),
    status: "pending",
    createdAt: "2026-11-10T09:30:00Z",
  });
  const preparing = makeTicket({
    ticketId: uuid(3),
    status: "preparing",
    createdAt: "2026-11-10T09:10:00Z",
  });
  const ready = makeTicket({
    ticketId: uuid(4),
    status: "ready",
    createdAt: "2026-11-10T09:20:00Z",
  });
  const completed = makeTicket({ ticketId: uuid(5), status: "completed" });
  const cancelled = makeTicket({ ticketId: uuid(6), status: "cancelled" });

  const grouped = groupKitchenTickets([
    newerPending,
    completed,
    ready,
    olderPending,
    cancelled,
    preparing,
  ]);

  assert.deepEqual(
    grouped.pending.map((ticket) => ticket.ticketId),
    [uuid(1), uuid(2)],
  );
  assert.deepEqual(
    grouped.preparing.map((ticket) => ticket.ticketId),
    [uuid(3)],
  );
  assert.deepEqual(
    grouped.ready.map((ticket) => ticket.ticketId),
    [uuid(4)],
  );
});

test("status counts ignore history statuses", () => {
  const counts = kitchenTicketCounts([
    makeTicket({ status: "pending" }),
    makeTicket({ status: "pending" }),
    makeTicket({ status: "preparing" }),
    makeTicket({ status: "ready" }),
    makeTicket({ status: "completed" }),
    makeTicket({ status: "cancelled" }),
  ]);

  assert.deepEqual(counts, { pending: 2, preparing: 1, ready: 1, total: 4 });
});

test("elapsed time and urgency are derived from the ticket creation time", () => {
  const createdAt = "2026-11-10T10:00:00Z";

  assert.equal(elapsedMinutes(createdAt, "2026-11-10T10:04:59Z"), 4);
  assert.equal(elapsedMinutes(createdAt, "2026-11-10T10:05:00Z"), 5);
  assert.equal(kitchenUrgencyForMinutes(9), "normal");
  assert.equal(kitchenUrgencyForMinutes(10), "warning");
  assert.equal(kitchenUrgencyForMinutes(19), "warning");
  assert.equal(kitchenUrgencyForMinutes(20), "urgent");
  assert.equal(kitchenTicketUrgency(makeTicket({ createdAt }), "2026-11-10T10:25:00Z"), "urgent");
});

test("item progress excludes cancelled items", () => {
  const ticket = makeTicket({
    items: [
      { ...makeTicket().items[0]!, ticketItemId: uuid(31), status: "completed" },
      { ...makeTicket().items[0]!, ticketItemId: uuid(32), status: "cancelled" },
      { ...makeTicket().items[0]!, ticketItemId: uuid(33), status: "pending" },
    ],
  });

  assert.deepEqual(kitchenTicketItemProgress(ticket), { completed: 1, total: 2 });
});
