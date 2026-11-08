import type { CookieOptions } from "@supabase/ssr";

/**
 * Deliberate POS session cookie policy.
 *
 * The 12-hour window is a **sliding idle timeout**, not an absolute session
 * lifetime. The cookie `maxAge` is renewed whenever Supabase refreshes the
 * session, so an idle terminal eventually loses its local session while a
 * continuously active terminal is not guaranteed to re-authenticate after 12
 * hours. Server-side refresh-token validity remains governed by Supabase Auth
 * project settings.
 *
 * This replaces the Supabase SSR default of 400 days, which is inappropriate
 * for shared POS devices.
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

/**
 * `secure` is enabled only when `NODE_ENV === "production"`.
 *
 * Production mode assumes HTTPS. Running a production build over plain HTTP
 * may prevent the browser from accepting the auth cookies, which makes login
 * appear to fail. Use `next dev` or terminate TLS in front of the app.
 */
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
