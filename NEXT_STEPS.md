# Next Steps

Status as of 2026-07-02. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 remains complete and live at
`https://worldbuilding-flashcards.vercel.app`.

Milestone 2, **Lore Lens**, is merged to `main` through PR #1 and deployed to
production at `https://worldbuilding-flashcards.vercel.app/lore-lens`. Vercel
successfully built merge commit `86a0d6134e29a66411d89a20e981f075c2be6059`
and the production route was verified to respond and redirect unauthenticated
requests to `/login`. Keep milestone 2 marked in progress until one production
real-vault batch passes generation, approval, deck, and question-quality review.

A product-alignment review on 2026-07-02 clarified the intended outcome: this
is a focused worldbuilding tool, not a recall deck, an upcoming-session prep
assistant, or merely an incomplete-note detector. Its job is to reduce scattered
worldbuilding by presenting one small, world-specific question at a time that
adds depth to NPCs, cities, cultures, relationships, history, the wider world, or
story threads, then captures the answer as draft lore. Lore Lens should therefore
select questions by their potential to deepen and connect the setting, as well as
their answerability; note sparsity is only one signal. The current generation
pipeline is mechanically aligned with that goal but has not yet demonstrated
that its questions meet that quality bar on the real vault.

The current API context contains up to 15 gap-ranked primary note bodies, 10
two-hop related note bodies, 200 prior generated prompts, and the 10 most recent
saved answers. Canonical Obsidian text and non-canon answers are labeled
separately. Known product-context weaknesses to evaluate before treating Lore
Lens as complete:

- Primary selection overweights short, empty, or placeholder-heavy notes without
  estimating whether resolving the gap would meaningfully deepen the setting.
- Related notes are supplied as an unlabeled group; the model is not told which
  links/backlinks connect each related note to each primary note.
- Recent answers are global rather than relevant to the selected notes, entities,
  or prior question, which can add noise and makes coherent follow-ups accidental.
- The request has only a broad Campaign/World/Characters/Balanced focus. It lacks
  optional creative direction such as which part of the setting the user wants
  to deepen, which unresolved thread interests them, or the desired answering
  depth. This direction must not be framed around upcoming-session utility.
- A generated question cites one primary source, but all selected note IDs are
  stored as its context provenance. Per-question evidence and supporting sources
  are therefore not represented precisely.

The implementation branch was merged through
`https://github.com/leodegaard/worldbuidler-flashcard/pull/1`. Production is now
the verification target; the former branch preview is no longer authoritative.

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
- A `Preview API payload` debug action runs the real Drive scan and context
  selection, then renders the complete model, instructions, input text, limits,
  and structured-output schema on `/lore-lens` without calling OpenAI, charging
  the budget, recording usage, or synchronizing source metadata.
- Runtime database URLs normalize the legacy strict `sslmode=require`,
  `prefer`, or `verify-ca` aliases to explicit `sslmode=verify-full`, preserving
  current certificate and hostname verification while avoiding the pg v9
  migration warning. The debug submit button also leaves React's Server Action
  routing attributes under React's control, avoiding console and hydration
  warnings.
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

- `npm test`: 13/13 passing, including coverage that the debug preview contains
  all parts of the request used by the real OpenAI call and that database SSL
  normalization preserves strict verification.
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
- Browser verification on 2026-07-02 ran `Preview API payload` against the
  connected real vault. The full request appeared on-page after the Drive scan,
  the UI returned from `Building preview…` to its idle state, and monthly usage
  remained unchanged at $0.098. The scan took 83 seconds locally; this is Drive
  traversal time, not model time.
- PR #1's Vercel preview check passed before merge. The production Vercel check
  then passed for merge commit `86a0d61`, and an unauthenticated request to
  `https://worldbuilding-flashcards.vercel.app/lore-lens` returned the expected
  redirect to the production login page.
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
- Production deployment `4Gn7uwKW9UCrUdavszCVuspceahS` built successfully
  from `main`; the build command applied all three migrations and ran the
  idempotent 26-card seed.

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

1. Use `Preview API payload` in production to review exactly what a
   Balanced request would send. The first local real-vault preview confirmed
   that image-only and very sparse notes can rank as primary candidates; decide
   whether those should be excluded or enriched before spending another run.
2. After accepting or correcting the context selection, generate exactly one
   Balanced batch. Verify that the button immediately reads `Generating…` and is
   disabled.
3. Evaluate all ten questions before approval against the product bar: each must
   be grounded in existing lore, answerable in one focused sitting, capable of
   adding depth or meaningful connections, non-recall, and narrow enough to ask
   one main question.
   Record whether weak questions came from source selection, missing relational
   context, or the generation instructions.
4. Based on that real batch, decide whether milestone 2 needs a context redesign.
   The leading design is an entity-centered bundle per primary note: relevant
   excerpts, explicit outbound/backlink relationships, detected gap locations,
   relevant prior answers, and optional user-entered creative direction. Avoid
   sending unrelated recent answers or whole notes when a bounded excerpt is
   sufficient.
5. Once question quality passes, approve a subset and verify 50/50 deck behavior,
   persistence, history, and source links. Test source-change archival using a
   disposable note.
6. Inspect Vercel runtime logs and production database counts after the first
   successful production batch.
7. Mark milestone 2 complete in the PRD only after the production generation,
   approval, deck, question-quality, and stale-source checks pass; then rewrite
   this file around milestone 3.

## Remaining PRD work

- Milestone 3: export saved answers as canon candidates into the Obsidian vault.
  This will require new incremental Google write consent; Lore Lens intentionally
  requests read-only access today.

## Existing gotchas

- Localhost links work only while `npm run dev` is running in an active terminal;
  if the page appears inert or unavailable, restart the development server and
  reload `/lore-lens`.
- Local development currently overrides `APP_PASSWORD` in ignored
  `.env.development.local`; change that file rather than a tracked environment
  example when rotating the local login.
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
