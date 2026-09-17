"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { requestPasswordReset, type FormState } from "../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});

  if (state.message) {
    return <Notice tone="success">{state.message}</Notice>;
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={state.fieldErrors?.email ? true : undefined}
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending" : "Send reset link"}
        </Button>
      </div>
    </form>
  );
}
