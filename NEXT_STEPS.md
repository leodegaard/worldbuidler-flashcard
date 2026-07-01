# Next Steps

Status as of 2026-07-01. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 (curated cards and answer capture) is deployed and all automated
production checks pass. It remains marked `in-progress` in the PRD only because
the required check on physical phone hardware has not yet been performed.

- Production: `https://worldbuilding-flashcards.vercel.app`
- Vercel project: `larserikodegaard-8796s-projects/worldbuilding-flashcards`
- GitHub repository `leodegaard/worldbuidler-flashcard` is connected for
  automatic deployments from `main`.
- Neon Postgres resource `worldbuilding-flashcards-db` uses the free plan in
  Frankfurt (`fra1`) and is connected to Production, Preview, and Development.
- `DATABASE_URL` and related Neon variables are injected in all environments.
  Fresh sensitive `APP_PASSWORD` and `SESSION_SECRET` values are configured for
  Production and Preview and are not committed.
- The production build applied migration `20260701104111_init`, idempotently
  seeded 26 cards, and built successfully. `/history` is dynamic (`ƒ`).
- Direct production SQL verification found exactly 26 active cards.
- The synthetic production verification answer was deleted after testing, so
  the production answer table is clean.
- `.env*`, `.vercel`, `.next`, `node_modules`, generated Prisma code, and
  TypeScript build artifacts remain ignored and uncommitted.

## Production verification completed

- Unauthenticated navigation redirects to `/login`.
- An incorrect password is rejected and the production password signs in.
- Saving a non-empty answer advances to another card.
- `/history` immediately shows the saved answer without a rebuild.
- Reloading `/history` preserves the answer.
- Skipping advances without creating another answer.
- Desktop rendering works.
- A live production run at a 390x844 browser viewport showed both card and
  history pages without horizontal overflow; the saved answer remained visible.
- No HTTP 500 responses appeared in Vercel runtime logs during verification.
- The only log warning is emitted by `pg` because Neon's generated URL uses an
  SSL mode whose semantics will change in the future `pg` v9 release. The
  current connection is verified and working; revisit when upgrading `pg`.

## Immediate next step

Open `https://worldbuilding-flashcards.vercel.app` on an actual phone, sign in,
save an answer, and confirm it appears in `/history` on both the phone and a
desktop browser. The production password was handed directly to the owner and
must not be added to this repository.

After that succeeds:

1. Change milestone 1 from `in-progress` to `complete` in
   `.claude/prds/dnd-worldbuilding-flashcards.prd.md`.
2. Rewrite this file to record physical-phone verification and the clean final
   milestone state.
3. Use the app during real prep sessions and self-track usage for four weeks.
   Do not plan milestone 2 until reviewing the target of at least three
   voluntary sessions per week and whether the flashcard interaction is useful.

## Remaining PRD work

- Milestone 2: generate cards from the user's Obsidian notes and mix them into
  the curated pool. The existing `Card.source` field anticipates this.
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
- Test Server Actions with a real browser; plain `curl` does not reproduce the
  Next.js action invocation protocol.
