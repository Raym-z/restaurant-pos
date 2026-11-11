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

### Sign in

`/login` is passwordless. Staff enter their staff email and receive a six-digit
one-time code from Supabase Auth (`signInWithOtp` with `shouldCreateUser: false`).
The code is verified by a Server Action (`verifyOtp` with type `email`), which
writes the session through the normal HttpOnly POS cookie policy. Login never
creates an Auth user; accounts are provisioned only through invitations.

Signing in only establishes a session. Organization membership is created by
`accept_staff_invitation` during acceptance, so a regular login never consumes,
approves, or bypasses an invitation.

### Acceptance

`/accept-invitation?invitation=<token>` is a public auth route.

1. Supabase Auth invite and magic-link emails redirect here with the session in
   the URL fragment (`#access_token=...&refresh_token=...`). The browser reads the
   fragment and posts the short-lived tokens to a same-origin Server Action. The
   server stores them with the normal HttpOnly POS cookie policy, then the page
   reloads without the fragment. No auth token is written to browser storage.
2. Acceptance itself runs in a Server Action. The server verifies the request
   cookies with `auth.getUser()` and calls `accept_staff_invitation` with the
   authenticated server client. The browser never calls the RPC, because the POS
   session cookie is deliberately unreadable by JavaScript.
3. When no server session exists, the page shows "Sign in to accept", which links
   to `/login?next=/accept-invitation?invitation=<token>`. The passwordless email
   code login then returns to the acceptance page. Invited new staff normally
   establish their session by opening the invitation email link.
4. On success the token is removed from the address bar and the recipient is
   offered the dashboard. Failures keep the token so the recipient can retry or
   sign in with the invited address; expired and revoked links show the backend
   reason. Refreshing during the handoff is safe: the fragment remains in the URL
   until the server session is established, and the exchange is retried.
   Authenticated failures offer the dashboard instead of a `/login` link, so a
   live session cannot cause a redirect loop.

The acceptance flow handles these backend outcomes explicitly: success,
already-accepted, expired, revoked, invalid or missing token, and email mismatch.
For authenticated failures the UI also shows the signed-in email address.

- The authenticated email must match the invitation.
- The inviter must still hold organization administration (Owner for an Admin
  invitation).
- The branch must still be active.
- An account that already belongs to an organization cannot accept.
- Replays return `INVITATION_ALREADY_ACCEPTED`.

## Security boundaries

- Tokens are single-use, 256-bit, expiry-bound, and stored only as SHA-256
  hashes. The POS sends only the SHA-256 hex digest to the acceptance RPC.
- The invitation token is carried only in the `invitation` query parameter and is
  never written to localStorage, sessionStorage, cookies, or logs.
- Invite/magic-link session tokens are read from the URL fragment, posted to a
  same-origin Server Action, and persisted only as HttpOnly cookies.
- Login redirects use internal paths validated by `safeNextPath`; no external
  callback URL is accepted.
- The service-role key is used only inside the Edge Function.
- Frontend role filtering is UX only; the RPCs enforce authorization.
- Client-supplied email addresses are never used for authorization.

## Known limits

- The legacy staff directory table below the invitations panel remains mock data
  in this milestone. Editing/deactivating staff still uses the mock workflow.
- Invitation email delivery requires hosted SMTP and redirect-URL configuration.
- Resending an expired invitation is rejected; create a new invitation instead.
