import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDashboardRange,
  parseDashboardRangePreset,
  resolveDashboardTimeZone,
} from "../date-range";

test("today uses the branch-local calendar day in UTC boundaries", () => {
  const range = buildDashboardRange("today", "Asia/Jakarta", new Date("2026-11-13T04:30:00.000Z"));

  assert.equal(range.from, "2026-11-12T17:00:00.000Z");
  assert.equal(range.to, "2026-11-13T17:00:00.000Z");
  assert.equal(range.fromLocalDate, "2026-11-13");
  assert.equal(range.toLocalDate, "2026-11-13");
});

test("seven and thirty day ranges include the local current day", () => {
  const sevenDays = buildDashboardRange("7d", "Asia/Jakarta", new Date("2026-11-13T04:30:00.000Z"));
  assert.equal(sevenDays.from, "2026-11-06T17:00:00.000Z");
  assert.equal(sevenDays.to, "2026-11-13T17:00:00.000Z");
  assert.equal(sevenDays.fromLocalDate, "2026-11-07");
  assert.equal(sevenDays.toLocalDate, "2026-11-13");

  const thirtyDays = buildDashboardRange(
    "30d",
    "Asia/Jakarta",
    new Date("2026-11-13T04:30:00.000Z"),
  );
  assert.equal(thirtyDays.from, "2026-10-14T17:00:00.000Z");
  assert.equal(thirtyDays.to, "2026-11-13T17:00:00.000Z");
  assert.equal(thirtyDays.fromLocalDate, "2026-10-15");
});

test("range boundaries respect daylight-saving transitions", () => {
  const range = buildDashboardRange("7d", "America/New_York", new Date("2026-11-02T12:00:00.000Z"));

  assert.equal(range.from, "2026-10-27T04:00:00.000Z");
  assert.equal(range.to, "2026-11-03T05:00:00.000Z");
});

test("invalid timezones fall back to UTC and invalid presets fall back to today", () => {
  assert.equal(resolveDashboardTimeZone("Not/A_Timezone"), "UTC");
  assert.equal(resolveDashboardTimeZone(null), "UTC");

  const range = buildDashboardRange(
    "today",
    "Not/A_Timezone",
    new Date("2026-11-13T04:30:00.000Z"),
  );
  assert.equal(range.from, "2026-11-13T00:00:00.000Z");
  assert.equal(range.to, "2026-11-14T00:00:00.000Z");

  assert.equal(parseDashboardRangePreset("7d"), "7d");
  assert.equal(parseDashboardRangePreset(["30d"]), "30d");
  assert.equal(parseDashboardRangePreset("quarter"), "today");
  assert.equal(parseDashboardRangePreset(undefined), "today");
});
