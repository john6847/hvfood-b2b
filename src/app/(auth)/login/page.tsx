import type { Metadata } from "next";
import Link from "next/link";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        For approved wholesale customers and Horizon Vert staff.
      </p>
      <div className="mt-8">
        <LoginForm next={safeNextPath(next, "")} />
      </div>
      <p className="mt-8 text-sm text-foreground-muted">
        New to Horizon Vert wholesale?{" "}
        <Link href="/wholesale/apply" className="text-primary underline underline-offset-4">
          Apply for an account
        </Link>
        .
      </p>
    </div>
  );
}
