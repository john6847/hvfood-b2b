/**
 * Operator action: create (or reuse) an auth user and grant the
 * ADMINISTRATOR staff role. Never exposed as a public route.
 *
 * Usage (local):
 *   node --env-file=.env.local scripts/bootstrap-admin.ts you@company.com
 *
 * Against a hosted project, export NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY from the deployment secret store first.
 *
 * A new user receives an invitation email to choose a password. On first
 * admin visit they must enroll an authenticator app (MFA) before any staff
 * data is readable.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: node --env-file=.env.local scripts/bootstrap-admin.ts <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(target: string) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

const existing = await findUserByEmail(email);
if (existing) {
  console.log(`Auth user exists: ${existing.id}`);
} else {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/update-password`,
  });
  if (error) throw error;
  console.log(`Invited ${email}: ${data.user.id}. They must set a password from the email.`);
}

const { data: staffId, error: rpcError } = await admin.rpc("bootstrap_administrator", {
  target_email: email,
});
if (rpcError) throw rpcError;

console.log(`ADMINISTRATOR granted. staff_users.id = ${staffId}`);
console.log("Next: sign in, then enroll an authenticator app at /mfa.");
