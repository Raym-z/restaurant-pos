# M4.7.0 — Hosted Development Acceptance Readiness

## 1. Verdict

**BLOCKED — TEST ENVIRONMENT NOT READY.**

The hosted Development *platform* is ready: 42/42 migrations are applied, the five
kitchen tables, 15 public kitchen RPCs, RLS/grants, and Realtime membership all
match the M4.6.5 deployment report exactly. No check differed.

The hosted Development *test environment* is not ready:

- No usable credentials are available for any role.
- Four of the five required roles have no account at all (Admin, Manager,
  Kitchen Staff, Cashier).
- There is no dedicated, disposable acceptance organization or branch.
- There are **0** kitchen stations, **0** category routes, and **0** item routes.
- There are **0** kitchen tickets, so no read-only KDS data exists to inspect.
- The existing single branch, 7 orders, 3 dining sessions, 4 tables, and single
  menu item have undocumented provenance and are treated as non-disposable.

Anonymous and schema-level read-only checks can run now. Every authenticated
matrix test — including the read-only KDS UI tests — needs at least one approved
Owner credential, and categories B–D need approved test data.

No hosted mutation was performed. No account, role, station, route, order,
session, ticket, migration, policy, or grant was created or changed.

## 2. Scope and method

This milestone is readiness and inspection only. Method:

- Read-only Supabase CLI operations against `bnticbeepxwhrzimouuh`
  (`migration list`, `db query --read-only`).
- Read-only REST probes using the publishable key already present in the local
  POS environment, with only boolean/host/status output.
- Aggregate `count(*)` and catalog queries only. No `auth.users` enumeration, no
  staff identity reads, no row dumps, no credential or environment value printed.
- Static inspection of the POS M4.4 worktree and the backend M4.1 worktree.

Explicitly not performed: sign-in, order acceptance, ticket transitions,
cancellations, station changes, account creation, role changes, migrations, SQL
writes, schema changes, commits, pushes, merges, or Production access.

## 3. Environment verification

### 3.1 Project identity and safety gate

| Check | Result |
| --- | --- |
| Expected Development ref | `bnticbeepxwhrzimouuh` |
| CLI target ref | **MATCH** — `bnticbeepxwhrzimouuh` |
| Project name | Development Branch - Restaurant |
| CLI target kind | linked base project (`environment: production` label) |
| Production ref `xzchsyxhpknlogwcfsll` in target | **No** |
| Production endpoint contacted | **No** |
| Local POS `NEXT_PUBLIC_SUPABASE_URL` host | Development ref (`m4-4` worktree and parent POS) |
| Local POS key type | publishable/anon — no secret prefix |
| Hosted write performed this milestone | **None** |

The `environment: production` label is the CLI classification for a base project
rather than a preview branch. The project ref is authoritative and matches the
approved Development project. This is the same interpretation recorded in
M4.6.1, M4.6.4, and M4.6.5.

### 3.2 Migration and schema baseline

| Check | Expected (M4.6.5) | Observed | Status |
| --- | --- | --- | --- |
| Applied migrations | 42 | 42 | Match |
| Pending migrations | 0 | 0 | Match |
| M4 migration history rows | 8 | 8 | Match |
| Kitchen tables | 5 | 5 | Match |
| Kitchen tables with RLS | 5 | 5 | Match |
| Policies per kitchen table | 1 | 1 each | Match |
| Public kitchen RPCs | 15 | 15 | Match |
| Private client-executable kitchen helpers | 0 | 0 | Match |
| Realtime kitchen publication members | 5 | 5 | Match |
| Route table replica identity | `FULL` (`f`) | `f`, `f` | Match |

All 15 public kitchen RPCs are `SECURITY DEFINER`, executable by `authenticated`,
and denied to `anon`, as recorded in M4.6.5. This was re-read from the catalog,
not assumed.

### 3.3 Security and Realtime baseline

- Kitchen tables grant `authenticated` **SELECT only**; direct
  INSERT/UPDATE/DELETE is denied; `anon` is fully denied.
- Anonymous REST reads of `kitchen_tickets`, `kitchen_stations`, and `orders`
  returned `401 / 42501`, confirming API-level denial.
- `supabase_realtime` contains exactly the five kitchen tables.
- `kitchen_station_menu_categories` and `kitchen_station_menu_items` have
  `REPLICA IDENTITY FULL`.

No drift from the deployment report was detected. Per the task's stop condition,
no drift means acceptance planning may continue.

### 3.4 API connectivity

| Probe | Result |
| --- | --- |
| `/auth/v1/settings` (publishable key) | 200 |
| Anonymous `kitchen_tickets` read | 401 / `42501` |
| Anonymous `kitchen_stations` read | 401 / `42501` |
| Anonymous `orders` read | 401 / `42501` |

The local POS application can reach hosted Development with its current public
configuration. Authenticated connectivity is **not** verified because no
credential is available.

## 4. Account and role readiness

### 4.1 What exists

| Signal | Value |
| --- | --- |
| Organizations | 1 |
| Active branches | 1 |
| Staff profiles | 1 (active) |
| Role assignments | 1 |
| Roles held | Owner, organization-scoped |
| Branch assignments | 0 |

The single active staff profile holds the only role assignment (Owner,
organization scope). Because the Owner is organization-scoped, it can reach the
active branch without a `staff_branch_assignments` row. No Admin, Manager,
Kitchen Staff, or Cashier assignment exists.

### 4.2 Role availability

| Role | Account exists | Credential available | Realistic login path | Status |
| --- | --- | --- | --- | --- |
| Owner | 1 profile (inferred Owner) | No | `/login` + email/password | **Blocked** |
| Admin | No | No | none | **Missing** |
| Manager | No | No | none | **Missing** |
| Kitchen Staff | No | No | none | **Missing** |
| Cashier | No | No | none | **Missing** |
| Anonymous | n/a | n/a | browser without session | **Available** |

`Owner` is marked "inferred" because this milestone deliberately did not read
staff identity rows or enumerate Auth users. The count and the single
organization-scoped assignment are consistent with the Owner-only state recorded
throughout M4.6.

### 4.3 Credential availability

| Input | Present in process environment |
| --- | --- |
| `POS_DEV_STAFF_EMAIL` | No |
| `POS_DEV_STAFF_PASSWORD` | No |
| `SUPABASE_DB_PASSWORD` | No |
| `SUPABASE_ACCESS_TOKEN` | No |

Local `.env.local` files exist for the POS M4.4 worktree, the parent POS
repository, and the backend M4.1 worktree. Their contents were not inspected
beyond the non-secret host/key-type booleans in §3.1. None of them is documented
as containing staff credentials, and the verification script requires the two
`POS_DEV_STAFF_*` process variables explicitly.

### 4.4 Login path

- The staff login route is `/login` (email + password).
- Routes are under the `(app)` group; unauthenticated access is expected to
  redirect to `/login`.
- The application's authentication is a real Supabase Auth session, not the mock
  workspace; the mock workspace is limited to shell preview data.
- The only scripted authenticated path is
  `npm run verify:hosted` → `scripts/verify-hosted-development.ts`, which reads
  `POS_DEV_STAFF_EMAIL` / `POS_DEV_STAFF_PASSWORD` from the environment and
  refuses Production and secret keys.

## 5. Test organization and branch readiness

| Item | Value | Assessment |
| --- | --- | --- |
| Organizations | 1 | Shared, non-disposable |
| Branches | 1 (active) | Shared, non-disposable |
| Provenance of the branch | Undocumented | Not safe for destructive tests |
| Dedicated acceptance org/branch | None | **Missing** |

The existing organization/branch is the only tenancy in Development and carries
the M2/M3 records used by earlier milestones. Its provenance is undocumented, so
this plan does not treat it as disposable.

Recommended: an approved, clearly labelled acceptance branch (preferred, under the
existing organization) or a separate acceptance organization, plus an explicit
statement that records under it may be created and cleaned up. Creating either is
outside this milestone's permissions.

## 6. Test data readiness

| Data | Available | Needed for full A–G | Gap |
| --- | ---: | ---: | --- |
| Kitchen stations | 0 | 2 active + 1 inactive | **Missing** |
| Category routes | 0 | ≥2 | **Missing** |
| Item routes | 0 | ≥2 (incl. one override) | **Missing** |
| Menu categories | 1 | ≥2 | Insufficient |
| Menu items | 1 | ≥4, spread across stations | Insufficient |
| Restaurant tables | 4 | 2 dedicated acceptance tables | Reusable only if branch is dedicated |
| Active dining sessions | 0 | 1 per scenario | Must be created during approved run |
| Orders | 7 | new fixtures only | Non-disposable, provenance undocumented |
| Order items | 8 | new fixtures only | Non-disposable |
| Kitchen tickets | 0 | ≥1 per lifecycle scenario | **Missing** |
| Kitchen ticket items | 0 | several | **Missing** |

Consequences:

- No read-only KDS board/history inspection is possible: with zero tickets, only
  the empty state can be observed.
- Routing, precedence, multi-station, and unrouted-item behavior cannot be
  exercised without stations and routes.
- The single category and single item cannot demonstrate category-vs-item
  precedence.

## 7. Frontend and backend compatibility

| Check | Evidence | Status |
| --- | --- | --- |
| Deployed schema matches frontend contracts | M4.5 golden-payload contract test parses a captured backend payload; M4.6.5 catalog re-verified | Compatible |
| Deployed RPC names/signatures match frontend calls | 15 public kitchen RPCs present; M4.5 backend contract evidence | Compatible |
| Role capability matrix matches deployed authorization | `src/features/kitchen/access.ts` + M4.5 integration results + M4.6.5 function inspection | Compatible |
| No code changed since deployment | POS `ed29be5` dirty only in docs/tests; backend `864591b` dirty only in two M4.5 tests; no migration changes | Compatible |
| Local app points at Development | §3.1 host check | Compatible |
| Local suites currently green | M4.5 recorded all 42 migrations on a disposable PostgreSQL 18.2 cluster plus backend, frontend, typecheck, lint, governance, and production build passes | Compatible |

The implemented capability matrix, which the acceptance matrix below asserts:

| Actor | Kitchen read | Item transitions | Station management | Order `preparing`/`ready` |
| --- | --- | --- | --- | --- |
| Owner | Allowed | Allowed | Allowed | Allowed |
| Admin | Allowed | Allowed | Allowed | Allowed |
| Manager | Allowed | Allowed | Allowed | Allowed |
| Kitchen Staff | Allowed | Allowed | Denied | Denied |
| Cashier | Denied | Denied | Denied | Denied |
| Anonymous | Denied | Denied | Denied | Denied |

## 8. Acceptance matrix

### 8.0 Classification and conventions

| Class | Meaning |
| --- | --- |
| **R** | Read-only, or a rejection probe that must leave hosted state byte-identical. Includes probes whose *success* would itself be a defect. |
| **M** | Reversible mutation: changes data, with a documented cleanup that returns the acceptance scope to its prior visible state. |
| **D** | Potentially destructive: can affect existing operational data or cannot be reliably reversed. |

Conventions used in every test:

- Sign in at `/login` unless the test states otherwise; sign out with local scope.
- UI routes: `/kitchen` (board), `/kitchen/history`, `/kitchen/stations`.
- "Verify unchanged" means a read-only aggregate/row comparison before and after
  the probe, using the CLI or an authenticated read.
- Evidence: screenshot or recording, browser console/network capture with bearer
  tokens redacted, RPC response body, and read-only SQL count deltas. Never
  capture tokens, cookies, emails, or other staff PII.
- No test may use the existing 7 orders, 8 order items, 3 dining sessions, 4
  tables, or single menu item as a mutation target.

### A. Authentication and role access

**A1 · Owner — kitchen board** · **R** · Owner
- Pre: Owner credential; at least one active branch.
- Steps: 1. Sign in. 2. Open `/kitchen`. 3. Confirm the station selector lists
  stations and the board renders.
- Expected: Board renders (empty state allowed); no unauthorized state; no error
  banner.
- Cleanup: None. Evidence: Screenshot, network log of `list_kitchen_tickets`.

**A2 · Owner — kitchen history** · **R** · Owner
- Pre: A1.
- Steps: 1. Open `/kitchen/history`. 2. Apply the default date range.
- Expected: History renders with the documented `created_at` basis and pagination
  controls; empty state if no tickets.
- Cleanup: None. Evidence: Screenshot, request log.

**A3 · Owner — station management** · **R** · Owner
- Pre: A1.
- Steps: 1. Open `/kitchen/stations`. 2. Inspect available actions.
- Expected: Create/edit/deactivate/reactivate and route add/remove controls are
  visible; no delete or bulk-reroute action exists.
- Cleanup: None. Evidence: Screenshot.

**A4 · Owner — item lifecycle actions** · **R** · Owner
- Pre: At least one ticket item in a non-terminal state.
- Steps: 1. Open the board. 2. Inspect the card actions for pending, preparing,
  and ready items.
- Expected: Exactly one forward action per non-terminal item; terminal items show
  none.
- Cleanup: None. Evidence: Screenshot per state.

**A5 · Admin — full kitchen access** · **R** · Admin
- Pre: Admin account, branch-scoped to the acceptance branch.
- Steps: 1. Sign in as Admin. 2. Open `/kitchen`, `/kitchen/history`,
  `/kitchen/stations`.
- Expected: All three surfaces accessible; item and station actions available.
- Cleanup: None. Evidence: Screenshots.

**A6 · Manager — full kitchen access** · **R** · Manager
- Pre: Manager account, branch-scoped.
- Steps: As A5.
- Expected: Same as A5.
- Cleanup: None. Evidence: Screenshots.

**A7 · Kitchen Staff — operate, not configure** · **R** · Kitchen Staff
- Pre: Kitchen Staff account, branch-scoped.
- Steps: 1. Sign in. 2. Open `/kitchen` and `/kitchen/history`. 3. Navigate
  directly to `/kitchen/stations`.
- Expected: Board and history accessible with item actions; station route shows
  unauthorized/denied and no configuration controls.
- Cleanup: None. Evidence: Screenshots, navigation log.

**A8 · Cashier — kitchen denied entirely** · **R** · Cashier
- Pre: Cashier account, branch-scoped.
- Steps: 1. Sign in. 2. Navigate directly to `/kitchen`,
  `/kitchen/history`, `/kitchen/stations`.
- Expected: All three show unauthorized; no kitchen navigation entry; no data
  rendered.
- Cleanup: None. Evidence: Screenshots.

**A9 · Anonymous — kitchen denied** · **R** · Anonymous
- Pre: Browser without a session; publishable key.
- Steps: 1. Open `/kitchen`, `/kitchen/history`, `/kitchen/stations`. 2. Probe
  `kitchen_tickets` and `kitchen_stations` via REST.
- Expected: Redirect to `/login`; REST returns `401` / `42501`.
- Cleanup: None. Evidence: Screenshots, status codes.

**A10 · Cashier — order-level `preparing`/`ready` denied** · **R** · Cashier
- Pre: Cashier account; an existing order in a state where the transition would
  otherwise be legal; order status captured before the probe.
- Steps: 1. Attempt `transition_order_status` to `preparing`, then `ready`.
- Expected: Both rejected with the documented authorization/status error; order
  unchanged. M3-level Cashier transitions remain unaffected.
- Cleanup: None (expected rejection). Evidence: Error codes, before/after status.

**A11 · Cross-branch isolation** · **R** · Manager / Kitchen Staff
- Pre: Two branches exist; actor is scoped to branch A only.
- Steps: 1. Attempt `list_kitchen_tickets` / `get_kitchen_ticket` for branch B
  identifiers. 2. Attempt an item transition on a branch-B ticket.
- Expected: Denied, no data returned.
- Cleanup: None. Evidence: Error codes.

**A12 · Cross-organization isolation** · **R** · Any non-member
- Pre: An organization the actor does not belong to.
- Steps: 1. Call the kitchen read RPCs with that organization's branch.
- Expected: Denied.
- Cleanup: None. Evidence: Error codes.

**A13 · Direct table write denied** · **R** · Owner (strongest role)
- Pre: Owner session.
- Steps: 1. Attempt a direct POST/PATCH/DELETE against `kitchen_tickets`,
  `kitchen_stations`, and a route table.
- Expected: Denied; tables stay read-only for clients; RPCs remain the only write
  path.
- Cleanup: None. Evidence: Status codes and `42501`.

**A14 · Kitchen Staff direct station RPC denied** · **R** · Kitchen Staff
- Pre: Kitchen Staff session.
- Steps: 1. Call `create_kitchen_station` and `deactivate_kitchen_station`
  directly.
- Expected: Denied by `assert_kitchen_station_admin`; no station created or
  changed.
- Cleanup: None. Evidence: Error codes, station count unchanged.

### B. Station management

All B tests require Owner/Admin/Manager and a dedicated acceptance branch.
Created stations and routes are labelled `POS-ACCEPT-<run>`.

**B1 · Create station** · **M** · Owner
- Pre: Acceptance branch; no station with the chosen name.
- Steps: 1. Open `/kitchen/stations`. 2. Create an active station.
- Expected: Station appears as active with a generated id; list refreshes.
- Cleanup: Deactivate at the end of the run. Evidence: Station id, screenshot.
- Residual: stations cannot be hard-deleted; inactive rows remain.

**B2 · Station validation** · **R** · Owner
- Pre: An existing station name.
- Steps: 1. Attempt to create a station with a duplicate or invalid name.
- Expected: Validation/backend rejection; no new station.
- Cleanup: None. Evidence: Error message, station count unchanged.

**B3 · Edit station** · **M** · Manager
- Pre: B1.
- Steps: 1. Rename and change editable fields. 2. Save.
- Expected: Values persist; list and detail agree.
- Cleanup: Restore original name. Evidence: Before/after screenshots.

**B4 · Deactivate station** · **M** · Owner
- Pre: Active station with no pending work.
- Steps: 1. Deactivate. 2. Confirm state.
- Expected: Station shows inactive; it disappears from board filters.
- Cleanup: Reactivate in B5, or leave inactive at run end. Evidence: Screenshot.

**B5 · Reactivate station** · **M** · Owner
- Pre: Inactive station.
- Steps: 1. Reactivate. 2. Confirm state.
- Expected: Station becomes active and routable again.
- Cleanup: Leave active only if needed for later tests. Evidence: Screenshot.

**B6 · Add category route** · **M** · Admin
- Pre: Active station; an acceptance menu category.
- Steps: 1. Add the category route to the station.
- Expected: Route listed; new tickets for that category route to the station.
- Cleanup: Remove the route. Evidence: Route id, screenshot.

**B7 · Duplicate/conflicting category route rejected** · **R** · Admin
- Pre: B6 applied.
- Steps: 1. Add the same category to the same station again; 2. optionally add it
  to a second station if the design forbids ambiguity.
- Expected: Rejection or documented single-owner behavior; no duplicate rows.
- Cleanup: None. Evidence: Error code, route count.

**B8 · Remove category route** · **M** · Admin
- Pre: B6.
- Steps: 1. Remove the route; 2. confirm removal while the station is inactive as
  a separate sub-check.
- Expected: Route removed; removal is allowed even when the station is inactive.
- Cleanup: Route already removed. Evidence: Before/after counts.

**B9 · Add item route** · **M** · Owner
- Pre: Active station; an acceptance menu item.
- Steps: 1. Add an item-level route.
- Expected: Item route listed and used for routing.
- Cleanup: Remove in B10. Evidence: Route id.

**B10 · Remove item route** · **M** · Owner
- Pre: B9.
- Steps: 1. Remove the item route; 2. confirm removal on an inactive station.
- Expected: Route removed; removal allowed while inactive.
- Cleanup: Route already removed. Evidence: Count delta.

**B11 · Item routing precedence over category routing** · **M** · Owner
- Pre: Item route to station S2; its category routed to S1; an acceptance order
  containing that item plus another S1 category item.
- Steps: 1. Accept the order. 2. Inspect ticket/ticket-item station assignment.
- Expected: The item-route ticket item lands on S2; the other item lands on S1;
  the item is not duplicated to S1.
- Cleanup: Cancel the order (D8 behavior); remove routes at run end. Evidence:
  Ticket-item station ids.

**B12 · Inactive station behavior** · **M** · Owner
- Pre: Inactive station with existing routes; a category still routed to it.
- Steps: 1. Attempt to add a new route to the inactive station. 2. Accept an order
  whose only route target is that inactive station. 3. Inspect routing.
- Expected: Adding routes is blocked; no new tickets are generated for work that
  can only route to an inactive station (documented behavior confirmed); existing
  routes remain visible/removable.
- Cleanup: Cancel the order. Evidence: Error code, ticket count.

**B13 · Cross-branch station configuration denied** · **R** · Manager
- Pre: Manager scoped to branch A; branch B exists.
- Steps: 1. Attempt `create_kitchen_station` / `deactivate_kitchen_station` for
  branch B.
- Expected: Denied; no station change in branch B.
- Cleanup: None. Evidence: Error code, branch-B station count.

### C. Order-to-kitchen integration

All C tests are **M** and require an approved acceptance order plus stations and
routes. Each order is labelled `POS-ACCEPT-<run>` and cancelled during cleanup.

**C1 · Accept an eligible order** · **M** · Owner/Manager
- Pre: Active dining session on an acceptance table; a pending order with routed
  items.
- Steps: 1. Accept the order (`pending → accepted`). 2. Read the kitchen board.
- Expected: Order becomes accepted; ticket(s) appear on the board.
- Cleanup: Cancel the order. Evidence: Ticket ids, board screenshot.

**C2 · Transactional ticket generation** · **M** · Owner
- Pre: C1 data.
- Steps: 1. Capture the order and ticket counts. 2. Accept a new order.
  3. Re-capture counts.
- Expected: Exactly one accepted order and one ticket set are created together; no
  orphan ticket without an accepted order and no accepted order without tickets.
- Cleanup: Cancel. Evidence: Count deltas, order status.

**C3 · Routing to the correct station** · **M** · Owner
- Pre: Category route configured.
- Steps: 1. Accept an order with one item in the routed category. 2. Inspect the
  ticket item's station.
- Expected: Ticket item routed to the configured station.
- Cleanup: Cancel. Evidence: Station id comparison.

**C4 · Multi-station fan-out** · **M** · Owner
- Pre: Two stations with routes; an order with items for both.
- Steps: 1. Accept. 2. Inspect each ticket item.
- Expected: Items split to their stations; each station sees only its items; no
  cross-station duplication.
- Cleanup: Cancel. Evidence: Per-station screenshots/ids.

**C5 · Unrouted items generate no ticket item** · **M** · Owner
- Pre: An acceptance item with no matching route.
- Steps: 1. Accept an order containing a routed and an unrouted item. 2. Inspect
  tickets.
- Expected: Routed item appears; unrouted item produces no ticket item and no
  phantom station assignment. Behavior is recorded as a documented gap if the
  order cannot be fully fulfilled.
- Cleanup: Cancel. Evidence: Ticket-item list, order detail.

**C6 · Repeated acceptance** · **M** · Owner/Manager
- Pre: C1 accepted order.
- Steps: 1. Accept the same order again. 2. Read the error. 3. Compare ticket
  counts.
- Expected: Rejected with `ORDER_INVALID_STATUS`; **no duplicate tickets**
  (known finding, carried forward).
- Cleanup: None beyond C1. Evidence: Error code, ticket count unchanged.

**C7 · Concurrent acceptance** · **M** · Two sessions (Owner + Manager)
- Pre: A single pending routed order.
- Steps: 1. Trigger acceptance simultaneously from two clients. 2. Inspect
  results and ticket counts.
- Expected: Exactly one acceptance succeeds; exactly one ticket set exists; the
  other request is rejected with a status error.
- Cleanup: Cancel. Evidence: Both responses, ticket count.

**C8 · Quantity preserved in ticket items** · **M** · Owner
- Pre: Order item quantity > 1.
- Steps: 1. Accept. 2. Inspect ticket item quantity.
- Expected: Ticket item quantity equals the order item quantity; board shows the
  aggregate.
- Cleanup: Cancel. Evidence: Ticket item payload.

### D. Kitchen lifecycle

All D tests are **M** and mutate ticket state. Each requires C1-style data.

**D1 · Pending → Preparing** · **M** · Kitchen Staff/Manager
- Pre: Pending ticket item.
- Steps: 1. Click Start. 2. Re-read the board/history.
- Expected: Item becomes `preparing`; `started_at` set; actor recorded.
- Cleanup: Continue to D3 completion, or cancel the owning order. Evidence: Before/
  after state and timestamps.

**D2 · Preparing → Ready** · **M** · Kitchen Staff
- Pre: D1.
- Steps: 1. Click Mark ready.
- Expected: Item becomes `ready`; `ready_at` set.
- Cleanup: Complete or cancel. Evidence: State + timestamps.

**D3 · Ready → Completed** · **M** · Kitchen Staff
- Pre: D2.
- Steps: 1. Click Complete.
- Expected: Item becomes `completed`; `completed_at` set; no forward action remains.
- Cleanup: None (terminal). Evidence: State + timestamps.

**D4 · Backward transition rejected** · **R** · Kitchen Staff
- Pre: A `ready` item.
- Steps: 1. Attempt a transition back to `preparing` via RPC.
- Expected: Rejected; state unchanged.
- Cleanup: None. Evidence: Error code, state.

**D5 · Skipped transition rejected** · **R** · Kitchen Staff
- Pre: A `pending` item.
- Steps: 1. Attempt `pending → ready` and `pending → completed`.
- Expected: Rejected; state unchanged.
- Cleanup: None. Evidence: Error codes.

**D6 · Terminal items expose no action** · **R** · Kitchen Staff
- Pre: `completed` and `cancelled` items.
- Steps: 1. Inspect both cards; 2. attempt a transition on each.
- Expected: No UI action; RPC rejected.
- Cleanup: None. Evidence: Screenshot + error.

**D7 · Aggregate ticket status** · **M** · Kitchen Staff
- Pre: A ticket with ≥2 items.
- Steps: 1. Advance one item. 2. Advance the rest. 3. Observe the ticket status at
  each step.
- Expected: Ticket reflects the documented aggregate rule (in progress while any
  item is non-terminal; `ready` when all items are ready; `completed` when all are
  completed).
- Cleanup: Complete the ticket. Evidence: State matrix.

**D8 · Cancellation propagation** · **M** · Owner/Manager
- Pre: An accepted order with a ticket, at least one item non-terminal.
- Steps: 1. Cancel the order. 2. Inspect the ticket and items.
- Expected: Ticket and remaining items become `cancelled`; already-completed items
  retain their audit history; board removes the ticket from active views.
- Cleanup: None (terminal). Evidence: Ticket status, item statuses.

**D9 · Item removal propagation** · **M** · Owner/Manager
- Pre: An accepted order with a ticket; at least one item removable per M4.3 rules.
- Steps: 1. Remove one order item. 2. Inspect its ticket item and the ticket
  aggregate.
- Expected: Corresponding ticket item becomes `cancelled`; ticket aggregate
  recalculates; remaining items unaffected.
- Cleanup: Cancel the order. Evidence: Ticket item statuses.

**D10 · Audit attribution and timestamps** · **M** · Two different roles
- Pre: D1–D3 performed by different actors where possible.
- Steps: 1. Read ticket-item history/fields. 2. Compare actors and timestamps.
- Expected: Each transition records the acting staff member and the correct
  timestamp; timestamps are monotonic.
- Cleanup: Complete or cancel. Evidence: Field dump excluding PII.

**D11 · Cross-branch transition denied** · **R** · Kitchen Staff
- Pre: A branch-B ticket id; actor scoped to branch A.
- Steps: 1. Attempt an item transition on the branch-B ticket.
- Expected: Denied; state unchanged.
- Cleanup: None. Evidence: Error code.

### E. KDS frontend

**E1 · Board loads with tickets** · **R** · Kitchen Staff
- Pre: ≥2 active tickets on different stations.
- Steps: 1. Open `/kitchen`. 2. Switch station filters.
- Expected: Correct tickets per filter; ticket count matches the filtered page
  scope (page-scoped counts are a known finding).
- Cleanup: None. Evidence: Screenshots.

**E2 · Ticket ordering and elapsed time** · **R** · Kitchen Staff
- Pre: E1.
- Steps: 1. Compare card order to the documented ordering. 2. Compare elapsed time
  to `created_at`.
- Expected: Stable deterministic order; elapsed time derived from ticket creation
  and advances over a few minutes.
- Cleanup: None. Evidence: Two screenshots ≥2 minutes apart.

**E3 · Modifiers and notes** · **R** · Kitchen Staff
- Pre: A ticket item with modifiers and notes.
- Steps: 1. Inspect the card.
- Expected: All modifiers and notes render; long text wraps without breaking the
  layout; no financial fields appear.
- Cleanup: None. Evidence: Screenshot.

**E4 · Loading state** · **R** · Any kitchen role
- Pre: Throttled network or slow response.
- Steps: 1. Open the board with throttling; 2. reload.
- Expected: Skeleton/loading state; no layout jump; no error flash.
- Cleanup: None. Evidence: Screenshot/recording.

**E5 · Empty state** · **R** · Kitchen Staff
- Pre: A station filter with no tickets (or the current zero-ticket state).
- Steps: 1. Select that filter.
- Expected: Explicit empty state, not an error and not a blank page.
- Cleanup: None. Evidence: Screenshot.

**E6 · Error state** · **R** · Kitchen Staff
- Pre: Ability to block the RPC (offline/devtools) without touching data.
- Steps: 1. Block the read request; 2. reload.
- Expected: Normalized, localized error with retry; no crash.
- Cleanup: Restore network. Evidence: Screenshot + console.

**E7 · Stale state** · **R** · Kitchen Staff
- Pre: A loaded board.
- Steps: 1. Break the next request. 2. Wait for a poll.
- Expected: Last board remains visible with a stale warning; no data loss.
- Cleanup: Restore network. Evidence: Screenshot.

**E8 · Manual refresh** · **R** · Kitchen Staff
- Pre: A loaded board.
- Steps: 1. Trigger refresh.
- Expected: Re-requests the current station/page; preserves filters and scroll
  intent; no full page reload.
- Cleanup: None. Evidence: Network log.

**E9 · Automatic polling** · **R** · Kitchen Staff
- Pre: Visible tab.
- Steps: 1. Observe requests for ≥2 intervals.
- Expected: Polls at the documented 45-second interval; no overlap; failures do not
  stop the loop.
- Cleanup: None. Evidence: Network log timestamps.

**E10 · Hidden-tab polling suspension** · **R** · Kitchen Staff
- Pre: E9.
- Steps: 1. Hide the tab for ≥2 intervals. 2. Return to it.
- Expected: Polling pauses while hidden and resumes (with an immediate refresh)
  when visible.
- Cleanup: None. Evidence: Network log with visibility transitions.

**E11 · History date range and filters** · **R** · Owner/Manager
- Pre: Tickets with known `created_at` values.
- Steps: 1. Set a range that includes them. 2. Apply station and status filters.
  3. Set a range that excludes them.
- Expected: Filtering uses ticket `created_at` (documented, carried finding);
  inclusive/exclusive boundaries behave as the UI documents.
- Cleanup: None. Evidence: Result counts per filter.

**E12 · History pagination** · **R** · Owner/Manager
- Pre: More tickets than one page.
- Steps: 1. Page forward and back. 2. Change filters mid-pagination.
- Expected: Stable ordering and page sizes; filters reset the page correctly.
- Cleanup: None. Evidence: Screenshots, request log.

**E13 · History date-basis copy** · **R** · Owner
- Pre: E11.
- Steps: 1. Read the filter helper text.
- Expected: It states the filter is on ticket creation time, matching the backend.
- Cleanup: None. Evidence: Screenshot.

**E14 · Unauthorized state** · **R** · Cashier
- Pre: A8.
- Steps: 1. Open `/kitchen`.
- Expected: The shared unauthorized state, with no kitchen data fetched.
- Cleanup: None. Evidence: Screenshot.

**E15 · Localization** · **R** · Owner
- Pre: E1.
- Steps: 1. Switch to `en`, then `id`, on the board, history, and stations.
- Expected: All kitchen labels, errors, and empty/stale states are translated; role
  and status identifiers stay language-neutral; currency is not shown in KDS.
- Cleanup: Restore the preferred locale. Evidence: Screenshots.

### F. Realtime

**F1 · Event delivery on ticket insert** · **M** · Owner
- Pre: Two browser sessions on `/kitchen`; Realtime enabled.
- Steps: 1. Accept a routed order in session A. 2. Observe session B without
  polling.
- Expected: Session B shows the new ticket from a Realtime event.
- Cleanup: Cancel the order. Evidence: Recording, event log.

**F2 · Event delivery on item transition** · **M** · Kitchen Staff
- Pre: F1.
- Steps: 1. Advance an item in session A. 2. Observe session B.
- Expected: Session B reflects the status change.
- Cleanup: Complete/cancel. Evidence: Recording.

**F3 · Duplicate events** · **M** · Kitchen Staff
- Pre: F2.
- Steps: 1. Force a duplicate delivery or rapid re-subscribe. 2. Inspect the board.
- Expected: No duplicate cards and no doubled counts; reconciliation is idempotent.
- Cleanup: None. Evidence: Screenshots.

**F4 · Missed events and reconnect** · **M** · Kitchen Staff
- Pre: F1.
- Steps: 1. Disconnect the client. 2. Mutate the ticket elsewhere. 3. Reconnect.
- Expected: Reconnect triggers a refresh/reconcile; the missed change appears.
- Cleanup: None. Evidence: Recording, request log.

**F5 · Branch isolation** · **M** · Manager/Kitchen Staff
- Pre: Tickets in two branches; actor scoped to one.
- Steps: 1. Subscribe as the branch-A actor. 2. Generate a branch-B event.
- Expected: No branch-B payload reaches the subscriber; RLS is enforced at the
  publication layer.
- Cleanup: Cancel branch-B fixture. Evidence: Event log with no cross-branch rows.

**F6 · Organization isolation** · **M** · Owner
- Pre: A second organization, if one is approved.
- Steps: As F5 across organizations.
- Expected: No cross-organization events.
- Cleanup: None. Evidence: Event log.

**F7 · Polling fallback** · **R** · Kitchen Staff
- Pre: A state change generated by another session.
- Steps: 1. Disable Realtime (block the socket). 2. Wait one poll interval.
- Expected: The board still updates within the polling interval.
- Cleanup: Restore network. Evidence: Recording.

**F8 · Correctness without Realtime** · **R** · Kitchen Staff
- Pre: F7.
- Steps: 1. Run one full item lifecycle with Realtime blocked.
- Expected: Every action succeeds and the UI stays consistent via re-read.
- Cleanup: Complete the item. Evidence: Recording.

`BLK-008` remains open: real event delivery, reconnect reconciliation, duplicate
suppression, and isolation have never been observed against a live Realtime
server. F1–F8 are the tests that would close it.

### G. Regression

**G1 · M2 role resolution and navigation** · **R** · All five roles
- Pre: All role accounts.
- Steps: 1. Sign in per role. 2. Verify navigation visibility and effective
  primary role.
- Expected: Matches `docs/roles-and-permissions.md`; no role gains kitchen or
  organization surfaces it should not have.
- Cleanup: None. Evidence: Screenshots per role.

**G2 · M3 POS ordering** · **M** · Cashier/Owner
- Pre: Acceptance session and table.
- Steps: 1. Create an order from `/pos`. 2. Add, update quantity, remove an item.
- Expected: M3 behavior unchanged by M4; totals recalculate.
- Cleanup: Cancel the order; close the session. Evidence: Order detail.

**G3 · Pricing and order snapshots** · **M** · Cashier/Owner
- Pre: G2.
- Steps: 1. Compare order totals to computed line totals. 2. Change a quantity and
  re-read.
- Expected: Authoritative server pricing; snapshots preserve historical totals;
  cancelled orders keep `subtotal` with zero payable.
- Cleanup: Cancel. Evidence: Before/after totals.

**G4 · Dining sessions** · **M** · Owner
- Pre: 4 tables; 0 active sessions.
- Steps: 1. Open a session on an acceptance table. 2. Replay the idempotency key.
  3. Close the session.
- Expected: Single session from replay; table availability toggles; close requires
  terminal orders.
- Cleanup: Session closed. Evidence: Session ids, table availability.

**G5 · Order cancellation** · **M** · Owner
- Pre: An accepted routed order.
- Steps: 1. Cancel with a reason. 2. Attempt a further transition.
- Expected: Cancelled state, zero payable, historical subtotal retained, further
  transitions rejected; kitchen tickets cancelled (D8).
- Cleanup: None (terminal). Evidence: Order + ticket states.

**G6 · Existing role restrictions** · **R** · Cashier/Kitchen Staff
- Pre: A8, A10.
- Steps: 1. Attempt a Cashier order-level `preparing`/`ready`; 2. attempt a Kitchen
  Staff station write.
- Expected: Both denied.
- Cleanup: None. Evidence: Error codes.

**G7 · Existing data preservation** · **R** · Owner
- Pre: Baseline counts captured.
- Steps: 1. Compare `orders`, `order_items`, and `dining_sessions` counts and
  statuses to the baseline (7 / 8 / 3) after the acceptance run.
- Expected: Identical; no existing row mutated.
- Cleanup: None. Evidence: Before/after aggregates.

## 9. Read-only tests runnable immediately

| Item | Runnability now |
| --- | --- |
| A9 anonymous denial (REST + route redirect) | **Runnable now** |
| Environment/catalog re-verification (`migration list`, read-only SQL) | **Runnable now** |
| E4 loading state, E6 error state, E7 stale state | Runnable once any kitchen role can sign in |
| `npm run verify:hosted` (default, no writes) | Runnable once an Owner credential is injected |
| Everything else | Blocked by missing account, credential, or data |

`npm run verify:hosted` without `--allow-writes` is the closest existing read-only
gate: it signs in, reads workspace/menu/tables/orders, and issues rejection probes
that assert nothing was committed. It **requires** `POS_DEV_STAFF_EMAIL` and
`POS_DEV_STAFF_PASSWORD` and cannot run today. `npm run verify:hosted:writes`
creates fixtures and belongs to the mutating phase only.

## 10. Mutating tests requiring explicit approval

- **B1, B3–B6, B8–B12** — stations, routes, precedence, inactive behavior.
- **C1–C8** — order acceptance, ticket generation, routing, concurrency.
- **D1–D3, D7–D10** — lifecycle, aggregate status, propagation, audit.
- **F1–F6** — event generation.
- **G2–G5** — POS ordering, pricing, sessions, cancellation.

Approval must name the acceptance branch/organization, allow fixture creation, and
accept the documented residual rows (inactive stations, cancelled tickets,
cancelled/terminal orders).

## 11. Potentially destructive tests and safeguards

| Test | Risk | Safeguard |
| --- | --- | --- |
| B11/C3/C4 routing checks | Wrong routes could misdirect real kitchen work | Dedicated branch only; routes created and removed within the run |
| C7 concurrent acceptance | Two writers on one order | Acceptance order only; never an existing order |
| D8 cancellation propagation | Cancels a real order and its tickets | Acceptance order only; cancel is terminal and audited |
| D9 item removal | Alters order composition and totals | Acceptance order only; verify totals before/after |
| G4 session open/close | Occupies a real table; blocks service | Dedicated acceptance tables; close the session in cleanup |
| G7 data preservation | If any existing row changes, evidence is lost | Baseline aggregate captured first; run aborted on any drift |
| Any direct SQL/CLI write | Bypasses RPC guards | **Prohibited**; acceptance uses UI/RPC only |

No destructive test may touch the existing 1 organization, 1 branch, 4 tables,
7 orders, 8 order items, 3 dining sessions, 1 menu category, or 1 menu item.

## 12. Required inputs

Names only. Values must be supplied out-of-band and never committed or printed.

| Input | Purpose | Hard requirement |
| --- | --- | --- |
| `POS_DEV_STAFF_EMAIL` | Owner (and later per-role) sign-in | Yes, for any authenticated test |
| `POS_DEV_STAFF_PASSWORD` | Owner sign-in | Yes |
| Per-role test credentials (Admin, Manager, Kitchen Staff, Cashier) | Role matrix A5–A8 | Yes for A5–A8, G1, G6 |
| Confirmation of Development ref `bnticbeepxwhrzimouuh` | Safety gate | Yes (already verified) |
| Approval to create 4 role accounts + role/branch assignments | Role matrix | Yes, separate approval |
| Approval for a dedicated acceptance branch/organization | Data safety | Yes |
| Approval to create stations, routes, tables, menu fixtures | B, C, D, E | Yes |
| Approval to run mutating acceptance (categories 2) | B–D, F, G | Yes |
| Acceptance branch name and 2 table labels | Navigation | Yes |

No credential is requested in this document. No value is recorded anywhere.

## 13. Recommended execution sequence

1. **Re-verify the environment** (read-only) — repeat §3 before any test.
2. **Run the anonymous checks** — A9, plus the catalog checks.
3. **Inject the Owner credential** and run `npm run verify:hosted` (no writes) to
   confirm sign-in, workspace, menu, tables, orders, and the M3 rejection guards.
4. **Owner UI pass** — A1–A4, E4–E7, E13, E14–E15 empty/error/stale states.
5. **Create the role accounts** (separate approval) — Admin, Manager, Kitchen
   Staff (branch-scoped), Cashier (branch-scoped).
6. **Role matrix** — A5–A8, A11–A14, G1, G6.
7. **Create acceptance data** on the dedicated branch — menu categories, items,
   2 active stations + 1 inactive, routes, 2 tables.
8. **Station management** — B1–B13.
9. **Order-to-kitchen** — C1–C8, capturing ticket ids per order.
10. **Lifecycle** — D1–D11 on those tickets.
11. **KDS UI with real data** — E1–E3, E8–E12.
12. **Realtime** — F1–F8 with two browsers; this is the `BLK-008` closure attempt.
13. **Regression** — G2–G5 on acceptance fixtures; G7 last, comparing against the
    baseline.
14. **Cleanup** — cancel acceptance orders, close sessions, remove routes,
    deactivate stations.
15. **Report** the results, including any residual rows, in a follow-up document.

Steps 5–13 require explicit approval. Steps 1–2 are ready to run today.

## 14. Blockers

| ID | Blocker | Unblocks |
| --- | --- | --- |
| BLK-A | No credential for any role; `POS_DEV_STAFF_*` absent | Every authenticated test |
| BLK-B | Admin, Manager, Kitchen Staff, Cashier accounts do not exist | A5–A8, A10, A14, G1, G6 |
| BLK-C | No dedicated acceptance org/branch; existing data non-disposable | B, C, D, F, G |
| BLK-D | 0 stations, 0 category routes, 0 item routes | B, C, D, E1–E3 |
| BLK-E | 1 menu category and 1 menu item | Routing and precedence coverage |
| BLK-F | 0 kitchen tickets | Any read-only KDS inspection beyond empty state |
| BLK-G | No mutating approval | C, D, F, G |
| BLK-H | `BLK-008` Realtime delivery never observed | F1–F8 |

## 15. Known findings carried forward

1. **Repeated order acceptance** returns `ORDER_INVALID_STATUS` even though
   duplicate tickets are correctly prevented. Acceptance must record the exact
   code and confirm no duplicates (C6).
2. **Board counts are page-scoped**, not branch-wide. Expected result in E1 must
   read filtered-page counts, not totals.
3. **History filters by ticket `created_at`**, not completion time. E11/E13 must
   assert this documented behavior.
4. **`BLK-008`** — actual Realtime delivery remains unverified. F1–F8 are the
   closure attempt.
5. **`tatus`** remains an accidental tracked file (916 bytes, unchanged).
6. **Repository-wide CRLF** formatting failures are pre-existing.
7. M4-era function comments and the `supabase_realtime` publication are now the
   intended deployed state; they are no longer discrepancies.
8. The CLI labels the linked base project `environment: production`; the ref is
   Development. Not a Production exposure.

None of these was fixed. Finding 1 must be re-observed, not assumed.

## 16. What this milestone did not do

- No sign-in, order acceptance, ticket transition, cancellation, or station
  change.
- No account, role, assignment, grant, policy, or project-setting change.
- No migration, SQL write, schema change, seed, or reset.
- No Production contact.
- No commit, push, merge, rebase, branch switch, worktree, or source edit.
- No secret, credential, Auth user, or environment value printed.

Existing worktree changes were preserved: POS
`agent/pos-m4-4-kds-frontend` @ `ed29be5` (docs/tests only), backend
`feature/m4-1-kitchen-infrastructure` @ `864591b` (two M4.5 test files). `tatus`
remains tracked and unchanged.

## 17. Verdict

**BLOCKED — TEST ENVIRONMENT NOT READY.**

The deployed M4 platform passes every environment, schema, security, and Realtime
baseline check. Acceptance cannot start because there are no usable role
credentials, four of five role accounts do not exist, and no kitchen stations,
routes, or tickets exist. Only anonymous and schema read-only checks are runnable
today.

Unblocking requires, in order: an approved Owner credential, approval to create
the four missing role accounts, and approval for a dedicated acceptance branch
with stations, routes, menu fixtures, and tables. No hosted change was made while
preparing this report, and none will be made until those approvals arrive.
