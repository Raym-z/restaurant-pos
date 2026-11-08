import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ORDERS_PAGE_SIZE,
  ordersPageHref,
  ordersPageOffset,
  parseOrdersPage,
} from "../orders-pagination";

test("page parsing falls back to page one for invalid input", () => {
  assert.equal(parseOrdersPage(undefined), 1);
  assert.equal(parseOrdersPage(""), 1);
  assert.equal(parseOrdersPage("0"), 1);
  assert.equal(parseOrdersPage("-4"), 1);
  assert.equal(parseOrdersPage("abc"), 1);
  assert.equal(parseOrdersPage("3"), 3);
});

test("offset pagination reaches orders beyond the first 100 rows", () => {
  assert.equal(ordersPageOffset(1), 0);
  assert.equal(ordersPageOffset(2), ORDERS_PAGE_SIZE);
  assert.equal(ordersPageOffset(4), ORDERS_PAGE_SIZE * 3);
  assert.ok(ordersPageOffset(4) > 100);
});

test("page links preserve the status filter and omit page one", () => {
  assert.equal(ordersPageHref({ page: 1 }), "/orders");
  assert.equal(ordersPageHref({ page: 1, status: "pending" }), "/orders?status=pending");
  assert.equal(ordersPageHref({ page: 3, status: "cancelled" }), "/orders?page=3&status=cancelled");
});
