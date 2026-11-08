/**
 * Pure workspace state transitions.
 *
 * Keeping workspace mutations in a reducer makes the shared branch collection
 * testable and guarantees the shell switcher and feature screens read the same
 * data. The provider adds browser persistence and ID generation; this module
 * stays free of React and browser globals.
 *
 * Branch selection is a client-side preference only. It never grants access:
 * all backend operations must still be authorized server-side.
 */

import type { Branch, BranchInput } from "@/features/branches/types";
import type { Organization, OrganizationProfileInput } from "@/features/organization/types";
import type { StaffUser, WorkspaceSnapshot } from "@/types/workspace";

export const ACTIVE_BRANCH_STORAGE_KEY = "restaurant-pos.active-branch-id";

export interface WorkspaceState {
  organization: Organization;
  branches: Branch[];
  user: StaffUser;
  planLabel: string;
  activeBranchId: string;
}

export type WorkspaceAction =
  | { type: "setActiveBranch"; branchId: string }
  | { type: "updateOrganization"; input: OrganizationProfileInput }
  | { type: "addBranch"; branch: Branch }
  | { type: "updateBranch"; branchId: string; input: BranchInput };

/**
 * Resolves a usable branch id from a stored/default candidate.
 *
 * Persisted preferences can outlive branch data, so invalid values fall back to
 * the provided fallback and then to the first available branch.
 */
export function resolveActiveBranchId(
  candidate: string | null | undefined,
  branches: readonly Branch[],
  fallback?: string | null,
): string {
  if (candidate && branches.some((branch) => branch.id === candidate)) {
    return candidate;
  }
  if (fallback && branches.some((branch) => branch.id === fallback)) {
    return fallback;
  }
  return branches[0]?.id ?? "";
}

export function createWorkspaceState(snapshot: WorkspaceSnapshot): WorkspaceState {
  const activeBranchId = resolveActiveBranchId(snapshot.defaultBranchId, snapshot.branches);

  if (!activeBranchId) {
    throw new Error("WorkspaceProvider requires at least one accessible branch.");
  }

  return {
    organization: snapshot.organization,
    branches: snapshot.branches,
    user: snapshot.user,
    planLabel: snapshot.planLabel,
    activeBranchId,
  };
}

export function getActiveBranch(state: WorkspaceState): Branch {
  const branch = state.branches.find((entry) => entry.id === state.activeBranchId);
  if (!branch) {
    throw new Error("Workspace active branch must exist in the branch collection.");
  }
  return branch;
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "setActiveBranch": {
      if (!state.branches.some((branch) => branch.id === action.branchId)) {
        return state;
      }
      return { ...state, activeBranchId: action.branchId };
    }
    case "updateOrganization":
      return {
        ...state,
        organization: { ...state.organization, ...action.input },
      };
    case "addBranch":
      return {
        ...state,
        branches: [...state.branches, action.branch],
        activeBranchId: state.activeBranchId || action.branch.id,
      };
    case "updateBranch":
      return {
        ...state,
        branches: state.branches.map((branch) =>
          branch.id === action.branchId ? { ...branch, ...action.input } : branch,
        ),
      };
    default:
      return state;
  }
}

/** Reads the persisted branch id without touching global state. */
export function readStoredActiveBranchId(
  storage: Pick<Storage, "getItem"> | null | undefined,
): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persists the selected branch id, ignoring unavailable storage. */
export function persistActiveBranchId(
  storage: Pick<Storage, "setItem"> | null | undefined,
  branchId: string,
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(ACTIVE_BRANCH_STORAGE_KEY, branchId);
  } catch {
    // Storage can be unavailable in private browsing or embedded contexts.
  }
}
