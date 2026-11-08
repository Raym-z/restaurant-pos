"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  APP_LOCALES,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("shell");
  const tLanguages = useTranslations("languages");
  const router = useRouter();

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.lang = nextLocale;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-1.5 px-2.5"
          aria-label={`${t("language")}: ${tLanguages(locale)}`}
        >
          <Globe className="text-brand" aria-hidden="true" />
          <span className="text-[13px] font-medium">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => changeLocale(value as AppLocale)}
        >
          {APP_LOCALES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              <span className="flex w-full items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-medium text-ink">{tLanguages(option)}</span>
                  <span className="block text-xs text-ink-subtle">
                    {option === "id" ? "Indonesia" : "English"}
                  </span>
                </span>
                {option === locale ? (
                  <Check className="size-4 text-brand" aria-hidden="true" />
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuItem disabled className="text-xs text-ink-subtle">
          {t("languageDescription")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
