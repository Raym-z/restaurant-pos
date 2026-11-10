import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeKitchenError } from "../errors";

test("published kitchen application codes are preserved with backend explanations", () => {
  const error = normalizeKitchenError({
    message: "KITCHEN_INVALID_TRANSITION",
    details: "The requested kitchen ticket item transition is not permitted",
    code: "P0001",
  });

  assert.deepEqual(error, {
    code: "KITCHEN_INVALID_TRANSITION",
    message: "The requested kitchen ticket item transition is not permitted",
    retryable: false,
  });
});

test("authorization, conflicts, and validation failures are normalized", () => {
  assert.equal(
    normalizeKitchenError({ code: "42501", message: "permission denied" }).code,
    "PERMISSION_DENIED",
  );
  assert.equal(normalizeKitchenError({ code: "23505" }).code, "RESOURCE_CONFLICT");
  assert.equal(
    normalizeKitchenError({ message: "VALIDATION_ERROR", details: "Page size is invalid" }).code,
    "VALIDATION_ERROR",
  );
});

test("transient failures remain retryable without leaking raw backend messages", () => {
  const error = normalizeKitchenError({ status: 503, message: "Service unavailable" });

  assert.equal(error.code, "SERVICE_UNAVAILABLE");
  assert.equal(error.retryable, true);
  assert.match(error.message, /temporarily unavailable/i);
});

test("unknown failures are safely generic", () => {
  const error = normalizeKitchenError(new Error("internal secret detail"));

  assert.equal(error.code, "INTERNAL_ERROR");
  assert.equal(error.retryable, false);
});
