import { z } from "zod";

/**
 * The only Supabase project this application may use for the M1 integration.
 * Production project refs are rejected before any client is created.
 */
export const DEVELOPMENT_SUPABASE_REF = "bnticbeepxwhrzimouuh";
export const PRODUCTION_SUPABASE_REF = "xzchsyxhpknlogwcfsll";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export interface PublicEnvironment {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string;
}

export interface PublicEnvironmentInput {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function parsePublicEnvironment(input: PublicEnvironmentInput): PublicEnvironment {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: input.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  if (!parsed.success) {
    throw new Error(
      "Missing or invalid public Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_APP_URL.",
    );
  }

  const url = new URL(parsed.data.NEXT_PUBLIC_SUPABASE_URL);

  if (url.hostname.includes(PRODUCTION_SUPABASE_REF)) {
    throw new Error("The production Supabase project must never be used by this application.");
  }

  const isDevelopmentProject = url.hostname === `${DEVELOPMENT_SUPABASE_REF}.supabase.co`;
  if (!isDevelopmentProject && !isLocalHost(url.hostname)) {
    throw new Error(
      `Only the development Supabase project (${DEVELOPMENT_SUPABASE_REF}) or a local Supabase instance may be used.`,
    );
  }

  return {
    supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
  };
}

let cachedEnvironment: PublicEnvironment | null = null;

export function getPublicEnvironment(): PublicEnvironment {
  if (!cachedEnvironment) {
    cachedEnvironment = parsePublicEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  }

  return cachedEnvironment;
}
