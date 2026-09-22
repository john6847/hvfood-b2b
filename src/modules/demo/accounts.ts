import "server-only";
import type { DemoAccountKey } from "./session";

/**
 * Test accounts for the static preview. Server-only, so the passwords are
 * never sent to the browser. They only work while no Supabase project is
 * configured; a connected deployment signs in through Supabase Auth.
 */
type DemoAccount = {
  key: DemoAccountKey;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    key: "buyer",
    email: "paul.maly51@gmail.com",
    password: "School123",
    firstName: "Paul",
    lastName: "Maly",
  },
  {
    key: "admin",
    email: "admin@horizonvertb2b.com",
    password: "School123",
    firstName: "Horizon Vert",
    lastName: "Admin",
  },
];

export function findDemoAccount(key: DemoAccountKey): DemoAccount {
  return DEMO_ACCOUNTS.find((a) => a.key === key)!;
}

/** The account matching these credentials, or null. Email ignores case. */
export function verifyDemoCredentials(email: string, password: string): DemoAccount | null {
  const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  return account && account.password === password ? account : null;
}
