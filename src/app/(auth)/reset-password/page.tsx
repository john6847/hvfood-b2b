import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Enter the email on your account and we will send a link to choose a new password.
      </p>
      <div className="mt-8">
        <ResetForm />
      </div>
      <p className="mt-8 text-sm text-foreground-muted">
        <Link href="/login" className="text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
