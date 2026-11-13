import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardFiles = [
  "src/features/dashboard/services.ts",
  "src/features/dashboard/aggregation.ts",
  "src/features/dashboard/date-range.ts",
  "src/features/dashboard/viewer.ts",
];

test("the dashboard reads through approved branch-scoped RPCs", () => {
  const service = readFileSync("src/features/dashboard/services.ts", "utf8");

  for (const rpc of [
    "list_branch_orders",
    "list_branch_tables",
    "list_branch_dining_sessions",
    "list_waitlist_entries",
  ]) {
    assert.match(service, new RegExp(`\\.rpc\\(\\s*"${rpc}"`), `dashboard service must use ${rpc}`);
  }

  assert.match(service, /viewer\.branches\.map/);
  assert.match(service, /p_from: range\.from/);
  assert.match(service, /p_to: range\.to/);
});

test("the dashboard does not query organization-wide tables or use privileged credentials", () => {
  for (const file of dashboardFiles) {
    const source = readFileSync(file, "utf8");

    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|service_role/i, file);
    assert.doesNotMatch(source, /\.from\(\s*["']orders["']\s*\)/, file);
    assert.doesNotMatch(source, /\.from\(\s*["']bills["']\s*\)/, file);
    assert.doesNotMatch(source, /\.from\(\s*["']payments["']\s*\)/, file);
    assert.doesNotMatch(source, /\.from\(\s*["']waitlist_entries["']\s*\)/, file);
    assert.doesNotMatch(source, /setInterval|postgres_changes|subscribe\(/, file);
  }
});

test("queue alerts are role-gated before the queue RPC is called", () => {
  const service = readFileSync("src/features/dashboard/services.ts", "utf8");
  const queueCheck = service.indexOf("canViewQueue(viewer.roles)");
  const queueCall = service.indexOf('rpc("list_waitlist_entries"');

  assert.ok(queueCheck >= 0);
  assert.ok(queueCall > queueCheck);
  assert.match(service, /return \{ available: false, reason: "role" \}/);
});

test("sales metrics are explicitly unavailable and not derived from order subtotals", () => {
  const aggregation = readFileSync("src/features/dashboard/aggregation.ts", "utf8");

  assert.match(aggregation, /sales: \{ available: false, reason: "NO_SETTLEMENT_CONTRACT" \}/);
  assert.doesNotMatch(aggregation, /grossSales|netSales|settledPayments|revenueMinor/);
});
