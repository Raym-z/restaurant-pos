"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { DEMO_CREDENTIALS } from "../demo-credentials";

type DemoCredentialField = "email" | "password";

/**
 * Sticky-note presentation of the demo account.
 *
 * The values are display-only and come from the single `DEMO_CREDENTIALS`
 * constant. They are never submitted automatically.
 */
export function DemoCredentialsNote() {
  const t = useTranslations("auth.demo");

  const [copied, setCopied] = useState<DemoCredentialField | null>(null);
  const [copyFailed, setCopyFailed] = useState<DemoCredentialField | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyValue = async (field: DemoCredentialField) => {
    try {
      await navigator.clipboard.writeText(DEMO_CREDENTIALS[field]);
      setCopyFailed(null);
      setCopied(field);
    } catch {
      setCopied(null);
      setCopyFailed(field);
    }
  };

  const rows = [
    { field: "email" as const, label: t("noteEmailLabel"), value: DEMO_CREDENTIALS.email },
    {
      field: "password" as const,
      label: t("notePasswordLabel"),
      value: DEMO_CREDENTIALS.password,
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm rotate-0 sm:rotate-1 lg:rotate-2">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-2 rounded-[2px] bg-white/60 shadow-sm ring-1 ring-black/5"
      />

      <div className="relative rounded-[4px] border border-warning/20 bg-warning-soft px-5 pt-8 pb-6 shadow-[0_24px_50px_-24px_rgba(27,35,31,0.45)] sm:px-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-warning uppercase">
            {t("noteEyebrow")}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{t("noteTitle")}</h2>
          <p className="text-[13px] leading-5 text-ink-muted">{t("noteDescription")}</p>
        </div>

        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={row.field}
              className="rounded-lg border border-warning/20 bg-white/65 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold tracking-[0.12em] text-warning uppercase">
                  {row.label}
                </span>
                <button
                  type="button"
                  onClick={() => void copyValue(row.field)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-warning/10 hover:text-ink"
                  aria-label={`${t("copy")} ${row.label}`}
                >
                  {copied === row.field ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3" aria-hidden="true" />
                  )}
                  {copied === row.field ? t("copied") : t("copy")}
                </button>
              </div>
              <code className="mt-1 block font-mono text-sm break-all text-ink select-all">
                {row.value}
              </code>
              {copyFailed === row.field ? (
                <p role="status" className="mt-1 text-[11px] leading-4 text-danger">
                  {t("copyFailed")}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-start gap-2 text-[11px] leading-4 text-ink-muted">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
          {t("noteFootnote")}
        </p>
      </div>
    </div>
  );
}
