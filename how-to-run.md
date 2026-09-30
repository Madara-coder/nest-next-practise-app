# How to run TradeFlow

There are two ways to run the project:

- **Option A: Docker only.** The quickest way to try the app. You need nothing installed except Docker.
- **Option B: Local development.** The apps run on your machine with hot reload; only Postgres and Redis run in Docker.

---

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | recent | Both options |
| [Node.js](https://nodejs.org/) | 22 or newer | Option B only |
| npm | **11** | Option B only. Install with `npm i -g npm@11` |

These ports must be free:

| Port | Used by |
| --- | --- |
| 3000 | Web app (Next.js) |
| 4000 | API (NestJS) |
| 5433 | PostgreSQL (mapped to 5433 so it doesn't clash with a local Postgres on 5432) |
| 6379 | Redis |

---

## Option A: Run everything with Docker

From the project root:

```bash
# 1. Build and start Postgres, Redis, the API and the web app
docker compose --profile app up -d --build

# 2. Load the demo data (companies, users, products)
docker compose --profile app run --rm backend node dist/database/seed.js
```

The first build takes a few minutes. The API applies database migrations automatically when it starts.

Then open:

- **Web app:** http://localhost:3000
- **API docs (Swagger):** http://localhost:4000/api/docs
- **Health check:** http://localhost:4000/api/health

To stop everything:

```bash
docker compose --profile app down        # stop; keeps the database
docker compose --profile app down -v     # stop and delete the database
```

---

## Option B: Local development

### 1. Start Postgres and Redis

From the project root:

```bash
docker compose up -d
```

Without `--profile app`, this starts only Postgres and Redis.

### 2. Start the API

```bash
cd backend
cp .env.example .env          # the defaults work as-is
npm install
npm run build                 # the migration CLI runs from the compiled output
npm run migration:run         # create the tables
npm run seed                  # load demo data (safe to run again)
npm run start:dev             # http://localhost:4000, restarts on file changes
```

### 3. Start the web app

In a second terminal:

```bash
cd frontend
cp .env.example .env.local    # points the web app at http://localhost:4000
npm install
npm run dev                   # http://localhost:3000
```

---

## Sign in

Every demo account uses the password **`Password123!`**. The login page also has click-to-fill buttons for each one.

| Email | Role | Company |
| --- | --- | --- |
| `admin@everest.test` | Admin | Everest Wholesale |
| `staff@everest.test` | Staff | Everest Wholesale |
| `buyer@everest.test` | Buyer | Everest Wholesale |
| `admin@annapurna.test` | Admin | Annapurna Supplies |

You can also create a new company from the **Create a company account** link.

### A quick walkthrough

1. **As the buyer:** go to **Products**, enter quantities and click **Place order**. On the order page, click **Pay now**. After about 2 seconds the payment webhook arrives and the status changes to **Paid** without a manual refresh.
2. **As the admin:** the Overview page shows revenue and order counts. Open the order and click **Mark as fulfilled**. On **Products**, add a product; on **Team**, add a staff member or buyer.
3. **As the Annapurna admin:** paste the Everest order's URL. You get a 404, because each company only sees its own data.

---

## Run the tests

The API tests live in `backend/`. The e2e tests need Postgres and Redis running (`docker compose up -d`) with migrations applied.

```bash
cd backend
npm test                 # unit tests
npm run test:e2e         # end-to-end tests against the real database and Redis
npm run lint             # linting
npm run typecheck        # TypeScript checks
npm run migration:check  # fails if an entity changed without a migration
```

For the web app:

```bash
cd frontend
npm run lint
npm run build            # also runs the TypeScript checks
```

---

## Configuration

**API (`backend/.env`):**

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | `postgres://tradeflow:tradeflow@localhost:5433/tradeflow` | PostgreSQL connection |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis for BullMQ queues |
| `JWT_SECRET` | dev value | Signs login tokens (at least 32 characters) |
| `JWT_EXPIRES_IN_SECONDS` | `86400` | Session length (1 day) |
| `WEBHOOK_SECRET` | dev value | Signs and verifies payment webhooks |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed browser origin |
| `COOKIE_SECURE` | `false` | Set to `true` when served over HTTPS |

**Web app (`frontend/.env.local`):**

| Variable | Default | Purpose |
| --- | --- | --- |
| `API_URL` | `http://localhost:4000` | Where the Next.js server calls the API |
| `COOKIE_SECURE` | `true` in production | Set to `false` only for plain-HTTP demos |

The API refuses to start if a required variable is missing or invalid.

For Docker, the secrets have demo defaults in `docker-compose.yml`. Override them with environment variables, for example `JWT_SECRET=... docker compose --profile app up -d`.

---

## Useful database commands

Run these in `backend/`, after `npm run build`:

```bash
npm run migration:generate -- src/database/migrations/AddSomething   # create a migration from entity changes
npm run migration:run                                                # apply pending migrations
npm run migration:revert                                             # undo the last migration
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `port is already allocated` or `address already in use` | Another program uses that port. For 5432 this is expected: the project uses 5433. For 3000 or 4000, stop the other app. If the Docker stack (Option A) is running, stop it before Option B: `docker compose --profile app stop backend frontend`. |
| `npm ci` says the lockfile is out of sync, or `npm install` fails with `edgesOut` | You're on npm 10. Run `npm i -g npm@11` and try again. |
| `relation "users" does not exist` | Tables haven't been created. Run `npm run build && npm run migration:run && npm run seed` in `backend/`. This can also happen after Docker Desktop resets its data, for example after an update. |
| `ECONNREFUSED` on 5433 or 6379 | Postgres or Redis isn't running. Start Docker Desktop, then run `docker compose up -d`. |
| **"Too many requests"** when signing in | Sign-in is limited to 5 attempts per minute for each email. Wait a minute. |
| An order stays on "Payment processing" | The background worker needs Redis. Check `http://localhost:4000/api/health`; `redis` should be `up`. |
| You get sent back to the login page | Your session expired (sessions last 1 day). Sign in again. |
