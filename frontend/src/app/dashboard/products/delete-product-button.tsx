'use client';

import { useTransition } from 'react';
import { deleteProduct } from '@/app/actions/products';

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Remove "${name}" from the catalog?`)) return;
        startTransition(async () => {
          const result = await deleteProduct(id);
          if (result?.error) alert(result.error);
        });
      }}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? 'Removing…' : 'Remove'}
    </button>
  );
}
