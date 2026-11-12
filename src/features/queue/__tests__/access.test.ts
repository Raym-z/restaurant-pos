import assert from "node:assert/strict";
import { test } from "node:test";

import { canManageQueue, canViewQueue, isQueueReadOnly } from "../access";

test("queue reads are allowed for owner, admin, manager, and cashier", () => {
  for (const role of ["owner", "admin", "manager", "cashier"] as const) {
    assert.equal(canViewQueue([role]), true, role);
  }

  assert.equal(canViewQueue(["kitchen_staff"]), false);
  assert.equal(canViewQueue([]), false);
});

test("only owner, admin, and manager receive management capability", () => {
  for (const role of ["owner", "admin", "manager"] as const) {
    assert.equal(canManageQueue([role]), true, role);
    assert.equal(isQueueReadOnly([role]), false, role);
  }

  assert.equal(canManageQueue(["cashier"]), false);
  assert.equal(isQueueReadOnly(["cashier"]), true);
  assert.equal(isQueueReadOnly(["kitchen_staff"]), false);
});

test("a higher role wins when roles are combined", () => {
  assert.equal(isQueueReadOnly(["cashier", "manager"]), false);
  assert.equal(canViewQueue(["cashier", "kitchen_staff"]), true);
});
