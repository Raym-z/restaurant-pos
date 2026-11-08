"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type {
  BranchSummary,
  OrganizationSummary,
  StaffUser,
  WorkspaceSnapshot,
} from "@/types/workspace";

export interface WorkspaceContextValue {
  organization: OrganizationSummary;
  user: StaffUser;
  branches: BranchSummary[];
  activeBranch: BranchSummary;
  setActiveBranch: (branchId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  workspace: WorkspaceSnapshot;
  children: React.ReactNode;
}

/**
 * Client-side workspace context for the application shell.
 *
 * This is deliberately mock-backed in Phase 1. In Phase 2 it should be fed by
 * the authenticated staff session and server-validated organization/branch
 * access. Switching branches here is a UI preference only; every backend
 * operation must still be authorized server-side.
 */
export function WorkspaceProvider({ workspace, children }: WorkspaceProviderProps) {
  const { organization } = workspace;
  const initialBranch =
    organization.branches.find((branch) => branch.id === workspace.defaultBranchId) ??
    organization.branches[0];

  if (!initialBranch) {
    throw new Error("WorkspaceProvider requires at least one accessible branch.");
  }

  const [activeBranchId, setActiveBranchId] = useState(initialBranch.id);

  const setActiveBranch = useCallback(
    (branchId: string) => {
      if (organization.branches.some((branch) => branch.id === branchId)) {
        setActiveBranchId(branchId);
      }
    },
    [organization.branches],
  );

  const activeBranch =
    organization.branches.find((branch) => branch.id === activeBranchId) ?? initialBranch;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organization,
      user: workspace.user,
      branches: organization.branches,
      activeBranch,
      setActiveBranch,
    }),
    [organization, workspace.user, activeBranch, setActiveBranch],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }

  return context;
}
