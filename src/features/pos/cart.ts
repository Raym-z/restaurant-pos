import type { CreateOrderItemInput } from "./contracts";
import type { DraftOrderLine } from "./types";

export interface PosCartState {
  /** Dining session this cart belongs to. Null only while the cart is empty. */
  sessionId: string | null;
  lines: DraftOrderLine[];
}

export const EMPTY_CART: PosCartState = { sessionId: null, lines: [] };

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return MIN_QUANTITY;
  }

  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
}

function sameLineIdentity(left: DraftOrderLine, right: DraftOrderLine): boolean {
  if (left.menuItemId !== right.menuItemId || left.notes !== right.notes) {
    return false;
  }

  if (left.modifierOptionIds.length !== right.modifierOptionIds.length) {
    return false;
  }

  return left.modifierOptionIds.every((id) => right.modifierOptionIds.includes(id));
}

/**
 * A cart belongs to exactly one dining session. Once it has lines, adding for a
 * different session is rejected rather than silently moving the items.
 */
export function canUseCartForSession(cart: PosCartState, sessionId: string): boolean {
  return cart.lines.length === 0 || cart.sessionId === sessionId;
}

export function addLineToCart(
  cart: PosCartState,
  sessionId: string,
  line: DraftOrderLine,
): PosCartState {
  if (!canUseCartForSession(cart, sessionId)) {
    return cart;
  }

  const normalizedLine: DraftOrderLine = {
    ...line,
    quantity: clampQuantity(line.quantity),
  };
  const existing = cart.lines.find((entry) => sameLineIdentity(entry, normalizedLine));

  if (existing) {
    return {
      ...cart,
      lines: cart.lines.map((entry) =>
        entry.key === existing.key
          ? { ...entry, quantity: clampQuantity(entry.quantity + normalizedLine.quantity) }
          : entry,
      ),
    };
  }

  return {
    sessionId: cart.lines.length === 0 ? sessionId : cart.sessionId,
    lines: [...cart.lines, normalizedLine],
  };
}

export function updateLineQuantity(
  cart: PosCartState,
  key: string,
  quantity: number,
): PosCartState {
  return {
    ...cart,
    lines: cart.lines.map((line) =>
      line.key === key ? { ...line, quantity: clampQuantity(quantity) } : line,
    ),
  };
}

export function removeLineFromCart(cart: PosCartState, key: string): PosCartState {
  const lines = cart.lines.filter((line) => line.key !== key);
  return lines.length === 0 ? EMPTY_CART : { ...cart, lines };
}

export function clearCart(): PosCartState {
  return EMPTY_CART;
}

export function cartLineCount(cart: PosCartState): number {
  return cart.lines.length;
}

export function cartItemCount(cart: PosCartState): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

/** Integer minor-unit arithmetic; no floating-point currency values. */
export function cartSubtotalMinor(cart: PosCartState): number {
  return cart.lines.reduce((total, line) => total + line.unitPriceMinor * line.quantity, 0);
}

export function toCreateOrderItems(lines: readonly DraftOrderLine[]): CreateOrderItemInput[] {
  return lines.map((line) => ({
    menuItemId: line.menuItemId,
    quantity: clampQuantity(line.quantity),
    modifierOptionIds: [...line.modifierOptionIds],
    ...(line.notes.trim() ? { notes: line.notes.trim() } : {}),
  }));
}

/**
 * Canonical payload signature used to decide whether an idempotency key may be
 * reused. Any change to the session, items, modifier selection, line notes, or
 * order notes produces a new signature and therefore a new key.
 */
export function orderSignature(
  sessionId: string,
  items: readonly CreateOrderItemInput[],
  notes: string,
): string {
  return JSON.stringify({
    diningSessionId: sessionId,
    items,
    notes: notes.trim() || undefined,
  });
}
