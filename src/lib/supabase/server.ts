import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { applyServerAuthCookiePolicy, POS_SERVER_AUTH_COOKIE_OPTIONS } from "./cookie-policy";
import type { Database } from "./database.types";
import { getPublicEnvironment } from "./env";

/**
 * Creates a request-scoped Supabase client for Server Components, Server
 * Actions, and Route Handlers.
 *
 * Always create a new client per request. Never share it across requests.
 */
export async function createSupabaseServerClient() {
  const environment = getPublicEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey, {
    cookieOptions: POS_SERVER_AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, applyServerAuthCookiePolicy(options));
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session and writes rotated tokens to the response.
        }
      },
    },
  });
}
