"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMockData } from "@/features/shared/mock-data-provider";
import {
  dateInputToInstant,
  instantToDateInput,
  type ValidationErrors,
} from "@/features/shared/validation";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useStatusLabel } from "@/i18n/use-labels";
import type { Branch, BranchInput, BusinessHours, Weekday } from "../types";
import { WEEKDAYS } from "../types";
import { validateBranch } from "../validation";

function defaultHours(): BusinessHours[] {
  return WEEKDAYS.map((day) => ({
    day,
    isClosed: false,
    open: "11:00",
    close: "22:00",
  }));
}

function emptyBranch(organizationTimezone: string): BranchInput {
  return {
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "Indonesia",
    phone: "",
    email: "",
    timezone: organizationTimezone,
    status: "active",
    managerId: null,
    openingDate: dateInputToInstant(new Date().toISOString().slice(0, 10)),
    businessHours: defaultHours(),
  };
}

function toInput(branch: Branch): BranchInput {
  return {
    name: branch.name,
    code: branch.code,
    addressLine1: branch.addressLine1,
    addressLine2: branch.addressLine2,
    city: branch.city,
    region: branch.region,
    postalCode: branch.postalCode,
    country: branch.country,
    phone: branch.phone,
    email: branch.email,
    timezone: branch.timezone,
    status: branch.status,
    managerId: branch.managerId,
    openingDate: branch.openingDate,
    businessHours: branch.businessHours,
  };
}

interface BranchFormProps {
  branch?: Branch;
}

export function BranchForm({ branch }: BranchFormProps) {
  const router = useRouter();
  const { organization, branches, staff, addBranch, updateBranch } = useMockData();
  const t = useTranslations("branches.form");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const statusLabel = useStatusLabel();
  const format = useLocalizedFormat();
  const [input, setInput] = useState<BranchInput>(() =>
    branch ? toInput(branch) : emptyBranch(organization.timezone),
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const managerCandidates = useMemo(
    () =>
      staff.filter((member) =>
        member.assignments.some(
          (assignment) => assignment.role === "manager" && assignment.scope === "branch",
        ),
      ),
    [staff],
  );

  function patch(patchValue: Partial<BranchInput>) {
    setInput((current) => ({ ...current, ...patchValue }));
  }

  function patchHours(day: Weekday, changes: Partial<BusinessHours>) {
    setInput((current) => ({
      ...current,
      businessHours: current.businessHours.map((entry) =>
        entry.day === day ? { ...entry, ...changes } : entry,
      ),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateBranch(input, branches, branch?.id, tValidation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (branch) {
      updateBranch(branch.id, input);
      router.push(`/branches/${branch.id}`);
      return;
    }

    const created = addBranch(input);
    router.push(`/branches/${created.id}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{tCommon("reviewFieldsNothingChanged")}</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection title={t("sections.details")} description={t("sections.detailsDescription")}>
          <FormGrid>
            <FormField label={t("fields.name")} htmlFor="branch-name" required error={errors.name}>
              <Input
                id="branch-name"
                value={input.name}
                onChange={(event) => patch({ name: event.target.value })}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "branch-name-error" : undefined}
                placeholder={t("placeholders.name")}
              />
            </FormField>
            <FormField
              label={t("fields.code")}
              htmlFor="branch-code"
              required
              error={errors.code}
              description={t("hints.code")}
            >
              <Input
                id="branch-code"
                value={input.code}
                onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
                aria-invalid={Boolean(errors.code)}
                aria-describedby={errors.code ? "branch-code-error" : "branch-code-description"}
                placeholder={t("placeholders.code")}
              />
            </FormField>
            <FormField label={t("fields.status")} htmlFor="branch-status" required>
              <Select
                id="branch-status"
                value={input.status}
                onChange={(event) => patch({ status: event.target.value as Branch["status"] })}
              >
                <option value="active">{statusLabel("active")}</option>
                <option value="opening_soon">{statusLabel("opening_soon")}</option>
                <option value="inactive">{statusLabel("inactive")}</option>
              </Select>
            </FormField>
            <FormField
              label={t("fields.openingDate")}
              htmlFor="branch-opening-date"
              required
              error={errors.openingDate}
            >
              <Input
                id="branch-opening-date"
                type="date"
                value={instantToDateInput(input.openingDate)}
                onChange={(event) => patch({ openingDate: dateInputToInstant(event.target.value) })}
                aria-invalid={Boolean(errors.openingDate)}
                aria-describedby={errors.openingDate ? "branch-opening-date-error" : undefined}
              />
            </FormField>
            <FormField
              label={t("fields.manager")}
              htmlFor="branch-manager"
              error={errors.managerId}
              description={t("hints.manager")}
            >
              <Select
                id="branch-manager"
                value={input.managerId ?? ""}
                onChange={(event) => patch({ managerId: event.target.value || null })}
              >
                <option value="">{tCommon("unassigned")}</option>
                {managerCandidates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title={t("sections.contact")} description={t("sections.contactDescription")}>
          <FormGrid>
            <FormField
              label={t("fields.phone")}
              htmlFor="branch-phone"
              required
              error={errors.phone}
              description={t("hints.phone")}
            >
              <Input
                id="branch-phone"
                type="tel"
                value={input.phone}
                onChange={(event) => patch({ phone: event.target.value })}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "branch-phone-error" : "branch-phone-description"}
                placeholder={t("placeholders.phone")}
              />
            </FormField>
            <FormField
              label={t("fields.email")}
              htmlFor="branch-email"
              required
              error={errors.email}
            >
              <Input
                id="branch-email"
                type="email"
                value={input.email}
                onChange={(event) => patch({ email: event.target.value })}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "branch-email-error" : undefined}
                placeholder={t("placeholders.email")}
              />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField
              label={t("fields.addressLine1")}
              htmlFor="branch-address-1"
              required
              error={errors.addressLine1}
              className="sm:col-span-2"
            >
              <Input
                id="branch-address-1"
                value={input.addressLine1}
                onChange={(event) => patch({ addressLine1: event.target.value })}
                aria-invalid={Boolean(errors.addressLine1)}
                aria-describedby={errors.addressLine1 ? "branch-address-1-error" : undefined}
                placeholder={t("placeholders.addressLine1")}
              />
            </FormField>
            <FormField
              label={t("fields.addressLine2")}
              htmlFor="branch-address-2"
              error={errors.addressLine2}
              description={t("hints.addressLine2")}
              className="sm:col-span-2"
            >
              <Input
                id="branch-address-2"
                value={input.addressLine2}
                onChange={(event) => patch({ addressLine2: event.target.value })}
                aria-describedby="branch-address-2-description"
                placeholder={t("placeholders.addressLine2")}
              />
            </FormField>
            <FormField label={t("fields.city")} htmlFor="branch-city" required error={errors.city}>
              <Input
                id="branch-city"
                value={input.city}
                onChange={(event) => patch({ city: event.target.value })}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "branch-city-error" : undefined}
                placeholder={t("placeholders.city")}
              />
            </FormField>
            <FormField
              label={t("fields.region")}
              htmlFor="branch-region"
              required
              error={errors.region}
            >
              <Input
                id="branch-region"
                value={input.region}
                onChange={(event) => patch({ region: event.target.value })}
                aria-invalid={Boolean(errors.region)}
                aria-describedby={errors.region ? "branch-region-error" : undefined}
                placeholder={t("placeholders.region")}
              />
            </FormField>
            <FormField
              label={t("fields.postalCode")}
              htmlFor="branch-postal-code"
              required
              error={errors.postalCode}
            >
              <Input
                id="branch-postal-code"
                value={input.postalCode}
                onChange={(event) => patch({ postalCode: event.target.value })}
                aria-invalid={Boolean(errors.postalCode)}
                aria-describedby={errors.postalCode ? "branch-postal-code-error" : undefined}
                placeholder={t("placeholders.postalCode")}
              />
            </FormField>
            <FormField
              label={t("fields.country")}
              htmlFor="branch-country"
              required
              error={errors.country}
            >
              <Input
                id="branch-country"
                value={input.country}
                onChange={(event) => patch({ country: event.target.value })}
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "branch-country-error" : undefined}
                placeholder={t("placeholders.country")}
              />
            </FormField>
            <FormField
              label={t("fields.timezone")}
              htmlFor="branch-timezone"
              required
              error={errors.timezone}
              description={t("hints.timezone")}
            >
              <Input
                id="branch-timezone"
                value={input.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
                aria-invalid={Boolean(errors.timezone)}
                aria-describedby={
                  errors.timezone ? "branch-timezone-error" : "branch-timezone-description"
                }
                placeholder={t("placeholders.timezone")}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title={t("sections.hours")} description={t("sections.hoursDescription")}>
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const hours = input.businessHours.find((entry) => entry.day === day);
              if (!hours) {
                return null;
              }
              const dayLabel = format.weekday(day);
              return (
                <div
                  key={day}
                  className="grid grid-cols-[minmax(90px,1fr)_auto_1fr_1fr] items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2"
                >
                  <span className="text-sm font-medium text-ink">{dayLabel}</span>
                  <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={hours.isClosed}
                      onChange={(event) => patchHours(day, { isClosed: event.target.checked })}
                      className="size-4 rounded border-line-strong accent-brand"
                    />
                    {t("closed")}
                  </label>
                  <div>
                    <label htmlFor={`hours-${day}-open`} className="sr-only">
                      {t("openingTime", { day: dayLabel })}
                    </label>
                    <Input
                      id={`hours-${day}-open`}
                      type="time"
                      value={hours.open ?? ""}
                      disabled={hours.isClosed}
                      onChange={(event) => patchHours(day, { open: event.target.value })}
                      aria-invalid={Boolean(errors[`hours.${day}.open`])}
                      aria-describedby={
                        errors[`hours.${day}.open`] ? `hours-${day}-open-error` : undefined
                      }
                      className="h-9"
                    />
                    {errors[`hours.${day}.open`] ? (
                      <p
                        id={`hours-${day}-open-error`}
                        role="alert"
                        className="mt-1 text-xs text-danger"
                      >
                        {errors[`hours.${day}.open`]}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor={`hours-${day}-close`} className="sr-only">
                      {t("closingTime", { day: dayLabel })}
                    </label>
                    <Input
                      id={`hours-${day}-close`}
                      type="time"
                      value={hours.close ?? ""}
                      disabled={hours.isClosed}
                      onChange={(event) => patchHours(day, { close: event.target.value })}
                      aria-invalid={Boolean(errors[`hours.${day}.close`])}
                      aria-describedby={
                        errors[`hours.${day}.close`] ? `hours-${day}-close-error` : undefined
                      }
                      className="h-9"
                    />
                    {errors[`hours.${day}.close`] ? (
                      <p
                        id={`hours-${day}-close-error`}
                        role="alert"
                        className="mt-1 text-xs text-danger"
                      >
                        {errors[`hours.${day}.close`]}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(branch ? `/branches/${branch.id}` : "/branches")}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit">{branch ? t("save") : t("create")}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
