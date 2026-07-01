# Next Steps

Status as of 2026-07-01. This is the cold-start handoff for Claude Code,
Codex, or a human. Requirements live in
`.claude/prds/dnd-worldbuilding-flashcards.prd.md`.

## Current status

Milestone 1 is complete and live at
`https://worldbuilding-flashcards.vercel.app`. Production has 26 curated cards
and 2 real saved answers. The owner explicitly waived the planned four-week
usage-validation period and chose to proceed on the assumption that the current
interaction works. The retention and flashcard-fit risks remain accepted but
unvalidated.

Milestone 2 (notes-derived prompts) is now in progress at the discovery/planning
stage. No milestone-2 application code has been written yet.

## Obsidian vault discovery

Google Drive access is connected. The likely live vault and campaign were found:

- Vault: `Obsidian/DND`
- Campaign: `01 Campaigns/The Gods Are Dead`
- Campaign folders: `00 Current State`, `01 Session Prep`, `02 Session Logs`,
  `03 Act 1 - Reeklands`, `04 Future Acts`, and `99 Old Prep`
- The wider vault also contains `02 World`, `03 Characters`, `05 Ideas`,
  `06 Inspiration`, `07 Reference`, `SourceBooks`, templates, and Obsidian
  configuration folders.

Drive folder IDs needed for implementation:

- `DND`: `1ymHFNRQtj6K9hB9bCxh4L1eITy3z_7Tc`
- `The Gods Are Dead`: `1kREaxxGXnQpNDWBbH0r0kDIxsBYw82kj`
- `00 Current State`: `1AUELXJrCGxoVq5Hb6_yVHr_2mKuSo1_h`
- `03 Act 1 - Reeklands`: `1zOAQwpNtVgBBxqsn4IO5jjzfk0iuLnT_`

Recommended initial scan scope is the current campaign's `00 Current State`,
`03 Act 1 - Reeklands`, and `04 Future Acts`, plus relevant campaign-owned notes
from the vault-level `02 World` and `03 Characters`. Exclude `.obsidian`,
`SourceBooks`, `07 Reference`, templates, archive/old-prep folders, and generic
rules content so generated prompts concern the user's world rather than source
material.

## Immediate next decision and implementation milestone

Choose the question-generation engine before implementation. The recommended
default is an OpenAI API model because it can turn unstructured Markdown into
specific gap-oriented questions; the alternative is deterministic local
heuristics, which avoid API cost but will mostly produce shallow template-based
questions.

After that decision, create a decision-complete milestone-2 implementation plan
covering:

- Drive authentication and recursive Markdown ingestion for the approved
  folder allowlist.
- Stable source-file identity and content hashes so unchanged notes are not
  regenerated and removed/changed notes can retire stale cards.
- Prompt generation, validation, deduplication, categories, and provenance.
- A manual authenticated sync action in the app; do not scan Drive on every
  page request.
- Mixing generated cards into the existing least-answered draw pool.
- Failure reporting that leaves the curated deck usable when Drive or the
  generator is unavailable.
- Tests using fixtures plus a preview/dry-run before writing generated cards to
  production.

Milestone 3 (exporting answers back to Obsidian) remains pending until milestone
2 is working.

## Existing production and implementation gotchas

- Vercel, Neon, and GitHub automatic deployment are configured; production
  secrets are in Vercel and are not committed.
- Next.js 16 uses `src/proxy.ts`, not `middleware.ts`. Read bundled docs in
  `node_modules/next/dist/docs/` before changing conventions.
- `/history` calls `connection()` before querying Postgres to prevent stale
  static rendering.
- Prisma 7 requires the existing `@prisma/adapter-pg` adapter.
- Local development uses Homebrew Postgres because `prisma dev` produced a
  `P1017` failure in this environment.
- Test Server Actions with a browser, not plain `curl`.
