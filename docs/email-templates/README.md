# Restaurant POS — Supabase Auth Email Templates

Production-quality HTML email templates for the staff-facing Restaurant POS
application. Each `.html` file is a complete, standalone Supabase Auth email body
that can be pasted into the Supabase Dashboard under **Authentication → Email
Templates**.

**Scope:** template artifacts only. No application code, Edge Function, database,
RLS, Auth setting, or deployment was changed.

---

## 1. Brand basis

The design is taken from the actual POS application, not invented:

| Source                        | What it establishes                                                    |
| ----------------------------- | ---------------------------------------------------------------------- |
| `src/app/globals.css`         | Color tokens, light canvas, type scale                                 |
| `src/components/layout/brand.tsx` | Green rounded brand tile + "Restaurant POS" wordmark               |
| `src/app/icon.svg`            | Actual brand mark: white utensils on `#1f6f54`                          |
| `src/app/(auth)/layout.tsx`   | Centered brand above a white card on the warm neutral canvas            |
| `src/features/auth/components/login-form.tsx` | Eyebrow + title + muted body + primary green action |
| `src/features/staff/components/accept-invitation-screen.tsx` | Invitation wording and security tone        |

Brand tokens used:

| Token        | Value     | Use                              |
| ------------ | --------- | -------------------------------- |
| Canvas       | `#f6f5f0` | Email page background            |
| Surface      | `#ffffff` | Email card                       |
| Surface soft | `#fbfaf7` | Security note panel              |
| Ink          | `#1b231f` | Headings and strong text         |
| Ink muted    | `#5f6b64` | Body copy                        |
| Ink subtle   | `#646f68` | Footer and secondary copy        |
| Line         | `#e5e2da` | Card border, dividers            |
| Brand        | `#1f6f54` | Eyebrow, CTA, brand tile         |
| Brand strong | `#185a44` | Hover/marketing use only         |
| Brand soft   | `#e6f2ec` | Verification code panel          |
| Brand ink    | `#123f30` | Text on brand-soft               |

**Logo treatment:** the real app icon is an SVG at `/icon.svg`. Many email
clients (including Gmail and desktop Outlook) do not render SVG images, so the
templates use the app's own fallback treatment: a `#1f6f54` rounded tile with a
white **R** beside the "Restaurant POS" wordmark. No external or invented image
URL is referenced. If an email-safe PNG is hosted later, it can replace the
text tile in the header block only.

---

## 2. Template map

| File                       | Supabase template        | Dashboard label     | Subject line                                                       | Variables                                  |
| -------------------------- | ------------------------ | ------------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `invite-user.html`         | Invite user              | **Invite user**     | `You're invited to Restaurant POS`                                 | `{{ .ConfirmationURL }}`, `{{ .Email }}`    |
| `magic-link.html`          | Magic link               | **Magic Link**      | `Your Restaurant POS sign-in code`                                 | `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}` |
| `confirm-signup.html`      | Confirm signup           | **Confirm signup**  | `Confirm your Restaurant POS email address`                        | `{{ .ConfirmationURL }}`, `{{ .Email }}`    |
| `reset-password.html`      | Reset password           | **Reset Password**  | `Reset your Restaurant POS password`                               | `{{ .ConfirmationURL }}`, `{{ .Email }}`    |
| `change-email.html`        | Change email address     | **Change Email Address** | `Confirm your new Restaurant POS email address`               | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| `reauthentication.html`    | Reauthentication         | **Reauthentication** | `{{ .Token }} is your Restaurant POS verification code`           | `{{ .Token }}`                             |

Subject lines are plain text and contain no markup. The reauthentication subject
intentionally uses `{{ .Token }}`; Supabase supports template variables in the
subject field.

### When each email is sent

- **Invite user** — `staff-invite` calls
  `auth.admin.inviteUserByEmail(email, { redirectTo })` when the invited address
  does not yet have an Auth account.
- **Magic link** — `staff-invite` calls
  `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })`
  when the invited address already has an Auth account. The POS login screen
  calls the same API to deliver a passwordless sign-in code. The template
  therefore shows the six-digit `{{ .Token }}` as its primary action and keeps
  a secondary `{{ .ConfirmationURL }}` link for invitation continuation. The
  same template also covers any future passwordless sign-in request.
- **Confirm signup** — Supabase sends this when email confirmation is required
  for a newly signed-up address.
- **Reset password** — sent when a password recovery is requested for an
  existing account.
- **Change email address** — sent when an account requests a new sign-in email
  address.
- **Reauthentication** — sent when Supabase requires a fresh identity check
  (for example before a sensitive account operation). It carries an OTP, not a
  link.

---

## 3. Supabase variable rules

These templates follow the documented Supabase Go-template variables and use
only variables valid for their template:

| Variable                 | Meaning                                                             | Used in                          |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------- |
| `{{ .ConfirmationURL }}` | Supabase-generated verification URL, including `token_hash` and `redirect_to` | All link templates        |
| `{{ .Email }}`           | Address on the user record                                          | Invite, magic link, confirm, reset |
| `{{ .NewEmail }}`        | New address; only supported by the change-email template            | Change email                     |
| `{{ .Token }}`           | One-time verification code                                          | Magic link, reauthentication     |

Deliberately **not** used:

- `{{ .TokenHash }}` — no custom verification URL is constructed. Using it would
  bypass the standard Supabase verification and break the existing acceptance
  handoff.
- `{{ .SiteURL }}` — not needed; the confirmation URL already carries the
  correct destination.
- `{{ .RedirectTo }}` — not printed; it is preserved inside
  `{{ .ConfirmationURL }}`.
- `{{ .Data }}` — the current invitation flow stores no template-visible
  organization, inviter, or role metadata.
- `{{ .OldEmail }}` — not used, because the change-email template is not
  guaranteed to be delivered only to the old address.

Do not remove or rewrite `{{ .ConfirmationURL }}`. Supabase replaces variables
before delivery; editing the URL in the template will break verification.

---

## 4. Staff invitation compatibility (verified against the implementation)

The templates were checked against the actual `staff-invite` flow:

```text
POST /functions/v1/staff-invite
  └─ create_staff_invitation(...)             (invitation row, SHA-256 token hash)
  └─ buildAcceptanceRedirect(POS_ACCEPT_INVITATION_URL, rawToken)
       = https://<pos-host>/accept-invitation?invitation=<raw-token>

  New account:     auth.admin.inviteUserByEmail(email, { redirectTo })
                   → Supabase "Invite user" template
  Existing account: auth.signInWithOtp({ email, shouldCreateUser: false,
                                         emailRedirectTo: redirectTo })
                   → Supabase "Magic Link" template
```

Clicking `{{ .ConfirmationURL }}`:

```text
https://<project>.supabase.co/auth/v1/verify
  ?token=<token_hash>
  &type=invite|magiclink
  &redirect_to=https%3A%2F%2F<pos-host>%2Faccept-invitation%3Finvitation%3D<raw-token>
        ↓ Supabase verifies and redirects
https://<pos-host>/accept-invitation?invitation=<raw-token>#access_token=...&refresh_token=...
        ↓ POS reads the implicit fragment in the browser
establishInvitationSessionAction(...)         (HttpOnly cookie, fragment removed)
        ↓
accept_staff_invitation(<sha256 token hash>)
```

Compatibility conclusions:

- The **Invite user** template uses `{{ .ConfirmationURL }}` exactly as provided,
  so `redirect_to` survives and the invitation token handoff is unchanged.
- The **Magic Link** template is also the delivery path for an existing account
  being invited. It shows the six-digit `{{ .Token }}` as the primary sign-in
  action and keeps a secondary `{{ .ConfirmationURL }}` link labelled as an
  invitation continuation. A recipient who signs in with the code reaches the
  POS normally; a recipient who still has a pending invitation can use the
  secondary link to preserve the `redirect_to` token handoff.
- The POS `/accept-invitation` route still receives the session in the URL
  fragment. Because no custom link is built, the implicit-flow handoff and the
  same-origin Server Action exchange remain intact.
- The invitation email shows no organization name, inviter name, role, or expiry
  date, because Supabase Auth does not expose those values to this template.

A prior Development Auth log for a successful invitation already recorded
`https://pos.raymondwillytan.com/accept-invitation?invitation=...` as the
invitation referer, which corroborates that `{{ .ConfirmationURL }}` preserves
`redirect_to` and the raw invitation token in this environment. No new email was
sent for this template change.

No token is printed as visible text. The fallback link uses human-readable link
text rather than the raw URL, because the confirmation URL embeds the single-use
Supabase token and the POS invitation token in its `redirect_to` parameter.
Printing the raw URL would expose both in the message body.

---

## 5. Installing the templates

### Prerequisites (hosted Supabase)

1. Email provider enabled.
2. Custom SMTP configured for reliable delivery. Supabase's built-in sender is
   rate-limited and is not suitable for production invitations.
3. **Site URL** set to the POS origin, e.g. `https://pos.raymondwillytan.com`.
4. The exact acceptance URL added to the redirect allow-list:
   `https://pos.raymondwillytan.com/accept-invitation`.
5. The `staff-invite` function's `POS_ACCEPT_INVITATION_URL` must match that
   acceptance URL.

These are deployment prerequisites, not part of this template change.

### Copying a template

1. Open the Supabase Dashboard for the target project.
2. Go to **Authentication → Email Templates**.
3. Select the template named in the map above (for example **Invite user**).
4. Replace the **Subject** field with the exact subject line from the table.
5. In the message body, switch to the **source / HTML** view (the `</>` control),
   select all existing content, and paste the entire `.html` file.
6. Save.
7. Repeat for each template.
8. After SMTP is configured, send **one** controlled invitation to a test
   address and confirm the link lands on `/accept-invitation` with the
   invitation query parameter preserved. Do not loop retries; Auth rate limits
   will reject repeated sends.

The templates are complete documents (`<!DOCTYPE html>` through `</html>`). Paste
the whole file, not a fragment.

---

## 6. Design and compatibility notes

- Table-based layout with inline CSS; no JavaScript, external stylesheets, web
  fonts, tracking pixels, or remote images.
- Container width is `600px`, reducing to the viewport on screens below `620px`.
- Hidden preheader text is included in every template.
- Primary actions use a bulletproof table-cell button with
  `mso-padding-alt` for Outlook.
- System font stack mirrors the Geist-led product typography without loading a
  web font.
- `role="presentation"` is used on layout tables; all content is real text, so
  links and copy remain accessible if styling is stripped.
- Links use `target="_blank"` and `rel="noopener"`.
- The Magic Link template has no sign-in button because the POS login flow
  expects a six-digit code. Its only link is the secondary invitation
  continuation.
- The reauthentication template has no CTA button because Supabase provides only
  `{{ .Token }}` for that event. Constructing a link there would be incorrect.

---

## 7. Limitations

1. **No organization, inviter, role, or expiry variables.** Supabase Auth does
   not expose the invitation RPC payload to email templates. The invitation copy
   stays intentionally generic.
2. **No per-template logo variable.** The header uses the text brand treatment
   for maximum client compatibility.
3. **The Magic Link template is shared.** It must serve both passwordless
   sign-in and existing-account staff invitations. The six-digit code is the
   primary action; the confirmation link remains as a secondary invitation
   continuation so the existing-account invitation path keeps its token handoff.
4. **Reauthentication is code-only.** There is no confirmation URL for this
   event; the email cannot deep-link back into the POS.
5. **Account security notifications are out of scope.** This set covers the six
   authentication templates requested. Supabase's separate "password changed",
   "email changed", and similar notification templates are not included.

---

## 8. Verification performed

- Every file is standalone HTML with a doctype, head, inline styles, and a
  complete body.
- Variable usage was checked against the Supabase template variable
  documentation: `ConfirmationURL`, `Email`, `NewEmail`, and `Token` only, each
  in a template where it is valid.
- The Invite user and Magic Link flows were compared against the deployed
  `staff-invite` source and the POS `/accept-invitation` handoff described above.
- The Magic Link template was updated for M4.7.3 passwordless login: it renders
  `{{ .Token }}` as the primary action and keeps `{{ .ConfirmationURL }}` only as
  a secondary invitation-continuation link.
- No email was sent, no Auth setting was changed, and no template was uploaded.
- No application, Edge Function, database, or deployment change was made.

Rendered appearance was inspected locally in a browser at a 1200px desktop
viewport and inside a 375px mobile viewport. The templates were not tested in a
live email inbox, and no email client compatibility matrix was executed.
