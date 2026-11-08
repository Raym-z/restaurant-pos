"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { ValidationErrors } from "@/features/shared/validation";
import { useRoleLabel } from "@/i18n/use-labels";
import type { RoleScope, StaffInput, StaffMember, StaffRole } from "../types";
import { STAFF_ROLES } from "../types";
import { validateStaff } from "../validation";

const BRANCH_ROLES: StaffRole[] = ["manager", "cashier", "kitchen_staff"];

function assignmentFor(
  role: StaffRole,
  scope: RoleScope,
  branchId: string,
): StaffInput["assignments"] {
  if (role === "owner" || scope === "organization") {
    return [{ role, scope: "organization", branchId: null }];
  }
  return [{ role, scope: "branch", branchId }];
}

interface StaffFormProps {
  member?: StaffMember;
}

export function StaffForm({ member }: StaffFormProps) {
  const router = useRouter();
  const { branches, staff, addStaff, updateStaff } = useMockData();
  const t = useTranslations("staff.form");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const roleLabel = useRoleLabel();
  const firstBranchId = branches[0]?.id ?? "";
  const initialAssignment = member?.assignments[0];

  const [fullName, setFullName] = useState(member?.fullName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<StaffRole>(initialAssignment?.role ?? "cashier");
  const [scope, setScope] = useState<RoleScope>(initialAssignment?.scope ?? "branch");
  const [branchId, setBranchId] = useState(initialAssignment?.branchId ?? firstBranchId);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const isOwner = role === "owner";
  const canChooseScope = role === "admin";

  function handleRoleChange(nextRole: StaffRole) {
    setRole(nextRole);
    if (nextRole === "owner") {
      setScope("organization");
    } else if (BRANCH_ROLES.includes(nextRole)) {
      setScope("branch");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const input: StaffInput = {
      fullName,
      email,
      phone,
      assignments: assignmentFor(role, scope, branchId),
    };
    const nextErrors = validateStaff(input, staff, member?.id, tValidation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (member) {
      updateStaff(member.id, input);
      router.push(`/staff/${member.id}`);
      return;
    }

    const created = addStaff(input);
    router.push(`/staff/${created.id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{tCommon("reviewFields")}</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection title={t("sections.profile")} description={t("sections.profileDescription")}>
          <FormGrid>
            <FormField
              label={t("fields.fullName")}
              htmlFor="staff-name"
              required
              error={errors.fullName}
            >
              <Input
                id="staff-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "staff-name-error" : undefined}
                autoComplete="name"
              />
            </FormField>
            <FormField
              label={t("fields.email")}
              htmlFor="staff-email"
              required
              error={errors.email}
            >
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "staff-email-error" : undefined}
                autoComplete="email"
              />
            </FormField>
            <FormField
              label={t("fields.phone")}
              htmlFor="staff-phone"
              required
              error={errors.phone}
              description={t("hints.phone")}
            >
              <Input
                id="staff-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "staff-phone-error" : "staff-phone-description"}
                autoComplete="tel"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title={t("sections.access")} description={t("sections.accessDescription")}>
          <FormGrid>
            <FormField
              label={t("fields.role")}
              htmlFor="staff-role"
              required
              error={errors["assignments.0"]}
            >
              <Select
                id="staff-role"
                value={role}
                onChange={(event) => handleRoleChange(event.target.value as StaffRole)}
                aria-invalid={Boolean(errors["assignments.0"])}
                aria-describedby={errors["assignments.0"] ? "staff-role-error" : undefined}
              >
                {STAFF_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {roleLabel(value)}
                  </option>
                ))}
              </Select>
            </FormField>

            {canChooseScope ? (
              <FormField
                label={t("fields.scope")}
                htmlFor="staff-scope"
                required
                description={t("hints.scope")}
              >
                <Select
                  id="staff-scope"
                  value={scope}
                  onChange={(event) => setScope(event.target.value as RoleScope)}
                  aria-describedby="staff-scope-description"
                >
                  <option value="organization">{t("scope.organization")}</option>
                  <option value="branch">{t("scope.branch")}</option>
                </Select>
              </FormField>
            ) : null}

            {!isOwner && (canChooseScope ? scope === "branch" : true) ? (
              <FormField
                label={t("fields.branch")}
                htmlFor="staff-branch"
                required
                error={errors["assignments.0"]}
              >
                <Select
                  id="staff-branch"
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  aria-invalid={Boolean(errors["assignments.0"])}
                  aria-describedby={errors["assignments.0"] ? "staff-branch-error" : undefined}
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
            {isOwner
              ? t("ownerNote")
              : scope === "organization"
                ? t("orgAdminNote")
                : t("branchNote")}
          </p>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(member ? `/staff/${member.id}` : "/staff")}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit">{member ? t("save") : t("send")}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
