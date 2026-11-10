# M4.6.4 — Final Development Deployment Preflight

## 1. Overall verdict

**READY FOR EXPLICIT DEVELOPMENT MIGRATION APPROVAL.**

All deployment gates passed:

- Target ref is exactly `bnticbeepxwhrzimouuh`.
- Migration history is exactly 34 applied and 8 pending.
- The fresh dry run proposes exactly the eight reviewed M4 migrations.
- All eight files are byte-identical to the reviewed deployment inputs.
- No destructive, transaction-unsafe, secret-bearing, or Production-referencing
  statements were introduced.
- The hosted Development rollback baseline remains intact.

No migration or hosted mutation was performed during this milestone. Production
was not contacted.

## 2. Verified Development project identity

| Item | Value |
| --- | --- |
| Target ref | `bnticbeepxwhrzimouuh` |
| Project name | Development Branch - Restaurant |
| CLI target kind | linked |
| Production ref present in target | No |
| Production endpoint contacted | No |

The CLI still reports `environment: production`. As established in M4.6.1, this
is the CLI classification for a base project rather than a preview branch; it is
not the Production project ref. The project ref is the authoritative identity and
matches the approved Development project.

## 3. Current migration history

| Metric | Value |
| --- | --- |
| Local migration files | 42 |
| Hosted applied | **34** |
| Pending | **8** |
| Unexpected entries | 0 |
| Out-of-order entries | 0 |
| Applied M4 migrations | 0 |

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

## 4. Eight migration file verification

All files exist in timestamp order. Their current full SHA-256 hashes match the
prefixes recorded during the M4.6.1 preflight, and the backend migration tree has
no working-tree changes.

| Migration | Size | SHA-256 |
| --- | ---: | --- |
| `20261109150000_m4_kitchen_infrastructure.sql` | 12,516 | `D646F445FC8B15CADF715368F99A146A5D152CC0F1399CAA8B724DBEE026ABDE` |
| `20261109160000_m4_kitchen_ticket_lifecycle.sql` | 35,020 | `D655157A1219683F2A05B03AE90F4FE7137DCAF3EBC710DD234894D764394360` |
| `20261109170000_m4_kitchen_ticket_lifecycle_corrections.sql` | 37,294 | `CC41349ED40BB755AF58801BF79E6858764A18DDFCE0B2B57788ECA03C5D4881` |
| `20261109180000_m4_kitchen_ticket_lifecycle_final_corrections.sql` | 11,132 | `BDDD0F52DC283618909BEC85F00A9719075A353B85E8E00185D71367C7976F04` |
| `20261110120000_m4_kitchen_station_management.sql` | 26,374 | `490C700BE04E15C4AC1B657B2007F260398CC0A152868371D165A81B739F2D54` |
| `20261110130000_m4_kitchen_kds_read_rpcs.sql` | 12,315 | `6DBB9ABA3DD19E7F4A1DBEDE07847BB5CC63DEA8E3B7E89D51C3D789F02F9D58` |
| `20261110140000_m4_realtime_kitchen_publication.sql` | 2,519 | `22DF7CBF51EE007140715F1CB5F24A523E77DE0F3E994F1268DAAAE5B65E0189` |
| `20261110150000_m4_order_kitchen_state_policy.sql` | 4,998 | `B1594846F5E42E45F584A4150B1BABAFCB6024FB23507C7A1900F1FDA5F7D9C6` |

### Static safety scan

- No `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `CONCURRENTLY`, or `VACUUM` in any
  file.
- `20261109170000` contains three `DROP CONSTRAINT IF EXISTS` statements that are
  immediately replaced by the new generation/cancellation constraints.
- The two `DELETE FROM` statements in `20261110120000` are inside route-removal
  RPC bodies; they do not delete data during migration.
- No URLs, service-role material, passwords, or Production project refs exist in
  the files.
- No file references the temporary rollback artifact.
- No dependency on uncommitted or missing migrations was introduced.

Dependency completeness, timestamp order, and transaction safety were already
proven by the M4.6.1 fresh 42-migration apply and the 98/98 kitchen/security test
run. Because every file is unchanged at the same HEAD, those conclusions remain
valid.

## 5. Fresh dry-run result

Command executed:

```powershell
npx supabase db push --dry-run --remote=bnticbeepxwhrzimouuh
```

Result: **exit 0**, target ref `bnticbeepxwhrzimouuh`, and exactly these eight
migrations proposed:

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

No seeds, roles, or other migrations were proposed.

## 6. Rollback baseline checks

| Check | Result |
| --- | --- |
| Kitchen tables present | 0 |
| Public kitchen RPCs | 0 |
| Private kitchen helpers | 0 |
| M4 migration-history rows | 0 |
| Kitchen `supabase_realtime` members | 0 |
| `orders` rows | 7 |
| `order_items` rows | 8 |
| `dining_sessions` rows | 3 |
| RLS on `orders` / `order_items` / `dining_sessions` | Enabled / Enabled / Enabled |
| `orders` authenticated SELECT | Allowed |
| `orders` anonymous SELECT | Denied |
| `transition_order_status` authenticated EXECUTE | Allowed |
| `transition_order_status` anonymous EXECUTE | Denied |
| `guard_order_snapshot` body hash | `0ab191ea8b941f524ecc6f6c9b6c0302` (matches pre-M4) |
| `remove_order_item` body hash | `ac504e32aea025c08fe7a99d6c452183` (matches pre-M4) |
| `transition_order_status` body hash | `6a6a35cf05716716f2e69aff7172088b` (matches pre-M4) |

The hosted baseline matches M4.6.3. No M3 data or authorization change was
observed during this preflight.

## 7. Repository state

### POS M4.4

- Branch: `agent/pos-m4-4-kds-frontend`
- HEAD: `ed29be5adf99b8c4665a02ba833adc71ea961d61`
- Staged: none
- Deleted tracked files: none
- M4.5 report, M4.6 report, M4.6.3 report, backend-contract test, fixture, and
  modified kitchen tests remain intact.
- `tatus` remains tracked at 916 bytes and unchanged.
- M4.6.1 preflight document remains absent by the earlier intentional revert.
- New: this report and its README link.

### Backend M4.1

- Branch: `feature/m4-1-kitchen-infrastructure`
- HEAD: `864591bde3c7749f48f6e9e2aff71693bdbd8b43`
- Staged: none
- Deleted tracked files: none
- Only the two M4.5 integration test files are modified.
- No migration SQL is modified.

## 8. Known findings carried forward

1. M4-era comments remain on three restored M3 functions.
2. `supabase_realtime` exists empty; its pre-M4 provenance is unverified.
3. No full pre-rollback database snapshot exists.
4. The previous rollback SQL remains only in the temporary directory.
5. `tatus` remains an accidental tracked file.
6. Repeated order acceptance returns `ORDER_INVALID_STATUS`.
7. Kitchen board counts are page-scoped.
8. History filters by ticket creation date.
9. `BLK-008` Realtime delivery remains unverified.
10. Repo-wide formatting has pre-existing CRLF failures.

None of these blocks the approved M4 migration deployment. No finding was fixed
during this milestone.

## 9. Proposed next command

Only after explicit approval for this exact scope:

```powershell
cd C:\Users\Think\Documents\Code\Projects\restaurant-platform\restaurant-platform-backend-m4-1
npx supabase db push --remote=bnticbeepxwhrzimouuh --yes
```

The `--yes` flag is required because this environment runs in agent mode and the
CLI cannot prompt interactively. The target ref and the eight-migration list above
must be the only changes accepted.

## 10. Confirmation

No hosted mutation was performed. No migration was applied, rolled back, or
repaired. No account, role, grant, policy, or project setting was changed. No
Production project was contacted.
