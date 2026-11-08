import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizePosError } from "../errors";

test("backend application codes are preserved from P0001 messages", () => {
  const error = normalizePosError({
    code: "P0001",
    message: "SESSION_BALANCE_OUTSTANDING",
    details: "All orders must be completed or cancelled before the dining session can close",
  });

  assert.equal(error.code, "SESSION_BALANCE_OUTSTANDING");
  assert.match(error.message, /completed or cancelled/);
  assert.equal(error.retryable, false);
});

test("permission and conflict database codes are normalized", () => {
  assert.equal(normalizePosError({ code: "42501" }).code, "PERMISSION_DENIED");
  assert.equal(normalizePosError({ code: "23505" }).code, "RESOURCE_CONFLICT");
  assert.equal(normalizePosError({ code: "PGRST116" }).code, "NOT_FOUND");
});

test("network and server failures are retryable", () => {
  const network = normalizePosError({ name: "TypeError", message: "fetch failed" });
  assert.equal(network.code, "SERVICE_UNAVAILABLE");
  assert.equal(network.retryable, true);

  const server = normalizePosError({ status: 503, message: "upstream unavailable" });
  assert.equal(server.code, "SERVICE_UNAVAILABLE");
  assert.equal(server.retryable, true);
});

test("unknown failures fall back to a non-retryable internal error", () => {
  const error = normalizePosError({ code: "XX000", message: "unexpected" });
  assert.equal(error.code, "INTERNAL_ERROR");
  assert.equal(error.retryable, false);
});
