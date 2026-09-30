export type Role = 'admin' | 'staff' | 'buyer';

export type OrderStatus = 'pending_payment' | 'paid' | 'fulfilled' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  tenant?: Tenant;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  priceCents: number;
  stock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  buyer: Pick<User, 'id' | 'fullName' | 'email'>;
  items?: OrderItem[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface OrderStats {
  byStatus: Record<OrderStatus, number>;
  revenueCents: number;
  currency: string;
}

/** Return type shared by the form Server Actions. */
export type ActionState = { error?: string; success?: string } | undefined;
