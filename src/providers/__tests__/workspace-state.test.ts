import assert from "node:assert/strict";
import { test } from "node:test";

import type { Branch } from "../../features/branches/types";
import type { Organization } from "../../features/organization/types";
import {
  ACTIVE_BRANCH_STORAGE_KEY,
  createWorkspaceState,
  getActiveBranch,
  persistActiveBranchId,
  readStoredActiveBranchId,
  resolveActiveBranchId,
  workspaceReducer,
} from "../workspace-state";

function branch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: "branch-1",
    organizationId: "org-1",
    name: "Senopati",
    code: "JKT-SNP",
    addressLine1: "Jl. Senopati No. 8",
    addressLine2: "",
    city: "Jakarta",
    region: "DKI Jakarta",
    postalCode: "12190",
    country: "Indonesia",
    phone: "+62215550142",
    email: "senopati@example.com",
    timezone: "Asia/Jakarta",
    status: "active",
    managerId: null,
    openingDate: "2023-03-14T14:22:00Z",
    businessHours: [],
    createdAt: "2023-03-14T14:22:00Z",
    ...overrides,
  };
}

const organization: Organization = {
  id: "org-1",
  name: "Terrace & Vine",
  slug: "terrace-and-vine",
  legalName: "PT Terrace & Vine",
  description: "Restaurant group.",
  email: "hello@example.com",
  phone: "+62215550118",
  website: "https://example.com",
  timezone: "Asia/Jakarta",
  currency: "IDR",
  address: {
    line1: "Jl. Senopati No. 8",
    line2: "",
    city: "Jakarta",
    region: "DKI Jakarta",
    postalCode: "12190",
    country: "Indonesia",
  },
  status: "active",
  createdAt: "2023-03-14T14:22:00Z",
};

const snapshot = {
  organization,
  branches: [branch(), branch({ id: "branch-2", name: "Dago", city: "Bandung" })],
  user: {
    id: "user-1",
    name: "Amara Okafor",
    email: "amara@example.com",
    role: "owner" as const,
  },
  defaultBranchId: "branch-2",
  planLabel: "Growth plan",
};

test("creates workspace state from the shared snapshot", () => {
  const state = createWorkspaceState(snapshot);

  assert.equal(state.activeBranchId, "branch-2");
  assert.equal(getActiveBranch(state).name, "Dago");
  assert.equal(state.branches.length, 2);
});

test("invalid stored branch ids fall back safely", () => {
  assert.equal(resolveActiveBranchId("missing", snapshot.branches, "branch-1"), "branch-1");
  assert.equal(resolveActiveBranchId(null, snapshot.branches, "branch-2"), "branch-2");
  assert.equal(resolveActiveBranchId(undefined, snapshot.branches), "branch-1");
  assert.equal(resolveActiveBranchId("missing", []), "");
});

test("branch CRUD mutates the same collection used by the shell switcher", () => {
  let state = createWorkspaceState(snapshot);
  const created = branch({ id: "branch-3", name: "Kemang", city: "Jakarta" });

  state = workspaceReducer(state, { type: "addBranch", branch: created });
  assert.equal(state.branches.length, 3);
  assert.equal(state.branches.find((entry) => entry.id === "branch-3")?.name, "Kemang");

  state = workspaceReducer(state, {
    type: "updateBranch",
    branchId: "branch-3",
    input: {
      name: "Kemang Raya",
      code: "JKT-KMG",
      addressLine1: "Jl. Kemang Raya No. 12",
      addressLine2: "",
      city: "Jakarta",
      region: "DKI Jakarta",
      postalCode: "12730",
      country: "Indonesia",
      phone: "+62215550999",
      email: "kemang@example.com",
      timezone: "Asia/Jakarta",
      status: "active",
      managerId: null,
      openingDate: "2026-11-08T12:00:00Z",
      businessHours: [],
    },
  });

  assert.equal(state.branches.find((entry) => entry.id === "branch-3")?.name, "Kemang Raya");
  assert.equal(state.branches.find((entry) => entry.id === "branch-3")?.city, "Jakarta");
});

test("active branch selection only accepts known branches", () => {
  let state = createWorkspaceState(snapshot);

  state = workspaceReducer(state, { type: "setActiveBranch", branchId: "branch-1" });
  assert.equal(state.activeBranchId, "branch-1");

  state = workspaceReducer(state, { type: "setActiveBranch", branchId: "missing" });
  assert.equal(state.activeBranchId, "branch-1");
});

test("organization updates flow through the shared workspace state", () => {
  let state = createWorkspaceState(snapshot);
  state = workspaceReducer(state, {
    type: "updateOrganization",
    input: {
      name: "Terrace & Vine Group",
      legalName: organization.legalName,
      description: organization.description,
      email: organization.email,
      phone: organization.phone,
      website: organization.website,
      timezone: organization.timezone,
      currency: organization.currency,
      address: organization.address,
    },
  });

  assert.equal(state.organization.name, "Terrace & Vine Group");
  assert.equal(state.organization.id, "org-1");
});

test("active branch persistence reads and writes the documented storage key", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };

  persistActiveBranchId(storage, "branch-2");
  assert.equal(values.get(ACTIVE_BRANCH_STORAGE_KEY), "branch-2");
  assert.equal(readStoredActiveBranchId(storage), "branch-2");

  const throwingStorage = {
    getItem: () => {
      throw new Error("unavailable");
    },
    setItem: () => {
      throw new Error("unavailable");
    },
  };

  assert.equal(readStoredActiveBranchId(throwingStorage), null);
  assert.doesNotThrow(() => persistActiveBranchId(throwingStorage, "branch-1"));
});
