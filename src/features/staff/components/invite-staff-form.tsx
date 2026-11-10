"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRoleLabel } from "@/i18n/use-labels";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useWorkspace } from "@/providers/workspace-provider";

import { inviteStaffAction } from "../actions";
import {
  CreateStaffInvitationInputSchema,
  invitableRolesFor,
  requiresBranchScope,
  type InvitableRole,
  type StaffInvitation,
} from "../invitation-contracts";

const INITIAL_ROLE: InvitableRole = "manager";

function isInvitableRole(value: string): value is InvitableRole {
  return ["admin", "manager", "cashier", "kitchen_staff"].includes(value);
}

export function InviteStaffForm() {
  const router = useRouter();
  const { branches, activeBranch, user, organization } = useWorkspace();
  const t = useTranslations("staff.form");
  const tInvites = useTranslations("staff.invitations");
  const tCommon = useTranslations("common");
  const roleLabel = useRoleLabel();
  const format = useLocalizedFormat();

  const allowedRoles = useMemo(() => invitableRolesFor(user.roles), [user.roles]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>(allowedRoles[0] ?? INITIAL_ROLE);
  const [scope, setScope] = useState<"organization" | "branch">(
    requiresBranchScope(allowedRoles[0] ?? INITIAL_ROLE) ? "branch" : "organization",
  );
  const [branchId, setBranchId] = useState(activeBranch.id);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<StaffInvitation | null>(null);

  if (allowedRoles.length === 0) {
    return (
      <Card className="p-4">
        <EmptyState
          bordered={false}
          icon={AlertCircle}
          title={t("noPermissionTitle")}
          description={t("noPermissionDescription")}
        />
      </Card>
    );
  }

  function handleRoleChange(nextRole: InvitableRole) {
    setRole(nextRole);
    setScope(requiresBranchScope(nextRole) ? "branch" : "organization");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input = {
      displayName,
      email,
      role,
      scope,
      branchId: scope === "branch" ? branchId : null,
    };

    const parsed = CreateStaffInvitationInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(t("invalidDetails"));
      return;
    }

    setPending(true);
    try {
      const result = await inviteStaffAction(parsed.data);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setSuccess(result.data);
      setDisplayName("");
      setEmail("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <Card className="space-y-6 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-lg border border-success/25 bg-success-soft/50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-medium text-ink">{t("successTitle")}</p>
            <p className="text-sm text-ink-muted">
              {t("successDescription", {
                email: success.email,
                role: roleLabel(success.roleCode),
              })}
            </p>
            <p className="text-xs text-ink-subtle">
              {tInvites("status.pending")} ·{" "}
              {tInvites("expires", {
                date: format.dateOnly(success.expiresAt, organization.timezone),
              })}
            </p>
          </div>
        </div>

        <FormActions>
          <Button asChild variant="secondary">
            <Link href="/staff">{t("backToStaff")}</Link>
          </Button>
          <Button onClick={() => setSuccess(null)}>{t("inviteAnother")}</Button>
        </FormActions>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection
          title={t("sections.profile")}
          description={t("sections.inviteProfileDescription")}
        >
          <FormGrid>
            <FormField label={t("fields.fullName")} htmlFor="invite-name" required>
              <Input
                id="invite-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                maxLength={120}
                required
              />
            </FormField>
            <FormField label={t("fields.email")} htmlFor="invite-email" required>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={320}
                required
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title={t("sections.access")}
          description={t("sections.inviteAccessDescription")}
        >
          <FormGrid>
            <FormField label={t("fields.role")} htmlFor="invite-role" required>
              <Select
                id="invite-role"
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value;
                  if (isInvitableRole(nextRole)) {
                    handleRoleChange(nextRole);
                  }
                }}
              >
                {allowedRoles.map((value) => (
                  <option key={value} value={value}>
                    {roleLabel(value)}
                  </option>
                ))}
              </Select>
            </FormField>

            {role === "admin" ? (
              <FormField
                label={t("fields.scope")}
                htmlFor="invite-scope"
                required
                description={t("hints.inviteScope")}
              >
                <Select
                  id="invite-scope"
                  value={scope}
                  onChange={(event) => {
                    const nextScope = event.target.value;
                    if (nextScope === "organization" || nextScope === "branch") {
                      setScope(nextScope);
                    }
                  }}
                >
                  <option value="organization">{t("scope.organization")}</option>
                  <option value="branch">{t("scope.branch")}</option>
                </Select>
              </FormField>
            ) : null}

            {scope === "branch" ? (
              <FormField label={t("fields.branch")} htmlFor="invite-branch" required>
                <Select
                  id="invite-branch"
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
          </FormGrid>

          <p className="rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
            {scope === "organization" ? t("orgAdminNote") : t("inviteBranchNote")}
          </p>
        </FormSection>

        <FormActions>
          <Button asChild variant="secondary">
            <Link href="/staff">{tCommon("cancel")}</Link>
          </Button>
          <Button type="submit" isLoading={pending}>
            <Send />
            {t("send")}
          </Button>
        </FormActions>
      </Card>
    </form>
  );
}
