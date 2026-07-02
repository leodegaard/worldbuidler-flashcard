# Worldbuilding Flashcards

A private, single-user worldbuilding tool that presents one focused prompt at a
time and stores draft lore in Postgres.

Production: <https://worldbuilding-flashcards.vercel.app>

## Local development

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run dev
```

The local environment requires Postgres. See `NEXT_STEPS.md` for the current
deployment state and project-specific gotchas.

## Lore Lens

Lore Lens reads approved Obsidian Markdown folders from Google Drive, identifies
evidence-backed lore gaps, and proposes 10 English questions for review. Raw
note bodies are processed transiently and are not stored in Postgres.

External setup:

1. Create a Google Cloud OAuth web application with the Drive API enabled.
2. Add `http://localhost:3000/api/google/callback` and the production callback
   URL as authorized redirect URIs.
3. Configure the Google variables documented in `.env.example`.
4. Create a dedicated OpenAI API project restricted to GPT-5.4 mini, add a
   project API key, and configure soft billing alerts. The app independently
   enforces a $2 UTC-calendar-month hard ceiling.
5. Open `/lore-lens`, connect Google Drive with read-only consent, and generate
   a draft batch.

Use **Preview API payload** beside the generate button to inspect the exact
model settings, instructions, selected note context, prior questions, draft
answers, and structured-output schema without calling OpenAI or recording model
usage.

## Verification

```bash
npm test
npm run lint
npm run build
```

Vercel runs migrations and idempotent seeding before every build through the
committed `vercel.json` build command.
