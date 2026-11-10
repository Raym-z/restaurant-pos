"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { acceptStaffInvitation } from "../accept-invitation";
import { isInvitationToken } from "../invitation-token";

type AcceptanceState =
  | { kind: "loading" }
  | { kind: "sign_in" }
  | { kind: "success"; organizationId: string; roleCode: string }
  | { kind: "error"; message: string };

interface AcceptInvitationScreenProps {
  token: string | null;
}

const SESSION_POLL_ATTEMPTS = 8;
const SESSION_POLL_DELAY_MS = 250;

export function AcceptInvitationScreen({ token }: AcceptInvitationScreenProps) {
  const t = useTranslations("auth.acceptInvitation");
  const [state, setState] = useState<AcceptanceState>({ kind: "loading" });

  const signInHref = useMemo(() => {
    if (!isInvitationToken(token)) {
      return "/login";
    }
    return `/login?next=${encodeURIComponent(`/accept-invitation?invitation=${token}`)}`;
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    // Strip the token only after the browser client has had a chance to read the
    // Supabase session from the invite/magic-link redirect fragment.
    const stripTokenFromUrl = () => {
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/accept-invitation");
      }
    };

    async function accept() {
      if (!isInvitationToken(token)) {
        stripTokenFromUrl();
        setState({ kind: "error", message: t("missingToken") });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      let hasSession = false;

      for (let attempt = 0; attempt < SESSION_POLL_ATTEMPTS; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          hasSession = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_DELAY_MS));
      }

      stripTokenFromUrl();

      if (cancelled) {
        return;
      }

      if (!hasSession) {
        setState({ kind: "sign_in" });
        return;
      }

      const result = await acceptStaffInvitation(
        (functionName, args) => supabase.rpc(functionName, args),
        token,
      );

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setState({
          kind: "error",
          message:
            result.error.code === "INVALID_RESPONSE" ? t("invalidResponse") : result.error.message,
        });
        return;
      }

      setState({
        kind: "success",
        organizationId: result.organizationId,
        roleCode: result.roleCode,
      });
    }

    void accept();

    return () => {
      cancelled = true;
    };
  }, [t, token]);

  return (
    <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("title")}</h1>
        <p className="text-sm leading-6 text-ink-muted">{t("description")}</p>
      </div>

      {state.kind === "loading" ? (
        <div role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {t("accepting")}
        </div>
      ) : null}

      {state.kind === "sign_in" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-ink">
            <LogIn className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{t("signInRequired")}</p>
          </div>
          <Button asChild className="w-full">
            <Link href={signInHref}>{t("signIn")}</Link>
          </Button>
        </div>
      ) : null}

      {state.kind === "success" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success-soft/50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-ink">{t("successTitle")}</p>
              <p className="text-sm text-ink-muted">{t("successDescription")}</p>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href="/dashboard">{t("goToDashboard")}</Link>
          </Button>
        </div>
      ) : null}

      {state.kind === "error" ? (
        <div className="space-y-4">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft/50 px-4 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
