# SneakickS Backend

Backend API server for the SneakickS Marketplace — a StockX-like Bid/Ask marketplace for sneakers and collectibles.

**Week 4** — PostgreSQL + JWT authentication + Matching Engine with `FOR UPDATE` row locking.

## Stack

- **Runtime:** Node.js (>= 18.x)
- **Framework:** ExpressJS 4.19
- **Database:** PostgreSQL (>= 13) via `pg` (node-postgres)
- **Auth:** `jsonwebtoken` (JWT) + `bcryptjs` (password hash)
- **Module system:** ES Modules (`import`/`export`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit .env (set DB credentials + JWT_SECRET)
cp .env.example .env

# 3. Make sure PostgreSQL is running and the database exists:
#    psql -U postgres -c "CREATE DATABASE sneakicks;"

# 4. Run migrations (schema + seed data)
npm run db:migrate

# 5. Start dev server (auto-restart on changes)
npm run dev
```

Server runs at `http://localhost:3000`.

## Project Structure

```
sneakicks-backend/
├── server.js                          ← Entry point
├── package.json
├── .env.example
├── .gitignore
└── src/
    ├── config/
    │   └── db.js                      ← PostgreSQL Pool + withTransaction()
    ├── db/
    │   ├── schema.sql                 ← DDL: 10 tables + indexes
    │   ├── seed.sql                   ← Categories + products
    │   └── migrate.js                 ← Run schema + seed (incl. bcrypt-hashed users)
    ├── models/
    │   ├── userModel.js
    │   ├── categoryModel.js
    │   ├── productModel.js            ← incl. lowestAsk / highestBid subqueries
    │   ├── bidModel.js
    │   ├── askModel.js
    │   └── transactionModel.js
    ├── middlewares/
    │   ├── authMiddleware.js          ← JWT Bearer verification
    │   └── errorHandler.js
    ├── services/
    │   └── matchingEngine.js          ← FOR UPDATE row locking
    ├── controllers/
    │   ├── productController.js
    │   ├── categoryController.js
    │   ├── authController.js          ← Real bcrypt + JWT
    │   ├── bidController.js
    │   └── askController.js
    ├── routes/
    │   ├── productRoutes.js
    │   ├── categoryRoutes.js
    │   ├── authRoutes.js
    │   ├── bidRoutes.js
    │   └── askRoutes.js
    └── data/                          ← Legacy mock JSON (kept for reference)
        ├── products.json
        └── categories.json
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run dev server with `--watch` (auto-restart) |
| `npm start` | Run production server |
| `npm run db:migrate` | Apply `schema.sql` + run all seed steps |
| `npm run db:seed` | Re-run seed only (keeps existing schema) |
| `npm run db:reset` | Drop + recreate everything |

## API Endpoints (summary)

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/products` | List products (supports `?brand`, `?category`, `?search`) |
| GET    | `/api/products/:id` | Product detail (with live `lowestAsk` / `highestBid`) |
| GET    | `/api/products/:id/orderbook?size=42` | Order book for a size |
| GET    | `/api/categories` | List categories |
| GET    | `/api/categories/:id/products` | Products by category |
| POST   | `/api/auth/register` | Register (real password hashing) |
| POST   | `/api/auth/login` | Login (returns real JWT) |

### Authenticated (requires `Authorization: Bearer <jwt>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/auth/me` | Current user info |
| POST   | `/api/bids` | Place Bid (auto-matches against Lowest Ask) |
| POST   | `/api/bids/buy-now` | Buy Now at Lowest Ask |
| GET    | `/api/bids/me` | List my Bids (filter `?status=active`) |
| DELETE | `/api/bids/:id` | Cancel my active Bid |
| POST   | `/api/asks` | Place Ask (auto-matches against Highest Bid) |
| POST   | `/api/asks/sell-now` | Sell Now at Highest Bid |
| GET    | `/api/asks/me` | List my Asks |
| DELETE | `/api/asks/:id` | Cancel my active Ask |

## Seeded test users

After `npm run db:migrate`:

| Email | Password | Role |
|-------|----------|------|
| `admin@sneakicks.com`   | `admin123`  | admin |
| `buyer1@sneakicks.com`  | `buyer123`  | user |
| `buyer2@sneakicks.com`  | `buyer123`  | user |
| `buyer3@sneakicks.com`  | `buyer123`  | user |
| `seller1@sneakicks.com` | `seller123` | user |
| `seller2@sneakicks.com` | `seller123` | user |

## What's Next (Week 5)

- Frontend React (Vite + Tailwind) consuming these APIs
- Verification Center workflow (admin pass/fail)
- Seller Trust score updates after each completed transaction
