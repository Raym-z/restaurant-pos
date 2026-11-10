# M4.6.3 — Post-Rollback Integrity and Release Baseline

## 1. Overall verdict

**PASS WITH FINDINGS.**

Hosted Development is back to a functionally correct pre-M4 baseline:

- 34 pre-M4 migrations applied; the eight M4 migrations pending.
- No M4 tables, enums, RPCs, private helpers, triggers, constraints, history
  rows, or Realtime kitchen members.
- The three M3 functions replaced by M4 are restored from the exact pre-M4
  sources, verified by whitespace-normalized body hashes.
- M3 tables, rows, constraints, triggers, RLS policies, and grants relevant to
  order acceptance/removal remain intact.

Two non-functional residues remain: M4-era function comments were not restored,
and an empty `supabase_realtime` publication exists whose pre-M4 provenance
cannot be proven. Neither affects behavior or security.

No hosted mutation was performed during this audit. Production was not contacted.

## 2. Hosted Development identity

| Item | Value |
| --- | --- |
| Target ref | `bnticbeepxwhrzimouuh` |
| Project name | Development Branch - Restaurant |
| Production ref present | No |
| Inspection method | Read-only CLI migration list and read-only SQL |

## 3. Migration history

| Metric | Value |
| --- | --- |
| Local migration files | 42 |
| Hosted applied | **34** |
| Pending | **8** |
| Applied M4 migrations | 0 |
| Unexpected entries | 0 |
| Out-of-order entries | 0 |

Pending exactly:

```text
20261109150000
20261109160000
20261109170000
20261109180000
20261110120000
20261110130000
20261110140000
20261110150000
```

The 34 applied entries match the pre-M4 migration set. Migration history was not
repaired or altered during this audit.

## 4. Rollback SQL review and execution evidence

The rollback artifact used in the previous task is still available at:

`C:\Users\Think\AppData\Local\Temp\opencode\m46_rollback.sql`

| Property | Value |
| --- | --- |
| Size | 13,965 bytes |
| SHA-256 | `AE1B1347BEBEEC180B2B71FC542B5C9D3BE8CB80BD92149442ED944018BD9EFD` |
| Transaction | Explicit `BEGIN; ... COMMIT;` |
| Execution result | Exit 0 in the previous task |

The script contained:

- Guard 1: abort if the combined row count of the five kitchen tables was not
  zero.
- Guard 2: abort unless exactly eight M4 migration-history rows were present.
- Removal of the three M4 triggers on `orders`/`order_items`.
- Removal of the five kitchen tables from `supabase_realtime`.
- Drops of the five kitchen tables in dependency order.
- Drop of the M4-added `order_items_id_order_branch_organization_key`
  constraint.
- Exact pre-M4 `CREATE OR REPLACE` definitions for:
  - `private.guard_order_snapshot`
  - `public.remove_order_item`
  - `public.transition_order_status`
- Drops of 15 public kitchen RPCs and 19 private kitchen helpers.
- Drops of the two kitchen enums.
- Deletion of the eight M4 migration-history rows.

It did **not** drop or alter M3 tables, M3 rows, M3 RLS policies, M3 triggers, or
M3 table grants. It did not restore function comments (finding F1), and it left
the `supabase_realtime` publication itself in place (finding F2).

Because the rollback script lives only in the temporary directory, it is not
durable audit evidence. Its hash and behavior are recorded here.

## 5. M3 schema and RPC integrity

### Restored function bodies

Whitespace-normalized MD5 comparison between hosted `prosrc` and the pre-M4
definitions used by the rollback:

| Function | Hosted | Pre-M4 source | Match |
| --- | --- | --- | --- |
| `private.guard_order_snapshot` | `0ab191ea8b941f524ecc6f6c9b6c0302` | same | Yes |
| `public.remove_order_item` | `ac504e32aea025c08fe7a99d6c452183` | same | Yes |
| `public.transition_order_status` | `6a6a35cf05716716f2e69aff7172088b` | same | Yes |

The restored `transition_order_status` includes Kitchen Staff for order-level
`preparing`/`ready`, matching pre-M4 behavior. `remove_order_item` no longer
references kitchen tables or M4 transaction flags. `guard_order_snapshot` no
longer uses the M4 subtotal flag.

### M3 data retained

| Table | Row count |
| --- | --- |
| `orders` | 7 |
| `order_items` | 8 |
| `dining_sessions` | 3 |

No pre-rollback row counts were captured, but the rollback script never targeted
these tables.

### Constraints and triggers

- `orders` constraints include the expected primary key, tenant/session keys,
  cancellation/subtotal/source checks, and foreign keys.
- `order_items` contains the expected primary key, organization/menu/order
  foreign keys, and quantity check. The M4 composite constraint is absent.
- `orders` triggers: `orders_guard_insert_terminal_state`,
  `orders_guard_snapshot`, `orders_guard_status_transition`,
  `orders_set_updated_at`.
- `order_items` triggers: `order_items_guard_snapshot`,
  `order_items_set_updated_at`.
- `dining_sessions` triggers: `dining_sessions_guard_context`,
  `dining_sessions_guard_lifecycle`, `dining_sessions_set_updated_at`.
- No kitchen-named triggers or constraints exist.

### M3 RPCs

Present: `create_order`, `transition_order_status`, `cancel_order`,
`add_order_item`, `update_order_item_quantity`, `remove_order_item`, `get_order`,
`list_branch_orders`, `list_orders_by_session`, `open_dining_session`,
`close_dining_session`.

All eleven are executable by `authenticated` and not by `anon`.

## 6. M3 authorization and RLS integrity

| Table | RLS | Policies | `authenticated` | `anon` |
| --- | --- | --- | --- | --- |
| `orders` | Enabled | 1, `orders_select_branch` | SELECT only | Denied |
| `order_items` | Enabled | 1, `order_items_select_branch` | SELECT only | Denied |
| `dining_sessions` | Enabled | 1, `dining_sessions_select_branch` | SELECT only | Denied |

Authorization checks:

- `authenticated` has no direct INSERT/UPDATE/DELETE table grants on these
  tables; writes remain RPC-only.
- `anon` has no SELECT or write access.
- `private.guard_order_snapshot` is not executable by `authenticated`.
- `public.remove_order_item` and `public.transition_order_status` are executable
  by `authenticated` only.
- `create_order` is executable by `authenticated` only.
- The pre-M4 role restrictions are restored: Kitchen Staff may use order-level
  `preparing`/`ready`, and Cashier is excluded from those two targets.

## 7. M4 absence verification

| Check | Result |
| --- | --- |
| Five kitchen tables | Absent |
| Kitchen enums | 0 |
| Public M4 kitchen RPCs | 0 |
| Private kitchen helpers | 0 |
| Kitchen-named triggers | 0 |
| Kitchen-named constraints | 0 |
| M4 migration-history rows | 0 |
| Kitchen tables in `supabase_realtime` | 0 |
| Kitchen route tables / M4 replica identity | Absent |

These are confirmed absent, not merely uninspected.

## 8. Realtime publication state

- `supabase_realtime` publication exists.
- `puballtables = false`.
- Total publication members: **0**.
- No kitchen tables are members.
- No M4-only replica identity remains, because the only tables M4.3 changed are
  absent.

**Uncertainty:** there is no pre-deployment snapshot proving whether this empty
publication existed before M4.3 or was created by the M4.3 DO block. An empty
`supabase_realtime` publication is standard and harmless, but its exact
provenance is unverified.

## 9. Local repository integrity

### POS M4.4

- Path: `C:\Users\Think\Documents\Code\Projects\restaurant-platform\restaurant-pos\restaurant-pos-m4-4`
- Branch: `agent/pos-m4-4-kds-frontend`
- HEAD: `ed29be5adf99b8c4665a02ba833adc71ea961d61`
- Staged: none
- Deleted tracked files: none

Modified: `README.md`, `docs/m4-4-kitchen-display.md`,
`docs/realtime-and-kds.md`, three kitchen test files, the history screen, and the
English/Indonesian dictionaries.

Untracked: M4.5 and M4.6 reports, the backend-contract test, and its golden
fixture.

- `tatus` remains tracked at 916 bytes and unchanged.
- `docs/m4-6-1-migration-preflight.md` is absent; it was intentionally removed by
  the requested revert. It was untracked, so Git cannot restore it.

### Backend M4.1

- Path: `C:\Users\Think\Documents\Code\Projects\restaurant-platform\restaurant-platform-backend-m4-1`
- Branch: `feature/m4-1-kitchen-infrastructure`
- HEAD: `864591bde3c7749f48f6e9e2aff71693bdbd8b43`
- Staged: none
- Deleted tracked files: none
- Modified: `m4-kitchen-kds-read.test.ts`, `m4-kitchen-ticket-lifecycle.test.ts`
- Migration SQL: unmodified

No M4.5/M4.6 work was discarded except the intentionally removed M4.6.1
preflight document.

## 10. M4.5 validation evidence

Previously recorded, **not re-executed during this milestone**:

| Check | Recorded result |
| --- | --- |
| Backend full integration suite | 137/137 passed |
| Backend contract tests | 86/86 passed |
| Frontend unit tests | 179/179 passed |
| Frontend lint | Passed |
| Frontend typecheck | Passed |
| Frontend production build | Passed |

The M4.5 report and test files remain present. No application/test code changed
after those runs; subsequent changes were documentation, the README link, and the
intentional removal of the M4.6.1 preflight document. The results therefore
remain applicable.

## 11. Remaining uncertainties and findings

1. **F1 — M4-era function comments remain.** Hosted comments still describe M4
   behavior for `guard_order_snapshot`, `remove_order_item`, and
   `transition_order_status`. Function bodies, ACLs, and behavior are pre-M4.
   This is metadata drift only; a future M4 deployment will overwrite the
   comments.
2. **F2 — Empty `supabase_realtime` publication provenance unverified.** It is
   empty and harmless, but the pre-M4 baseline cannot be proven without a prior
   catalog snapshot.
3. **F3 — No full pre-rollback catalog/backup snapshot.** Integrity was verified
   against the targeted M3 objects affected by M4 and the rollback script, not by
   a byte-for-byte whole-database comparison.
4. **F4 — Rollback artifact is temporary.** The SQL exists only in the temp
   directory; the hash is recorded here.
5. **F5 — Migration history was manually edited** to remove the eight M4 rows.
   This matches the requested rollback, but the temporary application is not
   represented in database history; the audit trail is this report and the
   session record.
6. **F6 — M4.6.1 preflight document is permanently removed** (it was untracked).
   This was intentional and does not affect code or hosted state.

## 12. Readiness for a new M4 deployment

The hosted baseline is safe to use for a new M4 deployment preparation:

- No M4 schema/security residue remains.
- M3 functions, data, constraints, triggers, RLS, and grants are intact.
- Migration history is exactly 34 applied and 8 pending.
- The only residues are non-functional comments and an empty default-style
  Realtime publication.

Recommended next action: prepare a fresh M4 deployment with a new dry run and
explicit approval. Do not deploy automatically. If exact comment-level parity is
required, restore the pre-M4 comments in a separate approved metadata-only step;
a normal M4 redeploy will replace them anyway.
