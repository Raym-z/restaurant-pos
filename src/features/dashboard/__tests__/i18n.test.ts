import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dictionaries = ["en", "id"].map((locale) => ({
  locale,
  value: JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")),
}));

function hasString(value: unknown, path: readonly string[]): boolean {
  let current: unknown = value;
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" && current.length > 0;
}

test("all dashboard UI keys exist in both locales", () => {
  const paths = [
    ["dashboard", "title"],
    ["dashboard", "openBranches"],
    ["dashboard", "metricsLabel"],
    ["dashboard", "noValue"],
    ["dashboard", "loadErrorTitle"],
    ["dashboard", "loadErrorDescription"],
    ["dashboard", "summary", "label"],
    ["dashboard", "summary", "organization"],
    ["dashboard", "summary", "accessibleBranches"],
    ["dashboard", "summary", "activeBranch"],
    ["dashboard", "summary", "primaryRole"],
    ["dashboard", "filters", "rangeLabel"],
    ["dashboard", "filters", "branchLabel"],
    ["dashboard", "filters", "singleDay"],
    ["dashboard", "filters", "range"],
    ["dashboard", "filters", "timezone"],
    ["dashboard", "filters", "asOf"],
    ["dashboard", "filters", "refresh"],
    ["dashboard", "filters", "branchSwitchFailed"],
    ["dashboard", "filters", "ranges", "today"],
    ["dashboard", "filters", "ranges", "7d"],
    ["dashboard", "filters", "ranges", "30d"],
    ["dashboard", "metrics", "totalOrders"],
    ["dashboard", "metrics", "totalOrdersHint"],
    ["dashboard", "metrics", "activeOrders"],
    ["dashboard", "metrics", "activeOrdersHint"],
    ["dashboard", "metrics", "completedOrders"],
    ["dashboard", "metrics", "completedOrdersHint"],
    ["dashboard", "metrics", "cancelledOrders"],
    ["dashboard", "metrics", "cancelledOrdersHint"],
    ["dashboard", "metrics", "activeSessions"],
    ["dashboard", "metrics", "activeSessionsHint"],
    ["dashboard", "metrics", "occupiedTables"],
    ["dashboard", "metrics", "occupiedTablesHint"],
    ["dashboard", "metrics", "availableTables"],
    ["dashboard", "metrics", "availableTablesHint"],
    ["dashboard", "metrics", "averageOrderValue"],
    ["dashboard", "metrics", "averageOrderValueHint"],
    ["dashboard", "orderActivity", "title"],
    ["dashboard", "orderActivity", "subtitle"],
    ["dashboard", "orderActivity", "viewOrders"],
    ["dashboard", "orderActivity", "emptyTitle"],
    ["dashboard", "orderActivity", "emptyDescription"],
    ["dashboard", "orderActivity", "truncated"],
    ["dashboard", "tableUtilization", "title"],
    ["dashboard", "tableUtilization", "subtitle"],
    ["dashboard", "tableUtilization", "emptyTitle"],
    ["dashboard", "tableUtilization", "emptyDescription"],
    ["dashboard", "tableUtilization", "occupancyDescription"],
    ["dashboard", "tableUtilization", "occupiedLegend"],
    ["dashboard", "tableUtilization", "availableLegend"],
    ["dashboard", "tableUtilization", "activeSessions"],
    ["dashboard", "tableUtilization", "totalTables"],
    ["dashboard", "tableUtilization", "occupiedTables"],
    ["dashboard", "recentOrders", "title"],
    ["dashboard", "recentOrders", "subtitle"],
    ["dashboard", "recentOrders", "status"],
    ["dashboard", "recentOrders", "allStatuses"],
    ["dashboard", "recentOrders", "noMatch"],
    ["dashboard", "recentOrders", "order"],
    ["dashboard", "recentOrders", "table"],
    ["dashboard", "recentOrders", "placed"],
    ["dashboard", "recentOrders", "subtotal"],
    ["dashboard", "recentOrders", "emptyTitle"],
    ["dashboard", "recentOrders", "emptyDescription"],
    ["dashboard", "recentOrders", "subtotalNote"],
    ["dashboard", "recentOrders", "truncated"],
    ["dashboard", "branchPerformance", "title"],
    ["dashboard", "branchPerformance", "subtitle"],
    ["dashboard", "branchPerformance", "viewBranches"],
    ["dashboard", "branchPerformance", "branch"],
    ["dashboard", "branchPerformance", "orders"],
    ["dashboard", "branchPerformance", "activeOrders"],
    ["dashboard", "branchPerformance", "activeSessions"],
    ["dashboard", "branchPerformance", "occupancy"],
    ["dashboard", "branchPerformance", "tables"],
    ["dashboard", "branchPerformance", "tableCount"],
    ["dashboard", "branchPerformance", "scopeNote"],
    ["dashboard", "branchPerformance", "unavailableNote"],
    ["dashboard", "branchPerformance", "emptyTitle"],
    ["dashboard", "branchPerformance", "emptyDescription"],
    ["dashboard", "alerts", "title"],
    ["dashboard", "alerts", "subtitle"],
    ["dashboard", "alerts", "emptyTitle"],
    ["dashboard", "alerts", "emptyDescription"],
    ["dashboard", "alerts", "pending", "title"],
    ["dashboard", "alerts", "pending", "description"],
    ["dashboard", "alerts", "pending", "link"],
    ["dashboard", "alerts", "ready", "title"],
    ["dashboard", "alerts", "ready", "description"],
    ["dashboard", "alerts", "ready", "link"],
    ["dashboard", "alerts", "waitlist", "title"],
    ["dashboard", "alerts", "waitlist", "description"],
    ["dashboard", "alerts", "waitlist", "truncated"],
    ["dashboard", "alerts", "waitlist", "link"],
    ["dashboard", "alerts", "occupied", "title"],
    ["dashboard", "alerts", "occupied", "description"],
    ["dashboard", "alerts", "occupied", "link"],
    ["dashboard", "sales", "title"],
    ["dashboard", "sales", "description"],
    ["dashboard", "sales", "badge"],
    ["dashboard", "sales", "note"],
    ["status", "pending"],
    ["status", "accepted"],
    ["status", "preparing"],
    ["status", "ready"],
    ["status", "served"],
    ["status", "completed"],
    ["status", "cancelled"],
  ];

  for (const dictionary of dictionaries) {
    for (const path of paths) {
      assert.equal(
        hasString(dictionary.value, path),
        true,
        `${dictionary.locale}:${path.join(".")}`,
      );
    }
  }
});

test("dashboard labels are localized rather than copied from English", () => {
  const en = dictionaries[0]?.value.dashboard;
  const id = dictionaries[1]?.value.dashboard;

  assert.notEqual(en.title, id.title);
  assert.notEqual(en.metrics.totalOrders, id.metrics.totalOrders);
  assert.notEqual(en.orderActivity.title, id.orderActivity.title);
  assert.notEqual(en.branchPerformance.title, id.branchPerformance.title);
  assert.notEqual(en.sales.description, id.sales.description);
  assert.match(en.alerts.pending.description, /\{count, plural,/);
  assert.match(id.alerts.pending.description, /\{count, plural,/);
  assert.match(en.alerts.waitlist.description, /\{guests, plural,/);
  assert.match(id.alerts.waitlist.description, /\{guests, plural,/);
});
