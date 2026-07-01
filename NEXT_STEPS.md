# Next Steps

Status as of 2026-07-01. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 (curated cards and answer capture) is **complete**: built, deployed,
and verified on desktop and a physical phone.

- Production: `https://worldbuilding-flashcards.vercel.app`
- Vercel project: `larserikodegaard-8796s-projects/worldbuilding-flashcards`
- GitHub repository `leodegaard/worldbuidler-flashcard` is connected for
  automatic production deployments from `main`.
- Neon resource `worldbuilding-flashcards-db` uses the free plan in Frankfurt
  (`fra1`) and is connected to Production, Preview, and Development.
- The production build runs Prisma migrations, idempotently seeds the curated
  deck, and then builds Next.js. `/history` is dynamic (`ƒ`).
- Production SQL currently shows 26 active curated cards and 2 saved answers.
- Fresh sensitive `APP_PASSWORD` and `SESSION_SECRET` values are configured in
  Vercel and are not committed.
- `.env*`, `.vercel`, `.next`, `node_modules`, generated Prisma code, and
  TypeScript build artifacts remain ignored and uncommitted.

## Verification completed

- Unauthenticated requests redirect to `/login`; incorrect passwords are
  rejected and the production password signs in.
- Saving advances to another card and immediately persists to `/history`.
- Reloading and moving between desktop and phone preserve saved answers.
- Skipping advances without creating an answer.
- Desktop, 390x844 responsive viewport, and physical-phone use all work.
- Production contains exactly 26 active cards; the owner created 2 real answers
  from the phone and they were confirmed directly in Postgres.
- Vercel showed no HTTP 500 responses during automated verification.

## Immediate next step: validate the product

Use the app during real campaign-prep sessions for four consecutive weeks.
Self-track at least:

- Date of each voluntary prep session.
- Whether the prompt-card interaction helped focus or felt constraining.
- Rough number of cards answered in the session (answer timestamps in Postgres
  can help reconstruct this).
- Any prompt categories that repeatedly feel useful, weak, or missing.

At the end of four weeks, compare usage against the PRD target of at least three
voluntary sessions per week. Decide whether to retain or revise the flashcard
interaction before planning milestone 2.

## Remaining PRD work

- Milestone 2: generate cards from the user's Obsidian notes and mix them into
  the curated pool. The existing `Card.source` field anticipates this. Do not
  begin implementation until the milestone-1 usage review.
- Milestone 3: export saved answers as canon candidates into the Obsidian vault,
  likely through Google Drive integration.

## Known implementation gotchas

- Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. Read the bundled docs in
  `node_modules/next/dist/docs/` before changing Next.js conventions.
- `/history` must call Next.js 16's `connection()` before querying Postgres or
  it may be statically prerendered with stale answers.
- Prisma 7 requires the existing `@prisma/adapter-pg` adapter when constructing
  `PrismaClient`.
- Local development uses Homebrew Postgres because `prisma dev` produced a
  `P1017` protocol failure in this environment.
- Neon's generated URL currently causes a non-blocking `pg` warning about SSL
  mode semantics changing in `pg` v9; revisit when upgrading `pg`.
- Test Server Actions with a real browser; plain `curl` does not reproduce the
  Next.js action invocation protocol.
