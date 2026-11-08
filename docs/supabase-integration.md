# Supabase Integration — M1 Workspace Foundation

## 1. Scope

This milestone connects the POS to the shared Supabase backend for:

- Staff authentication with Supabase Auth email/password.
- Session persistence, refresh, expiry, and logout.
- Auth user → active `staff_profiles` mapping.
- Organization context.
- Accessible active branch retrieval.
- Cookie-backed, server-validated branch switching.
- Role and scope-aware navigation.

It intentionally does **not** connect staff management, menu management, orders, payments, tables, KDS, waitlist, billing, or reports.

## 2. Environment

Required public variables:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://bnticbeepxwhrzimouuh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Rules:

- Development project `bnticbeepxwhrzimouuh` only.
- Production project `xzchsyxhpknlogwcfsll` is rejected by environment validation.
- No service-role key, database password, or personal access token is used in the frontend.
- `.env.local` is ignored by git.

## 3. Client architecture

| Module | Responsibility |
| --- | --- |
| `src/lib/supabase/env.ts` | Validates public environment and rejects production/local-invalid targets. |
| `src/lib/supabase/server.ts` | Request-scoped `@supabase/ssr` server client backed by Next.js cookies. |
| `src/lib/supabase/proxy.ts` | Session refresh and optimistic route redirects. |
| `src/proxy.ts` | Next.js 16 request proxy entry point. |
| `src/lib/supabase/errors.ts` | Normalizes auth and PostgREST failures; distinguishes missing, expired, and transient auth states. |
| `src/lib/supabase/auth-state.ts` | Classifies `getUser()` results into authenticated, unauthenticated, expired, or unavailable. |
| `src/lib/supabase/cookie-policy.ts` | Deliberate POS session-cookie lifetime and attributes. |

Business data is read on the server. Presentation components do not call Supabase directly. There is no browser Supabase client in M1 because the server session cookie is HttpOnly.

## 4. Authentication flow

1. `/login` renders an email/password form.
2. `signInAction` calls `supabase.auth.signInWithPassword`.
3. `@supabase/ssr` stores the session in HTTP cookies.
4. `src/proxy.ts` refreshes the session on subsequent requests.
5. The `(app)` layout calls `supabase.auth.getUser()` and loads the workspace.
6. Logout calls `signOut`, clears local auth cookies and the active-branch cookie, and redirects to `/login`.

### Session refresh failures

- `AuthSessionMissingError` / `session_missing` is treated as **unauthenticated**, not as a service outage.
- `getUser()` returning `{ user: null, error: null }` is treated as **unauthenticated**.
- Missing sessions on protected routes redirect to `/login`.
- Confirmed invalid/expired refresh tokens clear auth cookies and redirect to `/login?reason=session_expired`.
- Network failures, timeouts, and Supabase 5xx responses preserve cookies and render a retryable “session verification unavailable” state with a “Sign in again” recovery action.
- The application never clears a session solely because the Auth service is temporarily unreachable.

### Session cookie policy

- Server- and proxy-issued auth cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- The persistence lifetime is **12 hours** (`43,200` seconds), replacing the Supabase SSR default of 400 days. This covers a long restaurant shift while forcing re-authentication at least daily on shared POS devices.
- The unused browser Supabase client was removed because it cannot read an HttpOnly server session and had no call sites. Any future browser-side auth feature must be designed explicitly around this policy rather than silently weakening it.
- Successful sign-in clears `pos_active_branch_id` so a new staff member cannot inherit the previous user's branch selection.

## 5. Workspace mapping

Identity mapping:

```text
auth.users.id
  → staff_profiles.auth_user_id
  → staff_profiles.id
  → staff_profiles.organization_id
```

Reads:

| Data | Table | RLS behavior |
| --- | --- | --- |
| Active staff profile | `staff_profiles` | Self or organization admin; helper resolves active staff only |
| Organization | `organizations` | Current organization only |
| Roles | `staff_role_assignments` | Self or organization admin |
| Explicit branch assignments | `staff_branch_assignments` | Self or organization admin |
| Accessible branches | `branches` | Active branches accessible through roles/assignments |
| Plan label | `subscriptions`, `plans` | Organization Owner/Admin only (optional UI) |

### Assigned vs accessible branches

`staff_branch_assignments` is retained as explicit assignment data. It is **not** the branch-switching source. Branch switching and branch access use the `branches` query result, which already applies RLS. Organization-scoped Owners/Admins may access all active branches without individual branch assignments.

### Non-active staff

RLS hides invited, suspended, and deactivated staff profiles because the current-staff helper resolves active profiles only. The POS therefore shows a generic “no active staff access” state. Showing the exact status requires a backend self-read policy or RPC.

## 6. Branch switching

- The active branch is stored in the `pos_active_branch_id` HTTP-only cookie.
- `setActiveBranchAction` queries `branches` by ID through the authenticated server client.
- If RLS returns no row, the switch is rejected.
- The provider updates client context only after the Server Action succeeds.
- Switching is a UI preference; every future branch-scoped request must revalidate access server-side.

## 7. Navigation

Navigation is evaluated with role **and** scope:

- Organization and Staff navigation require an organization-scoped Owner/Admin.
- Branch navigation requires Owner, Admin, or Manager.
- Billing requires Owner.
- Reports/Settings require Owner, Admin, or Manager.
- Branch-scoped Admins do not receive organization-wide navigation.
- Managers do not receive Staff navigation.
- Staff and Menu navigation items are marked `Unavailable` in this milestone.

## 8. Mock data policy

- `MockDataProvider` is not mounted in the authenticated shell.
- Existing mock fixtures remain in the repository for later integration and tests.
- Staff and Menu route groups render explicit “not connected” states.
- Dashboard operational widgets render an explicit “not connected” state.
- A failed backend request never falls back to mock data.

## 9. Known backend dependencies

- Provisioned development staff Auth account and active staff profile.
- Hosted Auth redirect/confirmation configuration.
- Self-read status for invited/suspended/deactivated staff.
- Inactive branch historical reads.
- Branch reactivation.
- Free plan seed.
- Complete organization and branch profile contracts.
- Staff invitation/provisioning workflow.
- Per-branch role model and atomic assignment RPC.
- Complete RPC request/response contracts and consumable types.
- Menu availability semantics, translations, tags, and variants.

See the M1 plan for the full dependency matrix.

## 10. M-01 Route-Level Authorization Deferral

Route-level **server-side** authorization for organization- and role-restricted screens is explicitly deferred for M1 only, because there are currently no privileged mutation paths in this milestone.

This deferral is limited to read-only context screens. It is **not** a claim that client-side navigation filtering provides security. Client-side navigation filtering is UX only, and backend RLS remains the data authorization boundary.

Server-side route guards are mandatory before the first mutation milestone. They must verify the authenticated staff profile and the required role/scope before any privileged mutation is rendered or executed. The first organization, branch, staff, or menu mutation milestone must not ship without them.
