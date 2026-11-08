"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import type { Branch, BranchInput } from "@/features/branches/types";
import type { Organization, OrganizationProfileInput } from "@/features/organization/types";
import type { StaffUser, WorkspaceSnapshot } from "@/types/workspace";

import {
  createWorkspaceState,
  getActiveBranch,
  persistActiveBranchId,
  readStoredActiveBranchId,
  workspaceReducer,
} from "./workspace-state";

export interface WorkspaceContextValue {
  organization: Organization;
  user: StaffUser;
  planLabel: string;
  branches: Branch[];
  activeBranch: Branch;
  activeBranchId: string;
  setActiveBranch: (branchId: string) => void;
  updateOrganization: (input: OrganizationProfileInput) => void;
  addBranch: (input: BranchInput) => Branch;
  updateBranch: (branchId: string, input: BranchInput) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  workspace: WorkspaceSnapshot;
  children: React.ReactNode;
}

function nowInstant(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Client-side workspace context for the application shell.
 *
 * This provider is the single source of truth for the mock organization,
 * current user, branch collection, and active branch. Feature data providers
 * consume this context instead of keeping a second branch collection.
 *
 * This is deliberately mock-backed in Phase 1. In Phase 2 it should be fed by
 * the authenticated staff session and server-validated organization/branch
 * access. Switching branches here is a UI preference only; every backend
 * operation must still be authorized server-side.
 */
export function WorkspaceProvider({ workspace, children }: WorkspaceProviderProps) {
  const [state, dispatch] = useReducer(workspaceReducer, workspace, createWorkspaceState);

  // Restore a previously selected branch after hydration. The server and first
  // client render use the snapshot default so hydration output stays stable.
  useEffect(() => {
    const stored = readStoredActiveBranchId(window.localStorage);
    if (stored) {
      dispatch({ type: "setActiveBranch", branchId: stored });
    }
  }, []);

  const setActiveBranch = useCallback(
    (branchId: string) => {
      if (!state.branches.some((branch) => branch.id === branchId)) {
        return;
      }
      dispatch({ type: "setActiveBranch", branchId });
      persistActiveBranchId(window.localStorage, branchId);
    },
    [state.branches],
  );

  const updateOrganization = useCallback((input: OrganizationProfileInput) => {
    dispatch({ type: "updateOrganization", input });
  }, []);

  const addBranch = useCallback(
    (input: BranchInput) => {
      const branch: Branch = {
        ...input,
        id: crypto.randomUUID(),
        organizationId: state.organization.id,
        createdAt: nowInstant(),
      };
      dispatch({ type: "addBranch", branch });
      return branch;
    },
    [state.organization.id],
  );

  const updateBranch = useCallback((branchId: string, input: BranchInput) => {
    dispatch({ type: "updateBranch", branchId, input });
  }, []);

  const activeBranch = getActiveBranch(state);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      organization: state.organization,
      user: state.user,
      planLabel: state.planLabel,
      branches: state.branches,
      activeBranch,
      activeBranchId: state.activeBranchId,
      setActiveBranch,
      updateOrganization,
      addBranch,
      updateBranch,
    }),
    [
      state.organization,
      state.user,
      state.planLabel,
      state.branches,
      state.activeBranchId,
      activeBranch,
      setActiveBranch,
      updateOrganization,
      addBranch,
      updateBranch,
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
