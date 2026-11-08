import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveBranchContext } from "../branch-context";

const branches = [
  { id: "branch-a", name: "Senopati", timezone: "Asia/Jakarta" },
  { id: "branch-b", name: "Ubud", timezone: "Asia/Makassar" },
];

test("table/order context uses the resource branch, not the active branch", () => {
  const context = resolveBranchContext({
    branches,
    branchId: "branch-b",
    fallbackName: "Active branch",
    fallbackTimezone: "Asia/Jakarta",
  });

  assert.equal(context.name, "Ubud");
  assert.equal(context.timezone, "Asia/Makassar");
});

test("fallbacks apply only when the resource branch is unavailable", () => {
  const context = resolveBranchContext({
    branches,
    branchId: "branch-inactive",
    fallbackName: "Historical branch",
    fallbackTimezone: "Asia/Jakarta",
  });

  assert.equal(context.name, "Historical branch");
  assert.equal(context.timezone, "Asia/Jakarta");
});
