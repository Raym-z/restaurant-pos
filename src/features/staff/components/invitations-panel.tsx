"use client";

import { AlertCircle, Mail, RotateCw, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useRoleLabel, useStatusLabel } from "@/i18n/use-labels";
import { useWorkspace } from "@/providers/workspace-provider";

import { resendStaffInvitationAction, revokeStaffInvitationAction } from "../actions";
import type { StaffInvitation, StaffInvitationStatus } from "../invitation-contracts";
import type { StaffInvitationActionError } from "../invitation-errors";

const STATUS_VARIANTS: Record<StaffInvitationStatus, "success" | "info" | "neutral" | "warning"> = {
  pending: "info",
  accepted: "success",
  revoked: "neutral",
  expired: "warning",
};

interface InvitationsPanelProps {
  invitations: StaffInvitation[];
  loadError: StaffInvitationActionError | null;
}

export function InvitationsPanel({ invitations, loadError }: InvitationsPanelProps) {
  const t = useTranslations("staff.invitations");
  const tCommon = useTranslations("common");
  const roleLabel = useRoleLabel();
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const { branches, organization } = useWorkspace();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const branchById = new Map(branches.map((branch) => [branch.id, branch]));

  async function run(
    invitationId: string,
    action: () => Promise<{ ok: true } | { ok: false; error: StaffInvitationActionError }>,
    successMessage: string,
  ) {
    setPendingId(invitationId);
    setError(null);
    setNotice(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setNotice(successMessage);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-ink-subtle" aria-hidden="true" />
          {t("title")}
        </CardTitle>
        <p className="text-xs text-ink-subtle">{t("retentionNote")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        {notice ? (
          <p role="status" className="rounded-lg bg-success-soft/50 px-3 py-2 text-sm text-ink">
            {notice}
          </p>
        ) : null}

        {loadError ? (
          <p className="rounded-lg bg-warning-soft/50 px-3 py-2 text-sm text-ink">
            {t("loadError")}
          </p>
        ) : null}

        {!loadError && invitations.length === 0 ? (
          <EmptyState
            bordered={false}
            compact
            icon={Mail}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : null}

        {invitations.length > 0 ? (
          <ul className="divide-y divide-line">
            {invitations.map((invitation) => {
              const canResend = invitation.status === "pending";
              const canRevoke = invitation.status === "pending" || invitation.status === "expired";
              const branchLabel =
                invitation.scope === "organization"
                  ? tCommon("organizationWide")
                  : (branchById.get(invitation.branchId ?? "")?.name ?? t("unknownBranch"));

              return (
                <li
                  key={invitation.invitationId}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {invitation.displayName}
                    </p>
                    <p className="truncate text-xs text-ink-subtle">{invitation.email}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {roleLabel(invitation.roleCode)} · {branchLabel}
                    </p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {t("expires", {
                        date: format.dateOnly(invitation.expiresAt, organization.timezone),
                      })}
                      {invitation.sendCount > 1
                        ? ` · ${t("sentCount", { count: invitation.sendCount })}`
                        : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[invitation.status]}>
                      {statusLabel(invitation.status)}
                    </Badge>

                    {canResend ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={pendingId === invitation.invitationId}
                        onClick={() =>
                          run(
                            invitation.invitationId,
                            () => resendStaffInvitationAction(invitation.invitationId),
                            t("resendSuccess"),
                          )
                        }
                      >
                        <RotateCw />
                        {t("resend")}
                      </Button>
                    ) : null}

                    {canRevoke ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        isLoading={pendingId === invitation.invitationId}
                        onClick={() =>
                          run(
                            invitation.invitationId,
                            () => revokeStaffInvitationAction(invitation.invitationId),
                            t("revokeSuccess"),
                          )
                        }
                      >
                        <XCircle />
                        {t("revoke")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
