# M4.5 — Kitchen Integration and End-to-End Validation

## 1. Verdict

**PASS WITH FINDINGS.**

The full POS-to-kitchen workflow was exercised against a disposable PostgreSQL
18 cluster with all 42 backend migrations applied. Every M4 kitchen integration
suite passed, the full backend integration suite passed, and the frontend
contract/build checks passed. No migration, RPC, or authorization change was
required.

Live Supabase Realtime delivery remains unverified because Docker/WSL and a local
Supabase stack are unavailable in this environment. `BLK-008` remains open and
polling remains the supported production behavior.

## 2. Environment and method

| Item | Value |
| --- | --- |
| Backend worktree | `restaurant-platform-backend-m4-1`, branch `feature/m4-1-kitchen-infrastructure`, HEAD `864591b` |
| Frontend worktree | `restaurant-pos-m4-4`, branch `agent/pos-m4-4-kds-frontend`, HEAD `ed29be5` |
| Database | Disposable PostgreSQL 18.2 cluster on `127.0.0.1:55432` (native binaries, temporary data directory) |
| Migrations | All 42 files applied with `psql --single-transaction`, no errors |
| Supabase stack | Unavailable: Docker Desktop Linux engine is not running and WSL2 is unsupported on this machine |

The existing PostgreSQL service and its data were not touched. The temporary
cluster was created only for this validation and was removed afterwards.

Frontend and backend tests, typecheck, lint, governance checks, and the
production build were executed in the two worktrees. No hosted Development or
Production project was contacted.

## 3. Integration map

```text
POS order creation
  create_order (M3) -> orders + order_items snapshots
        |
        v
Order acceptance
  transition_order_status('accepted')
        |
        v
AFTER UPDATE trigger private.kitchen_on_order_status_change()
        |
        v
private.generate_kitchen_tickets(order, item?)
  - item-level routes win over category routes
  - only active stations participate
  - one ticket per (order, station, generation)
  - one ticket item per (ticket, order item)
  - full order-item quantity is linked to each matching station
  - no applicable route -> no ticket
  - idempotent reuse of the active ticket; new generation after cancellation
        |
        v
KDS reads
  list_kitchen_tickets / get_kitchen_ticket
        |
        v
KDS item actions
  start_kitchen_ticket_item -> preparing
  mark_kitchen_ticket_item_ready -> ready
  complete_kitchen_ticket_item -> completed
        |
        v
private.recalculate_kitchen_ticket_status()
  aggregate pending/preparing/ready/completed, or cancelled when all items cancel
        |
        +--> order remains the POS lifecycle owner; kitchen actions never rewrite it
        +--> order/item cancellation propagates into kitchen tickets and items
```

Key verified implementation facts:

- Ticket generation runs inside the same transaction as order acceptance.
- The ticket unique key plus the item unique key make retries and concurrent
  acceptance idempotent.
- Item-level routing suppresses category routing for that item, including when
  the item-level station is inactive: the backend does not fall back to the
  category route.
- One order item can produce ticket items at multiple stations. Quantities are
  **not split**; each station receives the full ordered quantity.
- Cancelling an order cancels all kitchen work, including completed items, with
  staff or system attribution. Removing one order item cancels only that item's
  kitchen work and rejects removal after kitchen completion.
- A cancelled ticket is terminal. New work after cancellation creates the next
  generation for the same order/station.

## 4. Validation results

### A. Order acceptance and ticket generation — PASS

- Pending orders are ticket-free; acceptance creates tickets atomically.
- One routed item creates one ticket item; multiple items at one station share
  one ticket.
- Repeated acceptance returns `ORDER_INVALID_STATUS` and creates no duplicate
  tickets or items.
- Concurrent acceptance produces exactly one ticket/item set.
- Unrouted orders accept successfully and produce no tickets.
- Adding an item to an already accepted order creates only the new ticket item
  and reuses the existing ticket identity.

### B. Station routing — PASS

- Category routing and item routing both create tickets.
- Item routing takes precedence over category routing.
- Inactive stations are skipped, with no fallback past an inactive item route.
- Existing tickets remain readable and completable after station deactivation.
- Reactivated stations receive newly routed work again.
- Multi-station routing creates one ticket per station and one ticket item per
  station for the shared order item.
- Multi-station quantities are not split; a quantity of 3 appears as 3 at each
  station.
- Unrouted items create no ticket.
- Routing to another branch or organization is rejected.

### C. Kitchen lifecycle — PASS

- `pending -> preparing -> ready -> completed` passes for each item.
- Skipped and backward transitions are rejected.
- Repeated identical transitions are safe no-ops at the RPC level.
- Concurrent and duplicate submissions cannot produce invalid states.
- Ticket aggregates match active item state exactly.
- Timestamps (`started_at`, `ready_at`, `completed_at`) and actor audit records
  are written.
- Order cancellation propagates to every ticket and item without marking them
  completed.
- Item removal cancels the affected kitchen item/ticket and rejects removal of
  completed kitchen work.
- Fresh ticket generations are created for new work after cancellation.
- Kitchen item actions do not change POS order status.

### D. KDS frontend integration — PASS (build/contract/unit level)

- Station filtering is sent to `list_kitchen_tickets` and inactive stations stay
  selectable for historical visibility.
- The board is grouped pending/preparing/ready, oldest-first.
- Cards render order reference, table label, elapsed time, notes, modifiers, item
  status, and item progress.
- Only the three forward item actions are exposed; terminal items have none.
- Successful transitions show feedback and re-read page 1.
- Backend errors are normalized and localized.
- Manual refresh re-requests the current station/page.
- Automatic polling runs every 45 seconds and pauses while hidden.
- Failed requests keep the last board visible and show a stale warning; the next
  poll or manual refresh recovers.
- History validates the date window locally, converts branch-local dates to UTC,
  supports station/status filters, and paginates.
- Station management covers create, edit, deactivate, reactivate, and route
  add/remove without a delete or reroute action.
- A captured real backend payload is parsed by the frontend contract test,
  proving response compatibility.
- Source-level tests assert that the feature uses backend RPCs and does not write
  kitchen tables directly.

## 5. Authorization and tenant isolation — PASS

Verified through the backend integration suite against real RLS policies:

| Actor | Kitchen read | Item transitions | Station management |
| --- | --- | --- | --- |
| Owner | Allowed | Allowed | Allowed |
| Admin | Allowed | Allowed | Allowed |
| Manager | Allowed | Allowed | Allowed |
| Kitchen Staff | Allowed | Allowed | Denied |
| Cashier | Denied | Denied | Denied |
| Anonymous | Denied | Denied | Denied |

Cross-branch and cross-organization reads/writes are denied. Client-supplied IDs
cannot bypass branch or organization checks. Direct authenticated writes to
kitchen tables remain denied; writes are RPC-only. Financial fields are absent
from the read model and are rejected by frontend parsing.

## 6. POS regression — PASS

The full backend integration suite (including M2 role resolution, M3 sessions,
orders, transitions, cancellation, pagination, pricing snapshots, and direct-write
guards) passed. Frontend navigation, auth/session, workspace, menu, table, order,
and kitchen tests passed, and the production build completed with the kitchen
routes present. No M4 change required a POS redesign or contract change.

## 7. Realtime — BLK-008 remains open

- The disposable database confirmed that exactly the five approved kitchen
  tables are in `supabase_realtime`, and that route tables use
  `replica identity full`.
- Branch-scoped RLS policies exist for those tables.
- No Realtime server was available, so actual event delivery, reconnect
  reconciliation, duplicate suppression, and branch/organization event isolation
  could not be tested.
- The frontend must not depend on Realtime until those tests run against a real
  local Supabase stack. Polling remains the supported behavior.

## 8. History semantics

`list_kitchen_tickets` filters on `kitchen_tickets.created_at`. It does **not**
filter on `completed_at` or `cancelled_at`. A ticket created before the selected
window but completed inside it will not appear.

- A backend regression test now backdates a completed ticket and proves it
  disappears from the recent window and appears in the creation window.
- The history screen now states that date filters use ticket creation time and
  that terminal timestamps are shown per ticket.
- Product follow-up: decide whether "history" should mean ticket creation date
  (current behavior) or terminal completion/cancellation date. If the latter is
  required, the backend RPC needs a coordinated change; the frontend must not
  silently reinterpret the window.

## 9. Findings and recommended follow-up

1. **Accidental tracked artifact `tatus`.** It is a 916-byte redirected
   `git diff --stat` output with ANSI color codes, committed in `ed29be5`.
   It contains no project content. Recommended follow-up: `git rm tatus` in the
   next housekeeping commit. It was not deleted here because M4.5 forbids commits.
2. **History date basis.** Current backend semantics use ticket creation time.
   The UI is now explicit. A product decision is required if terminal-date
   filtering is desired.
3. **Repeated acceptance response.** A second acceptance returns
   `ORDER_INVALID_STATUS` instead of a success-shaped idempotent response. No
   duplicate tickets are created. Recommended follow-up: treat an "already
   accepted" response as success in the acceptance client, or make the backend
   acceptance endpoint explicitly idempotent.
4. **Realtime delivery.** `BLK-008` stays open until a real local Supabase stack
   can run the two-branch delivery tests.
5. **Board status counts** remain page-scoped because there is no backend count
   RPC. This is a known M4.4 limitation, not a regression.
6. **Environment-only test adjustments.** The disposable cluster needed
   `max_connections=300`, `service_role` with `BYPASSRLS`, and a 30-second test
   timeout to mirror Supabase and the local machine. None of these indicate a
   product defect.

No contract mismatch, authorization gap, duplicate-ticket defect, or lifecycle
defect was found in the M4 implementation.

## 10. Changed files

Frontend:

- `docs/m4-5-kitchen-integration-validation.md` (new)
- `docs/m4-4-kitchen-display.md`
- `docs/realtime-and-kds.md`
- `README.md`
- `src/i18n/messages/en.json`
- `src/i18n/messages/id.json`
- `src/features/kitchen/components/kitchen-history-screen.tsx`
- `src/features/kitchen/__tests__/backend-contract.test.ts` (new)
- `src/features/kitchen/__tests__/fixtures/backend-kds-payload.json` (new)
- `src/features/kitchen/__tests__/history-filters.test.ts`
- `src/features/kitchen/__tests__/request-coordinator.test.ts`
- `src/features/kitchen/__tests__/i18n.test.ts`

Backend (tests only; no migration or RPC change):

- `tests/integration/security/m4-kitchen-kds-read.test.ts`
- `tests/integration/security/m4-kitchen-ticket-lifecycle.test.ts`

## 11. Development readiness

The platform is ready for a controlled end-to-end Development environment test.
The kitchen workflow is transactionally correct, branch-scoped, role-enforced,
and contract-compatible in the tested database. Before enabling Realtime in any
environment, `BLK-008` must be closed with live delivery tests. The history
date-basis decision and the accidental `tatus` file should be resolved in the
next coordinated change.
