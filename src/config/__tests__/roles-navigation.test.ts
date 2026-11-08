import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getNavigationForRole } from "../navigation";
import { ROLE_TRANSLATION_KEYS, roleTranslationKey } from "../../i18n/role-keys";
import { STAFF_ROLES, type StaffRole } from "../../types/roles";

const dictionaries = ["en", "id"].map((locale) =>
  JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")),
);

function navigationHrefs(role: StaffRole): string[] {
  return getNavigationForRole(role).flatMap((section) => section.items.map((item) => item.href));
}

test("the role contract contains exactly the five authoritative roles", () => {
  assert.deepEqual([...STAFF_ROLES], ["owner", "admin", "manager", "cashier", "kitchen_staff"]);
  assert.ok(!STAFF_ROLES.includes("org_admin" as StaffRole));
  assert.ok(!STAFF_ROLES.includes("branch_manager" as StaffRole));
  assert.ok(!STAFF_ROLES.includes("kitchen" as StaffRole));
  assert.ok(!STAFF_ROLES.includes("host" as StaffRole));
});

test("every authoritative role has a translation key in both dictionaries", () => {
  for (const role of STAFF_ROLES) {
    const key = roleTranslationKey(role);
    assert.ok(key, `missing translation key for ${role}`);
    assert.equal(ROLE_TRANSLATION_KEYS[role], key);
    for (const dictionary of dictionaries) {
      assert.equal(typeof dictionary.roles[key], "string");
    }
  }

  assert.equal(roleTranslationKey("org_admin"), null);
  assert.equal(roleTranslationKey("branch_manager"), null);
  assert.equal(roleTranslationKey("kitchen"), null);
  assert.equal(roleTranslationKey("host"), null);
});

test("navigation visibility uses the authoritative role identifiers", () => {
  assert.deepEqual(navigationHrefs("owner"), [
    "/dashboard",
    "/pos",
    "/orders",
    "/tables",
    "/kitchen",
    "/queue",
    "/organization",
    "/menu",
    "/staff",
    "/branches",
    "/reports",
    "/billing",
    "/settings",
  ]);

  assert.deepEqual(navigationHrefs("admin"), [
    "/dashboard",
    "/pos",
    "/orders",
    "/tables",
    "/kitchen",
    "/queue",
    "/organization",
    "/menu",
    "/staff",
    "/branches",
    "/reports",
    "/settings",
  ]);

  assert.deepEqual(navigationHrefs("manager"), [
    "/dashboard",
    "/pos",
    "/orders",
    "/tables",
    "/kitchen",
    "/queue",
    "/menu",
    "/staff",
    "/branches",
    "/reports",
    "/settings",
  ]);

  assert.deepEqual(navigationHrefs("cashier"), [
    "/dashboard",
    "/pos",
    "/orders",
    "/tables",
    "/kitchen",
    "/queue",
    "/menu",
  ]);

  assert.deepEqual(navigationHrefs("kitchen_staff"), [
    "/dashboard",
    "/orders",
    "/kitchen",
    "/menu",
  ]);
});

test("navigation never emits legacy role visibility groups", () => {
  for (const role of STAFF_ROLES) {
    const sections = getNavigationForRole(role);
    for (const section of sections) {
      for (const item of section.items) {
        for (const allowed of item.roles ?? []) {
          assert.ok(STAFF_ROLES.includes(allowed), `unknown role ${allowed}`);
        }
      }
    }
  }
});
