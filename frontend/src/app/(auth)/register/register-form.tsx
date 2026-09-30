'use client';

import { useActionState } from 'react';
import { register } from '@/app/actions/auth';
import { Alert } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

export function RegisterForm() {
  const [state, formAction] = useActionState(register, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Company name" name="companyName" required minLength={2} />
      <Field label="Your name" name="fullName" autoComplete="name" required minLength={2} />
      <Field label="Work email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <Alert state={state} />
      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
