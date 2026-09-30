'use client';

import { useActionState, useState } from 'react';
import { login } from '@/app/actions/auth';
import { Alert } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS = [
  { email: 'admin@everest.test', label: 'Admin', company: 'Everest Wholesale' },
  { email: 'staff@everest.test', label: 'Staff', company: 'Everest Wholesale' },
  { email: 'buyer@everest.test', label: 'Buyer', company: 'Everest Wholesale' },
  { email: 'admin@annapurna.test', label: 'Admin', company: 'Annapurna Supplies' },
];

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <>
      <form action={formAction} className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Alert state={state} />
        <SubmitButton className="w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Demo accounts (click to fill)
        </p>
        <ul className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-left text-xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                <span className="block font-medium text-slate-800">{account.label}</span>
                <span className="text-slate-500">{account.company}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
