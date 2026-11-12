import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeQueueError } from "../errors";

test("P0001 application codes are read from the message", () => {
  const result = normalizeQueueError({
    code: "P0001",
    status: 400,
    message: "PERMISSION_DENIED",
    details: "Branch role is not permitted",
  });

  assert.equal(result.code, "PERMISSION_DENIED");
  assert.equal(result.message, "Branch role is not permitted");
  assert.equal(result.retryable, false);
});

test("validation and not-found errors map to safe queue messages", () => {
  assert.equal(
    normalizeQueueError({ message: "VALIDATION_ERROR", details: "Page size must be positive" })
      .code,
    "VALIDATION_ERROR",
  );
  assert.equal(normalizeQueueError({ code: "22P02", status: 400 }).code, "VALIDATION_ERROR");
  assert.equal(normalizeQueueError({ code: "PGRST116", status: 406 }).code, "VALIDATION_ERROR");
  assert.equal(normalizeQueueError({ code: "42501", status: 403 }).code, "PERMISSION_DENIED");
});

test("transient transport failures are retryable", () => {
  const result = normalizeQueueError({ code: "503", status: 503, message: "Service unavailable" });

  assert.equal(result.code, "SERVICE_UNAVAILABLE");
  assert.equal(result.retryable, true);
});

test("unknown failures never expose raw database details", () => {
  const result = normalizeQueueError({ code: "XX000", status: 400 });

  assert.equal(result.code, "INTERNAL_ERROR");
  assert.equal(result.retryable, false);
  assert.equal(result.message, "The queue could not be loaded.");
});
