import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

import { APP_TIMEZONE } from "@/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { normalizeAuthError, normalizeDatabaseError } from "@/lib/supabase/errors";

import { isOrganizationAdmin } from "./access";
import { ACTIVE_BRANCH_COOKIE } from "./constants";
import { buildWorkspace, mapOrganization, mapRoleAssignments, mapUser } from "./mappers";
import type { WorkspaceLoadResult } from "./types";

type WorkspaceClient = SupabaseClient<Database>;

async function loadPlanLabel(
  supabase: WorkspaceClient,
  organizationId: string,
  orgAdmin: boolean,
): Promise<string | null> {
  if (!orgAdmin) {
    return null;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan_code")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return null;
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("name")
    .eq("code", subscription.plan_code)
    .maybeSingle();

  return plan?.name ?? subscription.plan_code;
}

export async function loadWorkspaceForUser(
  supabase: WorkspaceClient,
  user: User,
  activeBranchCandidate: string | null,
): Promise<WorkspaceLoadResult> {
  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select(
      "id, auth_user_id, organization_id, display_name, status, invited_at, activated_at, deactivated_at, created_at, updated_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { status: "error", error: normalizeDatabaseError(profileError) };
  }

  if (!profile) {
    // RLS hides invited, suspended, and deactivated profiles because the
    // current-staff helper only resolves active staff. The UI must show a
    // generic no-active-staff state until the backend adds a self-read status.
    return { status: "no_active_staff" };
  }

  const [organizationResult, rolesResult, assignmentsResult, branchesResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, default_currency_code, status, deletion_requested_at, deletion_scheduled_for, deleted_at, created_at, updated_at",
      )
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("staff_role_assignments")
      .select("id, staff_id, organization_id, role_code, scope_type, assigned_at, revoked_at")
      .eq("staff_id", profile.id)
      .eq("organization_id", profile.organization_id)
      .is("revoked_at", null),
    supabase
      .from("staff_branch_assignments")
      .select("id, staff_id, organization_id, branch_id, assigned_at, revoked_at")
      .eq("staff_id", profile.id)
      .eq("organization_id", profile.organization_id)
      .is("revoked_at", null),
    supabase
      .from("branches")
      .select(
        "id, organization_id, name, timezone, status, deactivated_at, address, phone, latitude, longitude, waitlist_geolocation_enabled, waitlist_radius_meters, created_at, updated_at",
      )
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (organizationResult.error) {
    return { status: "error", error: normalizeDatabaseError(organizationResult.error) };
  }
  if (!organizationResult.data) {
    return { status: "error", error: normalizeDatabaseError({ code: "PGRST116" }) };
  }
  if (rolesResult.error) {
    return { status: "error", error: normalizeDatabaseError(rolesResult.error) };
  }
  if (assignmentsResult.error) {
    return { status: "error", error: normalizeDatabaseError(assignmentsResult.error) };
  }
  if (branchesResult.error) {
    return { status: "error", error: normalizeDatabaseError(branchesResult.error) };
  }

  const roleRows = rolesResult.data ?? [];
  const roles = mapRoleAssignments(roleRows);
  if (roles.length === 0) {
    return { status: "no_roles" };
  }

  const organizationRow = organizationResult.data;
  const orgAdmin = isOrganizationAdmin(roles);
  const planLabel = await loadPlanLabel(supabase, organizationRow.id, orgAdmin);
  const assignedBranchIds = (assignmentsResult.data ?? []).map((row) => row.branch_id);

  const branches = branchesResult.data ?? [];
  const organization = mapOrganization(organizationRow, branches[0]?.timezone ?? APP_TIMEZONE);
  const mappedUser = mapUser(profile, user.email ?? "", roles);

  if (branches.length === 0) {
    return {
      status: "no_branches",
      organization,
      user: mappedUser,
    };
  }

  const workspace = buildWorkspace({
    organization: organizationRow,
    profile,
    email: user.email ?? "",
    roleRows,
    branchRows: branches,
    assignedBranchIds,
    activeBranchCandidate,
    planLabel,
  });

  if (!workspace) {
    return { status: "no_branches", organization, user: mappedUser };
  }

  return { status: "ready", workspace };
}

/**
 * Request-scoped workspace loader. `cache` deduplicates calls within one
 * server render without caching tenant data across requests.
 */
export const getWorkspace = cache(async (): Promise<WorkspaceLoadResult> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { status: "auth_error", error: normalizeAuthError(authError) };
  }

  if (!user) {
    return { status: "unauthenticated" };
  }

  const cookieStore = await cookies();
  const activeBranchCandidate = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value ?? null;

  return loadWorkspaceForUser(supabase, user, activeBranchCandidate);
});
