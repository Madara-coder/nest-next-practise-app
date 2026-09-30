import { hash } from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';
import { Product } from '../products/entities/product.entity.js';
import { Tenant } from '../tenants/entities/tenant.entity.js';
import { User } from '../users/entities/user.entity.js';
import dataSource from './data-source.js';

const DEMO_PASSWORD = 'Password123!';

interface SeedTenant {
  name: string;
  slug: string;
  users: { email: string; fullName: string; role: Role }[];
  products: Pick<Product, 'name' | 'sku' | 'priceCents' | 'stock'>[];
}

const tenants: SeedTenant[] = [
  {
    name: 'Everest Wholesale',
    slug: 'everest',
    users: [
      {
        email: 'admin@everest.test',
        fullName: 'Aarav Admin',
        role: Role.Admin,
      },
      { email: 'staff@everest.test', fullName: 'Sita Staff', role: Role.Staff },
      {
        email: 'buyer@everest.test',
        fullName: 'Bikash Buyer',
        role: Role.Buyer,
      },
    ],
    products: [
      {
        name: 'Basmati Rice 25kg',
        sku: 'RICE-25',
        priceCents: 350000,
        stock: 120,
      },
      { name: 'Masoor Dal 10kg', sku: 'DAL-10', priceCents: 180000, stock: 80 },
      { name: 'Mustard Oil 15L', sku: 'OIL-15', priceCents: 420000, stock: 40 },
      { name: 'Ilam Tea 1kg', sku: 'TEA-1', priceCents: 95000, stock: 200 },
      { name: 'Sugar 50kg', sku: 'SUGAR-50', priceCents: 560000, stock: 12 },
      {
        name: 'Wai Wai Noodles (carton of 30)',
        sku: 'NOODLE-30',
        priceCents: 75000,
        stock: 300,
      },
    ],
  },
  {
    name: 'Annapurna Supplies',
    slug: 'annapurna',
    users: [
      {
        email: 'admin@annapurna.test',
        fullName: 'Nisha Admin',
        role: Role.Admin,
      },
    ],
    products: [
      {
        name: 'Copy Paper A4 (box)',
        sku: 'PAPER-A4',
        priceCents: 250000,
        stock: 60,
      },
    ],
  },
];

async function seed() {
  await dataSource.initialize();
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  for (const seedTenant of tenants) {
    await dataSource.transaction(async (manager) => {
      if (await manager.existsBy(Tenant, { slug: seedTenant.slug })) {
        console.log(`Tenant "${seedTenant.name}" already exists, skipping`);
        return;
      }
      const tenant = await manager.save(
        manager.create(Tenant, {
          name: seedTenant.name,
          slug: seedTenant.slug,
        }),
      );
      await manager.save(
        seedTenant.users.map((user) =>
          manager.create(User, { ...user, tenantId: tenant.id, passwordHash }),
        ),
      );
      await manager.save(
        seedTenant.products.map((product) =>
          manager.create(Product, { ...product, tenantId: tenant.id }),
        ),
      );
      console.log(`Seeded tenant "${seedTenant.name}"`);
    });
  }

  console.log(`\nDemo password for every user: ${DEMO_PASSWORD}`);
  await dataSource.destroy();
}

await seed();
