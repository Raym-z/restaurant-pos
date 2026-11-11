"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getPublicEnvironment } from "./env";

/**
 * Browser Supabase client.
 *
 * Reserved for future browser-side auth features. The staff invitation flow
 * exchanges the email-link fragment on the server so POS session cookies remain
 * HttpOnly, so acceptance does not use this client.
 */
export function createSupabaseBrowserClient() {
  const environment = getPublicEnvironment();

  return createBrowserClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey);
}
