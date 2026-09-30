'use client';

import { useState, useTransition } from 'react';
import { placeOrder } from '@/app/actions/orders';
import { Button } from '@/components/ui/button';
import { Alert, Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import type { ActionState, Product } from '@/lib/types';

export function OrderBuilder({ products }: { products: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // One key per order attempt: resubmitting the same order is safe.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<ActionState>();
  const [isPending, startTransition] = useTransition();

  const items = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.priceCents ?? 0) * item.quantity;
  }, 0);

  function submit() {
    startTransition(async () => {
      setState(await placeOrder(idempotencyKey, items));
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <Card title="Catalog">
        <ul className="-my-5 divide-y divide-slate-100">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-500">
                  {product.sku} · {product.stock} in stock
                </p>
              </div>
              <p className="text-sm tabular-nums">{formatMoney(product.priceCents)}</p>
              <input
                type="number"
                min={0}
                max={product.stock}
                aria-label={`Quantity of ${product.name}`}
                value={quantities[product.id] ?? ''}
                placeholder="0"
                disabled={product.stock === 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [product.id]: Math.max(0, Number(e.target.value)),
                  }))
                }
                className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </li>
          ))}
          {products.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500">No products found.</li>
          )}
        </ul>
      </Card>

      <Card title="Order summary" className="self-start">
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{items.length} line item(s)</span>
            <span className="text-lg font-semibold tabular-nums">{formatMoney(total)}</span>
          </div>
          <Alert state={state} />
          <Button
            className="w-full"
            disabled={items.length === 0 || isPending}
            onClick={submit}
          >
            {isPending ? 'Placing order…' : 'Place order'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
