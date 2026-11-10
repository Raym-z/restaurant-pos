# Staff Invitations (POS)

The POS uses the backend `staff-invite` Edge Function and invitation RPCs
introduced in M4.7.2. The frontend never creates Auth users, never sees the
service-role key, and never stores an invitation token.

## Flows

### Invite

1. An organization-scoped Owner/Admin opens `/staff/new`.
2. The form collects display name, email, role, and branch scope.
   - Owner may invite Admin, Manager, Cashier, or Kitchen Staff.
   - Admin may invite Manager, Cashier, or Kitchen Staff.
   - Manager, Cashier, and Kitchen Staff see a permission state instead of the
     form.
3. `inviteStaffAction` invokes the `staff-invite` Edge Function with the server
   session. The function authorizes through the invitation RPC, then sends a
   Supabase Auth invitation (new account) or magic link (existing account).
4. The UI shows a generic success state. It does not reveal whether an Auth
   account already existed.

### Pending invitations

`/staff` loads `list_staff_invitations` for organization admins and renders the
real invitation list above the existing staff directory. Pending invitations can
be resent (token rotation) or revoked. Accepted and revoked invitations remain
visible for audit and have no actions.

### Acceptance

`/accept-invitation?invitation=<token>` is a public auth route. The browser client
parses the Supabase session from the invite/magic-link redirect, removes the
token from the address bar, hashes the raw token with Web Crypto SHA-256, and
calls `accept_staff_invitation` with `p_token_hash_hex`. The raw token is never
sent to the RPC.

- The authenticated email must match the invitation.
- The inviter must still hold organization administration (Owner for an Admin
  invitation).
- The branch must still be active.
- An account that already belongs to an organization cannot accept.
- Replays return `INVITATION_ALREADY_ACCEPTED`.

## Security boundaries

- Tokens are single-use, 256-bit, expiry-bound, and stored only as SHA-256
  hashes. The POS sends only the SHA-256 hex digest to the acceptance RPC.
- The token is held in component state for the acceptance request only; it is
  never written to localStorage, sessionStorage, cookies, or logs.
- The service-role key is used only inside the Edge Function.
- Frontend role filtering is UX only; the RPCs enforce authorization.

## Known limits

- The legacy staff directory table below the invitations panel remains mock data
  in this milestone. Editing/deactivating staff still uses the mock workflow.
- Invitation email delivery requires hosted SMTP and redirect-URL configuration.
- Resending an expired invitation is rejected; create a new invitation instead.
