import assert from "node:assert/strict";
import { test } from "node:test";

import {
  KitchenBoardResponseSchema,
  KitchenStationSchema,
  KitchenStationsResponseSchema,
  KitchenTicketItemStatusSchema,
  KitchenTicketSchema,
  KitchenTransitionResponseSchema,
} from "../contracts";
import { makeStation, makeTicket, uuid } from "./fixtures";

test("KDS ticket responses parse the M4.3 board shape", () => {
  const parsed = KitchenTicketSchema.parse(makeTicket());

  assert.equal(parsed.order.tableLabel, "T1");
  assert.equal(parsed.items[0]?.quantity, 2);
  assert.equal(parsed.items[0]?.modifiers[0]?.groupName, "Spice level");
});

test("KDS response validation strips financial and unknown fields", () => {
  const parsed = KitchenTicketSchema.parse({
    ...makeTicket(),
    subtotalMinor: 50000,
    currency: "IDR",
    items: [
      {
        ...makeTicket().items[0],
        baseUnitPriceMinor: 25000,
        lineTotalMinor: 50000,
        futureOperationalField: "ignored",
      },
    ],
  });

  assert.equal("subtotalMinor" in parsed, false);
  assert.equal("currency" in parsed, false);
  assert.equal("baseUnitPriceMinor" in parsed.items[0]!, false);
  assert.equal("lineTotalMinor" in parsed.items[0]!, false);
  assert.equal("futureOperationalField" in parsed.items[0]!, false);
});

test("invalid kitchen item states and negative page windows are rejected", () => {
  assert.equal(KitchenTicketItemStatusSchema.safeParse("accepted").success, false);
  assert.equal(KitchenTicketItemStatusSchema.safeParse("completed").success, true);

  const board = {
    branchId: uuid(3),
    stationId: null,
    statuses: ["pending", "preparing", "ready"],
    from: null,
    to: null,
    tickets: [makeTicket()],
    pageSize: 50,
    hasMore: false,
    nextOffset: null,
  };

  assert.equal(KitchenBoardResponseSchema.safeParse(board).success, true);
  assert.equal(KitchenBoardResponseSchema.safeParse({ ...board, pageSize: 0 }).success, false);
  assert.equal(KitchenBoardResponseSchema.safeParse({ ...board, nextOffset: -1 }).success, false);
});

test("station contracts include routing configuration", () => {
  const station = makeStation({
    categoryRoutes: [
      {
        routeId: uuid(20),
        menuCategoryId: uuid(21),
        menuCategoryName: "Mains",
        createdAt: "2026-11-10T09:00:00Z",
        updatedAt: "2026-11-10T09:00:00Z",
      },
    ],
    itemRoutes: [
      {
        routeId: uuid(22),
        menuItemId: uuid(23),
        menuItemName: "Nasi Goreng",
        menuCategoryId: uuid(21),
        menuCategoryName: "Mains",
        createdAt: "2026-11-10T09:00:00Z",
        updatedAt: "2026-11-10T09:00:00Z",
      },
    ],
  });

  assert.equal(KitchenStationSchema.safeParse(station).success, true);
  assert.equal(
    KitchenStationsResponseSchema.safeParse({ branchId: uuid(3), stations: [station] }).success,
    true,
  );
});

test("the M4.2 transition response is validated without assuming the board shape", () => {
  const parsed = KitchenTransitionResponseSchema.parse({
    ticketId: uuid(1),
    status: "preparing",
    items: [{ ticketItemId: uuid(7), status: "preparing" }],
  });

  assert.equal(parsed.ticketId, uuid(1));
  assert.equal(parsed.status, "preparing");
});
