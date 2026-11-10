import assert from "node:assert/strict";
import test from "node:test";

import { tableBelongsToBranch, tableSelectionMode } from "../table-selection";

const BRANCH_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_BRANCH_ID = "00000000-0000-4000-8000-000000000002";
const SESSION_ID = "00000000-0000-4000-8000-000000000011";

test("an available table opens a new session", () => {
  assert.equal(
    tableSelectionMode({
      status: "active",
      availability: "available",
      activeSessionId: null,
    }),
    "open",
  );
});

test("an occupied table resumes its existing session", () => {
  assert.equal(
    tableSelectionMode({
      status: "active",
      availability: "occupied",
      activeSessionId: SESSION_ID,
    }),
    "resume",
  );
});

test("an already-active session never triggers a duplicate open", () => {
  // Even if availability lags, the active session id makes resume authoritative.
  assert.equal(
    tableSelectionMode({
      status: "active",
      availability: "available",
      activeSessionId: SESSION_ID,
    }),
    "resume",
  );
});

test("a closed session leaves the table ready for a new session", () => {
  // A closed session has no activeSessionId; the table is available again.
  assert.equal(
    tableSelectionMode({
      status: "active",
      availability: "available",
      activeSessionId: null,
    }),
    "open",
  );
});

test("inactive or unavailable tables are blocked", () => {
  assert.equal(
    tableSelectionMode({
      status: "inactive",
      availability: "inactive",
      activeSessionId: null,
    }),
    "blocked",
  );
});

test("branch isolation rejects tables from another branch", () => {
  assert.equal(tableBelongsToBranch({ branchId: BRANCH_ID }, BRANCH_ID), true);
  assert.equal(tableBelongsToBranch({ branchId: OTHER_BRANCH_ID }, BRANCH_ID), false);
});
