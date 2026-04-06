# Workspace

## Overview

TipEase — a cashless tipping platform. pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (`@clerk/express` on backend, `@clerk/react` on frontend)
- **Payments**: Stripe (via Replit integration)
- **Frontend**: React + Vite + Tailwind + shadcn/ui + wouter

## Artifacts

- `artifacts/api-server` — Express REST API, port 8080
- `artifacts/tipease` — React + Vite web app (main frontend)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Frontend (`artifacts/tipease`)
- Single SPA with wouter routing
- Clerk auth via `ClerkProviderWithRoutes` pattern
- API calls via orval-generated hooks from `@workspace/api-client-react`
- Role-based routing: guest, host, vendor

### Backend (`artifacts/api-server`)
- Express + Clerk middleware
- Routes: /api/users, /api/wallet, /api/events, /api/qr-codes, /api/tips, /api/vendors, /api/notifications, /api/dashboard
- Stripe webhook registered before `express.json()`
- Daily tip limits enforced per tier: standard=$20, verified=$50, enhanced=$100, custom=$500

### Database Schema
Tables: users, vendors, events, qr_codes, tips, notifications, wallet_transactions
- `users.role` is nullable — null means user hasn't selected a role yet (new user → /select-role)
- Wallet balances stored as `numeric` strings in DB, parsed to float in API responses

## User Flows

1. **Guest**: Sign up → Select "Guest" → Wallet Dashboard → Scan QR → Confirm tip with PIN
2. **Host**: Sign up → Select "Host" → Create events → Assign vendors → Generate QR codes
3. **Vendor**: Sign up → Select "Vendor" → Create profile → Confirm event invitations → View tip feed
4. **Select Role**: New users always hit /select-role after first sign-in

## Important Notes

- `Link` from wouter renders `<a>` tags directly — use `Button asChild` pattern to avoid nested anchors
- API client uses session cookies for web auth (no manual token handling needed)
- OpenAPI spec at `lib/api-spec/openapi.yaml` is source of truth
- After schema changes, run `pnpm --filter @workspace/db run push` and restart api-server
