"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getPublicEnvironment } from "./env";

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Browser Supabase client.
 *
 * M1 intentionally keeps business-data queries on the server. This client is
 * available only for authentication events and future browser-only flows that
 * cannot be handled by a Server Action.
 */
export function createSupabaseBrowserClient() {
  if (!cachedClient) {
    const environment = getPublicEnvironment();
    cachedClient = createBrowserClient<Database>(
      environment.supabaseUrl,
      environment.supabasePublishableKey,
    );
  }

  return cachedClient;
}
