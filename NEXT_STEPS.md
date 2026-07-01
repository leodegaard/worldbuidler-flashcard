# Next Steps

Status as of 2026-07-01. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 remains complete and live at
`https://worldbuilding-flashcards.vercel.app`.

Milestone 2, **Lore Lens**, is implemented on `codex/lore-lens` but is not yet
production-ready because the real-vault preview flow has not yet been exercised.
Do not merge the branch or mark milestone 2 complete until the preview is
connected to Drive and the generation, approval, and stale-source flow passes.

The branch is pushed to GitHub. A ready Vercel preview exists at
`https://worldbuilding-flashc-git-a262cc-larserikodegaard-8796s-projects.vercel.app`.
Vercel Deployment Protection currently requires the owner's Vercel login before
that preview can be opened in a browser.

Implemented:

- Google OAuth connect/callback flow using read-only Drive consent, offline
  refresh tokens, signed state, and AES-256-GCM encrypted token storage.
- Recursive Markdown scanning of the discovered Campaign, World, and Characters
  folder IDs with explicit technical/archive/sourcebook exclusions.
- Transient note processing: only metadata, hashes, link graphs, and generated
  artifacts are stored; raw Markdown bodies are not persisted.
- Obsidian parsing for frontmatter-adjacent content, headings, empty/sparse
  notes, placeholders, open questions, embeds, links, backlinks, and bounded
  two-hop context.
- Focused or balanced selection, up to 15 primary notes and 10 related notes,
  with 100k input and 5k output token limits.
- Pinned GPT-5.4 mini structured generation of exactly 10 English questions,
  extended categories, evidence rationales, source validation, duplicate
  fingerprints, and non-canon draft-answer context.
- $2 UTC-calendar-month application hard cap with worst-case preflight checks
  and actual usage/cost persistence.
- Submission feedback changes the generate button to disabled `Generating…`
  while its Server Action is pending. A 15-minute renewable Postgres lease
  prevents simultaneous requests across separate Vercel instances and safely
  recovers after a crashed invocation.
- Source metadata is synchronized in bounded, idempotent chunks so a large vault
  does not hold one transaction past Prisma's five-second timeout.
- Multiple draft batches, select-all/clear/individual review, selective approval,
  rejection memory, discard, and a 30-active-unanswered-card ceiling.
- Source-hash recheck on approval and automatic archival of stale generated
  cards while preserving answers and provenance in history.
- 50/50 curated/generated drawing with least-answered selection inside the
  chosen source.
- Lore Lens source links and rationales on live cards and history, including a
  stale-source marker.
- Committed migration `20260701125510_lore_lens` and `.env.example` contract.

## Verification completed

- `npm test`: 9/9 passing.
- `npm run lint`: passing.
- `npx tsc --noEmit`: passing.
- `npm run build`: passing; `/`, `/history`, `/lore-lens`, and both OAuth
  handlers are dynamic routes.
- The generation lease was integration-tested against local Postgres: a current
  lease rejects a second run, and an expired lease is reclaimed and released.
- Browser verification against local Postgres covered password protection,
  navigation, disconnected state, focus selection, budget/active counters,
  responsive 390x844 layout without overflow, multiple-draft rendering,
  select-all/clear, discard, generated-card provenance, history provenance, and
  stale-source labeling. All fixture data was removed afterward.
- `npm audit` reports five moderate advisories inherited through the current
  Next.js/Prisma dependency trees. Suggested automated fixes incorrectly
  downgrade major framework versions, so no force-fix was applied.

## External service status

### Google Cloud — configured for deployed environments

- The Drive API, OAuth consent configuration, read-only Drive scope, web client,
  and all three authorized redirect URIs are configured.
- `GOOGLE_CLIENT_ID` is present in Vercel Development, Preview, and Production.
- `GOOGLE_CLIENT_SECRET` is sensitive and present in Vercel Preview and
  Production. Vercel does not permit sensitive Development variables, so local
  testing still requires adding it manually to ignored `.env.local`.
- The stable branch preview now points to deployment
  `worldbuilding-flashcards-dh4swx1hn.vercel.app`, which built successfully,
  applied all three migrations, and seeded 26 curated cards.

### OpenAI Platform — configured for deployed environments

- The dedicated Lore Lens API project uses GPT-5.4 mini with application-level
  hard enforcement of the $2 monthly ceiling.
- `OPENAI_API_KEY` is sensitive and present in Vercel Preview and Production.
  Local generation remains unavailable until the owner optionally adds the key
  to ignored `.env.local`; this does not block preview verification.

Already configured in all three Vercel environments:

- `OAUTH_ENCRYPTION_KEY`
- `LORE_CAMPAIGN_FOLDER_ID`
- `LORE_WORLD_FOLDER_ID`
- `LORE_CHARACTERS_FOLDER_ID`
- Environment-specific `GOOGLE_REDIRECT_URI` values

## Immediate continuation steps

1. Reload the connected `/lore-lens` preview and generate exactly one Balanced
   batch. Verify that the button immediately reads `Generating…` and is disabled.
2. Inspect the resulting ten questions, cost, sources, rationales, and scan
   warnings without approving anything yet.
3. Approve a subset and verify 50/50 deck behavior, persistence, history, and
   source links. Test source-change archival using a disposable note.
4. Inspect Vercel runtime logs and production database counts. The preview build
   has already applied the migration and reseeded all 26 curated cards.
5. Merge only after preview verification, then verify production, mark milestone
   2 complete in the PRD, and rewrite this file.

## Remaining PRD work

- Milestone 3: export saved answers as canon candidates into the Obsidian vault.
  This will require new incremental Google write consent; Lore Lens intentionally
  requests read-only access today.

## Existing gotchas

- `.env.local` may contain Vercel/Neon development credentials and overrides
  `.env` in Next.js. Prefix local dev commands with variables sourced from
  `.env` when testing against Homebrew Postgres.
- Next.js 16 uses `src/proxy.ts`, not `middleware.ts`; read bundled docs before
  changing conventions.
- Prisma 7 requires the existing `@prisma/adapter-pg` adapter.
- Test Server Actions with a browser, not plain `curl`.
- The first real-vault generation reached metadata synchronization but failed
  before calling OpenAI because one transaction exceeded Prisma's 5000 ms limit
  (5258 ms elapsed). Commit `6587bf1` replaces that transaction with chunked
  idempotent writes and adds the UI/server duplicate-request safeguards. The
  fixed deployed run is the immediate verification target.
