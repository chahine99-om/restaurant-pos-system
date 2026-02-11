# Security

This document describes how the application implements mandatory security rules and OWASP-aligned practices.

## Mandatory security rules

### Input sanitization and validation

- **Backend:** All request body, query, and path inputs are validated with **class-validator** DTOs. String fields use a **Trim** transformer to remove leading/trailing whitespace. Length and format (email, UUID, hex token) are enforced. **ValidationPipe** is global with `whitelist: true` and `forbidNonWhitelisted: true` so unknown properties are stripped and rejected.
- **Frontend:** Login and Register forms validate type, length, and format (e.g. email regex, password 8–100 chars, fullName 1–200) before submit. Inputs use `maxLength` and `minLength` where appropriate.
- **Query params:** Verified and bounded (e.g. `limit` 1–100, `threshold` 0–1_000_000). Verification token is validated as 64-char hex.

### SQL injection

- **Parameterized queries only.** The app uses **Prisma** for all database access. No raw SQL or string concatenation for queries. Schema and queries are defined in code; Prisma generates parameterized statements.

### Rate limiting

- **Every API endpoint** is protected by **@nestjs/throttler** (global ThrottlerGuard). Default: 100 requests per 60 seconds per client. Brute-force and abuse are mitigated.

### Secrets and configuration

- **No hardcoded secrets.** API keys, database URL, JWT secret, and optional SMTP credentials are read from **environment variables** (`.env`). `.env` is gitignored. Example configuration is in `.env.example` only.

### Passwords

- Passwords are **hashed with bcrypt** (salt rounds 10) before storage. Plain passwords are never logged or returned in any response.

### Role-based access control (RBAC)

- **Admin:** Full access (users, ingredients, recipes, products, stock, orders).
- **Cashier:** POS only (products for POS, create/confirm orders, list own orders).
- Routes are protected with **JwtAuthGuard** and **RolesGuard**; the **@Roles()** decorator enforces allowed roles per endpoint. Default is deny; access is allowed only where explicitly permitted.

### Threats addressed

- **SQL injection:** Parameterized queries (Prisma).
- **XSS:** Helmet sets secure HTTP headers; React escapes text by default; no `dangerouslySetInnerHTML` with user input.
- **CSRF:** API uses Bearer token in `Authorization` header (not cookies), so classic CSRF does not apply. For cookie-based sessions you would add CSRF tokens.
- **Brute-force:** Rate limiting on all endpoints; strong password and JWT expiry reduce impact.

### JWT authentication

- **Short-lived access tokens** (e.g. 15 minutes via `JWT_EXPIRES_IN`). Tokens are validated on every protected request (signature and expiry). No refresh token in this version; re-login when expired.

### CORS

- **Strict origins only.** Allowed origins come from `CORS_ORIGINS` (comma-separated). In development, if unset, fallback allows `http://localhost:3000` and `http://localhost:5173`. Wildcard `*` is never used in production.

### HTTP security headers

- **Helmet** is applied to set headers that mitigate XSS, clickjacking, and other client-side risks (e.g. X-Content-Type-Options, X-Frame-Options).

### Logging

- **Errors** are handled by a global exception filter. Only method, path, status, and safe error message are logged. **Request body, headers, and tokens are never logged.** Stack traces and internal details are not returned in API responses.

### Audit logs

- **Critical actions** are recorded in the **AuditLog** table: order created, order confirmed, stock add, stock adjust, stock deduct (sale). Each entry stores userId, action, resourceType, resourceId, and optional non-sensitive metadata. **Passwords and tokens are never stored in audit metadata.**

## Code quality and safety

- **Centralized validation:** All incoming data is validated through DTOs and the global ValidationPipe.
- **Centralized error handling:** AllExceptionsFilter catches errors and returns a safe, consistent response without leaking sensitive data.
- **No sensitive data in responses:** User objects never include password or verification tokens; error messages do not expose internals.
- **Fail securely:** Access is denied by default; guards explicitly allow only authenticated and authorized users per route.

## Reporting vulnerabilities

If you discover a security issue, please report it responsibly (e.g. private disclosure to the maintainers) rather than opening a public issue.
