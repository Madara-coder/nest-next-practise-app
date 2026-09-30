import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <Card>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        New supplier?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create a company account
        </Link>
      </p>
    </Card>
  );
}
