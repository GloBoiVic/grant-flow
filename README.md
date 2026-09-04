# GrantFlow

GrantFlow is a grant portfolio and grant-work management application for nonprofit grant professionals. See [`PRODUCT.md`](PRODUCT.md) for durable product identity and boundaries.

## Stack

- Next.js 16 with React 19 and TypeScript
- Prisma 7 with PostgreSQL
- Clerk authentication
- Tailwind CSS 4
- Vitest

## Local development

```bash
npm install
cp .env.example .env
# Edit .env with local PostgreSQL and Clerk values.
npx prisma generate
npx prisma migrate deploy
npm run verify:prisma
npm run dev
```

## Commands

- `npm run dev` — start the development server
- `npm run build` — generate the Prisma client and build the application
- `npm run start` — start the production server
- `npm run lint` — run ESLint
- `npm test` — run Vitest in watch mode
- `npm run test:run` — run Vitest once
- `npm run verify:prisma` — verify the configured database connection

## Repository workflow

Read [`AGENTS.md`](AGENTS.md) before contributing or working as an agent. Current work is tracked through the active SoloFlow workstream under [`dispatch/`](dispatch/).
