import { AppShell } from "@/components/layout/app-shell";
import { MockDataProvider } from "@/features/shared/mock-data-provider";
import { mockWorkspace } from "@/lib/mock/workspace";
import { WorkspaceProvider } from "@/providers/workspace-provider";

/**
 * Authenticated application shell.
 *
 * Phase 1 intentionally uses a mock workspace snapshot because authentication
 * and backend authorization contracts are not finalized. Phase 2 must replace
 * `mockWorkspace` with the authenticated staff session and server-validated
 * organization/branch access. Never treat this client context as security.
 */
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider workspace={mockWorkspace}>
      <MockDataProvider>
        <AppShell>{children}</AppShell>
      </MockDataProvider>
    </WorkspaceProvider>
  );
}
