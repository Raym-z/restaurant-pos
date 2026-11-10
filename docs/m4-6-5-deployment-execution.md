  # M4.6.5 — Approved Development Migration Deployment Execution

  ## 1. Target

  | Item | Value |
  | --- | --- |
  | Project ref | `bnticbeepxwhrzimouuh` |
  | Project name | Development Branch - Restaurant |
  | Repository | `restaurant-platform-backend-m4-1` |
  | Branch | `feature/m4-1-kitchen-infrastructure` |
  | HEAD | `864591bde3c7749f48f6e9e2aff71693bdbd8b43` |
  | Production contacted | **No** |

  The CLI reports `environment: production`; the project ref is the approved
  Development ref and the Production ref `xzchsyxhpknlogwcfslf` was never targeted.

  ## 2. Command outcomes

  ### Pre-deployment migration list

  ```powershell
  npx supabase migration list --remote=bnticbeepxwhrzimouuh
  ```

  - Exit 0
  - 34 applied, 8 pending
  - Pending exactly the eight approved M4 migrations

  ### Dry run

  ```powershell
  npx supabase db push --dry-run --remote=bnticbeepxwhrzimouuh
  ```

  - Exit 0
  - Proposed exactly the eight approved migrations
  - No seeds, roles, or unrelated migrations

  ### Deployment

  ```powershell
  npx supabase db push --remote=bnticbeepxwhrzimouuh --yes
  ```

  - Exit 0
  - Applied eight migrations in timestamp order
  - No errors or partial failures

  Applied:

  ```text
  20261109150000_m4_kitchen_infrastructure.sql
  20261109160000_m4_kitchen_ticket_lifecycle.sql
  20261109170000_m4_kitchen_ticket_lifecycle_corrections.sql
  20261109180000_m4_kitchen_ticket_lifecycle_final_corrections.sql
  20261110120000_m4_kitchen_station_management.sql
  20261110130000_m4_kitchen_kds_read_rpcs.sql
  20261110140000_m4_realtime_kitchen_publication.sql
  20261110150000_m4_order_kitchen_state_policy.sql
  ```

  ### Post-deployment migration list

  - Exit 0
  - **42 applied, 0 pending**
  - All eight M4 migrations recorded
  - No unexpected entries

  ## 3. Post-deployment verification

  ### Kitchen tables and RLS

  | Table | Exists | RLS | Policies |
  | --- | --- | --- | --- |
  | `kitchen_stations` | Yes | Enabled | 1 |
  | `kitchen_station_menu_categories` | Yes | Enabled | 1 |
  | `kitchen_station_menu_items` | Yes | Enabled | 1 |
  | `kitchen_tickets` | Yes | Enabled | 1 |
  | `kitchen_ticket_items` | Yes | Enabled | 1 |

  ### Kitchen table privileges

  | Table | `authenticated` | Direct writes | `anon` |
  | --- | --- | --- | --- |
  | `kitchen_stations` | SELECT | Denied | Denied |
  | `kitchen_station_menu_categories` | SELECT | Denied | Denied |
  | `kitchen_station_menu_items` | SELECT | Denied | Denied |
  | `kitchen_tickets` | SELECT | Denied | Denied |
  | `kitchen_ticket_items` | SELECT | Denied | Denied |

  Anonymous REST reads of `kitchen_tickets` and `kitchen_stations` returned
  `401 / 42501`, confirming RLS/privilege denial.

  ### Kitchen RPCs

  - **15 public kitchen RPCs** exist.
  - All are `SECURITY DEFINER`.
  - All are executable by `authenticated` and denied to `anon`.
  - **0 private kitchen helpers** are client-executable.
  - Station management checks Owner/Admin/Manager and excludes Kitchen Staff and
    Cashier.
  - Order-level `preparing`/`ready` excludes both Kitchen Staff and Cashier, as
    designed by M4.3.
  - `transition_order_status` and `remove_order_item` are present and
    authenticated-only; their M4 behavior is active.

  ### Realtime

  - `supabase_realtime` contains all five kitchen tables.
  - Both route tables have replica identity `FULL` (`f`).

  ### M4 state

  - M4 migration history rows: **8**
  - Kitchen table row count: **0** (no test/operational data created)
  - No unexpected schema objects or migration failures observed.

  ## 4. M3 preservation

  | Check | Result |
  | --- | --- |
  | M3 `orders` rows | 7 |
  | M3 `order_items` rows | 8 |
  | M3 `dining_sessions` rows | 3 |
  | RLS on `orders` / `order_items` / `dining_sessions` | Enabled |
  | Nine unaffected M3 order/session RPCs | Present, authenticated-executable |
  | `create_order` / `cancel_order` | Present |
  | M3 table grants | SELECT-only for `authenticated`; `anon` denied |
  | M4-added `order_items` composite constraint | Present as designed |

  `transition_order_status`, `remove_order_item`, and `guard_order_snapshot` now
  contain their intended M4 definitions rather than the pre-M4 versions. This is the
  expected post-deployment state.

  ## 5. Findings

  - Deployment completed without errors.
  - No new security or schema defect was found.
  - The previous M4-comment residue is no longer a discrepancy: M4 is now deployed
    and the M4 comments are the intended state.
  - The previously empty `supabase_realtime` publication now has the five intended
    kitchen members.
  - Carried, unchanged findings: repeated acceptance returns
    `ORDER_INVALID_STATUS`; board counts are page-scoped; history filters by
    `created_at`; `BLK-008` Realtime delivery is unverified; `tatus` remains tracked;
    repo-wide formatting still has pre-existing CRLF failures.

  ## 6. Checks not performed

  The following were not part of this deployment task and remain unverified:

  - Authenticated staff sign-in and hosted POS-to-kitchen workflow execution.
  - Kitchen item lifecycle and cancellation operations against hosted data.
  - Realtime event delivery and reconnect behavior (`BLK-008`).
  - Supabase advisors.
  - Any account, role, or disposable test-data creation.

  These belong to M4.7 hosted acceptance and require separate approval.

  ## 7. Repository state

  No application or migration source was modified. The backend worktree still has
  only the two M4.5 integration test modifications; POS worktree documentation and
  test changes remain uncommitted. No commits, pushes, merges, or application
  deployments were performed.

  ## 8. Result

  **SUCCESSFUL DEPLOYMENT.**

  Development now has 42/42 migrations, the complete M4 kitchen schema, all 15 public
  kitchen RPCs, correct RLS/grants, all five Realtime kitchen members, and the two
  route tables with `FULL` replica identity. M3 data and access controls remain
  intact.
