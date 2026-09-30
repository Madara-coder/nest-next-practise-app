import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';
import type { Paginated, Product } from '@/lib/types';
import { DeleteProductButton } from './delete-product-button';
import { OrderBuilder } from './order-builder';
import { ProductForm } from './product-form';

export const metadata: Metadata = { title: 'Products' };

const PAGE_SIZE = 20;

export default async function ProductsPage({
  searchParams,
}: PageProps<'/dashboard/products'>) {
  const { search = '', page = '1' } = (await searchParams) as {
    search?: string;
    page?: string;
  };
  const currentPage = Math.max(1, Number(page) || 1);

  const query = new URLSearchParams({
    page: String(currentPage),
    limit: String(PAGE_SIZE),
    ...(search && { search }),
  });
  const [user, products] = await Promise.all([
    getCurrentUser(),
    apiFetch<Paginated<Product>>(`/products?${query}`),
  ]);
  const isBuyer = user.role === 'buyer';
  const totalPages = Math.max(1, Math.ceil(products.meta.total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title={isBuyer ? 'Place an order' : 'Products'}
        description={
          isBuyer
            ? 'Choose quantities and place your order. Stock is reserved immediately.'
            : `${products.meta.total} products in your catalog`
        }
        action={
          <Form action="/dashboard/products" className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search name or SKU"
              className="w-56 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
            />
            <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              Search
            </button>
          </Form>
        }
      />

      {isBuyer ? (
        <OrderBuilder products={products.data} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <Card title="Catalog">
            <ProductTable products={products.data} canDelete={user.role === 'admin'} />
          </Card>
          <Card title="Add product" className="self-start">
            <ProductForm />
          </Card>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage > 1 && (
            <Link
              href={`/dashboard/products?${new URLSearchParams({ search, page: String(currentPage - 1) })}`}
              className="text-indigo-600 hover:underline"
            >
              Previous
            </Link>
          )}
          {currentPage < totalPages && (
            <Link
              href={`/dashboard/products?${new URLSearchParams({ search, page: String(currentPage + 1) })}`}
              className="text-indigo-600 hover:underline"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

function ProductTable({
  products,
  canDelete,
}: {
  products: Product[];
  canDelete: boolean;
}) {
  if (products.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No products found.</p>;
  }
  return (
    <div className="-mx-5 -my-5 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Product</th>
            <th className="px-5 py-3">SKU</th>
            <th className="px-5 py-3 text-right">Price</th>
            <th className="px-5 py-3 text-right">Stock</th>
            {canDelete && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-5 py-3 font-medium text-slate-900">{product.name}</td>
              <td className="px-5 py-3 font-mono text-xs text-slate-500">{product.sku}</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {formatMoney(product.priceCents)}
              </td>
              <td
                className={`px-5 py-3 text-right tabular-nums ${
                  product.stock <= 10 ? 'font-semibold text-amber-600' : ''
                }`}
              >
                {product.stock}
              </td>
              {canDelete && (
                <td className="px-5 py-3 text-right">
                  <DeleteProductButton id={product.id} name={product.name} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
