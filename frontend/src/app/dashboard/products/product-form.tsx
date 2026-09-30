'use client';

import { useActionState } from 'react';
import { createProduct } from '@/app/actions/products';
import { Alert } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

export function ProductForm() {
  const [state, formAction] = useActionState(createProduct, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Name" name="name" required minLength={2} />
      <Field label="SKU" name="sku" required minLength={2} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (NPR)" name="price" type="number" min={0} step="0.01" required />
        <Field label="Stock" name="stock" type="number" min={0} step={1} required />
      </div>
      <Alert state={state} />
      <SubmitButton className="w-full" pendingText="Adding…">
        Add product
      </SubmitButton>
    </form>
  );
}
