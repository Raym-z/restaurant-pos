import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { StaffScreen } from "@/features/staff/components/staff-screen";
import { loadStaffInvitations } from "@/features/staff/data/invitations";
import { getWorkspace } from "@/features/workspace/services";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("staff") };
}

export default async function StaffPage() {
  const workspaceResult = await getWorkspace();
  const canManageInvitations =
    workspaceResult.status === "ready" && workspaceResult.workspace.isOrgAdmin;

  if (!canManageInvitations) {
    return <StaffScreen invitations={[]} invitationsError={null} showInvitations={false} />;
  }

  const invitationsResult = await loadStaffInvitations();

  return (
    <StaffScreen
      invitations={invitationsResult.ok ? invitationsResult.invitations : []}
      invitationsError={invitationsResult.ok ? null : invitationsResult.error}
      showInvitations
    />
  );
}
