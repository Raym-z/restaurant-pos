"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

import { demoSignInAction } from "../demo-actions";
import {
  INITIAL_DEMO_LOGIN_STATE,
  validateDemoCredentials,
  type DemoLoginErrorCode,
} from "../demo-login";

interface DemoLoginFormProps {
  next: string;
}

/**
 * Email-and-password form for the public demo entry point.
 *
 * Sign-in runs in a Server Action so the Supabase session is written to the
 * existing HttpOnly cookies. The browser never handles session tokens.
 */
export function DemoLoginForm({ next }: DemoLoginFormProps) {
  const t = useTranslations("auth.demo");
  const tErrors = useTranslations("auth.demo.errors");

  const [state, formAction, pending] = useActionState(demoSignInAction, INITIAL_DEMO_LOGIN_STATE);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<DemoLoginErrorCode | null>(null);

  const serverError = state.status === "error" ? state.error : null;
  const error = clientError ?? (pending ? null : serverError);
  const emailInvalid =
    error === "invalid_email" || error === "invalid_credentials" || error === "email_not_confirmed";
  const passwordInvalid = error === "password_required" || error === "invalid_credentials";

  return (
    <form
      action={formAction}
      className="space-y-5"
      noValidate
      onSubmit={() => {
        const validation = validateDemoCredentials(email, password);
        setClientError(validation.ok ? null : validation.error);
      }}
    >
      <input type="hidden" name="next" value={next} />

      <FormField label={t("fields.email")} htmlFor="demo-login-email" required>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <Input
            id="demo-login-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("emailPlaceholder")}
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setClientError(null);
            }}
            aria-invalid={emailInvalid || undefined}
            aria-describedby={error ? "demo-login-error" : undefined}
            className="pl-9"
          />
        </div>
      </FormField>

      <FormField label={t("fields.password")} htmlFor="demo-login-password" required>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <Input
            id="demo-login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setClientError(null);
            }}
            aria-invalid={passwordInvalid || undefined}
            aria-describedby={error ? "demo-login-error" : undefined}
            className="pr-11 pl-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>

      {error ? (
        <div
          id="demo-login-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{tErrors(error)}</p>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" isLoading={pending}>
        {pending ? t("signingIn") : t("signIn")}
        {pending ? null : <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  );
}
