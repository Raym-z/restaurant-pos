"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getPublicEnvironment } from "./env";

/**
 * Browser Supabase client.
 *
 * Used only for the invitation acceptance screen, where Supabase Auth delivers
 * the session in the URL fragment after the invite or magic-link redirect. It
 * uses the publishable key and cookie-based session storage; no privileged key
 * is ever exposed to client code.
 */
export function createSupabaseBrowserClient() {
  const environment = getPublicEnvironment();

  return createBrowserClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey);
}
