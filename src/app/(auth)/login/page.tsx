import type { Metadata } from "next";
import Link from "next/link";
import { STATIC_PREVIEW } from "@/lib/env";
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
      {STATIC_PREVIEW ? (
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-foreground-muted">
          Design preview: sign in with one of the test accounts. There is no live data.
        </p>
      ) : null}
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
