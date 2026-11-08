import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCurrencyDelta } from "../format";

test("positive, zero, and negative modifier deltas format with one sign", () => {
  assert.equal(formatCurrencyDelta(5000, "IDR"), "+ Rp 5.000");
  assert.equal(formatCurrencyDelta(0, "IDR"), "Rp 0");
  assert.equal(formatCurrencyDelta(-5000, "IDR"), "− Rp 5.000");
  assert.ok(!formatCurrencyDelta(-5000, "IDR").includes("+"));
});
