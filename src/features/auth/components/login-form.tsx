"use client";

import { AlertCircle, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { signInAction, type LoginActionState } from "../actions";

const INITIAL_STATE: LoginActionState = { error: null };

interface LoginFormProps {
  next: string;
  sessionExpired: boolean;
}

export function LoginForm({ next, sessionExpired }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const [state, formAction, pending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("title")}</h1>
        <p className="text-sm leading-6 text-ink-muted">{t("description")}</p>
      </div>

      {sessionExpired ? (
        <div
          role="status"
          className="rounded-lg border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-ink"
        >
          {t("sessionExpired")}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />

        <FormField label={t("fields.email")} htmlFor="login-email" required>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={state.error === "invalid_credentials"}
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </FormField>

        <FormField label={t("fields.password")} htmlFor="login-password" required>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.error === "invalid_credentials"}
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </FormField>

        {state.error ? (
          <div
            id="login-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{tErrors(state.error)}</p>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          <LogIn aria-hidden="true" />
          {pending ? t("pending") : t("submit")}
        </Button>
      </form>

      <p className="text-xs leading-5 text-ink-subtle">{t("staffOnly")}</p>
    </Card>
  );
}
