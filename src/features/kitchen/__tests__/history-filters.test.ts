import assert from "node:assert/strict";
import { test } from "node:test";

import {
  KITCHEN_HISTORY_MAX_RANGE_DAYS,
  defaultKitchenHistoryRange,
  kitchenHistoryHref,
  parseKitchenHistoryFilters,
  startOfDayInTimeZone,
  todayDateOnly,
} from "../history-filters";
import { uuid } from "./fixtures";

const NOW = new Date("2026-11-10T12:00:00Z");

test("missing history dates default to the last seven local days", () => {
  const result = parseKitchenHistoryFilters({}, "Asia/Jakarta", NOW);

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.deepEqual(defaultKitchenHistoryRange(NOW, "Asia/Jakarta"), {
    fromDate: "2026-11-04",
    toDate: "2026-11-10",
  });
  assert.equal(result.filters.fromDate, "2026-11-04");
  assert.equal(result.filters.toDate, "2026-11-10");
  assert.equal(result.filters.status, "all");
  assert.deepEqual(result.filters.statuses, ["completed", "cancelled"]);
  assert.equal(result.filters.page, 1);
});

test("branch-local date boundaries are converted to UTC instants", () => {
  assert.equal(startOfDayInTimeZone("2026-11-09", "Asia/Jakarta"), "2026-11-08T17:00:00.000Z");
  assert.equal(todayDateOnly(new Date("2026-11-10T16:59:00Z"), "Asia/Jakarta"), "2026-11-10");
  assert.equal(todayDateOnly(new Date("2026-11-10T17:00:00Z"), "Asia/Jakarta"), "2026-11-11");
});

test("branch-local conversion remains correct across daylight-saving changes", () => {
  // 2026-03-08 is the US spring-forward date and 2026-11-01 is the fall-back date.
  assert.equal(startOfDayInTimeZone("2026-03-08", "America/New_York"), "2026-03-08T05:00:00.000Z");
  assert.equal(startOfDayInTimeZone("2026-11-01", "America/New_York"), "2026-11-01T04:00:00.000Z");
  // Jakarta has no daylight saving, so the offset stays constant.
  assert.equal(startOfDayInTimeZone("2026-11-01", "Asia/Jakarta"), "2026-10-31T17:00:00.000Z");
});

test("history requests require both dates and a chronological bounded window", () => {
  assert.deepEqual(parseKitchenHistoryFilters({ from: "2026-11-01" }, "Asia/Jakarta", NOW), {
    ok: false,
    error: "MISSING_RANGE",
  });
  assert.deepEqual(
    parseKitchenHistoryFilters({ from: "2026-11-01", to: "not-a-date" }, "Asia/Jakarta", NOW),
    { ok: false, error: "INVALID_DATE" },
  );
  assert.deepEqual(
    parseKitchenHistoryFilters({ from: "2026-11-10", to: "2026-11-01" }, "Asia/Jakarta", NOW),
    { ok: false, error: "INVALID_RANGE" },
  );
  assert.deepEqual(
    parseKitchenHistoryFilters({ from: "2026-01-01", to: "2026-02-01" }, "Asia/Jakarta", NOW),
    { ok: false, error: "RANGE_TOO_LONG" },
  );

  const maximumWindow = parseKitchenHistoryFilters(
    { from: "2026-01-01", to: "2026-01-31" },
    "Asia/Jakarta",
    NOW,
  );
  assert.equal(maximumWindow.ok, true);
  if (maximumWindow.ok) {
    assert.equal(KITCHEN_HISTORY_MAX_RANGE_DAYS, 31);
    assert.equal(
      maximumWindow.filters.toInstant,
      startOfDayInTimeZone("2026-02-01", "Asia/Jakarta"),
    );
  }
});

test("history statuses and station filters map to the backend request", () => {
  const stationId = uuid(4);
  const result = parseKitchenHistoryFilters(
    {
      from: "2026-11-01",
      to: "2026-11-07",
      status: "cancelled",
      station: stationId,
      page: "3",
    },
    "Asia/Jakarta",
    NOW,
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.filters.status, "cancelled");
  assert.deepEqual(result.filters.statuses, ["cancelled"]);
  assert.equal(result.filters.stationId, stationId);
  assert.equal(result.filters.page, 3);
  assert.equal(
    kitchenHistoryHref({ ...result.filters, page: 2 }),
    `/kitchen/history?from=2026-11-01&to=2026-11-07&status=cancelled&station=${stationId}&page=2`,
  );
});

test("invalid history status and station values are reported", () => {
  assert.deepEqual(
    parseKitchenHistoryFilters(
      { from: "2026-11-01", to: "2026-11-07", status: "served" },
      "Asia/Jakarta",
      NOW,
    ),
    { ok: false, error: "INVALID_STATUS" },
  );
  assert.deepEqual(
    parseKitchenHistoryFilters(
      { from: "2026-11-01", to: "2026-11-07", station: "not-a-uuid" },
      "Asia/Jakarta",
      NOW,
    ),
    { ok: false, error: "INVALID_STATION" },
  );
});
