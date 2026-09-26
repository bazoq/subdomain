# Work Log Protocol (resume-safe multi-agent work)

Purpose: if a session/agent is cut off (rate limit, crash), the next agent must be able to
resume EXACTLY where the previous one stopped, without re-auditing.

## Files
- `STATUS.md` — master board. One row per work-stream: owner area, state, last update, next step.
- `<stream>.md` — one file per work-stream (e.g. `security.md`). Owned by the agent on that stream.

## Rules for every agent
1. Before starting: read `STATUS.md` and your `<stream>.md`. If it has entries, CONTINUE from
   the last `NEXT:` line — do not restart the audit.
2. Append an entry to your `<stream>.md` after EVERY completed fix or finding (not at the end).
   Format:
   ```
   ## [YYYY-MM-DD HH:MM] <short title>
   - DONE: what changed (file paths)
   - FOUND (not yet fixed): ...
   - NEXT: the exact next step
   ```
3. Update your row in `STATUS.md` (state: `todo | in-progress | blocked | done`, plus NEXT).
4. Only edit files inside your ownership boundary (listed in your stream file header).
   Cross-boundary problems go under `## Handoffs` in your stream file — do not fix them.
5. Never run `git commit`; the orchestrator commits between waves.
6. Keep `npx tsc --noEmit` and `npx eslint <changed files>` clean before every log entry.
