import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/features/auth/redirect";
import { ACTIVE_BRANCH_COOKIE } from "@/features/workspace/constants";

import { classifyAuthUserResult } from "./auth-state";
import { applyServerAuthCookiePolicy, POS_SERVER_AUTH_COOKIE_OPTIONS } from "./cookie-policy";
import type { Database } from "./database.types";
import { getPublicEnvironment } from "./env";

function isAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

function clearSessionCookies(response: NextResponse, request: NextRequest): void {
  for (const cookie of request.cookies.getAll()) {
    if (isAuthCookieName(cookie.name) || cookie.name === ACTIVE_BRANCH_COOKIE) {
      response.cookies.delete(cookie.name);
    }
  }
}

function loginRedirect(request: NextRequest, reason?: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";

  if (request.nextUrl.pathname !== "/login") {
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  }

  if (reason) {
    url.searchParams.set("reason", reason);
  }

  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase session and applies optimistic route redirects.
 *
 * Only confirmed invalid/expired credentials clear cookies. Network failures
 * and Supabase 5xx responses preserve the session so a temporary outage does
 * not sign the user out.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const environment = getPublicEnvironment();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      cookieOptions: POS_SERVER_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, applyServerAuthCookiePolicy(options));
          }

          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const outcome = classifyAuthUserResult({ user, error });

  if (outcome.status === "unauthenticated") {
    if (request.nextUrl.pathname === "/login") {
      clearSessionCookies(response, request);
      return response;
    }

    const redirectResponse = loginRedirect(request);
    clearSessionCookies(redirectResponse, request);
    return redirectResponse;
  }

  if (outcome.status === "expired") {
    const redirectResponse = loginRedirect(request, "session_expired");
    clearSessionCookies(redirectResponse, request);
    return redirectResponse;
  }

  if (outcome.status === "unavailable") {
    // Transient failure: preserve cookies and let the protected layout show a
    // retryable verification state instead of signing the user out.
    return response;
  }

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(
      new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url),
    );
  }

  return response;
}
