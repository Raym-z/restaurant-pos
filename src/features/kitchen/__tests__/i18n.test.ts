import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { KITCHEN_ERROR_CODES } from "../errors";

const dictionaries = ["en", "id"].map((locale) => ({
  locale,
  value: JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")),
}));

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

test("all kitchen UI keys exist in both locales", () => {
  const paths = [
    ["kitchen", "title"],
    ["kitchen", "description"],
    ["kitchen", "loadErrorTitle"],
    ["kitchen", "unauthorizedTitle"],
    ["kitchen", "tabs", "board"],
    ["kitchen", "tabs", "history"],
    ["kitchen", "tabs", "stations"],
    ["kitchen", "board", "station"],
    ["kitchen", "board", "allStations"],
    ["kitchen", "board", "refresh"],
    ["kitchen", "board", "lastRefreshed"],
    ["kitchen", "board", "autoRefresh"],
    ["kitchen", "board", "staleTitle"],
    ["kitchen", "board", "emptyTitle"],
    ["kitchen", "board", "counts", "pending"],
    ["kitchen", "board", "counts", "preparing"],
    ["kitchen", "board", "counts", "ready"],
    ["kitchen", "card", "order"],
    ["kitchen", "card", "minutes"],
    ["kitchen", "actions", "start"],
    ["kitchen", "actions", "markReady"],
    ["kitchen", "actions", "complete"],
    ["kitchen", "feedback", "start"],
    ["kitchen", "feedback", "markReady"],
    ["kitchen", "feedback", "complete"],
    ["kitchen", "history", "title"],
    ["kitchen", "history", "from"],
    ["kitchen", "history", "to"],
    ["kitchen", "history", "status"],
    ["kitchen", "history", "emptyTitle"],
    ["kitchen", "history", "errors", "RANGE_TOO_LONG"],
    ["kitchen", "stations", "title"],
    ["kitchen", "stations", "newStation"],
    ["kitchen", "stations", "deactivateTitle"],
    ["kitchen", "stations", "deactivateWarningRouting"],
    ["kitchen", "stations", "categoryRoutes"],
    ["kitchen", "stations", "itemRoutes"],
  ];

  for (const dictionary of dictionaries) {
    for (const path of paths) {
      assert.equal(hasPath(dictionary.value, path), true, `${dictionary.locale}:${path.join(".")}`);
    }
  }
});

test("every kitchen backend error code has a localized message", () => {
  for (const dictionary of dictionaries) {
    for (const code of KITCHEN_ERROR_CODES) {
      assert.equal(
        hasPath(dictionary.value, ["kitchen", "errors", code]),
        true,
        `${dictionary.locale}:${code}`,
      );
    }
  }
});
