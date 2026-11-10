# M4.7.1 — Acceptance Environment Provisioning Plan

**Status:** plan and inspection only. No hosted mutation, Auth invitation, role change, fixture, SQL write, migration, commit, or deployment was performed while producing this document.

**Target:** Supabase Development `bnticbeepxwhrzimouuh`. Production `xzchsyxhpknlogwcfsll` was not contacted.

**Depends on:** M4.6.5 deployment execution (deployed baseline) and M4.7.0 hosted acceptance readiness (environment state).

---

## 1. Scope and method

This milestone answers one question:

> Can a safe, isolated M4 Kitchen acceptance environment be provisioned on hosted Development using mechanisms the repository actually implements and supports?

Method:

1. Read every provisioning-relevant migration, RPC, trigger, RLS policy, and grant in `restaurant-platform-backend-m4-1`.
2. Read the POS onboarding surfaces that are supposed to drive those mechanisms in `restaurant-pos-m4-4`.
3. Compare the implementation with the backend and POS documentation that defines the intended workflow.
4. Propose the isolated structure, role/account matrix, fixtures, cleanup rules, and a deterministic execution sequence.
5. Return a single verdict.

No hosted read or write was attempted. Environment facts are reused from M4.6.5 and M4.7.0, which are the latest verified evidence for Development.

Source-reference convention:

- `BE/...` = `restaurant-platform-backend-m4-1/...`
- `POS/...` = `restaurant-pos-m4-4/...`

---

## 2. Verified baseline carried forward

From M4.6.5 and M4.7.0:

| Fact | Value |
| --- | --- |
| Migrations applied on Development | 42 applied, 0 pending |
| Kitchen tables | 5, RLS enabled, one policy each |
| Public kitchen RPCs | 15, `SECURITY DEFINER`, authenticated-only, `anon` denied |
| Realtime kitchen members | 5 tables |
| Deployed kitchen route tables | `REPLICA IDENTITY FULL` |
| Organizations / branches | 1 / 1 active |
| Staff profiles / active staff | 1 / 1 |
| Role assignments | 1 (Owner, organization scope) |
| Branch assignments | 0 |
| Menu categories / items | 1 / 1 |
| Kitchen stations / category routes / item routes | 0 / 0 / 0 |
| Restaurant tables | 4 |
| Active dining sessions | 0 |
| Orders / order items | 7 / 8 |
| Kitchen tickets / ticket items | 0 / 0 |

The single organization/branch and its M3 records have undocumented provenance and are therefore **non-disposable** for this plan. M4.7.1 does not propose deleting, resetting, or reseeding them.

`BLK-008` (Realtime delivery) remains open. This plan does not assume Realtime works; polling remains the supported fallback.

---

## 3. Architecture findings

### 3.1 The write-path rule

The database is the security boundary:

- Tenant tables grant `SELECT` only to `authenticated`.
- `staff_profiles`, `staff_role_assignments`, and `staff_branch_assignments` explicitly `REVOKE ALL` from `authenticated` and enable RLS; the only client grant is `SELECT`.
- All tenant writes go through reviewed `SECURITY DEFINER` RPCs that re-derive the caller's staff profile, organization, role, scope, and branch assignment server-side.

References:

- `BE/supabase/migrations/20261108090300_identity_and_access.sql:180-204` — RLS enabled and `authenticated` revoked on staff tables.
- `BE/supabase/migrations/20261108100100_rls_policies.sql:25-28` — `organizations`, `branches`, `subscriptions` are read-only grants.
- `BE/supabase/migrations/20261108100100_rls_policies.sql:54-57` — staff tables are read-only grants.
- `BE/supabase/migrations/20261108100100_rls_policies.sql:102-110` — menu tables are read-only grants.

Consequence: direct table insertion is not a supported client write path, and this plan does not use one.

### 3.2 Implemented provisioning RPCs

The following are implemented, granted to `authenticated`, and audited.

| Object | Implemented RPC | Authorization | Reference |
| --- | --- | --- | --- |
| Organization + first branch + Owner + Free subscription | `register_organization(name, branch_name, branch_timezone, owner_display_name, ...)` | Caller must be authenticated and have **no existing staff profile** | `BE/.../migrations/20261108100300_rpc_organization_branch_staff.sql:7-185`; hardened at `20261108110100_security_remediation_rpcs.sql:11-188` |
| Additional branch | `create_branch(organization_id, name, timezone, ...)` | Owner/Admin, same organization, plan branch limit | `BE/.../20261108110100_security_remediation_rpcs.sql:190-332` |
| Staff role | `grant_staff_role(staff_id, role_code, scope_type, reason, branch_id)` | Owner/Admin; Admin only Owner may grant; Owner cannot be granted | `BE/.../20261109130000_m2_staff_rpc_concurrency_and_errors.sql:212-372` |
| Role revocation | `revoke_staff_role(assignment_id, reason)` | Owner/Admin; Admin role revocation Owner-only | `BE/.../20261109130000_m2_staff_rpc_concurrency_and_errors.sql:104-210` |
| Branch assignment | `assign_staff_branch(staff_id, branch_id)` | Owner/Admin | `BE/.../20261109130000_m2_staff_rpc_concurrency_and_errors.sql:374-465` |
| Staff deactivate/reactivate/profile | `deactivate_staff`, `reactivate_staff`, `update_staff_profile` | Owner/Admin (self for profile) | `BE/.../20261108100300_rpc_organization_branch_staff.sql:825-992`; normalized at `20261109140000_m2_staff_admin_error_normalization.sql` |
| Menu category/item/modifier | `create_menu_category`, `create_menu_item`, modifier RPCs | **Owner/Admin organization role** | `BE/.../20261108110500_security_remediation_error_consistency_menu_staff.sql:4-827` |
| Branch availability/price | `set_branch_item_availability`, `set_branch_price_override`, `remove_branch_price_override` | Owner/Admin/Manager branch role | `BE/.../20261108110500_...:636-827` |
| Table | `create_table`, `update_table`, `deactivate_table`, `regenerate_table_qr` | Owner/Admin/Manager branch role | `BE/.../20261108110100_...:334-394`, `457-513`; `BE/.../20261108110400_security_remediation_phase2.sql:231-474` |
| Dining session | `open_dining_session`, `close_dining_session` | Owner/Admin/Manager/Cashier branch role | `BE/.../20261108111000_m3_table_session_rpcs.sql:271-339`, `446-531` |
| Order | `create_order`, `transition_order_status`, `cancel_order`, item RPCs | Accept/serve/cancel: Owner/Admin/Manager/Cashier. `preparing`/`ready`: Owner/Admin/Manager only | `BE/.../20261108111100_m3_order_rpcs.sql:6-68`, `916-1087`; `BE/.../20261110150000_m4_order_kitchen_state_policy.sql:42-65` |
| Kitchen station | `create_kitchen_station`, `update_kitchen_station`, `deactivate_kitchen_station`, `reactivate_kitchen_station` | Owner/Admin/Manager branch role | `BE/.../20261110120000_m4_kitchen_station_management.sql:107-442` |
| Kitchen routes | `add/remove_kitchen_station_category_route`, `add/remove_kitchen_station_item_route` | Owner/Admin/Manager branch role | `BE/.../20261110120000_m4_kitchen_station_management.sql:448-805` |
| Kitchen reads | `list_kitchen_stations`, `list_kitchen_tickets`, `get_kitchen_ticket`, `list_kitchen_routing_issues` | Stations/tickets: Owner/Admin/Manager/Kitchen Staff. Routing issues: Owner/Admin/Manager only | `BE/.../20261110120000_...:816-860`; `BE/.../20261110130000_m4_kitchen_kds_read_rpcs.sql:139-376`; `BE/.../20261109170000_...:1104-1130` |
| Kitchen item lifecycle | `start_kitchen_ticket_item`, `mark_kitchen_ticket_item_ready`, `complete_kitchen_ticket_item` | Owner/Admin/Manager/Kitchen Staff branch role | `BE/.../20261109160000_m4_kitchen_ticket_lifecycle.sql:1086-1130` and `:1019-1022` |

### 3.3 The critical gap: no implemented staff-account provisioning

`register_organization` is the **only** function that inserts into `public.staff_profiles`, and it inserts exactly one profile — the caller's — while creating a brand-new organization.

- It raises `STAFF_ALREADY_MEMBER` if the caller already has any staff profile: `BE/.../20261108100300_...:80-87`.
- `staff_profiles.auth_user_id` is `NOT NULL UNIQUE` and references `auth.users(id) ON DELETE RESTRICT`: `BE/.../20261108090300_identity_and_access.sql:3-19`.
- `grant_staff_role` requires the target staff profile to already exist in the caller's organization: `BE/.../20261109130000_...:234-243`.
- No RPC named or shaped like `invite_staff`, `create_staff`, `accept_invitation`, `onboard`, or `provision` exists in any migration.
- No Edge Function exists for staff invitations. `BE/supabase/functions/` contains only guest-facing functions (`guest-reconnect`, `guest-resolve-table`, `guest-session-data`).
- No `auth.admin`/`inviteUserByEmail` call exists anywhere in either repository.

This is confirmed by the backend documentation itself:

- `BE/docs/api-and-rpc-contracts.md:599-600` lists **Invite staff** and **Create staff account** as "Edge Function + RPC" — a design contract, not an implemented capability.
- `BE/docs/api-and-rpc-contracts.md:607` says invitations "may use Supabase Auth invitation functionality through a trusted server-side workflow."
- `BE/docs/backend-services.md:483-484` states: "Staff invitation/activation flow is unresolved; no Auth-admin invitation Edge Function is implemented."
- `BE/docs/schema/database-foundation.md:375` still lists "Staff invitation flow" as open.
- `POS/docs/supabase-integration.md:163` lists "Staff invitation/provisioning workflow" as outstanding.

### 3.4 One organization per staff account

`staff_profiles.auth_user_id` is unique. A staff account belongs to exactly one organization and cannot be attached to a second one through any implemented RPC. `register_organization` refuses an account that already has a profile.

Consequence: you cannot "add" the existing Development Owner to a new acceptance organization, and you cannot reuse one account across the existing organization and a dedicated acceptance organization.

### 3.5 POS onboarding surfaces are not wired to provisioning

| Surface | Actual behavior | Reference |
| --- | --- | --- |
| `/staff/new` ("Invite staff member") | Client form writes to `useMockData().addStaff`; no Supabase call, no Auth invite, no RPC | `POS/src/features/staff/components/staff-form.tsx:41`, `:70-92` |
| `/branches/new` | Creation intentionally disabled; renders an unavailable empty state | `POS/src/features/branches/components/branch-form.tsx:9-22` |
| `/organization` | No `update_organization` call found | grep over `POS/src/features/organization` returned no RPC/mock write |
| `/menu/*`, `/tables`, `/kitchen/stations`, `/pos` | Real Supabase RPC wiring | `POS/src/features/menu/actions.ts`, `POS/src/features/pos/actions.ts`, `POS/src/features/kitchen/actions.ts` |
| Sign-up / onboarding | No route; only `/login` | `POS/src/app` route inventory |

So the only supported, implemented end-to-end onboarding is: an already-authenticated Auth user with no staff profile calls `register_organization` and becomes Owner of a new organization. There is no POS screen that performs it.

### 3.6 Plan and entitlement dependency

`register_organization` requires an active row in `public.plans` with `is_free = true`:

- `BE/.../20261108100300_...:89-101` → `SUBSCRIPTION_PLAN_UNAVAILABLE` otherwise.
- `BE/.../20261108110100_...:92-104` repeats the check.

Plans are **not seeded** by migrations or `seed.sql`:

- `BE/supabase/migrations/20261108090100_reference_data.sql:7-8`: "Plans, plan entitlements, permissions, and role-permission mappings are intentionally not seeded until their catalogs are approved."
- `BE/supabase/seed.sql:1-9`: explicitly says not to add plans or demo organizations.

`create_branch` enforces `plans.branch_limit` and counts active branches (`BE/.../20261108110100_...:257-288`). Whether hosted Development has a plan row, and what its `branch_limit` is, is **unknown** and cannot be checked without hosted read access.

---

## 4. Supported provisioning mechanisms (by object)

| Object | Supported mechanism | Status | Notes |
| --- | --- | --- | --- |
| Auth user | None implemented in this platform | **Not established** | Supabase Auth itself can create/invite users, but no trusted server-side workflow is implemented. |
| Organization + first branch + Owner | `register_organization` | Implemented | Requires an authenticated caller with no existing staff profile and an active Free plan row. |
| Additional branch | `create_branch` | Implemented | Owner/Admin only; plan branch limit applies. |
| Owner membership | Created only as part of `register_organization` | Implemented | Cannot be granted later (`grant_staff_role` rejects `owner`). |
| Admin membership | `grant_staff_role` on an existing profile | Implemented, but profile creation is not | Owner only may grant Admin. |
| Manager / Kitchen Staff / Cashier membership | `grant_staff_role` on an existing profile | Implemented, but profile creation is not | Branch scope and branch id required. |
| Staff profile for a second account | None | **Not implemented** | This is the blocker. |
| Menu category / item | `create_menu_category` / `create_menu_item` | Implemented | Owner/Admin organization role only. |
| Table | `create_table` | Implemented | Owner/Admin/Manager branch role. |
| Dining session | `open_dining_session` | Implemented | Owner/Admin/Manager/Cashier branch role. |
| Kitchen station | `create_kitchen_station` | Implemented | Owner/Admin/Manager branch role. |
| Category route | `add_kitchen_station_category_route` | Implemented | Owner/Admin/Manager; active station only. |
| Item route | `add_kitchen_station_item_route` | Implemented | Item routes take precedence over category routes. |
| Kitchen ticket | Generated automatically on order acceptance | Implemented | No manual ticket creation RPC. |

**Conclusion for §4:** every object *after* staff membership has a supported RPC. The single missing link is creating an Auth user and attaching a staff profile to an existing organization.

---

## 5. Proposed isolated structure

### 5.1 Target design (primary)

| Field | Proposed value |
| --- | --- |
| Organization name | `M4 Acceptance — Kitchen Operations (DEV)` |
| Branch name | `M4 Acceptance Kitchen Lab (DEV)` |
| Timezone | `Asia/Jakarta` |
| Currency | `IDR` (only seeded currency) |
| Address / phone | omitted |
| Naming prefix | `M4-ACC-` on every fixture |

Properties:

- Clearly distinguishable from the existing organization/branch.
- No dependency on existing M3 records.
- Can be retained after the acceptance run; only explicitly disposable fixtures are reset.
- All test fixtures live under this branch, so the existing branch is never touched.

### 5.2 Fallback design

If the plan entitlement cannot provide a second active branch, or if a second Auth identity cannot be approved, the fallback is a **dedicated acceptance branch under the existing organization**, named `M4 Acceptance Kitchen Lab (DEV)`, administered by the existing Owner.

Trade-offs:

- Weaker isolation: shares the organization with existing data and staff.
- Does not solve the four-role provisioning blocker.
- Still requires `create_branch` to pass `plans.branch_limit`.
- Requires the existing Owner credential, which is currently absent.

### 5.3 Recommendation

Use the primary design if a new Owner identity can be provisioned. Otherwise use the fallback branch, but only after the staff-provisioning blocker is resolved. Do **not** create fixtures in the existing branch "for now", because its provenance is undocumented and its M3 records are non-disposable.

---

## 6. Role and account matrix

Required end state for full M4 acceptance. `staff_profiles` rows are per-account and single-organization.

| Role | Auth account | Staff profile | Role assignment | Branch assignment | Expected permissions | Provisioning status |
| --- | --- | --- | --- | --- | --- | --- |
| Owner | Yes, dedicated | Active, acceptance org | `owner` / `organization` | Not required (org scope reaches active branches) | All org/branch/menu/table/station/kitchen/order RPCs; sole grantor of Admin | **Not established** (no Auth account; `register_organization` needs a new identity) |
| Admin | Yes | Active, acceptance org | `admin` / `organization` (recommended) | Not required for org scope | Menus, branches, staff roles, tables, stations/routes, order lifecycle; cannot grant Owner; cannot grant Admin unless Owner | **Blocked** (no profile creation RPC) |
| Manager | Yes | Active, acceptance org | `manager` / `branch` + acceptance branch | Auto-created by role trigger, or explicit | Tables, stations/routes, order accept/serve/cancel and `preparing`/`ready`; menu read + availability/price; no menu create | **Blocked** (no profile creation RPC) |
| Kitchen Staff | Yes | Active, acceptance org | `kitchen_staff` / `branch` + acceptance branch | Auto-created by role trigger, or explicit | Kitchen station read; ticket list/get; item start/ready/complete; no station writes; no order `preparing`/`ready`; no cashier actions | **Blocked** (no profile creation RPC) |
| Cashier | Yes | Active, acceptance org | `cashier` / `branch` + acceptance branch | Auto-created by role trigger, or explicit | Tables, sessions, order create/accept/serve/cancel; no kitchen read; no station access; no menu writes | **Blocked** (no profile creation RPC) |
| Anonymous | No | — | — | — | `/auth/v1/settings` only; all tenant tables/RPCs denied | Available |

Notes:

- `grant_staff_role` with a branch id atomically ensures the matching active `staff_branch_assignments` row through `staff_role_assignments_ensure_branch_assignment` (`BE/.../20261108120000_m2_branch_scoped_staff_roles.sql:176-219`). An explicit `assign_staff_branch` is still useful for isolation tests.
- A branch-scoped Admin does not receive organization-wide navigation (`POS/docs/roles-and-permissions.md:209-212`). Use an organization-scoped Admin for the main matrix; add a branch-scoped Admin only if that restriction must be asserted.
- Kitchen Staff are intentionally excluded from order-level `preparing`/`ready` to avoid two competing controls (`BE/.../20261110150000_m4_order_kitchen_state_policy.sql:47-54`).
- Cashier is excluded from all kitchen ticket reads and station reads (`BE/.../20261110130000_...:11`, `:173-176`; `BE/.../20261109150000_...:251-294`).

### 6.1 Credential handling

- Email addresses: use a controlled, non-customer domain supplied by the requester, e.g. `<acceptance-domain>` + `m4-acc-owner@`, `m4-acc-admin@`, `m4-acc-manager@`, `m4-acc-kitchen@`, `m4-acc-cashier@`.
- Passwords: generated by the requester or the provisioning operator, delivered out-of-band (secret manager or ephemeral secure channel), never committed, never printed in logs or chat, never written into `.env` examples.
- Existing verification scripts read `POS_DEV_STAFF_EMAIL` / `POS_DEV_STAFF_PASSWORD` from the process environment only (`POS/scripts/verify-hosted-development.ts`). Per-role runs need the same mechanism under distinct variable names or a separate process invocation per role.
- Do not store per-role credentials in the repository. Do not reuse the Owner password for other roles.

### 6.2 Who must approve

- Owner account creation / invitation: the project owner (human) explicitly.
- Admin/Manager/Kitchen/Cashier membership: the acceptance Owner (once provisioned) via the approved mechanism, or the backend workstream if a system-level provisioning path is approved.
- Any use of a service-role key: explicit, time-boxed approval, server-side only, never in the POS or in a browser session.

---

## 7. Fixture inventory

All names use the `M4-ACC-` prefix. Nothing below is created by this milestone.

### 7.1 Menu

| Fixture | Type | Parent | Purpose |
| --- | --- | --- | --- |
| `M4-ACC-Grill` | Category | — | Category-level routing target |
| `M4-ACC-Cold` | Category | — | Category-level routing and multi-station behavior |
| `M4-ACC-Beverage` | Category | — | Unrouted-item control |
| `M4-ACC-Grill-01` | Item | Grill | Item-level route to Hot Line (overrides category route) |
| `M4-ACC-Grill-02` | Item | Grill | No item route; inherits category route to Hot Line |
| `M4-ACC-Cold-01` | Item | Cold | No item route; inherits category route to Cold Line |
| `M4-ACC-Cold-02` | Item | Cold | Item-level route to the inactive station (must become unrouted, no fallback) |
| `M4-ACC-Cold-03` | Item | Cold | Item-level routes to **both** active stations (multi-station) |
| `M4-ACC-Unrouted-01` | Item | Beverage | No route at all; must produce no ticket and stay on the order |

Menu writes require Owner or Admin. Manager cannot create these fixtures.

### 7.2 Stations

| Fixture | Status | Purpose |
| --- | --- | --- |
| `M4-ACC-Hot-Line` | active | Category and item routing; lifecycle |
| `M4-ACC-Cold-Line` | active | Category and item routing; multi-station |
| `M4-ACC-Legacy-Bar` | inactive after route setup | Inactive-station behavior and no-fallback rule |

### 7.3 Routes

| Route | Type | Station | Expected effect |
| --- | --- | --- | --- |
| Grill → Hot Line | Category | Hot Line | `Grill-02` routes to Hot Line |
| Cold → Cold Line | Category | Cold Line | `Cold-01` routes to Cold Line |
| Grill-01 → Hot Line | Item | Hot Line | Precedence: item route wins, but same station here; use a second variant if a cross-station override is needed |
| Cold-02 → Legacy Bar | Item | Legacy Bar | Inactive item route; item is unrouted, **no** Cold Line fallback |
| Cold-03 → Hot Line | Item | Hot Line | Multi-station half |
| Cold-03 → Cold Line | Item | Cold Line | Multi-station half |

To prove precedence unambiguously, add one cross-station override: `Grill-02` → Cold Line as an **item** route would defeat the category route. Prefer a separate item, `M4-ACC-Grill-03`, with an item route to Cold Line, so `Grill-02` can continue to demonstrate category inheritance. Keep the total small.

### 7.4 Tables

| Fixture | Capacity | Purpose |
| --- | --- | --- |
| `M4-ACC-T1` | 4 | Multi-station and lifecycle orders |
| `M4-ACC-T2` | 2 | Cancellation and unrouted-item orders |

Tables are branch-scoped. `create_table` also creates the QR identifier row.

### 7.5 Orders and scenarios (created only during an approved run)

| Scenario | Items | Expected routing |
| --- | --- | --- |
| S1 Multi-station | `Grill-02`, `Cold-01` | One ticket on Hot Line, one on Cold Line |
| S2 Precedence | `Grill-01`, `Grill-03` | `Grill-01` on Hot Line; `Grill-03` on Cold Line (item override) |
| S3 Multi-station item | `Cold-03` | One item, tickets on both Hot Line and Cold Line |
| S4 Inactive | `Cold-02` | No ticket; item remains on the order |
| S5 Unrouted | `Unrouted-01` | No ticket; order remains valid |
| S6 Mixed | `Unrouted-01`, `Grill-02` | One ticket (Hot Line); one unrouted item |
| S7 Lifecycle | `Grill-02`, `Cold-01` | Start, ready, complete each item; verify aggregate status |
| S8 Cancellation | `Grill-02`, `Cold-01` | Remove/cancel one item, then cancel the order; verify ticket propagation |

Eight orders is the practical minimum. They cannot be hard-deleted later; they can only be cancelled and retained as history.

---

## 8. Security and isolation analysis

### 8.1 Tenant and branch scoping

Every RPC derives the organization from the authenticated staff profile (`authz.current_organization_id()`), not from client input. Cross-organization resources are reported as not found:

- `create_branch`: organization must equal the caller's (`BE/.../20261108110100_...:217-222`).
- `grant_staff_role`, `assign_staff_branch`: target staff and branch must be in the caller's organization (`BE/.../20261109130000_...:234-243`, `:284-291`).
- Station RPCs: station organization must equal the caller's; cross-org is `KITCHEN_STATION_NOT_FOUND` (`BE/.../20261110120000_...:465-481`).
- KDS reads: branch must be in the caller's organization; cross-org ticket is `KITCHEN_TICKET_NOT_FOUND` (`BE/.../20261110130000_...:165-176`, `:355-376`).

### 8.2 Authorization matrix (implemented, not UI hints)

| Capability | Owner | Admin (org) | Manager (branch) | Kitchen Staff (branch) | Cashier (branch) | Anonymous |
| --- | --- | --- | --- | --- | --- | --- |
| Create menu category/item | Yes | Yes | No | No | No | No |
| Create/update/deactivate station | Yes | Yes | Yes | No | No | No |
| Add/remove routes | Yes | Yes | Yes | No | No | No |
| Read stations/routes | Yes | Yes | Yes | Yes | No | No |
| List/get kitchen tickets | Yes | Yes | Yes | Yes | No | No |
| Kitchen item transitions | Yes | Yes | Yes | Yes | No | No |
| Order `preparing`/`ready` | Yes | Yes | Yes | No | No | No |
| Order accept/serve/cancel | Yes | Yes | Yes | No | Yes | No |
| Tables/sessions | Yes | Yes | Yes | No | Yes | No |
| Grant Admin | Yes | No | No | No | No | No |
| Grant Manager/Kitchen/Cashier | Yes | Yes | No | No | No | No |
| Grant Owner | No (not supported) | No | No | No | No | No |

References: `BE/.../20261108110500_...:4-53` (menu), `BE/.../20261110120000_...:107-141` (station admin), `BE/.../20261110130000_...:173-176` (KDS read), `BE/.../20261109160000_...:1019-1022` (item lifecycle), `BE/.../20261110150000_...:42-65` (order state), `BE/.../20261109130000_...:242-263` (role grants).

### 8.3 Cross-branch isolation

- Branch-scoped roles are only effective on the exact branch id in the role row **and** while an active `staff_branch_assignments` row exists (`BE/.../20261108120000_...:380-397`).
- Revoking a branch assignment is a suspension, not a role removal; re-assigning restores the still-active role (`BE/docs/backend-services.md:190-202`).
- A branch assignment alone grants nothing.
- Organization-scoped Owner/Admin reach every active branch without branch assignments.

### 8.4 Provisioning procedures that could over-grant

| Risk | Why it matters | Control |
| --- | --- | --- |
| Giving all five test accounts organization-scoped Admin/Manager roles | Bypasses branch isolation and invalidates the matrix | Only Owner and the designated org Admin get organization scope; Manager/Kitchen/Cashier are branch-scoped |
| Reusing the existing Owner account for every role test | Role assertions become meaningless | One account per role; Owner only for setup and Owner-only checks |
| Using a service-role key from the POS or browser | Bypasses every guard and RLS check | Never; server-side, time-boxed, explicit approval only |
| Direct `INSERT` into `staff_profiles` / `staff_role_assignments` | No supported write path; risks inconsistent membership/audit | Prohibited unless a reviewed backend provisioning RPC/Edge Function is implemented |
| Assigning role on the wrong branch | `grant_staff_role` accepts any branch in the organization | Always pass the acceptance branch id; verify returned `branchId` |
| Creating a second active Owner | Database unique index prevents it (`staff_role_assignments_one_active_owner`) | Do not attempt; only one Owner |
| Leaving test accounts active forever | Dormant privileged accounts | Deactivate/revoke after acceptance, or retain with an explicit owner decision |
| Creating fixtures in the existing branch | Contaminates non-disposable data | Enforce the `M4-ACC-` branch guard before every write |

### 8.5 Anonymous

M4.7.0 confirmed:

- `/auth/v1/settings` returns 200.
- Anonymous `kitchen_tickets`, `kitchen_stations`, and `orders` return `401 / 42501`.
- No table grants to `anon`; kitchen RPCs are authenticated-only.

This must be rechecked after provisioning, because new rows and stations do not change the grant model but do change what would be exposed if a policy were wrong.

---

## 9. Cleanup and reversibility

### 9.1 What can and cannot be deleted

| Fixture | Hard delete supported? | FK / history dependency | Supported cleanup |
| --- | --- | --- | --- |
| Organization | No RPC | Referenced by branches, staff, menu, audit | Retain; optionally suspend later with approval |
| Branch | No | Referenced by tables, sessions, orders, stations, assignments | `deactivate_branch` (blocked if an active session exists) |
| Auth user | No platform workflow | `staff_profiles.auth_user_id` is `ON DELETE RESTRICT` | Disable/retain; do not delete |
| Staff profile | No | Role/branch assignments, orders, audit | `deactivate_staff`; revoke roles |
| Role assignment | Yes (soft revoke) | `revoked_at` retains history | `revoke_staff_role` |
| Branch assignment | Yes (soft revoke) | `revoked_at` retains history | `revoke_staff_branch` / `revoke_staff_role` |
| Menu category | No | Items, orders, routes | `archive_menu_category` |
| Menu item | No | Order items, routes | `archive_menu_item` |
| Table | No | Sessions, orders, QR | `deactivate_table` |
| Dining session | No | Orders | `close_dining_session` |
| Order | No | Items, tickets, bills | `cancel_order` |
| Kitchen ticket / item | No | Audit and order history | Retain; cancellation propagates from the order |
| Station | No | Tickets, routes | `deactivate_kitchen_station`; routes kept |
| Category/item route | **Yes** (hard `DELETE`) | None beyond audit | `remove_kitchen_station_*_route` |

Route removal is the only approved destructive configuration delete (`BE/.../20261110120000_...:19-21`). It deletes only the route row, never stations, tickets, or audit.

### 9.2 Cleanup strategy

1. **Retain** the dedicated acceptance organization and branch. Do not attempt to delete them.
2. During each run, close every dining session and cancel every acceptance order.
3. Deactivate the two acceptance tables.
4. Remove all `M4-ACC-` routes from the three stations (this is the only hard delete and is safe).
5. Deactivate the three stations (including `M4-ACC-Legacy-Bar`).
6. Archive all `M4-ACC-` menu items and categories.
7. Revoke branch roles and branch assignments for the four non-Owner accounts, then deactivate those staff profiles if they are not needed for a follow-up run.
8. Leave the Owner profile active for the next run, unless the owner explicitly requests deactivation.
9. Re-run the read-only baseline and report residual rows: inactive tables/stations, archived menu, cancelled orders, closed sessions, retained audit.
10. Never touch the existing organization, branch, tables, menu, orders, or sessions.

### 9.3 Why not a disposable organization

A truly disposable organization would require deleting Auth users, staff profiles, and all dependent rows. No supported mechanism exists, and the foreign keys use `ON DELETE RESTRICT`. Attempting it would require privileged SQL, which this plan prohibits. Retaining the acceptance tenancy is the only reversible, auditable strategy.

---

## 10. Exact execution sequence

Every step lists prerequisites, mechanism, expected result, and approval gate. Steps 1–2 are read-only. Step 3 onward requires explicit approval.

| # | Step | Prerequisites | Supported mechanism | Expected result | Approval |
| --- | --- | --- | --- | --- | --- |
| 0 | Freeze and re-verify environment | None | Read-only: confirm Development ref, migration count, baseline counts | 42/42, baseline unchanged | Not required (read-only) |
| 1 | Resolve the provisioning mechanism | Backend owner decision | Choose: (a) implement reviewed Auth-invite + staff-profile Edge Function/RPC, or (b) explicitly approve a documented admin provisioning procedure, or (c) defer acceptance | A written, supported mechanism exists | **Required** |
| 2 | Verify plan entitlement | Hosted read access | Read-only SQL/REST: active Free plan row; `branch_limit`; existing subscription | Plan exists and limit allows the chosen structure | Not required (read-only) |
| 3 | Provision the Owner identity | Step 1; approved email; credentials | Approved Auth mechanism + `register_organization` for a dedicated org, or existing Owner + `create_branch` for the fallback | Organization/branch exist with one active Owner | **Required** |
| 4 | Provision Admin, Manager, Kitchen Staff, Cashier | Step 1; four approved emails; credentials | Approved staff-account mechanism + `grant_staff_role` | Four active profiles with the exact roles/scopes | **Required** |
| 5 | Assign branch access | Step 4; acceptance branch | Auto-created by `grant_staff_role(branch_id)`, or `assign_staff_branch` | Manager/Kitchen/Cashier have active assignments on the acceptance branch only | **Required** |
| 6 | Create menu fixtures | Step 3; Owner or Admin session | `create_menu_category`, `create_menu_item` | 3 categories, 7 items | **Required** |
| 7 | Create tables | Step 3; Owner/Admin/Manager session | `create_table` | `M4-ACC-T1`, `M4-ACC-T2` with QR identifiers | **Required** |
| 8 | Create stations and routes | Step 6; Owner/Admin/Manager session | `create_kitchen_station`, route RPCs, then deactivate `M4-ACC-Legacy-Bar` | 2 active + 1 inactive; six routes | **Required** |
| 9 | Verify isolation and role permissions | Steps 3–8 | UI + RPC probes with each account; anonymous probes | Matrix in §8.2 holds; cross-branch/org denied; anon `401/42501` | **Required** |
| 10 | Run read-only acceptance checks | Step 3; Owner credential in process env | `npm run verify:hosted` (no writes) | Sign-in, workspace, menu, tables, orders, rejection guards pass | **Required** |
| 11 | Run controlled order/lifecycle tests | Steps 6–9; mutating approval | `open_dining_session`, `create_order`, item RPCs, `transition_order_status`, `cancel_order` | Scenarios S1–S8 behave as specified; ticket counts correct | **Required** |
| 12 | Cleanup | Step 11 | §9.2 sequence | No active sessions/orders; fixtures soft-retired; residual list reported | **Required** |

Hard gates:

- Do not start step 3 until step 1 produces a supported mechanism. Creating Auth users or staff profiles by ad-hoc SQL would bypass the contract and is not acceptable.
- Do not start step 6 until step 9's role probes can identify the exact actor for every write.
- Abort if any existing Development row changes.

---

## 11. Missing user inputs

| Input | Why it is needed | Status |
| --- | --- | --- |
| Decision on the staff provisioning mechanism | No implemented Auth/staff-profile path for non-Owner roles | **Missing — critical** |
| Approval to implement an invitation/create-account Edge Function + RPC | Only way to establish a supported mechanism | **Missing** |
| Acceptance email domain and five addresses (or a decision to reuse the existing Owner only) | Account creation | **Missing** |
| Owner credential (existing or new) | All authenticated setup | **Missing** |
| Four per-role credentials, delivered out-of-band | Role matrix | **Missing** |
| Confirmation of dedicated organization vs fallback branch | Structure and isolation | **Missing** |
| Confirmation that the active Free plan row exists and its `branch_limit` | `register_organization` / `create_branch` | **Unknown** |
| Explicit approval for hosted writes (accounts, org/branch, fixtures) | Safety gate | **Missing** |
| Approval for mutating acceptance and cleanup scope | Steps 11–12 | **Missing** |
| Confirmation that `M4-ACC-` names are acceptable | Cleanup identification | **Missing** |

No credential is requested in this document. No value is recorded anywhere.

---

## 12. Risks and blockers

| ID | Risk / blocker | Impact | Mitigation / unblock |
| --- | --- | --- | --- |
| BLK-P1 | **No supported mechanism creates an Auth user or staff profile for additional roles** | Cannot obtain Admin, Manager, Kitchen Staff, or Cashier in any organization | Implement and review the documented "Edge Function + RPC" invitation/create-account workflow, or obtain an explicit approved admin procedure |
| BLK-P2 | A dedicated organization requires a new Auth identity; the existing Owner cannot join it (`STAFF_ALREADY_MEMBER`, unique `auth_user_id`) | Primary design cannot be completed with existing accounts | Provision a new Owner identity through the approved mechanism |
| BLK-P3 | No active Free plan row is guaranteed; plans are not seeded by migrations | `register_organization` returns `SUBSCRIPTION_PLAN_UNAVAILABLE` | Read-only verification; if absent, backend must approve and seed the plan catalog |
| BLK-P4 | `plans.branch_limit` may be 1 | `create_branch` returns `BRANCH_LIMIT_REACHED`; fallback design fails | Read-only verification; use the dedicated-org design or approve a plan change |
| BLK-P5 | No credentials exist locally or in the process environment | No authenticated test can run | Requester supplies credentials out-of-band |
| BLK-P6 | Existing organization/branch provenance is undocumented | Destructive tests could destroy M3 evidence | Use the dedicated acceptance tenancy; never delete existing rows |
| BLK-P7 | Cleanup is soft-only for most objects | Residual inactive/archived/cancelled rows accumulate | Retain the acceptance tenancy; document residuals; do not attempt hard deletes |
| BLK-P8 | `BLK-008` Realtime delivery is unverified | F-series acceptance cannot be trusted | Treat polling as the supported fallback; keep the realtime verification as a separate attempt |
| BLK-P9 | Auth invitations may send real email | Accidental customer mail or address disclosure | Use controlled addresses; confirm mail behavior before inviting |
| BLK-P10 | Pre-existing CRLF/format failures and `tatus` | Noise in checks; repo hygiene | Do not fix in this milestone; record as pre-existing |

---

## 13. What this milestone did not do

- No hosted read or write, including no organization, branch, staff, role, membership, menu, table, station, route, order, or session change.
- No Auth account creation or invitation.
- No SQL write, migration, seed, or reset.
- No Production contact.
- No commit, push, merge, rebase, branch switch, worktree creation, or deployment.
- No application source edit. Only this document and its README link were added.
- No secret, token, password, or environment value was printed or stored.
- Existing worktree changes were preserved: POS `agent/pos-m4-4-kds-frontend` @ `ed29be5`; backend `feature/m4-1-kitchen-infrastructure` @ `864591b`; `tatus` remains tracked and unchanged (916 bytes).

---

## 14. Verdict

**BLOCKED — PROVISIONING MECHANISM NOT ESTABLISHED.**

The M4 Kitchen data model, RPCs, RLS, and cleanup rules are implemented and sufficient for acceptance. The environment can even create a dedicated organization, branch, menu, tables, stations, and routes using supported RPCs.

Acceptance cannot be provisioned because the platform has **no implemented, supported mechanism to create the Auth users and staff profiles required for Admin, Manager, Kitchen Staff, and Cashier**, and no supported way to attach an existing account to a second organization. The documented workflow is explicitly an unimplemented "Edge Function + RPC" design, the POS invite screen is mock-only, and branch creation UI is disabled. Additionally, the active Free plan row and branch limit needed by `register_organization`/`create_branch` are unknown.

Unblocking requires, in order:

1. A reviewed, tested staff invitation/create-account Edge Function + RPC (or an explicitly approved, documented alternative) that creates the Auth identity and the `staff_profiles` membership in the target organization.
2. Confirmation that an active Free plan row exists, or an approved backend catalog change.
3. An approved Owner identity and the four per-role credentials, supplied out-of-band.
4. Explicit approval for the writes in §10.

Until then, no safe acceptance environment can be provisioned on Development, and this milestone stops here.
