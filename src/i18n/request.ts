import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { APP_TIMEZONE, LOCALE_COOKIE_NAME, resolveLocale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return {
    locale,
    timeZone: APP_TIMEZONE,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
