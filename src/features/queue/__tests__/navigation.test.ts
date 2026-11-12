import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getNavigationForContext } from "@/config/navigation";

function itemsFor(roles: Array<"owner" | "admin" | "manager" | "cashier" | "kitchen_staff">) {
  return getNavigationForContext({
    roles,
    isOrganizationScoped: roles.includes("owner") || roles.includes("admin"),
    isOrgAdmin: roles.includes("owner") || roles.includes("admin"),
  }).flatMap((section) => section.items);
}

test("queue navigation is available to floor roles and hidden from kitchen staff", () => {
  for (const role of ["owner", "admin", "manager", "cashier"] as const) {
    const queue = itemsFor([role]).find((item) => item.href === "/queue");
    assert.ok(queue, role);
    assert.equal(queue.availability ?? "available", "available", role);
  }

  assert.equal(
    itemsFor(["kitchen_staff"]).some((item) => item.href === "/queue"),
    false,
  );
});

test("the queue route renders the live screen with a branch-keyed remount", () => {
  const page = readFileSync("src/app/(app)/queue/page.tsx", "utf8");

  assert.match(page, /QueueScreen/);
  assert.match(page, /canViewQueue/);
  assert.match(page, /key=\{viewer\.branchId\}/);
  assert.doesNotMatch(page, /ModulePlaceholder/);
});
