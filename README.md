# Aluminium Backend

NestJS and MongoDB backend for the 7 Star Traders POS and inventory system.

## Core Features

- JWT authentication with first-admin bootstrap support
- Role-based authorization guards
- Atomic sales and purchase flows with stock and ledger integration
- Paginated list endpoints for products, customers, sales invoices, and purchase invoices
- Cashier session management with open-shift enforcement for sales invoices

## Local Development

```bash
npm install
npm run start:dev
```

Default local backend URL: `http://localhost:3000`

## Required Environment Variables

Create a `.env` file in this folder.

```env
MONGO_URI=mongodb://127.0.0.1:27017/7star-traders
JWT_SECRET=replace-this-with-a-long-random-secret
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
```

Notes:

- `MONGO_URI` is required. `MONGODB_URI` is also accepted and normalized internally.
- `JWT_SECRET` must be present for login and token validation.
- `ALLOWED_ORIGINS` should be a comma-separated list when multiple frontend origins are allowed.

## Scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
```

## Production Setup

1. Provision MongoDB and set `MONGO_URI`.
2. Set a strong `JWT_SECRET`.
3. Set `ALLOWED_ORIGINS` to the deployed frontend origin or origins.
4. Build with `npm run build`.
5. Start with `npm run start:prod` or run `node dist/main` behind your process manager.

## Deployment Checklist

- Confirm database connectivity before starting the app.
- Confirm the frontend origin is present in `ALLOWED_ORIGINS`.
- Bootstrap the first admin user and verify role-protected routes.
- Verify `GET /session/active`, `POST /session/open`, and `POST /session/close` for an authenticated user.
- Verify creating a sales invoice without an open session returns `Please open a shift first`.
