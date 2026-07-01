Agent interoperability
All plans, tasks, implementation notes, and handoff documents must be written so they can be executed by either Claude Code or Codex without translation.

Next steps tracking
At the end of any work session (finishing a milestone, a task, or otherwise stopping mid-stream), update `NEXT_STEPS.md` at the repo root with: current status of what's built/verified, the immediate next step(s), any gotchas or non-obvious findings hit along the way, and remaining work from the PRD. Write it so any agent (or human) can pick up the project cold from that file alone — no assumed context from this conversation. Overwrite stale sections rather than appending a history log; `NEXT_STEPS.md` should always describe where things stand *now*, not a chronological diary.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
