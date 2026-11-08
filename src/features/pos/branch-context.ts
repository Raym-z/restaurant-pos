export interface BranchDirectoryEntry {
  id: string;
  name: string;
  timezone: string;
}

/**
 * Resolves display context from the resource's branch, never from whichever
 * branch happens to be active in the header.
 */
export function resolveBranchContext({
  branches,
  branchId,
  fallbackName,
  fallbackTimezone,
}: {
  branches: readonly BranchDirectoryEntry[];
  branchId: string;
  fallbackName?: string | null;
  fallbackTimezone: string;
}): { name: string; timezone: string } {
  const branch = branches.find((entry) => entry.id === branchId);
  return {
    name: branch?.name ?? fallbackName ?? "",
    timezone: branch?.timezone ?? fallbackTimezone,
  };
}
