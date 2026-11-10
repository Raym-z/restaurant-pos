import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getNavigationForContext } from "@/config/navigation";

function hrefsFor(roles: Array<"owner" | "admin" | "manager" | "cashier" | "kitchen_staff">) {
  return getNavigationForContext({
    roles,
    isOrganizationScoped: roles.includes("owner") || roles.includes("admin"),
    isOrgAdmin: roles.includes("owner") || roles.includes("admin"),
  }).flatMap((section) => section.items.map((item) => item.href));
}

test("KDS navigation is available to kitchen roles and hidden from cashiers", () => {
  for (const role of ["owner", "admin", "manager", "kitchen_staff"] as const) {
    assert.ok(hrefsFor([role]).includes("/kitchen"), role);
  }

  assert.ok(!hrefsFor(["cashier"]).includes("/kitchen"));
});

test("KDS routes exist and are connected to real feature components", () => {
  const board = readFileSync("src/app/(app)/kitchen/page.tsx", "utf8");
  const history = readFileSync("src/app/(app)/kitchen/history/page.tsx", "utf8");
  const stations = readFileSync("src/app/(app)/kitchen/stations/page.tsx", "utf8");

  assert.match(board, /KitchenDashboard/);
  assert.match(history, /KitchenHistoryScreen/);
  assert.match(stations, /StationManagementScreen/);
  assert.doesNotMatch(board, /ModulePlaceholder/);
});
