# Restaurant POS + Stock Management System

Production-ready web-based Restaurant POS and Stock Management where every sale automatically deducts ingredients from stock, and dish availability is computed in real time from recipes.

## Tech Stack

- **Backend:** Node.js, NestJS, PostgreSQL, Prisma
- **Auth:** JWT (short-lived), bcrypt, RBAC (Admin / Cashier)
- **Frontend:** React (see `client/` for setup)
- **Security:** OWASP-aligned (validation, rate limiting, Helmet, CORS, parameterized queries only)

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (PostgreSQL), JWT_SECRET, CORS_ORIGINS
```

### 2. Database

```bash
npm run prisma:migrate   # create DB and run migrations
npm run prisma:seed      # seed roles, users, sample ingredients/recipe/product
```

### 3. Run API

```bash
npm install --legacy-peer-deps
npm run prisma:generate
npm run start:dev
```

API base: `http://localhost:3000`

### Seed Users (dummy – change in production)

| Role   | Email                  | Password     |
|--------|------------------------|--------------|
| Admin  | admin@restaurant.local | Password123! |
| Cashier| cashier@restaurant.local | Password123! |

## API Overview

- **POST /auth/login** – Body: `{ "email", "password" }` → `{ accessToken, user }`
- **GET /products/pos** – Products for POS with `availableQuantity` (Admin + Cashier)
- **POST /orders** – Create order (items: `{ productId, quantity }`)
- **POST /orders/:id/confirm** – Confirm and pay (body: `{ "paymentMethod": "CASH" }`), deducts stock
- **GET /orders** – List orders (Cashier: own only; Admin: all)
- **Admin-only:** `/users`, `/ingredients`, `/recipes`, `/products` (CRUD), `/stock`, `/stock/add`, `/stock/adjust`, `/stock/movements`, `/stock/low`

## Core Logic

- **Dish availability:** For each dish, `min(availableStock / recipeQuantity)` over all ingredients (e.g. Chicken 6000g/300g = 20, Tomatoes 300g/20g = 15 → **15** dishes).
- **On order confirm:** Ingredients are deducted per recipe × quantity; stock movements are recorded as `SALE` with order reference.

## Security (OWASP)

- Input validation (class-validator) on all DTOs; whitelist + forbidNonWhitelisted.
- Parameterized queries only (Prisma, no raw SQL).
- Rate limiting on all endpoints (Throttler).
- JWT short-lived; passwords hashed with bcrypt.
- RBAC: Admin (full), Cashier (POS + own orders).
- CORS from env; Helmet; centralized error filter (no stack/sensitive data in responses).

## Project Structure

```
src/
  auth/           # Login, JWT strategy, guards
  users/          # CRUD users (Admin)
  ingredients/    # CRUD ingredients (Admin)
  recipes/        # CRUD recipes + recipe_ingredients (Admin)
  products/      # CRUD products, GET /products/pos (POS)
  availability/  # Dish availability from stock & recipes
  stock/         # Stock levels, add/adjust, movements, low-stock (Admin)
  orders/        # Create, confirm (deduct stock), list (Admin/Cashier)
  prisma/        # PrismaService
  common/        # Roles decorator, global exception filter
```

## Frontend (React POS)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend (port 3000). Login with seed user (e.g. cashier@restaurant.local / Password123!), then use the POS to add dishes to cart and confirm with cash payment; stock is deducted automatically.
