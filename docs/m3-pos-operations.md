# M3 Core POS Operations — Frontend Integration

## 1. Scope

This milestone connects the POS staff UI to the M3 backend operations in
`restaurant-platform-backend` branch `agent/m3-core-pos-operations` (latest
commit `adaad57`). It also consumes the M2.1 branch-scoped role contract from
`agent/m2-branch-scoped-roles` (latest commit `fd61e00`):

- Branch table overview with availability and occupancy.
- Table detail with the active dining session and its orders.
- Open and close dining sessions.
- Create staff orders for an active dining session.
- Add, update quantity, and remove order items.
- Order lifecycle transitions and cancellation with a mandatory reason.
- Role-aware UI hints with backend authorization remaining authoritative.

The backend repository, migrations, RLS policies, and RPC definitions were not
modified.

## 2. Consumed RPC contracts

| Operation | RPC |
| --- | --- |
| Branch table list | `list_branch_tables(p_branch_id, p_include_inactive)` |
| Table detail | `get_table(p_table_id)` |
| Active session for table | `get_active_dining_session(p_table_id)` |
| Open session | `open_dining_session(p_table_id, p_idempotency_key)` |
| Session detail | `get_dining_session(p_session_id)` |
| Close session | `close_dining_session(p_session_id, p_reason)` |
| Branch order list | `list_branch_orders(...)` |
| Order detail | `get_order(p_order_id)` |
| Create order | `create_order(p_dining_session_id, p_items, p_notes, p_idempotency_key)` |
| Add item | `add_order_item(...)` |
| Update item quantity | `update_order_item_quantity(...)` |
| Remove item | `remove_order_item(...)` |
| Transition status | `transition_order_status(...)` |
| Cancel order | `cancel_order(p_order_id, p_reason)` |

Request/response runtime shapes are mirrored in `src/features/pos/contracts.ts`.
RPC argument names use the published `p_*` names. Prices and totals are never
sent by the client; the backend resolves branch availability, branch price
overrides, modifier snapshots, and totals.

Every order response exposes `subtotalMinor` as the immutable historical item
snapshot and `payableSubtotalMinor` as the settlement amount. Cancelled orders
retain their historical subtotal but have a zero payable subtotal. Response
objects tolerate additive backend fields; request validation remains strict.

The order list uses backend offset pagination with a 50-row page size, so pages
beyond the first 100 rows are reachable.

`get_table_availability`, `list_branch_dining_sessions`, and
`list_orders_by_session` are typed and validated at the integration boundary but
are not surfaced by the current screens.

## 3. Integration boundary

| Layer | Location | Responsibility |
| --- | --- | --- |
| Contracts | `src/features/pos/contracts.ts` | Zod parsers for M3 response shapes and action input validation. |
| Data access | `src/features/pos/services.ts` | Server-only RPC reads and branch menu reads. |
| Mutations | `src/features/pos/actions.ts` | Server Actions wrapping transactional RPCs, idempotency keys, and revalidation. |
| Capability hints | `src/features/pos/access.ts` | Role-aware UI only. The backend enforces branch role and branch access. |
| Menu display | `src/features/pos/menu.ts` | Display-time branch availability/price resolution mirroring the backend rule. |
| Screens | `src/features/pos/components/*` | Table/order presentation and interaction. |

### M2.1 effective roles

`staff_role_assignments.branch_id` is selected into the workspace. The active
branch uses organization-scoped roles plus branch-scoped roles whose `branchId`
exactly matches the active branch. Navigation, POS capability checks, the user
summary, the dashboard primary role, and the Manage Branches link all use these
effective roles. Roles held at other branches never grant active-branch UI
capabilities.

## 4. Menu read boundary

M3 publishes authoritative order-write menu resolution but no staff-facing
menu-list RPC. The POS therefore reads the RLS-protected menu tables directly:

- `menu_categories`
- `menu_items`
- `branch_menu_categories`
- `branch_menu_items`
- `modifier_groups`
- `modifier_options`
- `menu_item_modifier_groups`

The display rule mirrors `private.resolve_menu_item_for_branch` documented in
`20261108110900_m3_pos_read_helpers.sql`. It is presentation-only; the order RPC
re-resolves the same rule and rejects any mismatch. If the backend later
publishes a staff menu read RPC, replace `loadBranchMenu` without changing the
screens.

## 5. Idempotency and concurrency

- `open_dining_session` and `create_order` receive client-generated keys.
- A key is retained across retries of the same submission and cleared after a
  successful response. Create-order keys are regenerated only when the draft
  content changes.
- A successful RPC whose response cannot be parsed is treated as an **uncertain
  committed** mutation, not a failed transaction. The POS revalidates persisted
  state, refreshes the page, and prevents automatic or accidental resubmission.
- RPC failures are the only outcomes treated as definitely uncommitted.
- The backend serializes concurrent session/order writes and remains the final
  defence against duplicate active sessions and invalid transitions.

## 6. Remaining blockers and limitations

- **No staff menu read RPC.** Direct RLS-protected table reads are used, as
  above.
- **Realtime is not configured** in the backend (`BLK-008`). The screens provide
  a manual refresh and re-read persisted state; no realtime channel or payload
  contract was invented.
- **Inactive-branch history context.** M3 read RPCs allow organization-scoped
  staff to read historical tables/orders on an inactive branch, but direct
  `branches` reads remain restricted by RLS. The POS therefore cannot always
  resolve an inactive branch's display name/timezone; the table detail falls
  back to the recorded session branch name or an explicit unknown-branch label.
- **Payment, billing, and KDS item-level transitions** are outside M3 and remain
  unconnected. Order `completed` is operational only and does not settle a bill.
- **Per-branch human order display numbering** is deferred by the backend;
  `orderReference` is displayed as published.

## 7. Manual verification

1. Sign in as a floor role with access to the active branch.
2. Open **Tables** and verify available/occupied counts and table cards.
3. Open a table with no active session and open a session.
4. Create an order with items that require modifier selections.
5. Verify totals, item snapshots, and the session subtotal.
6. Change item quantity and remove an item while the order is pending/accepted.
7. Advance the order through accepted, preparing, ready, served, and completed.
8. Create another order and cancel it with a reason; verify the reason and
   terminal status are shown.
9. Try to close a session with an active order and verify the blocked state.
10. Complete/cancel all orders, close the session, and verify the table becomes
    available.
11. Sign in as kitchen staff and verify read access to orders and the
    preparation/ready transitions only.
12. Sign in with Manager at branch A and Cashier at branch B; switch branches and
    verify navigation, capability buttons, primary role, and Manage Branches
    visibility change with the active branch.
13. Verify a cancelled order shows a zero payable subtotal and a separately
    labelled historical subtotal.
14. Verify pagination reaches page 3 or later (beyond the first 100 orders).
