import type { CookieOptions } from "@supabase/ssr";

/**
 * Deliberate POS session cookie policy.
 *
 * A 12-hour browser persistence window covers a long restaurant shift while
 * forcing re-authentication at least daily. This replaces the Supabase SSR
 * default of 400 days, which is inappropriate for shared POS devices.
 *
 * The server sets auth cookies as HttpOnly because M1 is server-first and has
 * no browser-side session reader. Any future browser-side auth feature must be
 * designed explicitly around this policy rather than weakening it silently.
 */
export const POS_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export interface AuthCookieOptions {
  path: string;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  httpOnly?: boolean;
}

export function getAuthCookieOptions(
  environment: string | undefined = process.env.NODE_ENV,
): AuthCookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    secure: environment === "production",
    maxAge: POS_SESSION_MAX_AGE_SECONDS,
  };
}

/** Server- and proxy-issued cookies are not readable by browser JavaScript. */
export const POS_SERVER_AUTH_COOKIE_OPTIONS: AuthCookieOptions = {
  ...getAuthCookieOptions(),
  httpOnly: true,
};

/**
 * Browser cookie options intentionally omit `httpOnly`; browsers cannot set
 * that attribute from JavaScript. The browser Supabase client is not mounted
 * in M1 because the server session is HttpOnly.
 */
export const POS_BROWSER_AUTH_COOKIE_OPTIONS = getAuthCookieOptions();

/**
 * Applies the POS policy to a cookie written by Supabase SSR. The library
 * forces its own 400-day maxAge for session writes, so the explicit merge is
 * required. Removal cookies (maxAge 0) must stay removal cookies.
 */
export function applyServerAuthCookiePolicy(options: CookieOptions): CookieOptions {
  const policyOptions = { ...options };
  delete policyOptions.expires;

  return {
    ...policyOptions,
    ...POS_SERVER_AUTH_COOKIE_OPTIONS,
    maxAge: options.maxAge === 0 ? 0 : POS_SERVER_AUTH_COOKIE_OPTIONS.maxAge,
  };
}
