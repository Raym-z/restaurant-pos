# Localization and Currency

## Overview

The POS supports Indonesian (`id`, default) and English (`en`) without changing
application URLs. Locale preference is stored in the `pos_locale` cookie and is
managed through `next-intl`.

IDR is the platform currency for this phase. Currency presentation is
independent of the selected interface language.

## Locale architecture

- `src/i18n/config.ts` — supported locales, default locale, cookie name, and
  locale-to-Intl mapping.
- `src/i18n/request.ts` — reads the locale cookie and loads the matching
  dictionary for server rendering.
- `src/i18n/messages/id.json` and `src/i18n/messages/en.json` — centralized
  translation dictionaries.
- `src/i18n/use-localized-format.ts` — client hook for locale-aware dates,
  numbers, percentages, weekdays, and business-hour times.
- `src/i18n/use-labels.ts` — display labels for internal role/status/tag
  identifiers.
- `src/components/layout/language-switcher.tsx` — compact shell selector.

`src/app/layout.tsx` wraps the application in `NextIntlClientProvider`. The
locale cookie is read at request time, so routes are request-rendered rather
than statically prerendered.

Language selection never changes stored timestamps, money values, or IDs. Only
presentation changes.

## Currency architecture

`src/lib/currency.ts` is the single source for money formatting and parsing:

- `Money` is `{ amountMinor, currency }`.
- `amountMinor` is the currency's smallest normal unit.
- IDR has **0 fraction digits**: `amountMinor` is whole Rupiah. Its display
  locale is `id-ID`, so IDR always renders as `Rp 25.000`.
- USD and other configured currencies declare their own fraction digits and
  presentation locale.
- `formatCurrencyAmount` uses `Intl.NumberFormat`; IDR is never divided by 100.
- `parseMoneyInput` and `formatMoneyInput` use integer arithmetic and reject
  fractional IDR.

`src/lib/format.ts` exposes locale-aware date/number helpers and re-exports the
currency formatters. Feature modules do not implement their own currency
formatting.

## Adding translations

1. Add the key to both `id.json` and `en.json` (keep key parity).
2. Use `useTranslations(namespace)` in client components or
   `getTranslations(namespace)` in server components.
3. Keep internal identifiers and enum values language-neutral. Translate labels
   through `useRoleLabel`, `useStatusLabel`, `useTagLabel`, or dictionary keys.
4. Use ICU messages for plurals and interpolated values.

## Scope boundaries

- No backend persistence of language preference yet.
- No currency selector is exposed; IDR is fixed for this phase.
- Dates use the selected interface locale and the relevant branch timezone.
- Currency uses its own presentation locale, so IDR remains `Rp 25.000` in both
  interface languages.
