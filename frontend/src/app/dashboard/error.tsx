'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-800">Something went wrong</h2>
      <p className="mt-1 text-sm text-red-700">
        {error.digest ? `Reference: ${error.digest}` : error.message}
      </p>
      <Button variant="secondary" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
