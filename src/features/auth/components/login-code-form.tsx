"use client";

import { AlertCircle, ArrowLeft, KeyRound, LoaderCircle, MailCheck } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { resendLoginCodeAction, verifyLoginCodeAction } from "../actions";
import {
  INITIAL_LOGIN_OTP_VERIFY_STATE,
  LOGIN_OTP_LENGTH,
  LOGIN_OTP_RESEND_COOLDOWN_SECONDS,
  isLoginOtpComplete,
  sanitizeLoginOtpInput,
  type LoginOtpErrorCode,
} from "../otp";

interface LoginCodeFormProps {
  email: string;
  next: string;
  onChangeEmail: () => void;
}

/**
 * Step two of passwordless sign-in.
 *
 * The code is verified by a Server Action so the resulting Supabase session is
 * immediately written to HttpOnly cookies. The browser never receives or stores
 * the session tokens.
 */
export function LoginCodeForm({ email, next, onChangeEmail }: LoginCodeFormProps) {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const [state, formAction, pending] = useActionState(
    verifyLoginCodeAction,
    INITIAL_LOGIN_OTP_VERIFY_STATE,
  );

  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(LOGIN_OTP_RESEND_COOLDOWN_SECONDS);
  const [resendPending, startResend] = useTransition();
  const [resendNotice, setResendNotice] = useState(false);
  const [resendError, setResendError] = useState<LoginOtpErrorCode | null>(null);
  const [suppressVerifyError, setSuppressVerifyError] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const verifyError = state.status === "error" ? state.error : null;
  const activeError = resendError ?? (suppressVerifyError ? null : verifyError);
  const complete = isLoginOtpComplete(code);

  const handleResend = () => {
    if (cooldown > 0 || resendPending || pending) {
      return;
    }

    setResendNotice(false);
    setResendError(null);

    startResend(async () => {
      const result = await resendLoginCodeAction(email);

      if (result.status === "code_sent") {
        setCooldown(LOGIN_OTP_RESEND_COOLDOWN_SECONDS);
        setResendNotice(true);
        setSuppressVerifyError(true);
        return;
      }

      if (result.status === "error") {
        setResendError(result.error);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
        <span className="inline-flex min-w-0 items-center gap-2">
          <MailCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <span className="truncate">{email}</span>
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          disabled={pending}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("changeEmail")}
        </button>
      </div>

      <form
        action={formAction}
        className="space-y-5"
        noValidate
        onSubmit={() => setSuppressVerifyError(false)}
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <FormField
          label={t("fields.code")}
          htmlFor="login-code"
          description={t("codeHint")}
          required
        >
          <Input
            id="login-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            pattern="[0-9]*"
            maxLength={LOGIN_OTP_LENGTH}
            required
            value={code}
            onChange={(event) => {
              setCode(sanitizeLoginOtpInput(event.target.value));
              setResendNotice(false);
              setResendError(null);
            }}
            aria-invalid={Boolean(activeError)}
            aria-describedby={
              activeError ? "login-code-description login-code-error" : "login-code-description"
            }
            className="text-center text-lg tracking-[0.4em] font-semibold"
          />
        </FormField>

        {activeError ? (
          <div
            id="login-code-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{tErrors(activeError)}</p>
          </div>
        ) : null}

        {resendNotice ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-success/25 bg-success-soft/50 px-3 py-2.5 text-sm text-ink"
          >
            <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            <p>{t("codeResent")}</p>
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending || !complete}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound aria-hidden="true" />
          )}
          {pending ? t("verifying") : t("verify")}
        </Button>
      </form>

      <div className="space-y-3 border-t border-line pt-5">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleResend}
          disabled={cooldown > 0 || resendPending || pending}
        >
          {resendPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {resendPending
            ? t("resending")
            : cooldown > 0
              ? t("resendIn", { seconds: cooldown })
              : t("resend")}
        </Button>

        <p className="text-xs leading-5 text-ink-subtle">{t("codeSecurity")}</p>
      </div>
    </div>
  );
}
