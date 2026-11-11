"use client";

import { AlertCircle, Mail, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { requestLoginCodeAction } from "../actions";
import { INITIAL_LOGIN_OTP_REQUEST_STATE } from "../otp";
import { LoginCodeForm } from "./login-code-form";

interface LoginFormProps {
  next: string;
  sessionExpired: boolean;
}

/**
 * Passwordless staff sign-in.
 *
 * Step one requests a one-time code for an existing staff account. Step two
 * verifies it and lets the Server Action establish the HttpOnly POS session.
 */
export function LoginForm({ next, sessionExpired }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const [requestState, requestAction, requestPending] = useActionState(
    requestLoginCodeAction,
    INITIAL_LOGIN_OTP_REQUEST_STATE,
  );

  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);

  const codeEmail = requestState.status === "code_sent" ? requestState.email : null;
  const step = codeEmail && !editingEmail ? "verify" : "email";
  const email = emailDraft ?? codeEmail ?? "";

  const requestError = requestState.status === "error" ? requestState.error : null;
  const verifyEmail = codeEmail ?? email;

  return (
    <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("title")}</h1>
        <p className="text-sm leading-6 text-ink-muted">
          {step === "email" ? t("description") : t("verifyDescription", { email: verifyEmail })}
        </p>
      </div>

      {sessionExpired ? (
        <div
          role="status"
          className="rounded-lg border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-ink"
        >
          {t("sessionExpired")}
        </div>
      ) : null}

      {step === "email" ? (
        <>
          <form
            action={requestAction}
            className="space-y-5"
            noValidate
            onSubmit={() => setEditingEmail(false)}
          >
            <input type="hidden" name="next" value={next} />

            <FormField label={t("fields.email")} htmlFor="login-email" required>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmailDraft(event.target.value)}
                aria-invalid={requestError === "invalid_email"}
                aria-describedby={requestError ? "login-error" : undefined}
              />
            </FormField>

            {requestError ? (
              <div
                id="login-error"
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2.5 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{tErrors(requestError)}</p>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={requestPending}>
              <Mail aria-hidden="true" />
              {requestPending ? t("sendingCode") : t("sendCode")}
            </Button>
          </form>

          <p className="flex items-start gap-2 text-xs leading-5 text-ink-subtle">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t("staffOnly")}
          </p>
        </>
      ) : (
        <LoginCodeForm
          email={verifyEmail}
          next={next}
          onChangeEmail={() => {
            setEmailDraft(verifyEmail);
            setEditingEmail(true);
          }}
        />
      )}
    </Card>
  );
}
