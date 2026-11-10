export interface IdempotencyKeyState {
  /** Payload signature the current key was generated for. */
  signature: string | null;
  key: string | null;
}

export const EMPTY_IDEMPOTENCY_STATE: IdempotencyKeyState = {
  signature: null,
  key: null,
};

function generateKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `idempotency-${Date.now()}`;
}

/**
 * Reuses the existing key when the payload signature is unchanged, which makes
 * retries of an uncertain submission safe. A changed payload always receives a
 * new key so the backend cannot replay a response for different content.
 */
export function resolveIdempotencyKey(
  state: IdempotencyKeyState,
  signature: string,
  generator: () => string = generateKey,
): { state: IdempotencyKeyState; key: string } {
  if (state.signature === signature && state.key) {
    return { state, key: state.key };
  }

  const key = generator();
  return { state: { signature, key }, key };
}

export function resetIdempotencyState(): IdempotencyKeyState {
  return EMPTY_IDEMPOTENCY_STATE;
}
