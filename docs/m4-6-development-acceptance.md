# M4.6 — Development Environment Acceptance

## 1. Overall verdict

**BLOCKED for hosted Development acceptance.**

The hosted Development project (`bnticbeepxwhrzimouuh`) is reachable and its
existing M3 schema responds correctly, but **none of the M4 kitchen migrations
have been applied**. All five kitchen tables and all fourteen M4 kitchen RPCs are
absent. The POS-to-kitchen workflow therefore cannot run in hosted Development.

Local code, contracts, tests, and build remain green. The blocker is deployment
state, not an M4 implementation defect.

No hosted mutation was performed. No migration was applied. No Production
project was contacted.

The CLI's read-only `migration list --linked` path printed
"Initialising login role..." as part of its normal connection setup. No schema,
migration, data, account, policy, grant, publication, or project-setting change
was requested. One additional read-only OpenAPI GET used the backend server-side
key; no operational rows were read beyond schema metadata.

## 2. Project identity and safety gate

| Check | Result |
| --- | --- |
| Expected Development ref | `bnticbeepxwhrzimouuh` |
| Linked CLI target ref | **MATCH** |
| Production ref `xzchsyxhpknlogwcfsll` in active endpoint config | **Not found** |
| Production endpoint targeted | **No** |
| Hosted write / migration / seed / reset | **None performed** |
| Secrets printed | **None** |

The CLI reported the target ref as the approved Development ref and named it
"Development Branch - Restaurant". Its metadata also labels the branch
environment as `production`; the ref does not match the Production project and
all inspection was read-only. Recommend confirming that branch-label metadata
with the platform owner before further hosted work.

Configuration audit:

- POS shared `.env.local`: Supabase URL resolves to the Development ref.
- Ordering frontend `.env.local`: Supabase URL resolves to the Development ref.
- Backend main, integration, and M4.1 `.env.local`: Supabase URL resolves to the
  Development ref.
- POS M4.4 worktree has no `.env.local`; it has only `.env.example`. Runtime
  environment variables must be injected without committing secrets.
- Source files that contain the Production ref are the intentional environment
  guard/deny-list and documentation, not active endpoints.

## 3. Repositories and worktrees

| Repository / worktree | Branch | HEAD |
| --- | --- | --- |
| `restaurant-pos` (main checkout) | `main` | `92502fa` |
| POS M3/M3.5 worktree | `agent/pos-m3-frontend` | `fb77598` |
| POS M4.4 worktree | `agent/pos-m4-4-kds-frontend` | `ed29be5` |
| Backend M4.1–M4.3 worktree | `feature/m4-1-kitchen-infrastructure` | `864591b` |
| Backend main worktree | `main` | `4875bfc` |
| Backend M2 worktree | `agent/m2-branch-scoped-roles` | `d987e33` |
| Backend M3 worktree | `agent/m3-core-pos-operations` | `37e268b` |
| Backend integration worktree | `integration/m2-m3-backend` | `b00be11` |
| Ordering frontend worktree | `agent/ordering-frontend` | `8b22f17` |
| Waitlist repository | `main` | no commits |

M4.5 changes are **not committed**. The POS M4.4 worktree has modified and new
M4.5/M4.6 files. The backend M4.1 worktree has two modified integration test
files from M4.5. No commits, pushes, merges, rebases, or branch switches were
performed.

Frontend and backend M4 contracts are aligned **locally** (M4.5 golden-payload
test and local integration suite). Hosted alignment is not applicable because the
hosted backend does not contain M4.

## 4. Hosted migration comparison

Read-only `supabase migration list --linked` against the linked Development
project:

| Metric | Value |
| --- | --- |
| Repository migration files (M4.1 worktree) | 42 |
| Hosted applied migrations | 34 |
| Missing from hosted | **8** |
| Unexpected hosted migrations | 0 |
| Out-of-order migrations | 0 |
| Hosted latest migration | `20261109140100` |

Missing M4 migrations, in order:

```text
20261109150000  M4.1 kitchen infrastructure
20261109160000  M4.2 kitchen ticket lifecycle
20261109170000  M4.2 lifecycle corrections
20261109180000  M4.2 final lifecycle corrections
20261110120000  M4.3 kitchen station management
20261110130000  M4.3 KDS read RPCs
20261110140000  M4.3 Realtime publication
20261110150000  M4.3 order/kitchen state policy
```

The link configuration lives in the backend main/integration worktrees, whose
local migration folders predate M4. The comparison above uses the M4.1
worktree's migration files as the repository source of truth.

**No migration was applied.** Applying these eight migrations is the first
approval required before hosted acceptance can continue.

## 5. Hosted schema and RPC verification

Read-only checks performed with the Development publishable key, plus one
read-only OpenAPI GET with the backend server-side key:

| Object | Hosted Development | Evidence |
| --- | --- | --- |
| `kitchen_stations` | **ABSENT** | REST `404`, PostgREST `PGRST205`; not in OpenAPI |
| `kitchen_station_menu_categories` | **ABSENT** | not in OpenAPI |
| `kitchen_station_menu_items` | **ABSENT** | not in OpenAPI |
| `kitchen_tickets` | **ABSENT** | REST `404`, PostgREST `PGRST205` |
| `kitchen_ticket_items` | **ABSENT** | not in OpenAPI |
| All 14 M4 kitchen RPCs | **ABSENT** | not in OpenAPI RPC paths |
| `create_order`, `transition_order_status`, `list_branch_orders` | PRESENT | OpenAPI RPC paths |
| Anonymous `orders` read | Denied (`401`, SQLSTATE `42501`) | RLS enforcement on existing data |
| Auth settings endpoint | Reachable (`200`) | Development connectivity |

Because the kitchen objects do not exist, the following could **not** be
verified against hosted Development:

- Kitchen foreign keys, unique constraints, check constraints, and indexes.
- RLS enablement and kitchen SELECT policies.
- Direct-write denial on kitchen tables.
- RPC parameter signatures, ownership, grants, and execution permissions.
- Realtime publication membership for the five kitchen tables.
- Replica identity configuration on route tables.

These were verified locally in M4.5 against a disposable PostgreSQL cluster with
all 42 migrations applied. They are **not** verified hosted.

## 6. Authentication and connectivity

| Check | Result |
| --- | --- |
| Hosted auth endpoint reachable | Yes (`/auth/v1/settings` 200) |
| Publishable/anon request uses Development ref | Yes |
| Anonymous access to existing operational table | Denied by RLS (`42501`) |
| Staff sign-in and session persistence | **Not verified** — no approved test account |
| Organization/branch resolution | **Not verified hosted** — no approved test identity |
| Role retrieval and effective-role enforcement | **Verified locally only** (M4.5 and unit tests) |
| Expired/revoked session handling | **Verified by local tests only** |

No account, user, role, or membership was created or changed.

## 7. POS-to-kitchen workflow

**Not executed in hosted Development.** Two independent blockers apply:

1. The M4 kitchen tables and RPCs do not exist in hosted Development.
2. No approved disposable Development test data or test accounts were available.

No order, ticket, session, table, menu, user, or organization was created or
modified in hosted Development.

Proposed disposable-data acceptance plan after approval:

1. Apply the eight missing migrations to Development after separate approval.
2. Create a disposable organization and one branch with timezone `Asia/Jakarta`.
3. Create disposable Owner, Admin, Manager, Cashier, and Kitchen Staff accounts.
4. Create two active stations and one inactive station, plus menu categories and
   items, including a category route, an item-level override, and an unrouted
   item.
5. Create one table and dining session, then an accepted order covering routed
   and unrouted items.
6. Verify ticket generation, multi-station routing, inactive-station skip, and
   the full `pending → preparing → ready → completed` lifecycle.
7. Verify aggregate recalculation, cancellation propagation, order-status
   independence, history records, and station-management role denial.
8. Verify the role matrix and branch/organization isolation with each account.
9. Record evidence, then clean up disposable data under a separate approval.

## 8. Authorization and isolation

The intended matrix remains:

| Role | Board | History | Lifecycle | Station management |
| --- | --- | --- | --- | --- |
| Owner | Allowed | Allowed | Allowed | Allowed |
| Admin | Allowed | Allowed | Allowed | Allowed |
| Manager | Allowed | Allowed | Allowed | Allowed |
| Kitchen Staff | Allowed | Allowed | Allowed | Denied |
| Cashier | Denied | Denied | Denied | Denied |
| Anonymous | Denied | Denied | Denied | Denied |

- Hosted verification: **not executable** because M4 objects are absent.
- Local database verification: **passed** in M4.5, including anonymous, Cashier,
  cross-branch, and cross-organization denial and direct-write protection.
- Backend RPC authorization remains the security boundary; frontend guards are
  only navigation/control hints.

## 9. Realtime and polling

`BLK-008` remains open.

- Hosted kitchen tables do not exist, so Realtime subscription or delivery
  testing is impossible without first applying M4.3.
- No Realtime publication, channel, or project setting was changed.
- Polling at 45 seconds remains the supported behavior.
- Publication membership and replica identity were verified **locally** in
  M4.5; actual event delivery, reconnect behavior, duplicate suppression, and
  branch/organization event isolation remain unverified everywhere.

## 10. Local validation results

| Check | Result |
| --- | --- |
| Backend `npm run typecheck` | Passed |
| Backend contract tests | 86/86 passed |
| Backend migration governance / secret scan / blocker register / RLS manifest / contract drift | Passed |
| Frontend `npm run lint` | Passed |
| Frontend `npm run typecheck` | Passed |
| Frontend unit tests | 179/179 passed |
| Frontend production build | Passed; all three kitchen routes built |
| Full local DB integration (M4.5) | 137/137 passed on disposable PostgreSQL |

No baseline failures were introduced. Repo-wide `format:check` still has the
pre-existing CRLF-related failures described in M4.5.

## 11. Known findings and new observations

Carried forward from M4.5:

1. **`tatus`** remains a tracked accidental file in the POS M4.4 commit,
   916 bytes, unchanged. It was not deleted.
2. Repeated order acceptance returns `ORDER_INVALID_STATUS`; no duplicate
   tickets are created.
3. `BLK-008` Realtime delivery remains unverified.
4. Kitchen board counts are limited to the loaded page.
5. History filters by ticket `created_at`, not terminal time; the UI now states
   this.
6. Repo-wide `format:check` retains existing CRLF failures.

New for M4.6:

7. **Hosted Development is missing all eight M4 migrations**, so the kitchen
   feature is not deployed there.
8. The POS M4.4 worktree has no `.env.local`; runtime Development configuration
   is absent from that worktree even though the shared POS configuration targets
   Development.
9. The linked CLI target reports an environment label of `production` while the
   ref matches the approved Development ref. Confirm the branch metadata with the
   platform owner; no Production project was accessed.

## 12. Checks that could not be performed

- Hosted kitchen schema, constraints, indexes, RLS policies, grants, and RPC
  signatures (objects absent).
- Hosted kitchen Realtime publication and delivery.
- Hosted staff sign-in, session persistence, organization/branch resolution, and
  role enforcement (no approved accounts).
- Hosted POS-to-kitchen workflow, cancellation propagation, history, and station
  management (schema absent; no approved disposable data).
- Hosted direct-write denial on kitchen tables (tables absent).

## 13. Recommended next milestone and approvals

**Recommended next milestone:** M4.7 — Development M4 deployment and hosted
acceptance.

Required approvals, in order:

1. **Approve applying the eight missing M4 migrations to Development**
   (`bnticbeepxwhrzimouuh`) using the repository migration files, followed by a
   read-only schema verification.
2. **Approve creation of disposable acceptance data and test accounts** in
   Development, including the cleanup policy.
3. **Confirm the Development branch/environment metadata**, because the CLI
   labels the linked target environment as `production` even though its ref is
   the approved Development ref.
4. After deployment and data approval, run the POS-to-kitchen acceptance plan in
   section 7 and decide whether `BLK-008` can be closed.

Until steps 1–2 are approved, hosted Development acceptance remains **BLOCKED**.
