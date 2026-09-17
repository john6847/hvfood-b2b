"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Props = { mode: "enroll" | "verify" };

type Enrollment = { factorId: string; qrCode: string; secret: string };

/**
 * TOTP enrollment and challenge using Supabase Auth MFA. On success the
 * session cookie is upgraded to aal2 and the router refreshes so server
 * components (and RLS) see the new assurance level.
 */
export function MfaPanel({ mode }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Single-flight: React Strict Mode mounts effects twice in development and
  // a double enroll would collide on the factor's friendly name.
  const prepareRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    async function clearUnverifiedFactors() {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const stale = data.all.filter((f) => f.factor_type === "totp" && f.status === "unverified");
      for (const factor of stale) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      return data;
    }

    async function enrollTotp() {
      return supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Horizon Vert wholesale",
        issuer: "Horizon Vert Wholesale",
      });
    }

    async function prepare() {
      setError(null);

      if (mode === "verify") {
        const { data, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) {
          setError(listError.message);
          return;
        }
        const verified = data.totp.find((f) => f.status === "verified");
        if (!verified) {
          setError("No verified authenticator found. Sign out and sign in again to enroll.");
          return;
        }
        setFactorId(verified.id);
        return;
      }

      try {
        await clearUnverifiedFactors();
        let result = await enrollTotp();
        if (result.error) {
          // A leftover unverified factor from an abandoned attempt: clear and retry once.
          await clearUnverifiedFactors();
          result = await enrollTotp();
        }
        if (result.error) {
          setError(result.error.message);
          return;
        }
        setEnrollment({
          factorId: result.data.id,
          qrCode: result.data.totp.qr_code,
          secret: result.data.totp.secret,
        });
        setFactorId(result.data.id);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not start enrollment.");
      }
    }

    if (!prepareRef.current) {
      prepareRef.current = prepare();
    }
  }, [mode, supabase]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setBusy(false);
      setError("That code did not match. Check the time on your device and try again.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {mode === "enroll" ? (
        enrollment ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-start">
            {/* Supabase returns the QR as an SVG data URI. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrollment.qrCode}
              alt="QR code to add Horizon Vert wholesale to your authenticator app"
              width={176}
              height={176}
              className="size-44 shrink-0 rounded-md border border-border bg-surface"
            />
            <div className="text-sm text-foreground-muted">
              <p className="font-medium text-foreground">Cannot scan?</p>
              <p className="mt-1">Enter this key manually in your authenticator app:</p>
              <code className="mt-2 block break-all rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
                {enrollment.secret}
              </code>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted" aria-live="polite">
            Preparing your authenticator code
          </p>
        )
      ) : null}

      <Field label="Six-digit code" htmlFor="code">
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          className="max-w-40 font-mono text-lg tracking-[0.3em]"
        />
      </Field>

      <div>
        <Button type="submit" disabled={busy || !factorId || code.length !== 6}>
          {busy ? "Verifying" : mode === "enroll" ? "Activate" : "Continue"}
        </Button>
      </div>
    </form>
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
    </div>
  );
}
