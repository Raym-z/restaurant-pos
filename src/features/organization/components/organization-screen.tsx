"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Building2 } from "lucide-react";

import { PageHeader, PageStack } from "@/components/layout/page";
import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateOnly } from "@/features/shared/format";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { ValidationErrors } from "@/features/shared/validation";
import type { OrganizationProfileInput } from "../types";
import { validateOrganizationProfile } from "../validation";

export function OrganizationScreen() {
  const { organization, branches, staff, menuItems, updateOrganization } = useMockData();
  const [input, setInput] = useState<OrganizationProfileInput>({
    name: organization.name,
    legalName: organization.legalName,
    description: organization.description,
    email: organization.email,
    phone: organization.phone,
    website: organization.website,
    timezone: organization.timezone,
    currency: organization.currency,
    address: { ...organization.address },
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saved, setSaved] = useState(false);

  function patch(changes: Partial<OrganizationProfileInput>) {
    setInput((current) => ({ ...current, ...changes }));
    setSaved(false);
  }

  function patchAddress(changes: Partial<OrganizationProfileInput["address"]>) {
    setInput((current) => ({
      ...current,
      address: { ...current.address, ...changes },
    }));
    setSaved(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateOrganizationProfile(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaved(false);
      return;
    }
    updateOrganization(input);
    setSaved(true);
  }

  return (
    <PageStack>
      <PageHeader
        eyebrow="Organization"
        title={organization.name}
        description="Manage the restaurant business profile shared across every branch."
        actions={
          <Badge variant={organization.status === "active" ? "success" : "neutral"}>
            {organization.status === "active" ? "Active" : "Inactive"}
          </Badge>
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="space-y-6 p-5 sm:p-6">
            {saved ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-success/20 bg-success-soft/60 px-4 py-3 text-sm text-success"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Organization profile saved in this mock session.</p>
              </div>
            ) : null}

            {Object.keys(errors).length > 0 ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Review the highlighted fields before saving.</p>
              </div>
            ) : null}

            <FormSection
              title="Business identity"
              description="Shown in the workspace and on organization-level documents."
            >
              <FormGrid>
                <FormField label="Display name" htmlFor="org-name" required error={errors.name}>
                  <Input
                    id="org-name"
                    value={input.name}
                    onChange={(event) => patch({ name: event.target.value })}
                    aria-invalid={Boolean(errors.name)}
                  />
                </FormField>
                <FormField
                  label="Legal name"
                  htmlFor="org-legal-name"
                  required
                  error={errors.legalName}
                >
                  <Input
                    id="org-legal-name"
                    value={input.legalName}
                    onChange={(event) => patch({ legalName: event.target.value })}
                    aria-invalid={Boolean(errors.legalName)}
                  />
                </FormField>
                <FormField
                  label="Description"
                  htmlFor="org-description"
                  error={errors.description}
                  description="Up to 500 characters."
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="org-description"
                    value={input.description}
                    onChange={(event) => patch({ description: event.target.value })}
                    aria-invalid={Boolean(errors.description)}
                    rows={3}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection
              title="Contact and regional settings"
              description="Used as the default currency and timezone for new branches."
            >
              <FormGrid>
                <FormField label="Contact email" htmlFor="org-email" required error={errors.email}>
                  <Input
                    id="org-email"
                    type="email"
                    value={input.email}
                    onChange={(event) => patch({ email: event.target.value })}
                    aria-invalid={Boolean(errors.email)}
                  />
                </FormField>
                <FormField
                  label="Phone"
                  htmlFor="org-phone"
                  required
                  error={errors.phone}
                  description="E.164 format, for example +15035550118."
                >
                  <Input
                    id="org-phone"
                    type="tel"
                    value={input.phone}
                    onChange={(event) => patch({ phone: event.target.value })}
                    aria-invalid={Boolean(errors.phone)}
                  />
                </FormField>
                <FormField label="Website" htmlFor="org-website" error={errors.website}>
                  <Input
                    id="org-website"
                    type="url"
                    value={input.website}
                    onChange={(event) => patch({ website: event.target.value })}
                    aria-invalid={Boolean(errors.website)}
                    placeholder="https://example.com"
                  />
                </FormField>
                <FormField
                  label="Timezone"
                  htmlFor="org-timezone"
                  required
                  error={errors.timezone}
                  description="IANA timezone, for example America/Los_Angeles."
                >
                  <Input
                    id="org-timezone"
                    value={input.timezone}
                    onChange={(event) => patch({ timezone: event.target.value })}
                    aria-invalid={Boolean(errors.timezone)}
                  />
                </FormField>
                <FormField
                  label="Currency"
                  htmlFor="org-currency"
                  required
                  error={errors.currency}
                  description="ISO 4217 code, for example USD."
                >
                  <Input
                    id="org-currency"
                    value={input.currency}
                    onChange={(event) => patch({ currency: event.target.value.toUpperCase() })}
                    aria-invalid={Boolean(errors.currency)}
                    maxLength={3}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection
              title="Business address"
              description="The organization's registered or primary mailing address."
            >
              <FormGrid>
                <FormField
                  label="Street address"
                  htmlFor="org-address-1"
                  required
                  error={errors["address.line1"]}
                  className="sm:col-span-2"
                >
                  <Input
                    id="org-address-1"
                    value={input.address.line1}
                    onChange={(event) => patchAddress({ line1: event.target.value })}
                    aria-invalid={Boolean(errors["address.line1"])}
                  />
                </FormField>
                <FormField label="Address line 2" htmlFor="org-address-2" className="sm:col-span-2">
                  <Input
                    id="org-address-2"
                    value={input.address.line2}
                    onChange={(event) => patchAddress({ line2: event.target.value })}
                    placeholder="Suite, floor, unit (optional)"
                  />
                </FormField>
                <FormField label="City" htmlFor="org-city" required error={errors["address.city"]}>
                  <Input
                    id="org-city"
                    value={input.address.city}
                    onChange={(event) => patchAddress({ city: event.target.value })}
                    aria-invalid={Boolean(errors["address.city"])}
                  />
                </FormField>
                <FormField
                  label="State or region"
                  htmlFor="org-region"
                  required
                  error={errors["address.region"]}
                >
                  <Input
                    id="org-region"
                    value={input.address.region}
                    onChange={(event) => patchAddress({ region: event.target.value })}
                    aria-invalid={Boolean(errors["address.region"])}
                  />
                </FormField>
                <FormField
                  label="Postal code"
                  htmlFor="org-postal-code"
                  required
                  error={errors["address.postalCode"]}
                >
                  <Input
                    id="org-postal-code"
                    value={input.address.postalCode}
                    onChange={(event) => patchAddress({ postalCode: event.target.value })}
                    aria-invalid={Boolean(errors["address.postalCode"])}
                  />
                </FormField>
                <FormField
                  label="Country"
                  htmlFor="org-country"
                  required
                  error={errors["address.country"]}
                >
                  <Input
                    id="org-country"
                    value={input.address.country}
                    onChange={(event) => patchAddress({ country: event.target.value })}
                    aria-invalid={Boolean(errors["address.country"])}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormActions>
              <Button type="submit">Save changes</Button>
            </FormActions>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-ink-subtle" aria-hidden="true" />
                  Workspace summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">Branches</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">{branches.length}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">Staff</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">{staff.length}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">Menu items</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">{menuItems.length}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      Workspace slug
                    </dt>
                    <dd className="mt-0.5 font-mono text-ink">{organization.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      Organization ID
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs break-all text-ink-muted">
                      {organization.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      Created
                    </dt>
                    <dd className="mt-0.5 text-ink">
                      {formatDateOnly(organization.createdAt, organization.timezone)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
                  Identifiers are read-only. In production they are issued and validated by the
                  backend.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageStack>
  );
}
