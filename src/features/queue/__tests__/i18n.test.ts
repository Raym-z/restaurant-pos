import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { QUEUE_ERROR_CODES } from "../errors";

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

test("all queue UI keys exist in both locales", () => {
  const paths = [
    ["queue", "title"],
    ["queue", "description"],
    ["queue", "loadErrorTitle"],
    ["queue", "errorTitle"],
    ["queue", "unauthorizedTitle"],
    ["queue", "unauthorizedDescription"],
    ["queue", "readOnlyBadge"],
    ["queue", "readOnlyNotice"],
    ["queue", "refresh"],
    ["queue", "lastRefreshed"],
    ["queue", "autoRefresh"],
    ["queue", "staleTitle"],
    ["queue", "staleDescription"],
    ["queue", "loading"],
    ["queue", "filters", "searchLabel"],
    ["queue", "filters", "searchPlaceholder"],
    ["queue", "filters", "apply"],
    ["queue", "filters", "statusLabel"],
    ["queue", "filters", "all"],
    ["queue", "filters", "waiting"],
    ["queue", "filters", "notified"],
    ["queue", "summary", "pageEntries"],
    ["queue", "summary", "waiting"],
    ["queue", "summary", "notified"],
    ["queue", "summary", "activeScope"],
    ["queue", "summary", "filteredScope"],
    ["queue", "entry", "ariaLabel"],
    ["queue", "entry", "position"],
    ["queue", "entry", "unnamed"],
    ["queue", "entry", "partySize"],
    ["queue", "entry", "elapsed"],
    ["queue", "entry", "lessThanMinute"],
    ["queue", "entry", "joinedAt"],
    ["queue", "entry", "notifiedAt"],
    ["queue", "entry", "phoneLabel"],
    ["queue", "entry", "noPhone"],
    ["queue", "entry", "maskedPhone"],
    ["queue", "entry", "source", "customer"],
    ["queue", "entry", "source", "walk_in"],
    ["queue", "empty", "title"],
    ["queue", "empty", "description"],
    ["queue", "empty", "filteredTitle"],
    ["queue", "empty", "filteredDescription"],
    ["queue", "empty", "pageTitle"],
    ["queue", "empty", "pageDescription"],
    ["queue", "empty", "backToFirst"],
    ["queue", "pagination", "page"],
    ["queue", "pagination", "liveBadge"],
    ["queue", "pagination", "notLive"],
    ["queue", "pagination", "backToLive"],
    ["queue", "pagination", "autoPaused"],
    ["status", "waiting"],
    ["status", "notified"],
  ];

  for (const dictionary of dictionaries) {
    for (const path of paths) {
      assert.equal(hasPath(dictionary.value, path), true, `${dictionary.locale}:${path.join(".")}`);
    }
  }
});

test("every queue error code has a localized message", () => {
  for (const dictionary of dictionaries) {
    for (const code of QUEUE_ERROR_CODES) {
      assert.equal(
        hasPath(dictionary.value, ["queue", "errors", code]),
        true,
        `${dictionary.locale}:${code}`,
      );
    }
  }
});

test("page-scoped summary and live-page labels are localized in both languages", () => {
  for (const dictionary of dictionaries) {
    const queue = dictionary.value.queue;

    assert.match(queue.summary.pageEntries, /\{count, plural,/, dictionary.locale);
    assert.match(queue.summary.activeScope, /this page|halaman ini/, dictionary.locale);
    assert.match(queue.summary.filteredScope, /this page|halaman ini/, dictionary.locale);
    assert.match(queue.pagination.notLive, /\{page\}/, dictionary.locale);
    assert.match(queue.pagination.notLive, /live|langsung/, dictionary.locale);
    assert.match(queue.pagination.autoPaused, /paused|dijeda/, dictionary.locale);
    assert.match(queue.pagination.liveBadge, /live|langsung/i, dictionary.locale);
    assert.match(queue.pagination.backToLive, /live|langsung/i, dictionary.locale);
  }

  // English and Indonesian must not accidentally share the same wording.
  assert.notEqual(dictionaries[0]?.value.queue.pagination.liveBadge, undefined);
  assert.notEqual(
    dictionaries[0]?.value.queue.pagination.liveBadge,
    dictionaries[1]?.value.queue.pagination.liveBadge,
  );
});
