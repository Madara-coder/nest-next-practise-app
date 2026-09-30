import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

/**
 * Runs against the real PostgreSQL + Redis from docker-compose (or CI services).
 * Each run registers a fresh tenant, so tests never collide with seed data.
 */
describe('TradeFlow API (e2e)', () => {
  let app: NestExpressApplication;
  let adminCookie: string;
  let buyerCookie: string;
  let productId: string;

  const runId = Date.now();
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      rawBody: true,
    });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const cookieFrom = (res: request.Response) =>
    ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0].split(';')[0];

  it('GET /api/health reports database and redis as up', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/api/products').expect(401);
  });

  it('registers a new company and signs the admin in', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        companyName: `E2E Traders ${runId}`,
        fullName: 'E2E Admin',
        email: `admin-${runId}@e2e.test`,
        password,
      })
      .expect(201);
    adminCookie = cookieFrom(res);
    expect(adminCookie).toMatch(/^access_token=/);
  });

  it('lets the admin add a product and invite a buyer', async () => {
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({ name: 'Test Rice', sku: 'E2E-RICE', priceCents: 1000, stock: 5 })
      .expect(201);
    productId = product.body.id;

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        email: `buyer-${runId}@e2e.test`,
        fullName: 'E2E Buyer',
        password,
        role: 'buyer',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: `buyer-${runId}@e2e.test`, password })
      .expect(200);
    buyerCookie = cookieFrom(login);
  });

  it('forbids buyers from managing products', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Cookie', buyerCookie)
      .send({ name: 'Nope', sku: 'NOPE', priceCents: 1, stock: 1 })
      .expect(403);
  });

  it('never sells more than is in stock', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', buyerCookie)
      .send({ items: [{ productId, quantity: 6 }] })
      .expect(400);
    expect(res.body.message).toContain('left in stock');
  });

  it('creates an order, reserves stock and is idempotent', async () => {
    const send = () =>
      request(app.getHttpServer())
        .post('/api/orders')
        .set('Cookie', buyerCookie)
        .set('Idempotency-Key', `e2e-${runId}`)
        .send({ items: [{ productId, quantity: 2 }] })
        .expect(201);

    const first = await send();
    const retry = await send();
    expect(retry.body.id).toBe(first.body.id);
    expect(first.body.totalCents).toBe(2000);

    const product = await request(app.getHttpServer())
      .get(`/api/products/${productId}`)
      .set('Cookie', buyerCookie)
      .expect(200);
    expect(product.body.stock).toBe(3);
  });

  it('rejects webhooks with an invalid signature', async () => {
    await request(app.getHttpServer())
      .post('/api/webhooks/payments')
      .set('x-webhook-signature', 'sha256=invalid')
      .send({ id: 'evt_1', type: 'payment.succeeded', data: { orderId: 'x' } })
      .expect(401);
  });
});
