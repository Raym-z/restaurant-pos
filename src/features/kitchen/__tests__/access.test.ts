import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAddKitchenRoute,
  canManageKitchenStations,
  canOperateKitchen,
  canRemoveKitchenRoute,
  canTransitionKitchenItem,
  canViewKitchen,
  kitchenItemActionFor,
} from "../access";
import type { StaffRole } from "@/types/roles";

const roles = (...values: StaffRole[]) => values;

test("kitchen reads and item operations follow the backend branch-role rule", () => {
  for (const role of roles("owner", "admin", "manager", "kitchen_staff")) {
    assert.equal(canViewKitchen([role]), true, role);
    assert.equal(canOperateKitchen([role]), true, role);
  }

  assert.equal(canViewKitchen(["cashier"]), false);
  assert.equal(canOperateKitchen(["cashier"]), false);
});

test("station configuration is limited to Owner, Admin, and Manager", () => {
  for (const role of roles("owner", "admin", "manager")) {
    assert.equal(canManageKitchenStations([role]), true, role);
  }

  assert.equal(canManageKitchenStations(["kitchen_staff"]), false);
  assert.equal(canManageKitchenStations(["cashier"]), false);
});

test("routes can be added only to active stations but removed from any station", () => {
  assert.equal(canAddKitchenRoute(["manager"], "active"), true);
  assert.equal(canAddKitchenRoute(["manager"], "inactive"), false);
  assert.equal(canAddKitchenRoute(["kitchen_staff"], "active"), false);
  assert.equal(canRemoveKitchenRoute(["manager"]), true);
  assert.equal(canRemoveKitchenRoute(["kitchen_staff"]), false);
});

test("item lifecycle exposes only pending -> preparing -> ready -> completed", () => {
  assert.deepEqual(kitchenItemActionFor("pending"), {
    action: "start",
    targetStatus: "preparing",
  });
  assert.deepEqual(kitchenItemActionFor("preparing"), {
    action: "markReady",
    targetStatus: "ready",
  });
  assert.deepEqual(kitchenItemActionFor("ready"), {
    action: "complete",
    targetStatus: "completed",
  });
  assert.equal(kitchenItemActionFor("completed"), null);
  assert.equal(kitchenItemActionFor("cancelled"), null);
});

test("terminal item states expose no controls", () => {
  for (const role of roles("owner", "admin", "manager", "kitchen_staff")) {
    assert.equal(canTransitionKitchenItem([role], "pending"), true, role);
    assert.equal(canTransitionKitchenItem([role], "preparing"), true, role);
    assert.equal(canTransitionKitchenItem([role], "ready"), true, role);
    assert.equal(canTransitionKitchenItem([role], "completed"), false, role);
    assert.equal(canTransitionKitchenItem([role], "cancelled"), false, role);
  }

  assert.equal(canTransitionKitchenItem(["cashier"], "pending"), false);
});
