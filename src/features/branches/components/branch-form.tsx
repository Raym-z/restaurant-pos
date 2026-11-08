"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

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
import type { Branch, BranchInput, BusinessHours, Weekday } from "../types";
import { WEEKDAYS } from "../types";
import { validateBranch } from "../validation";

const DAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

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
    country: "United States",
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
    const nextErrors = validateBranch(input, branches, branch?.id);
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
          <p>Review the highlighted fields before saving. Nothing has been changed yet.</p>
        </div>
      ) : null}

      <Card className="space-y-6 p-5 sm:p-6">
        <FormSection
          title="Branch details"
          description="The name, code, and operating status shown across the POS."
        >
          <FormGrid>
            <FormField label="Branch name" htmlFor="branch-name" required error={errors.name}>
              <Input
                id="branch-name"
                value={input.name}
                onChange={(event) => patch({ name: event.target.value })}
                aria-invalid={Boolean(errors.name)}
                placeholder="Downtown"
              />
            </FormField>
            <FormField
              label="Branch code"
              htmlFor="branch-code"
              required
              error={errors.code}
              description="Uppercase letters, numbers, and hyphens."
            >
              <Input
                id="branch-code"
                value={input.code}
                onChange={(event) => patch({ code: event.target.value.toUpperCase() })}
                aria-invalid={Boolean(errors.code)}
                placeholder="PDX-DT"
              />
            </FormField>
            <FormField label="Status" htmlFor="branch-status" required error={errors.status}>
              <Select
                id="branch-status"
                value={input.status}
                onChange={(event) => patch({ status: event.target.value as Branch["status"] })}
              >
                <option value="active">Active</option>
                <option value="opening_soon">Opening soon</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
            <FormField
              label="Opening date"
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
              />
            </FormField>
            <FormField
              label="Branch manager"
              htmlFor="branch-manager"
              error={errors.managerId}
              description="Only staff with a branch manager assignment are listed."
            >
              <Select
                id="branch-manager"
                value={input.managerId ?? ""}
                onChange={(event) => patch({ managerId: event.target.value || null })}
              >
                <option value="">Unassigned</option>
                {managerCandidates.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Contact" description="Guest-facing contact details for this location.">
          <FormGrid>
            <FormField
              label="Phone"
              htmlFor="branch-phone"
              required
              error={errors.phone}
              description="E.164 format, for example +15035550142."
            >
              <Input
                id="branch-phone"
                type="tel"
                value={input.phone}
                onChange={(event) => patch({ phone: event.target.value })}
                aria-invalid={Boolean(errors.phone)}
                placeholder="+15035550142"
              />
            </FormField>
            <FormField label="Email" htmlFor="branch-email" required error={errors.email}>
              <Input
                id="branch-email"
                type="email"
                value={input.email}
                onChange={(event) => patch({ email: event.target.value })}
                aria-invalid={Boolean(errors.email)}
                placeholder="downtown@terraceandvine.example"
              />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField
              label="Street address"
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
                placeholder="1210 NW Everett Street"
              />
            </FormField>
            <FormField
              label="Address line 2"
              htmlFor="branch-address-2"
              error={errors.addressLine2}
              className="sm:col-span-2"
            >
              <Input
                id="branch-address-2"
                value={input.addressLine2}
                onChange={(event) => patch({ addressLine2: event.target.value })}
                placeholder="Suite, floor, unit (optional)"
              />
            </FormField>
            <FormField label="City" htmlFor="branch-city" required error={errors.city}>
              <Input
                id="branch-city"
                value={input.city}
                onChange={(event) => patch({ city: event.target.value })}
                aria-invalid={Boolean(errors.city)}
              />
            </FormField>
            <FormField
              label="State or region"
              htmlFor="branch-region"
              required
              error={errors.region}
            >
              <Input
                id="branch-region"
                value={input.region}
                onChange={(event) => patch({ region: event.target.value })}
                aria-invalid={Boolean(errors.region)}
              />
            </FormField>
            <FormField
              label="Postal code"
              htmlFor="branch-postal-code"
              required
              error={errors.postalCode}
            >
              <Input
                id="branch-postal-code"
                value={input.postalCode}
                onChange={(event) => patch({ postalCode: event.target.value })}
                aria-invalid={Boolean(errors.postalCode)}
              />
            </FormField>
            <FormField label="Country" htmlFor="branch-country" required error={errors.country}>
              <Input
                id="branch-country"
                value={input.country}
                onChange={(event) => patch({ country: event.target.value })}
                aria-invalid={Boolean(errors.country)}
              />
            </FormField>
            <FormField
              label="Timezone"
              htmlFor="branch-timezone"
              required
              error={errors.timezone}
              description="IANA timezone, for example America/Los_Angeles."
            >
              <Input
                id="branch-timezone"
                value={input.timezone}
                onChange={(event) => patch({ timezone: event.target.value })}
                aria-invalid={Boolean(errors.timezone)}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Business hours"
          description="Local branch time. Use 00:00 as the closing time for midnight."
        >
          <div className="space-y-2">
            {WEEKDAYS.map((day) => {
              const hours = input.businessHours.find((entry) => entry.day === day);
              if (!hours) {
                return null;
              }
              return (
                <div
                  key={day}
                  className="grid grid-cols-[minmax(90px,1fr)_auto_1fr_1fr] items-center gap-2 rounded-lg border border-line bg-surface-subtle px-3 py-2"
                >
                  <span className="text-sm font-medium text-ink">{DAY_LABELS[day]}</span>
                  <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={hours.isClosed}
                      onChange={(event) => patchHours(day, { isClosed: event.target.checked })}
                      className="size-4 rounded border-line-strong accent-brand"
                    />
                    Closed
                  </label>
                  <div>
                    <label htmlFor={`hours-${day}-open`} className="sr-only">
                      {DAY_LABELS[day]} opening time
                    </label>
                    <Input
                      id={`hours-${day}-open`}
                      type="time"
                      value={hours.open ?? ""}
                      disabled={hours.isClosed}
                      onChange={(event) => patchHours(day, { open: event.target.value })}
                      aria-invalid={Boolean(errors[`hours.${day}.open`])}
                      className="h-9"
                    />
                    {errors[`hours.${day}.open`] ? (
                      <p role="alert" className="mt-1 text-xs text-danger">
                        {errors[`hours.${day}.open`]}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor={`hours-${day}-close`} className="sr-only">
                      {DAY_LABELS[day]} closing time
                    </label>
                    <Input
                      id={`hours-${day}-close`}
                      type="time"
                      value={hours.close ?? ""}
                      disabled={hours.isClosed}
                      onChange={(event) => patchHours(day, { close: event.target.value })}
                      aria-invalid={Boolean(errors[`hours.${day}.close`])}
                      className="h-9"
                    />
                    {errors[`hours.${day}.close`] ? (
                      <p role="alert" className="mt-1 text-xs text-danger">
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
            Cancel
          </Button>
          <Button type="submit">{branch ? "Save changes" : "Create branch"}</Button>
        </FormActions>
      </Card>
    </form>
  );
}
