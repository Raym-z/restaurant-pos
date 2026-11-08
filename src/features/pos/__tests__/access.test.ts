import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canCancelOrder,
  canCancelStatus,
  canModifyOrderItems,
  canOperateFloor,
  canTransitionOrder,
} from "../access";
import type { StaffRole } from "@/types/roles";

const roles = (...values: StaffRole[]) => values;

test("floor roles can operate sessions and modify orders", () => {
  for (const role of roles("owner", "admin", "manager", "cashier")) {
    assert.equal(canOperateFloor([role]), true, role);
    assert.equal(canCancelOrder([role]), true, role);
  }

  assert.equal(canOperateFloor(["kitchen_staff"]), false);
  assert.equal(canCancelOrder(["kitchen_staff"]), false);
});

test("kitchen staff may apply preparation transitions only", () => {
  assert.equal(canTransitionOrder(["kitchen_staff"], "preparing"), true);
  assert.equal(canTransitionOrder(["kitchen_staff"], "ready"), true);
  assert.equal(canTransitionOrder(["kitchen_staff"], "accepted"), false);
  assert.equal(canTransitionOrder(["kitchen_staff"], "served"), false);
  assert.equal(canTransitionOrder(["kitchen_staff"], "completed"), false);
});

test("floor roles may accept, serve, and complete", () => {
  for (const role of roles("owner", "admin", "manager", "cashier")) {
    assert.equal(canTransitionOrder([role], "accepted"), true, role);
    assert.equal(canTransitionOrder([role], "served"), true, role);
    assert.equal(canTransitionOrder([role], "completed"), true, role);
  }

  assert.equal(canTransitionOrder(["cashier"], "preparing"), false);
  assert.equal(canTransitionOrder(["manager"], "preparing"), true);
});

test("order items are mutable only before preparation starts", () => {
  assert.equal(canModifyOrderItems("pending"), true);
  assert.equal(canModifyOrderItems("accepted"), true);
  assert.equal(canModifyOrderItems("preparing"), false);
  assert.equal(canModifyOrderItems("ready"), false);
  assert.equal(canModifyOrderItems("completed"), false);
});

test("cancellation is limited to pre-service statuses", () => {
  assert.equal(canCancelStatus("pending"), true);
  assert.equal(canCancelStatus("ready"), true);
  assert.equal(canCancelStatus("served"), false);
  assert.equal(canCancelStatus("cancelled"), false);
});
