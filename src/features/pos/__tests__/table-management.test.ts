import assert from "node:assert/strict";
import test from "node:test";

import { canManageTables } from "../access";
import { CreateTableResponseSchema, type TableSummary } from "../contracts";
import { resolveMutationResponse } from "../mutation";
import {
  canDeactivateTable,
  filterTables,
  tableOverviewStats,
  validateTableForm,
  type TableAvailabilityFilter,
} from "../table-management";
import type { ValidationTranslator } from "@/features/shared/validation";

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const BRANCH_ID = "00000000-0000-4000-8000-000000000002";
const SESSION_ID = "00000000-0000-4000-8000-000000000003";

function table(overrides: Partial<TableSummary> = {}): TableSummary {
  return {
    tableId: overrides.tableId ?? "00000000-0000-4000-8000-000000000010",
    organizationId: ORG_ID,
    branchId: BRANCH_ID,
    label: overrides.label ?? "Table 1",
    capacity: overrides.capacity ?? 4,
    status: overrides.status ?? "active",
    deactivatedAt: overrides.deactivatedAt ?? null,
    qrPublicId: overrides.qrPublicId ?? null,
    availability: overrides.availability ?? "available",
    activeSessionId: overrides.activeSessionId ?? null,
    activeSessionOpenedAt: overrides.activeSessionOpenedAt ?? null,
  };
}

const translator: ValidationTranslator = (key, values) =>
  key === "required" || key === "maxLength" || key === "invalidTableCapacity"
    ? `${key}:${String(values?.field ?? values?.max ?? "")}`
    : key;

test("table configuration is limited to owner, admin, and manager", () => {
  assert.equal(canManageTables(["owner"]), true);
  assert.equal(canManageTables(["admin"]), true);
  assert.equal(canManageTables(["manager"]), true);
  assert.equal(canManageTables(["cashier"]), false);
  assert.equal(canManageTables(["kitchen_staff"]), false);
  assert.equal(canManageTables(["cashier", "manager"]), true);
});

test("overview stats count total, available, occupied, and inactive tables", () => {
  const stats = tableOverviewStats([
    table({ tableId: "00000000-0000-4000-8000-000000000011" }),
    table({
      tableId: "00000000-0000-4000-8000-000000000012",
      availability: "occupied",
      activeSessionId: SESSION_ID,
    }),
    table({
      tableId: "00000000-0000-4000-8000-000000000013",
      status: "inactive",
      availability: "inactive",
      deactivatedAt: "2026-11-09T08:00:00.000Z",
    }),
  ]);

  assert.deepEqual(stats, {
    total: 3,
    available: 1,
    occupied: 1,
    inactive: 1,
  });
});

test("search matches labels and session identifiers", () => {
  const tables = [
    table({ tableId: "00000000-0000-4000-8000-000000000011", label: "Patio A" }),
    table({
      tableId: "00000000-0000-4000-8000-000000000012",
      label: "Window",
      activeSessionId: SESSION_ID,
      availability: "occupied",
    }),
  ];

  assert.deepEqual(
    filterTables(tables, "patio", "all").map((entry) => entry.label),
    ["Patio A"],
  );
  assert.deepEqual(
    filterTables(tables, SESSION_ID.slice(0, 8), "all").map((entry) => entry.label),
    ["Window"],
  );
});

test("availability filter includes inactive tables", () => {
  const tables = [
    table({ tableId: "00000000-0000-4000-8000-000000000011", label: "Active" }),
    table({
      tableId: "00000000-0000-4000-8000-000000000012",
      label: "Closed",
      status: "inactive",
      availability: "inactive",
    }),
  ];

  for (const filter of ["all", "available", "inactive"] as TableAvailabilityFilter[]) {
    const labels = filterTables(tables, "", filter).map((entry) => entry.label);
    if (filter === "all") assert.deepEqual(labels, ["Active", "Closed"]);
    if (filter === "available") assert.deepEqual(labels, ["Active"]);
    if (filter === "inactive") assert.deepEqual(labels, ["Closed"]);
  }
});

test("table deactivation is blocked for occupied or already-inactive tables", () => {
  assert.equal(canDeactivateTable(table()), true);
  assert.equal(
    canDeactivateTable({
      status: "active",
      activeSessionId: SESSION_ID,
    }),
    false,
  );
  assert.equal(
    canDeactivateTable({
      status: "inactive",
      activeSessionId: null,
    }),
    false,
  );
});

test("table form requires a label and an integer capacity inside backend limits", () => {
  assert.deepEqual(validateTableForm({ label: "Table 4", capacity: "4" }, translator), {});

  const missing = validateTableForm({ label: " ", capacity: "" }, translator);
  assert.ok(missing.label);
  assert.ok(missing.capacity);

  assert.ok(validateTableForm({ label: "Table", capacity: "0" }, translator).capacity);
  assert.ok(validateTableForm({ label: "Table", capacity: "32768" }, translator).capacity);
  assert.ok(validateTableForm({ label: "Table", capacity: "2.5" }, translator).capacity);
  assert.ok(validateTableForm({ label: "x".repeat(81), capacity: "4" }, translator).label);
});

test("table mutation responses distinguish success, failure, and uncertainty", () => {
  const parse = (value: unknown) => {
    const parsed = CreateTableResponseSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  };

  const success = resolveMutationResponse(
    {
      data: {
        tableId: "00000000-0000-4000-8000-000000000010",
        branchId: BRANCH_ID,
        qrPublicId: "00000000-0000-4000-8000-000000000099",
      },
      error: null,
    },
    parse,
  );
  assert.equal(success.status, "success");
  assert.equal(success.committed, true);

  const failure = resolveMutationResponse(
    {
      data: null,
      error: { message: "TABLE_NOT_FOUND", details: "Table was not found" },
    },
    parse,
  );
  assert.equal(failure.status, "failed");
  assert.equal(failure.error.code, "TABLE_NOT_FOUND");
  assert.equal(failure.committed, false);

  const uncertain = resolveMutationResponse({ data: { tableId: "invalid" }, error: null }, parse);
  assert.equal(uncertain.status, "uncertain");
  assert.equal(uncertain.error.code, "INVALID_RESPONSE");
  assert.equal(uncertain.committed, true);
});
