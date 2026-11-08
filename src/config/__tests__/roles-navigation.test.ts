import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getNavigationForContext, type NavigationContext } from "../navigation";
import { ROLE_TRANSLATION_KEYS, roleTranslationKey } from "../../i18n/role-keys";
import { STAFF_ROLES, type StaffRole } from "../../types/roles";

const dictionaries = ["en", "id"].map((locale) =>
  JSON.parse(readFileSync(`src/i18n/messages/${locale}.json`, "utf8")),
);

function context(
  roles: readonly StaffRole[],
  overrides: Partial<NavigationContext> = {},
): NavigationContext {
  return {
    roles,
    isOrganizationScoped: roles.includes("owner") || roles.includes("admin"),
    isOrgAdmin: roles.includes("owner") || roles.includes("admin"),
    ...overrides,
  };
}

function navigationHrefs(navigationContext: NavigationContext): string[] {
  return getNavigationForContext(navigationContext).flatMap((section) =>
    section.items.map((item) => item.href),
  );
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
});

test("organization-scoped owner sees every module", () => {
  assert.deepEqual(navigationHrefs(context(["owner"])), [
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
});

test("organization-scoped admin sees every module except billing", () => {
  assert.deepEqual(navigationHrefs(context(["admin"])), [
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
});

test("branch-scoped admin does not receive organization-wide navigation", () => {
  const hrefs = navigationHrefs(
    context(["admin"], { isOrganizationScoped: false, isOrgAdmin: false }),
  );

  assert.ok(!hrefs.includes("/organization"));
  assert.ok(!hrefs.includes("/staff"));
  assert.ok(!hrefs.includes("/billing"));
  assert.ok(hrefs.includes("/branches"));
});

test("manager does not receive staff administration navigation", () => {
  const hrefs = navigationHrefs(context(["manager"]));

  assert.ok(!hrefs.includes("/organization"));
  assert.ok(!hrefs.includes("/staff"));
  assert.ok(!hrefs.includes("/billing"));
  assert.ok(hrefs.includes("/branches"));
  assert.ok(hrefs.includes("/reports"));
});

test("cashier and kitchen navigation remain operational", () => {
  assert.deepEqual(navigationHrefs(context(["cashier"])), [
    "/dashboard",
    "/pos",
    "/orders",
    "/tables",
    "/kitchen",
    "/queue",
    "/menu",
  ]);

  assert.deepEqual(navigationHrefs(context(["kitchen_staff"])), [
    "/dashboard",
    "/orders",
    "/kitchen",
    "/menu",
  ]);
});

test("unavailable modules are marked and never imply functional access", () => {
  const sections = getNavigationForContext(context(["owner"]));
  const items = sections.flatMap((section) => section.items);
  const unavailableHrefs = items
    .filter((item) => item.availability === "unavailable")
    .map((item) => item.href);

  assert.deepEqual(unavailableHrefs.sort(), [
    "/billing",
    "/kitchen",
    "/menu",
    "/pos",
    "/queue",
    "/reports",
    "/settings",
    "/staff",
  ]);

  assert.ok(!unavailableHrefs.includes("/tables"));
  assert.ok(!unavailableHrefs.includes("/orders"));
});

test("navigation never emits unknown role identifiers", () => {
  for (const role of STAFF_ROLES) {
    const sections = getNavigationForContext(context([role]));
    for (const section of sections) {
      for (const item of section.items) {
        for (const allowed of item.access?.roles ?? []) {
          assert.ok(STAFF_ROLES.includes(allowed), `unknown role ${allowed}`);
        }
      }
    }
  }
});
