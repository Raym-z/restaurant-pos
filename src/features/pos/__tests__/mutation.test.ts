import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveMutationResponse } from "../mutation";

const parse = (value: unknown): { id: string } | null =>
  value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string"
    ? { id: (value as { id: string }).id }
    : null;

test("a successful RPC with a valid response is committed and revalidated", () => {
  const result = resolveMutationResponse({ data: { id: "order-1" }, error: null }, parse);

  assert.equal(result.status, "success");
  assert.equal(result.committed, true);
  assert.equal(result.shouldRevalidate, true);
  if (result.status === "success") {
    assert.equal(result.data.id, "order-1");
  }
});

test("an RPC failure is not committed and is not revalidated", () => {
  const result = resolveMutationResponse(
    { data: null, error: { code: "P0001", message: "ORDER_INVALID_STATUS" } },
    parse,
  );

  assert.equal(result.status, "failed");
  assert.equal(result.committed, false);
  assert.equal(result.shouldRevalidate, false);
});

test("a successful RPC with an unparseable response is uncertain, not failed", () => {
  const result = resolveMutationResponse({ data: { unexpected: true }, error: null }, parse);

  assert.equal(result.status, "uncertain");
  assert.equal(result.committed, true);
  assert.equal(result.shouldRevalidate, true);
  assert.equal(result.error.code, "INVALID_RESPONSE");
  assert.equal(result.error.retryable, false);
});
