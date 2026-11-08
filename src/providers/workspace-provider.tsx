"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { setActiveBranchAction } from "@/features/workspace/actions";
import { findActiveBranch } from "@/features/workspace/branch-selection";
import type {
  BranchSwitchResult,
  WorkspaceBranch,
  WorkspaceContext,
  WorkspaceOrganization,
  WorkspaceUser,
} from "@/features/workspace/types";

export interface WorkspaceContextValue {
  organization: WorkspaceOrganization;
  user: WorkspaceUser;
  planLabel: string | null;
  branches: WorkspaceBranch[];
  activeBranch: WorkspaceBranch;
  activeBranchId: string;
  assignedBranchIds: string[];
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
  setActiveBranch: (branchId: string) => Promise<BranchSwitchResult>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  workspace: WorkspaceContext;
  children: React.ReactNode;
}

/**
 * Client-side workspace context for the authenticated shell.
 *
 * The initial snapshot comes from server-side, RLS-protected reads. Branch
 * switching is a UI preference validated by a Server Action against the
 * accessible branch collection; it never grants authorization by itself.
 */
export function WorkspaceProvider({ workspace, children }: WorkspaceProviderProps) {
  const [activeBranchId, setActiveBranchId] = useState(workspace.activeBranchId);

  const setActiveBranch = useCallback(async (branchId: string): Promise<BranchSwitchResult> => {
    const result = await setActiveBranchAction(branchId);
    if (result.ok) {
      setActiveBranchId(branchId);
    }
    return result;
  }, []);

  const activeBranch =
    findActiveBranch(activeBranchId, workspace.branches) ?? workspace.activeBranch;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organization: workspace.organization,
      user: workspace.user,
      planLabel: workspace.planLabel,
      branches: workspace.branches,
      activeBranch,
      activeBranchId: activeBranch.id,
      assignedBranchIds: workspace.assignedBranchIds,
      isOrganizationScoped: workspace.isOrganizationScoped,
      isOrgAdmin: workspace.isOrgAdmin,
      setActiveBranch,
    }),
    [
      workspace.organization,
      workspace.user,
      workspace.planLabel,
      workspace.branches,
      workspace.assignedBranchIds,
      workspace.isOrganizationScoped,
      workspace.isOrgAdmin,
      activeBranch,
      setActiveBranch,
    ],
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
