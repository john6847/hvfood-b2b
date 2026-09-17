"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { updatePassword, type FormState } from "../actions";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <Field label="New password" htmlFor="password" error={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          aria-invalid={state.fieldErrors?.password ? true : undefined}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={state.fieldErrors?.confirm ? true : undefined}
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Save password"}
        </Button>
      </div>
    </form>
  );
}
