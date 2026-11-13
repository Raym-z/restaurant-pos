/**
 * Credentials displayed on the public `/logindemo` page.
 *
 * These are display-only values. The matching Supabase Auth user is
 * provisioned separately. They must never be imported by authentication logic
 * or used to sign a visitor in automatically.
 */
export const DEMO_CREDENTIALS = {
  email: "demouser@raymondwillytan.com",
  password: "#DemoUser789$",
} as const;
