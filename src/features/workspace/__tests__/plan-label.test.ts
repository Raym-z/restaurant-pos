import assert from "node:assert/strict";
import { test } from "node:test";

import { resolvePlanLabel } from "../plan-label";

const plans = [
  { code: "free", name: "Free" },
  { code: "growth", name: "Growth" },
];

test("organization admins see the plan name", () => {
  assert.equal(
    resolvePlanLabel({ isOrgAdmin: true, subscription: { plan_code: "growth" }, plans }),
    "Growth",
  );
});

test("a missing plan row falls back to the stored plan code", () => {
  assert.equal(
    resolvePlanLabel({ isOrgAdmin: true, subscription: { plan_code: "legacy" }, plans }),
    "legacy",
  );
});

test("non-admins never see a plan label", () => {
  assert.equal(
    resolvePlanLabel({ isOrgAdmin: false, subscription: { plan_code: "growth" }, plans }),
    null,
  );
});

test("an unavailable subscription produces no plan label", () => {
  assert.equal(resolvePlanLabel({ isOrgAdmin: true, subscription: null, plans }), null);
});

test("an unavailable plan list still falls back to the plan code", () => {
  assert.equal(
    resolvePlanLabel({ isOrgAdmin: true, subscription: { plan_code: "growth" }, plans: [] }),
    "growth",
  );
});
