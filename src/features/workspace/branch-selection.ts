import type { WorkspaceBranch } from "./types";

/**
 * Resolves the active branch from a server-validated cookie candidate.
 *
 * The candidate must be one of the branches returned by the RLS-protected
 * `branches` query. Persisted values that are no longer accessible fall back
 * to the first accessible branch.
 */
export function resolveActiveBranchId(
  candidate: string | null | undefined,
  branches: readonly WorkspaceBranch[],
): string | null {
  if (candidate && branches.some((branch) => branch.id === candidate)) {
    return candidate;
  }

  return branches[0]?.id ?? null;
}

export function findActiveBranch(
  activeBranchId: string | null,
  branches: readonly WorkspaceBranch[],
): WorkspaceBranch | null {
  if (!activeBranchId) {
    return branches[0] ?? null;
  }

  return branches.find((branch) => branch.id === activeBranchId) ?? branches[0] ?? null;
}
