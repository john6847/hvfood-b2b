import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/service";
import { UpdatePasswordForm } from "./update-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/reset-password");

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        At least 12 characters with an uppercase letter, a lowercase letter and a number.
      </p>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
