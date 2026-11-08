import type { Branch, BranchStatus } from "./types";

export interface BranchFilters {
  query: string;
  status: BranchStatus | "all";
}

export function filterBranches(branches: Branch[], { query, status }: BranchFilters): Branch[] {
  const normalized = query.trim().toLowerCase();
  return branches.filter((branch) => {
    if (status !== "all" && branch.status !== status) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return [branch.name, branch.code, branch.city, branch.region, branch.email].some((value) =>
      value.toLowerCase().includes(normalized),
    );
  });
}
