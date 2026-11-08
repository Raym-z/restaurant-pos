import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dictionaries = ["en", "id"].map((locale) =>
  JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")),
);

function hasPath(value: unknown, path: readonly string[]): boolean {
  let current: unknown = value;
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" && current.length > 0;
}

test("remediation strings exist in both dictionaries", () => {
  const paths = [
    ["common", "closeDialog"],
    ["tables", "detail", "unknownBranch"],
    ["tables", "order", "noOptionsAvailable"],
    ["tables", "order", "payableSubtotal"],
    ["tables", "order", "historicalSubtotal"],
    ["orders", "table", "payableSubtotal"],
    ["orders", "historicalSubtotal"],
    ["orders", "page"],
    ["orders", "detail", "payableSubtotal"],
    ["orders", "detail", "historicalSubtotal"],
    ["orders", "detail", "completedNotSettled"],
    ["pos", "errors", "INVALID_RESPONSE"],
    ["pos", "errors", "IDEMPOTENCY_IN_PROGRESS"],
  ];

  for (const dictionary of dictionaries) {
    for (const path of paths) {
      assert.equal(hasPath(dictionary, path), true, path.join("."));
    }
  }
});
