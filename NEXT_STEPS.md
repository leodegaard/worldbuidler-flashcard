# Next Steps

Status as of 2026-07-01. This file is the cold-start handoff for either
Claude Code, Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 (curated cards and answer capture) is built and verified locally,
committed to `main`, and pushed to GitHub at commit `74d0639`. It is not yet
deployed, so the PRD milestone remains in progress.

- `npm run lint` passes.
- `npm run build` passes. `/`, `/login`, and `/history` are dynamic routes.
- `/history` now calls Next.js 16's `connection()` before reading Postgres, so
  mutable answers will not be frozen into the production build.
- `vercel.json` runs migrations, idempotently seeds all 26 curated cards, and
  then builds the app on every Vercel deployment.
- The Vercel project `larserikodegaard-8796s-projects/worldbuilding-flashcards`
  exists and this checkout is linked to it through the ignored `.vercel/`
  directory.
- Fresh sensitive `APP_PASSWORD` and `SESSION_SECRET` values are configured for
  Vercel Production and Preview. They are not committed.
- `.env`, `.env.local`, `.next`, `node_modules`, generated Prisma code, and
  TypeScript build artifacts remain ignored and were not committed.

## Immediate blockers and next actions

1. The account owner must accept the Neon Marketplace terms at:
   `https://vercel.com/larserikodegaard-8796s-projects/~/integrations/accept-terms/neon?source=cli`
2. Retry database provisioning from the repo root:
   `vercel integration add neon --name worldbuilding-flashcards-db --plan free_v3 --metadata region=fra1 --metadata auth=false --environment production --environment preview --environment development --format=json`
3. Confirm `vercel env ls` contains integration-provided `DATABASE_URL` for
   Production, Preview, and Development. If Neon exposes a differently named
   URL, map it to `DATABASE_URL` in Vercel rather than changing app code.
4. Vercel could not connect the GitHub repository even though the local GitHub
   account has push access. Grant the Vercel GitHub app access to
   `leodegaard/worldbuidler-flashcard`, then run:
   `vercel git connect https://github.com/leodegaard/worldbuidler-flashcard`
5. Deploy with `vercel --prod`. The committed build command will run
   `prisma migrate deploy`, seed 26 cards, and run `next build`.
6. Inspect deployment and runtime logs for migration, Prisma, proxy, or missing
   environment-variable errors.

## Production verification required

Do not mark milestone 1 complete until all of these pass on the production URL:

- Confirm the production database contains exactly 26 active curated cards.
- Unauthenticated requests redirect to `/login`; wrong and correct passwords
  behave correctly.
- Saving a non-empty answer advances to another card and `/history` immediately
  shows the saved answer without a rebuild.
- Skipping advances without creating an answer.
- Refreshing preserves the answer.
- Repeat the flow in desktop and mobile-width browser sessions. A physical-phone
  check remains required if only browser viewport emulation is available.
- Confirm no secrets or generated artifacts entered Git history.

After verification, mark milestone 1 `complete` in the PRD and rewrite this file
with the production URL and final deployment details. Then use the app during
real prep sessions and self-track usage for four weeks. Do not plan milestone 2
until reviewing the target of at least three voluntary sessions per week and
whether the flashcard interaction is actually useful.

## Remaining PRD work

- Milestone 2: generate cards from the user's Obsidian notes and mix them into
  the curated pool. The existing `Card.source` field anticipates this.
- Milestone 3: export saved answers as canon candidates into the Obsidian vault,
  likely through Google Drive integration.

## Known implementation gotchas

- Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. Read the bundled docs in
  `node_modules/next/dist/docs/` before changing Next.js conventions.
- Prisma 7 requires the existing `@prisma/adapter-pg` adapter when constructing
  `PrismaClient`.
- Local development uses Homebrew Postgres because `prisma dev` produced a
  `P1017` protocol failure in this environment.
- Test Server Actions with a real browser; plain `curl` does not reproduce the
  Next.js action invocation protocol.
