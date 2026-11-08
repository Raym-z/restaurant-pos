import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNextPath } from "../redirect";

test("accepts internal paths including query strings", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/branches?view=active"), "/branches?view=active");
  assert.equal(safeNextPath("/menu/items/abc#pricing"), "/menu/items/abc#pricing");
});

test("rejects external, protocol-relative, backslash, and login-loop paths", () => {
  assert.equal(safeNextPath("https://evil.example"), "/dashboard");
  assert.equal(safeNextPath("//evil.example"), "/dashboard");
  assert.equal(safeNextPath("\\\\evil.example"), "/dashboard");
  assert.equal(safeNextPath("/\\evil.example"), "/dashboard");
  assert.equal(safeNextPath("/login"), "/dashboard");
  assert.equal(safeNextPath("/login?reason=session_expired"), "/dashboard");
  assert.equal(safeNextPath(null), "/dashboard");
  assert.equal(safeNextPath(undefined), "/dashboard");
});

test("rejects dot-segment and encoded normalization bypasses", () => {
  assert.equal(safeNextPath("/..//evil.com"), "/dashboard");
  assert.equal(safeNextPath("/%2e%2e//evil.com"), "/dashboard");
  assert.equal(safeNextPath("/%2e//evil.com"), "/dashboard");
  assert.equal(safeNextPath("/%2f%2fevil.com"), "/dashboard");
  assert.equal(safeNextPath("/%252f%252fevil.com"), "/dashboard");
  assert.equal(safeNextPath("/%25252f%25252fevil.com"), "/dashboard");
  assert.equal(safeNextPath("/%5cevil.com"), "/dashboard");
});

test("returns only normalized same-origin relative destinations", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/branches/../dashboard"), "/dashboard");
  assert.equal(safeNextPath("/dashboard?tab=overview"), "/dashboard?tab=overview");
});

test("uses a caller-provided fallback", () => {
  assert.equal(safeNextPath("https://evil.example", "/login"), "/login");
});
