# Next Steps

Status as of 2026-07-01. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 remains complete and live at
`https://worldbuilding-flashcards.vercel.app`.

Milestone 2, **Lore Lens**, is implemented on `codex/lore-lens` but is not yet
production-ready because the OpenAI project key still requires owner-managed
account setup. Do not merge the branch or mark milestone 2 complete until the
preview is connected to Drive and OpenAI and the real-vault flow passes.

The branch is pushed at commit `5429887`. A ready Vercel preview exists at
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
  `worldbuilding-flashcards-mmf4ombd0.vercel.app`, which built successfully,
  applied all migrations, and seeded 26 curated cards.

### OpenAI Platform

1. Create a dedicated API project for Lore Lens with billing enabled.
2. Restrict model use to GPT-5.4 mini where project controls allow.
3. Add soft budget alerts below and at $2/month. The app enforces the hard cap.
4. Add a project-scoped `OPENAI_API_KEY` directly to Vercel's Production,
   Preview, and Development environments. A ChatGPT subscription does not
   supply this key or API billing.

Already configured in all three Vercel environments:

- `OAUTH_ENCRYPTION_KEY`
- `LORE_CAMPAIGN_FOLDER_ID`
- `LORE_WORLD_FOLDER_ID`
- `LORE_CHARACTERS_FOLDER_ID`
- Environment-specific `GOOGLE_REDIRECT_URI` values

## Immediate continuation steps

1. Complete the OpenAI Platform setup above and add the remaining
   `OPENAI_API_KEY` to Vercel Preview and Production.
2. Sign in through Vercel Deployment Protection, open `/lore-lens`, and connect
   the owner's Google account.
3. Generate a real batch without approving it and verify ten questions, costs,
   sources, and rationales.
4. Approve a subset and verify 50/50 deck behavior, persistence, history, and
   source links. Test source-change archival using a disposable note.
5. Inspect Vercel runtime logs and production database counts. The preview build
   has already applied the migration and reseeded all 26 curated cards.
6. Merge only after preview verification, then verify production, mark milestone
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
