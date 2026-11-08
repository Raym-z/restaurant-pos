import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SessionStateScreen } from "@/features/auth/components/session-state-screen";
import { getWorkspace } from "@/features/workspace/services";
import { WorkspaceProvider } from "@/providers/workspace-provider";

/**
 * Authenticated application shell.
 *
 * The proxy performs an optimistic session refresh, but this layout performs
 * the authoritative server-side check and loads the RLS-protected workspace
 * before rendering any staff screen.
 */
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const result = await getWorkspace();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "auth_error") {
    if (result.error.confirmedAuthFailure) {
      redirect("/login?reason=session_expired");
    }

    return <SessionStateScreen variant="auth-unavailable" />;
  }

  if (result.status === "no_active_staff") {
    return <SessionStateScreen variant="no-active-staff" />;
  }

  if (result.status === "no_roles") {
    return <SessionStateScreen variant="no-roles" />;
  }

  if (result.status === "no_branches") {
    return (
      <SessionStateScreen
        variant="no-branches"
        organizationName={result.organization.name}
        displayName={result.user.displayName}
      />
    );
  }

  if (result.status === "error") {
    return <SessionStateScreen variant="workspace-error" />;
  }

  return (
    <WorkspaceProvider workspace={result.workspace}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
