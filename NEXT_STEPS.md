# Next Steps

Status as of 2026-07-01. This file exists so any agent (or human) picking up
this repo cold can continue without re-deriving context. Source of truth for
requirements: `.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Where things stand

Milestone 1 from the PRD ("Curated card deck + answer capture") is **built
and verified working locally**, but **not yet deployed**. The PRD explicitly
requires PC + mobile access, which means local-only isn't "done" yet —
deployment is the next concrete step, not a nice-to-have.

What exists in the repo right now:
- Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui) app, scaffolded
  with `--src-dir` (everything lives under `src/`).
- Prisma 7 schema (`prisma/schema.prisma`) with `Card` and `Answer` models.
  `Card.source` defaults to `"curated"` and is intentionally unused right now
  — it exists so milestone 2 (notes-derived cards) can add a `"generated"`
  source without a migration.
- 26 seed prompts across 6 categories in `src/lib/seed-data.ts`, upserted by
  `prisma/seed.ts` (stable ids like `npc-1`, `location-2`, so re-seeding
  never duplicates rows).
- Password-gate auth: `src/proxy.ts` (see gotcha below) checks an
  HMAC-signed cookie (`src/lib/auth.ts`), redirecting to `/login` if absent.
  No user table — single-user tool, shared password only.
- Draw-one-card loop: `src/app/page.tsx` + `src/lib/cards.ts` (least-answered
  first, falls back to random once everything has ≥1 answer) +
  `src/app/actions.ts` (`saveAnswer`, `skipCard` Server Actions, both
  redirect to `/?exclude=<cardId>`).
- `src/app/history/page.tsx` lists saved answers newest-first — this is the
  page that proves persistence is real (server-side, not `localStorage`).
- Verified end-to-end with a real headless browser (Playwright, mobile
  viewport) hitting the actual running dev server: login redirect, one-card
  rendering, save persists to Postgres, skip doesn't, refresh survives.
  Cross-checked against Postgres directly (`psql`) to confirm DB state, not
  just what the DOM claimed.

## Immediate next step: deploy

This is what turns "works on my machine" into "usable from PC and mobile,"
which is the actual PRD requirement.

1. Push this repo to GitHub (if not already), then import into Vercel
   (`vercel link` or the dashboard).
2. Vercel dashboard → **Storage** tab → create a Postgres database
   (Neon-backed) → connect it to the project. This auto-injects connection
   env vars into the project.
3. `vercel env pull .env.local` locally so Prisma can target the same DB
   from your machine if needed.
4. **Gotcha**: Prisma 7's `prisma.config.ts` reads `DATABASE_URL` directly
   (not `POSTGRES_PRISMA_URL` like older Vercel Postgres docs assume) —
   check what env var name Vercel's Neon integration actually injects and
   either use that name directly in `prisma.config.ts`'s
   `datasource.url: process.env["DATABASE_URL"]` or update it to match
   whatever Vercel names it.
5. Add `"postinstall": "prisma generate"` is already in `package.json` —
   confirm the Vercel build command also runs `prisma migrate deploy`
   before `next build` (e.g. build command:
   `prisma generate && prisma migrate deploy && next build`).
6. Set real values for `APP_PASSWORD` and `SESSION_SECRET` in Vercel's
   environment variables (Production + Preview). **Do not reuse the local
   dev values** — `.env` currently has `APP_PASSWORD="changeme-dev-password"`,
   a placeholder, and a `SESSION_SECRET` that was generated for local dev
   only. Generate a fresh one for production: `openssl rand -hex 32`.
7. Run `prisma db seed` once against the production database (either via
   `vercel env pull` + local `npx prisma db seed`, or by including seeding
   in a one-off deploy step) so the curated cards exist in prod.
8. Deploy (`vercel --prod` or push to `main` if GitHub auto-deploy is
   configured). Verify on both a desktop browser and an actual phone browser
   — logging in, drawing/saving/skipping a card, and confirming `/history`
   shows answers saved from either device.

## Gotchas hit during milestone 1 (so you don't re-discover them)

- **`middleware.ts` → `proxy.ts`**: Next.js 16 deprecated the
  `middleware.ts` file convention in favor of `proxy.ts` (same location,
  same matcher config, function can be a default export). The file in this
  repo is `src/proxy.ts`, not `middleware.ts` — don't recreate the old name.
  Also note: with `--src-dir`, this file must live in `src/`, not the repo
  root, or Next.js won't pick it up.
- **Prisma 7 requires an explicit driver adapter.** `new PrismaClient()`
  with no arguments throws
  `PrismaClientInitializationError: needs to be constructed with a
  non-empty, valid PrismaClientOptions`. You must pass
  `new PrismaClient({ adapter: new PrismaPg({ connectionString: ... }) })`
  using `@prisma/adapter-pg` (already installed and wired in
  `src/lib/db.ts` and `prisma/seed.ts`). If you ever see that error again
  after touching Prisma config, this is almost certainly why.
- **Local dev database is Homebrew Postgres, not `prisma dev`.** Prisma 7's
  built-in local dev Postgres (`npx prisma dev`) failed with a `P1017`
  wire-protocol error in this environment — a real bug, not a config
  mistake (verified with `DEBUG=* npx prisma migrate dev`, saw
  `quaint::connector::postgres::native` throw `UnexpectedMessage` even
  connecting to the raw TCP port it printed). We installed
  `postgresql@17` via Homebrew instead (`brew services start
  postgresql@17`) and pointed `DATABASE_URL` at
  `postgresql://<macOS username>@localhost:5432/worldbuilding_flashcards`.
  If `prisma dev` has been fixed upstream by the time you read this, it's
  fine to switch back, but don't assume the failure was something we did
  wrong.
- **Testing Server Actions needs a real browser, not curl.** `<form
  action={someServerAction}>` doesn't accept a plain `curl -d "field=value"`
  POST — Next.js wraps it in a specific action-invocation protocol
  (`$ACTION_ID_...` hidden field + specific encoding). Use Playwright (or
  similar) for any future manual verification of form flows, not curl.

## Remaining PRD milestones (not yet planned in detail)

See `.claude/prds/dnd-worldbuilding-flashcards.prd.md` for full context.
Neither of these has an implementation plan yet — run `/plan
.claude/prds/dnd-worldbuilding-flashcards.prd.md` to generate one once
milestone 1 is deployed and in actual use for a bit.

- **Milestone 2 — Notes-derived question generation**: mix questions
  generated by scanning the user's Obsidian notes into the same draw pool
  as the curated deck. The `Card.source` field already anticipates this
  (`"curated"` vs. presumably `"generated"`) so no schema change should be
  needed, just a new ingestion path that creates `Card` rows.
- **Milestone 3 — Obsidian canon-candidate export**: write saved answers
  back into a "might be included in canon" section of the user's Obsidian
  vault (which lives in Google Drive, per the PRD — this likely means
  Google Drive API integration, not local filesystem access). `Answer` is
  already append-only with stable ids/timestamps, which milestone 3 was
  explicitly designed to lean on.

Open questions from the PRD that are still unresolved (worth revisiting
before planning milestone 2): whether "flashcards" is even the right
interaction shape for open-ended generative prompts, and what the Obsidian
vault's structure actually looks like (unknown until milestone 2 planning
starts).
