import "server-only";

import { getPublicEnvironment } from "./env";

interface SigningKey {
  kty: string;
  key_ops: string[];
  kid?: string;
  alg?: string;
  [key: string]: unknown;
}

interface JsonWebKeySet {
  keys: SigningKey[];
}

/**
 * Public signing keys rotate rarely, so a short-lived in-memory cache avoids a
 * JWKS request on every render without hiding a rotation for long. These keys
 * are public verification material, never tenant data.
 */
const SIGNING_KEYS_TTL_MS = 5 * 60 * 1000;

let cached: { keys: JsonWebKeySet; fetchedAt: number } | null = null;
let inFlight: Promise<JsonWebKeySet | null> | null = null;

export async function getCachedSigningKeys(): Promise<JsonWebKeySet | null> {
  if (cached && Date.now() - cached.fetchedAt < SIGNING_KEYS_TTL_MS) {
    return cached.keys;
  }

  if (!inFlight) {
    inFlight = fetchSigningKeys().finally(() => {
      inFlight = null;
    });
  }

  const keys = await inFlight;
  if (keys) {
    cached = { keys, fetchedAt: Date.now() };
  }

  return keys;
}

async function fetchSigningKeys(): Promise<JsonWebKeySet | null> {
  try {
    const environment = getPublicEnvironment();
    const response = await fetch(`${environment.supabaseUrl}/auth/v1/.well-known/jwks.json`, {
      cache: "no-store",
      headers: { apikey: environment.supabasePublishableKey },
    });

    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    return parseJsonWebKeySet(body);
  } catch {
    // The Auth client falls back to server-side verification when the key set
    // is unavailable, so a failed lookup must not fail the request.
    return null;
  }
}

function parseJsonWebKeySet(value: unknown): JsonWebKeySet | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawKeys = (value as { keys?: unknown }).keys;
  if (!Array.isArray(rawKeys) || rawKeys.length === 0) {
    return null;
  }

  const keys: SigningKey[] = [];
  for (const rawKey of rawKeys) {
    if (!rawKey || typeof rawKey !== "object") {
      return null;
    }

    const candidate = rawKey as {
      kty?: unknown;
      key_ops?: unknown;
      kid?: unknown;
      alg?: unknown;
      [name: string]: unknown;
    };

    if (typeof candidate.kty !== "string" || candidate.kty.length === 0) {
      return null;
    }

    const { kid, alg, ...rest } = candidate;

    // JWKS permits `key_ops` as either a single string or an array.
    const keyOps = Array.isArray(candidate.key_ops)
      ? candidate.key_ops.filter((operation): operation is string => typeof operation === "string")
      : typeof candidate.key_ops === "string"
        ? [candidate.key_ops]
        : [];

    keys.push({
      ...rest,
      kty: candidate.kty,
      key_ops: keyOps,
      ...(typeof kid === "string" ? { kid } : {}),
      ...(typeof alg === "string" ? { alg } : {}),
    });
  }

  return { keys };
}
