import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { KitchenBoardResponseSchema, KitchenTransitionResponseSchema } from "../contracts";
import { groupKitchenTickets, kitchenTicketCounts, kitchenTicketItemProgress } from "../selectors";
import payload from "./fixtures/backend-kds-payload.json";

function collectKeys(value: unknown, keys: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectKeys(entry, keys);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      keys.add(key);
      collectKeys(entry, keys);
    }
  }
}

test("the captured M4 backend board satisfies the frontend contract", () => {
  const board = KitchenBoardResponseSchema.parse(payload.board);

  assert.equal(board.tickets.length, 1);
  const ticket = board.tickets[0]!;
  assert.equal(ticket.status, "ready");
  assert.equal(ticket.generation, 1);
  assert.equal(ticket.stationName.length > 0, true);
  assert.ok(ticket.order.tableLabel);
  assert.equal(ticket.order.tableLabel.length > 0, true);
  assert.equal(ticket.order.notes, "Birthday table");

  const item = ticket.items[0]!;
  assert.equal(item.quantity, 2);
  assert.equal(item.notes, "No onion");
  assert.equal(item.status, "ready");
  assert.equal(item.modifiers[0]?.optionName, "Mild");

  // Active tickets carry the default actor domain from the backend schema.
  assert.equal(ticket.cancelledByActorType, "staff");
  assert.equal(ticket.cancelledAt, null);

  assert.deepEqual(kitchenTicketItemProgress(ticket), { completed: 0, total: 1 });
});

test("the captured board contains no financial fields", () => {
  const keys = new Set<string>();
  collectKeys(payload.board, keys);

  assert.deepEqual(
    [...keys].filter((key) => /price|subtotal|discount|total|payment|currency/i.test(key)),
    [],
  );
});

test("board grouping and counts handle the captured backend ticket", () => {
  const board = KitchenBoardResponseSchema.parse(payload.board);
  const grouped = groupKitchenTickets(board.tickets);

  assert.equal(grouped.pending.length, 0);
  assert.equal(grouped.preparing.length, 0);
  assert.deepEqual(
    grouped.ready.map((ticket) => ticket.ticketId),
    [board.tickets[0]!.ticketId],
  );
  assert.deepEqual(kitchenTicketCounts(board.tickets), {
    pending: 0,
    preparing: 0,
    ready: 1,
    total: 1,
  });
});

test("the captured history payload keeps creation and cancellation timestamps distinct", () => {
  const history = KitchenBoardResponseSchema.parse(payload.history);
  const ticket = history.tickets[0]!;

  assert.equal(ticket.status, "cancelled");
  assert.equal(ticket.items[0]?.status, "cancelled");
  assert.equal(ticket.cancellationReason, "Guest changed mind");
  assert.equal(ticket.cancelledByActorType, "staff");
  assert.notEqual(ticket.cancelledByStaffId, null);

  // History is filtered by ticket creation time (`createdAt`), while the
  // cancellation timestamp is the operational terminal time.
  assert.equal(
    new Date(ticket.createdAt).getTime() <= new Date(ticket.cancelledAt!).getTime(),
    true,
  );
  assert.equal(history.from !== null, true);
  assert.equal(history.to !== null, true);
});

test("the captured M4.2 transition response parses with additive ticket fields", () => {
  const transition = KitchenTransitionResponseSchema.parse(payload.transition);
  const ticket = payload.transition as unknown as Record<string, unknown>;

  assert.equal(transition.status, "preparing");
  assert.equal(typeof ticket.ticketId, "string");
  // The transition payload is the full ticket shape; the client only relies on
  // the stable identifiers and must tolerate the additive fields.
  assert.equal(Array.isArray(ticket.items), true);
});

test("the KDS frontend uses backend RPCs and never writes kitchen tables directly", () => {
  const actions = readFileSync(new URL("../actions.ts", import.meta.url), "utf8");
  const services = readFileSync(new URL("../services.ts", import.meta.url), "utf8");

  for (const rpc of [
    "start_kitchen_ticket_item",
    "mark_kitchen_ticket_item_ready",
    "complete_kitchen_ticket_item",
    "create_kitchen_station",
    "update_kitchen_station",
    "deactivate_kitchen_station",
    "reactivate_kitchen_station",
    "add_kitchen_station_category_route",
    "remove_kitchen_station_category_route",
    "add_kitchen_station_item_route",
    "remove_kitchen_station_item_route",
  ]) {
    assert.equal(actions.includes(rpc), true, `actions.ts must call ${rpc}`);
  }

  for (const rpc of ["list_kitchen_tickets", "list_kitchen_stations"]) {
    assert.equal(services.includes(rpc), true, `services.ts must call ${rpc}`);
  }

  for (const source of [actions, services]) {
    assert.equal(/\.from\(\s*["']kitchen_/i.test(source), false, "no direct kitchen table access");
    assert.equal(/\.insert\(\s*\{[\s\S]*kitchen_/i.test(source), false, "no kitchen inserts");
    assert.equal(/\.update\(\s*\{[\s\S]*kitchen_/i.test(source), false, "no kitchen updates");
    assert.equal(/\.delete\(\)[\s\S]*kitchen_/i.test(source), false, "no kitchen deletes");
  }
});
