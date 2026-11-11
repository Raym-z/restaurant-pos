"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, LogIn, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  ACCEPT_INVITATION_PATH,
  buildAcceptInvitationHref,
  buildInvitationSignInHref,
  invitationErrorMessageKey,
  parseInvitationFragment,
  type InvitationFragmentResult,
} from "../invitation-auth";
import {
  acceptInvitationAction,
  establishInvitationSessionAction,
} from "../accept-invitation-actions";
import { isInvitationToken } from "../invitation-token";

type AcceptanceState =
  | { kind: "checking" }
  | { kind: "handoff" }
  | { kind: "sign_in" }
  | { kind: "success"; organizationId: string; roleCode: string }
  | {
      kind: "error";
      code: string;
      message: string;
      retryable: boolean;
      authenticated: boolean;
      email: string | null;
    };

interface AcceptInvitationScreenProps {
  token: string | null;
}

export function AcceptInvitationScreen({ token }: AcceptInvitationScreenProps) {
  const t = useTranslations("auth.acceptInvitation");
  const validToken = isInvitationToken(token);
  const [state, setState] = useState<AcceptanceState>(() =>
    validToken
      ? { kind: "checking" }
      : {
          kind: "error",
          code: "MISSING_TOKEN",
          message: t("missingToken"),
          retryable: false,
          authenticated: false,
          email: null,
        },
  );
  const [attempt, setAttempt] = useState(0);
  const [signingIn, setSigningIn] = useState(false);

  const signInHref = useMemo(() => buildInvitationSignInHref(token), [token]);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const fragmentRef = useRef<InvitationFragmentResult | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!validToken) {
      return;
    }

    // A retry runs after the previous request has settled; never start a second
    // request while one is still in flight (Strict Mode runs effects twice).
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;

    const acceptanceHref = buildAcceptInvitationHref(token);

    void (async () => {
      try {
        // Parse once per mount. The error branch removes the fragment from the
        // URL, so a repeated effect run must not fall through to acceptance.
        const fragment =
          fragmentRef.current ?? (fragmentRef.current = parseInvitationFragment(window.location.hash));

        if (fragment.kind === "error") {
          window.history.replaceState(null, "", acceptanceHref);
          if (mountedRef.current) {
            setState({
              kind: "error",
              code: "INVALID_SESSION_LINK",
              message: t("invalidSessionLink"),
              retryable: false,
              authenticated: false,
              email: null,
            });
          }
          return;
        }

        if (fragment.kind === "session") {
          if (mountedRef.current) {
            setState({ kind: "handoff" });
          }

          const established = await establishInvitationSessionAction({
            accessToken: fragment.accessToken,
            refreshToken: fragment.refreshToken,
          });

          if (!mountedRef.current) {
            return;
          }

          if (!established.ok) {
            window.history.replaceState(null, "", acceptanceHref);
            setState({
              kind: "error",
              code: "INVALID_SESSION_LINK",
              message: t("invalidSessionLink"),
              retryable: false,
              authenticated: false,
              email: null,
            });
            return;
          }

          // Reload without the fragment so the server can read the new HttpOnly
          // session and run the authoritative acceptance RPC.
          window.location.replace(acceptanceHref);
          return;
        }

        if (mountedRef.current) {
          setState({ kind: "checking" });
        }

        const result = await acceptInvitationAction(token);

        if (!mountedRef.current) {
          return;
        }

        if (result.kind === "sign_in") {
          setState({ kind: "sign_in" });
          return;
        }

        if (result.kind === "accepted") {
          // The invitation is single-use and consumed; remove it from history.
          window.history.replaceState(null, "", ACCEPT_INVITATION_PATH);
          setState({
            kind: "success",
            organizationId: result.organizationId,
            roleCode: result.roleCode,
          });
          return;
        }

        setState({
          kind: "error",
          code: result.error.code,
          message:
            result.error.code === "INVALID_RESPONSE" ? t("invalidResponse") : result.error.message,
          retryable: result.error.retryable,
          authenticated: result.authenticated,
          email: result.email,
        });
      } catch {
        if (mountedRef.current) {
          setState({
            kind: "error",
            code: "SERVICE_UNAVAILABLE",
            message: t("errorServiceUnavailable"),
            retryable: true,
            authenticated: false,
            email: null,
          });
        }
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [attempt, t, token, validToken]);

  const retry = () => {
    setState({ kind: "checking" });
    setAttempt((value) => value + 1);
  };

  const errorMessageKey =
    state.kind === "error" ? invitationErrorMessageKey(state.code) : null;
  const errorMessage =
    state.kind === "error" ? (errorMessageKey ? t(errorMessageKey) : state.message) : "";

  return (
    <Card className="w-full max-w-md space-y-6 p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("title")}</h1>
        <p className="text-sm leading-6 text-ink-muted">{t("description")}</p>
      </div>

      {state.kind === "checking" || state.kind === "handoff" ? (
        <div role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {state.kind === "handoff" ? t("finishingSignIn") : t("accepting")}
        </div>
      ) : null}

      {state.kind === "sign_in" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-ink">
            <LogIn className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{t("signInRequired")}</p>
          </div>
          <Button asChild className="w-full" aria-busy={signingIn || undefined}>
            <Link href={signInHref} onClick={() => setSigningIn(true)}>
              {signingIn ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <LogIn aria-hidden="true" />
              )}
              {signingIn ? t("signingIn") : t("signIn")}
            </Link>
          </Button>
          <p className="text-xs leading-5 text-ink-subtle">{t("signInHelp")}</p>
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
            <div className="space-y-1">
              <p>{errorMessage}</p>
              {state.authenticated && state.email ? (
                <p className="text-xs text-ink-muted">{t("signedInAs", { email: state.email })}</p>
              ) : null}
            </div>
          </div>

          {state.retryable ? (
            <Button type="button" className="w-full" onClick={retry}>
              <RotateCw aria-hidden="true" />
              {t("retry")}
            </Button>
          ) : null}

          {state.authenticated ? (
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard">{t("goToDashboard")}</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="w-full">
              <Link href={signInHref}>{t("backToLogin")}</Link>
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
