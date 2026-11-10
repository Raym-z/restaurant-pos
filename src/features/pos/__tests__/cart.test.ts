import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_CART,
  addLineToCart,
  canUseCartForSession,
  cartItemCount,
  cartLineCount,
  cartSubtotalMinor,
  clearCart,
  orderSignature,
  removeLineFromCart,
  toCreateOrderItems,
  updateLineQuantity,
} from "../cart";
import { EMPTY_IDEMPOTENCY_STATE, resolveIdempotencyKey } from "../idempotency";
import type { DraftOrderLine } from "../types";

const SESSION_A = "00000000-0000-4000-8000-000000000001";
const SESSION_B = "00000000-0000-4000-8000-000000000002";
const ITEM_A = "00000000-0000-4000-8000-000000000011";
const ITEM_B = "00000000-0000-4000-8000-000000000012";
const OPTION_A = "00000000-0000-4000-8000-000000000021";

function line(overrides: Partial<DraftOrderLine> = {}): DraftOrderLine {
  return {
    key: overrides.key ?? "line-1",
    menuItemId: overrides.menuItemId ?? ITEM_A,
    name: overrides.name ?? "Lamb Kofta",
    quantity: overrides.quantity ?? 1,
    modifierOptionIds: overrides.modifierOptionIds ?? [],
    modifierLabels: overrides.modifierLabels ?? [],
    basePriceMinor: overrides.basePriceMinor ?? 145000,
    unitPriceMinor: overrides.unitPriceMinor ?? 145000,
    currency: overrides.currency ?? "IDR",
    notes: overrides.notes ?? "",
  };
}

test("adds items, merges identical lines, and calculates integer subtotals", () => {
  let cart = addLineToCart(EMPTY_CART, SESSION_A, line());
  cart = addLineToCart(cart, SESSION_A, line({ key: "line-2" }));

  assert.equal(cart.sessionId, SESSION_A);
  assert.equal(cartLineCount(cart), 1);
  assert.equal(cart.lines[0]?.quantity, 2);
  assert.equal(cartItemCount(cart), 2);
  assert.equal(cartSubtotalMinor(cart), 290000);

  cart = addLineToCart(
    cart,
    SESSION_A,
    line({ key: "line-3", menuItemId: ITEM_B, unitPriceMinor: 45000 }),
  );
  assert.equal(cartLineCount(cart), 2);
  assert.equal(cartSubtotalMinor(cart), 335000);
});

test("keeps quantities integer and inside 1..99", () => {
  let cart = addLineToCart(EMPTY_CART, SESSION_A, line({ quantity: 2 }));

  cart = updateLineQuantity(cart, "line-1", 0);
  assert.equal(cart.lines[0]?.quantity, 1);

  cart = updateLineQuantity(cart, "line-1", 1000);
  assert.equal(cart.lines[0]?.quantity, 99);

  cart = updateLineQuantity(cart, "line-1", 2.9);
  assert.equal(cart.lines[0]?.quantity, 2);

  cart = updateLineQuantity(cart, "line-1", Number.NaN);
  assert.equal(cart.lines[0]?.quantity, 1);
});

test("removes lines and resets to an empty cart", () => {
  let cart = addLineToCart(EMPTY_CART, SESSION_A, line());
  cart = removeLineFromCart(cart, "line-1");

  assert.deepEqual(cart, EMPTY_CART);
  assert.equal(cart.sessionId, null);
  assert.deepEqual(clearCart(), EMPTY_CART);
});

test("does not mix items between dining sessions", () => {
  const cart = addLineToCart(EMPTY_CART, SESSION_A, line());
  const rejected = addLineToCart(cart, SESSION_B, line({ key: "line-b" }));

  assert.equal(canUseCartForSession(cart, SESSION_A), true);
  assert.equal(canUseCartForSession(cart, SESSION_B), false);
  assert.equal(rejected, cart);
  assert.equal(rejected.sessionId, SESSION_A);
});

test("returns only the backend-supported create_order item fields", () => {
  const cart = addLineToCart(
    EMPTY_CART,
    SESSION_A,
    line({ quantity: 3, modifierOptionIds: [OPTION_A], notes: "  no onions  " }),
  );

  assert.deepEqual(toCreateOrderItems(cart.lines), [
    {
      menuItemId: ITEM_A,
      quantity: 3,
      modifierOptionIds: [OPTION_A],
      notes: "no onions",
    },
  ]);
});

test("order signature changes with session, payload, or notes", () => {
  const items = toCreateOrderItems([
    line({ quantity: 1, modifierOptionIds: [OPTION_A], notes: "no onions" }),
  ]);
  const signature = orderSignature(SESSION_A, items, "table note");

  assert.equal(orderSignature(SESSION_A, items, "table note"), signature);
  assert.notEqual(orderSignature(SESSION_B, items, "table note"), signature);
  assert.notEqual(
    orderSignature(SESSION_A, toCreateOrderItems([line({ quantity: 2 })]), "table note"),
    signature,
  );
  assert.notEqual(orderSignature(SESSION_A, items, "different note"), signature);
});

test("idempotency key is reused for the same payload and rotated for a new one", () => {
  let counter = 0;
  const generator = () => `key-${++counter}`;

  const first = resolveIdempotencyKey(EMPTY_IDEMPOTENCY_STATE, "signature-a", generator);
  assert.equal(first.key, "key-1");

  const retry = resolveIdempotencyKey(first.state, "signature-a", generator);
  assert.equal(retry.key, "key-1");
  assert.equal(counter, 1);

  const changed = resolveIdempotencyKey(retry.state, "signature-b", generator);
  assert.equal(changed.key, "key-2");
  assert.equal(counter, 2);
});
