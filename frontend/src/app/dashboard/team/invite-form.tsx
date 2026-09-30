'use client';

import { useActionState } from 'react';
import { inviteUser } from '@/app/actions/users';
import { Alert } from '@/components/ui/card';
import { Field, SelectField } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

export function InviteForm() {
  const [state, formAction] = useActionState(inviteUser, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Full name" name="fullName" required minLength={2} />
      <Field label="Email" name="email" type="email" required />
      <Field
        label="Temporary password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <SelectField label="Role" name="role" defaultValue="buyer">
        <option value="buyer">Buyer</option>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </SelectField>
      <Alert state={state} />
      <SubmitButton className="w-full" pendingText="Adding…">
        Add person
      </SubmitButton>
    </form>
  );
}
