"use client";

import { AlertCircle, Building2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form-field";
import { PageHeader, PageStack } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalizedFormat } from "@/i18n/use-localized-format";
import { useMockData } from "@/features/shared/mock-data-provider";
import type { ValidationErrors } from "@/features/shared/validation";
import type { OrganizationProfileInput } from "../types";
import { validateOrganizationProfile } from "../validation";

export function OrganizationScreen() {
  const { organization, branches, staff, menuItems, updateOrganization } = useMockData();
  const t = useTranslations("organization");
  const tValidation = useTranslations("validation");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const format = useLocalizedFormat();

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
    const nextErrors = validateOrganizationProfile(input, tValidation);
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
        eyebrow={t("eyebrow")}
        title={organization.name}
        description={t("description")}
        actions={
          <Badge variant={organization.status === "active" ? "success" : "neutral"}>
            {tStatus(organization.status)}
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
                <p>{t("saved")}</p>
              </div>
            ) : null}

            {Object.keys(errors).length > 0 ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{tCommon("reviewFields")}</p>
              </div>
            ) : null}

            <FormSection
              title={t("sections.identity")}
              description={t("sections.identityDescription")}
            >
              <FormGrid>
                <FormField
                  label={t("fields.displayName")}
                  htmlFor="org-name"
                  required
                  error={errors.name}
                >
                  <Input
                    id="org-name"
                    value={input.name}
                    onChange={(event) => patch({ name: event.target.value })}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "org-name-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.legalName")}
                  htmlFor="org-legal-name"
                  required
                  error={errors.legalName}
                >
                  <Input
                    id="org-legal-name"
                    value={input.legalName}
                    onChange={(event) => patch({ legalName: event.target.value })}
                    aria-invalid={Boolean(errors.legalName)}
                    aria-describedby={errors.legalName ? "org-legal-name-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.description")}
                  htmlFor="org-description"
                  error={errors.description}
                  description={t("hints.description")}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="org-description"
                    value={input.description}
                    onChange={(event) => patch({ description: event.target.value })}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                      errors.description ? "org-description-error" : "org-description-description"
                    }
                    rows={3}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection
              title={t("sections.contact")}
              description={t("sections.contactDescription")}
            >
              <FormGrid>
                <FormField
                  label={t("fields.contactEmail")}
                  htmlFor="org-email"
                  required
                  error={errors.email}
                >
                  <Input
                    id="org-email"
                    type="email"
                    value={input.email}
                    onChange={(event) => patch({ email: event.target.value })}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "org-email-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.phone")}
                  htmlFor="org-phone"
                  required
                  error={errors.phone}
                  description={t("hints.phone")}
                >
                  <Input
                    id="org-phone"
                    type="tel"
                    value={input.phone}
                    onChange={(event) => patch({ phone: event.target.value })}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "org-phone-error" : "org-phone-description"}
                  />
                </FormField>
                <FormField label={t("fields.website")} htmlFor="org-website" error={errors.website}>
                  <Input
                    id="org-website"
                    type="url"
                    value={input.website}
                    onChange={(event) => patch({ website: event.target.value })}
                    aria-invalid={Boolean(errors.website)}
                    aria-describedby={errors.website ? "org-website-error" : undefined}
                    placeholder={t("placeholders.website")}
                  />
                </FormField>
                <FormField
                  label={t("fields.timezone")}
                  htmlFor="org-timezone"
                  required
                  error={errors.timezone}
                  description={t("hints.timezone")}
                >
                  <Input
                    id="org-timezone"
                    value={input.timezone}
                    onChange={(event) => patch({ timezone: event.target.value })}
                    aria-invalid={Boolean(errors.timezone)}
                    aria-describedby={
                      errors.timezone ? "org-timezone-error" : "org-timezone-description"
                    }
                  />
                </FormField>
                <FormField
                  label={t("fields.currency")}
                  htmlFor="org-currency"
                  required
                  error={errors.currency}
                  description={t("hints.currency")}
                >
                  <Input
                    id="org-currency"
                    value={input.currency}
                    readOnly
                    aria-invalid={Boolean(errors.currency)}
                    aria-describedby={`org-currency-description`}
                    maxLength={3}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormSection
              title={t("sections.address")}
              description={t("sections.addressDescription")}
            >
              <FormGrid>
                <FormField
                  label={t("fields.streetAddress")}
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
                    aria-describedby={errors["address.line1"] ? "org-address-1-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.addressLine2")}
                  htmlFor="org-address-2"
                  description={t("hints.addressLine2")}
                  className="sm:col-span-2"
                >
                  <Input
                    id="org-address-2"
                    value={input.address.line2}
                    onChange={(event) => patchAddress({ line2: event.target.value })}
                    aria-describedby="org-address-2-description"
                    placeholder={t("placeholders.addressLine2")}
                  />
                </FormField>
                <FormField
                  label={t("fields.city")}
                  htmlFor="org-city"
                  required
                  error={errors["address.city"]}
                >
                  <Input
                    id="org-city"
                    value={input.address.city}
                    onChange={(event) => patchAddress({ city: event.target.value })}
                    aria-invalid={Boolean(errors["address.city"])}
                    aria-describedby={errors["address.city"] ? "org-city-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.region")}
                  htmlFor="org-region"
                  required
                  error={errors["address.region"]}
                >
                  <Input
                    id="org-region"
                    value={input.address.region}
                    onChange={(event) => patchAddress({ region: event.target.value })}
                    aria-invalid={Boolean(errors["address.region"])}
                    aria-describedby={errors["address.region"] ? "org-region-error" : undefined}
                  />
                </FormField>
                <FormField
                  label={t("fields.postalCode")}
                  htmlFor="org-postal-code"
                  required
                  error={errors["address.postalCode"]}
                >
                  <Input
                    id="org-postal-code"
                    value={input.address.postalCode}
                    onChange={(event) => patchAddress({ postalCode: event.target.value })}
                    aria-invalid={Boolean(errors["address.postalCode"])}
                    aria-describedby={
                      errors["address.postalCode"] ? "org-postal-code-error" : undefined
                    }
                  />
                </FormField>
                <FormField
                  label={t("fields.country")}
                  htmlFor="org-country"
                  required
                  error={errors["address.country"]}
                >
                  <Input
                    id="org-country"
                    value={input.address.country}
                    onChange={(event) => patchAddress({ country: event.target.value })}
                    aria-invalid={Boolean(errors["address.country"])}
                    aria-describedby={errors["address.country"] ? "org-country-error" : undefined}
                  />
                </FormField>
              </FormGrid>
            </FormSection>

            <FormActions>
              <Button type="submit">{tCommon("saveChanges")}</Button>
            </FormActions>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-ink-subtle" aria-hidden="true" />
                  {t("workspaceSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">{t("branches")}</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">
                      {format.number(branches.length)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">{t("staff")}</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">
                      {format.number(staff.length)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-subtle p-3">
                    <dt className="text-xs text-ink-subtle">{t("menuItems")}</dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">
                      {format.number(menuItems.length)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("identifiers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      {t("slug")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-ink">{organization.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      {t("organizationId")}
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs break-all text-ink-muted">
                      {organization.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
                      {t("created")}
                    </dt>
                    <dd className="mt-0.5 text-ink">
                      {format.dateOnly(organization.createdAt, organization.timezone)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 rounded-lg bg-surface-subtle p-3 text-[13px] leading-5 text-ink-muted">
                  {t("identifiersNote")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </PageStack>
  );
}
