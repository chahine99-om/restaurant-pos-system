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

**Option A – Docker (recommended for local testing)**

```bash
docker-compose up -d
# Wait a few seconds for PostgreSQL to start, then:
npm run prisma:migrate
npm run prisma:seed
```

**Option B – Existing PostgreSQL**

Create a database named `restaurant_pos`, then set `DATABASE_URL` in `.env` and run:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Seed is idempotent: safe to run multiple times. If you already had a database, run `npm run prisma:migrate` again to add the email verification columns.

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

- **POST /auth/register** – Body: `{ "email", "password", "fullName" }` → creates account, sends verification email (or returns `verificationLink` if no SMTP). User must verify before login.
- **GET /auth/verify-email?token=...** – Verifies email; returns `{ message, email }`.
- **POST /auth/login** – Body: `{ "email", "password" }` → `{ accessToken, user }` (only if email is verified)
- **GET /products/pos** – Products for POS with `availableQuantity` (Admin + Cashier)
- **POST /orders** – Create order (items: `{ productId, quantity }`)
- **POST /orders/:id/confirm** – Confirm and pay (body: `{ "paymentMethod": "CASH" }`), deducts stock
- **GET /orders** – List orders (Cashier: own only; Admin: all)
- **Admin-only:** `/users`, `/ingredients`, `/recipes`, `/products` (CRUD), `/stock`, `/stock/add`, `/stock/adjust`, `/stock/movements`, `/stock/low`

## Core Logic

- **Dish availability:** For each dish, `min(availableStock / recipeQuantity)` over all ingredients (e.g. Chicken 6000g/300g = 20, Tomatoes 300g/20g = 15 → **15** dishes).
- **On order confirm:** Ingredients are deducted per recipe × quantity; stock movements are recorded as `SALE` with order reference.

## Security (OWASP)

See **[SECURITY.md](./SECURITY.md)** for the full list. Summary:

- **Input sanitization & validation:** All inputs trimmed and validated (type, length, format) on backend (class-validator DTOs) and frontend (forms). Query params validated and bounded.
- **SQL injection:** Parameterized queries only (Prisma, no raw SQL).
- **Rate limiting:** Every API endpoint (Throttler). Brute-force protection.
- **Secrets:** Environment variables only; no hardcoded credentials.
- **Passwords:** bcrypt hashing; never returned or logged.
- **RBAC:** Admin / Cashier; deny by default.
- **JWT:** Short-lived tokens; validated on each request.
- **CORS:** Strict origins from env; Helmet for headers.
- **Logging:** No sensitive data; centralized error filter.
- **Audit logs:** Orders and stock changes (see AuditLog table).

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

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend (port 3000).

- **Login:** Use seed user (cashier@restaurant.local / Password123!) or an account you created and verified.
- **Create account:** Click "Create one" → register with email and password → you'll see a verification link (if no SMTP, copy the link from the success message or from the API console log) → open it to verify → then log in.
- **POS:** Add dishes to cart, confirm with cash payment; stock is deducted automatically.

For production builds, set `VITE_API_URL` to your API base URL (e.g. `https://api.example.com`) before `npm run build`.

### Can't log in?

1. **"Cannot reach the server"** – Start the backend: from project root run `npm run start:dev`. The API must be running on port 3000. If it exits with a database error, set up PostgreSQL (see Database step above: Docker or local DB + migrate + seed).
2. **"Invalid credentials"** – Use the seed users exactly: **cashier@restaurant.local** or **admin@restaurant.local**, password **Password123!** (capital P, exclamation mark). If you changed the seed or never ran it, run `npm run prisma:seed`.
3. **Blank or CORS error** – Ensure you have a `.env` file (copy from `.env.example`) and that `CORS_ORIGINS` includes `http://localhost:5173`, or leave it unset (dev fallback allows it).
