# Project-Spy repository instructions

These instructions apply to the entire repository.

## Read before working

1. Read `docs/CURRENT_STAGE.md` first.
2. Read `docs/CODEX_WORKING_RULES.md` and `docs/technical/TECHNICAL_READINESS.md` before changing technical files.
3. Treat the six active documents listed in `docs/README.md` as the authoritative game-design rules.
4. The root `THE_MOLE_GAME_DESIGN_PREP.md` is a historical snapshot, not the active specification.
5. Read `docs/technical/UI_UX_CONTRACT.md` before changing lobby, HUD, React Three Fiber presentation, responsive layout, or input code. The external UI source under `docs/reference/ui/` is non-authoritative reference material.

## Current boundary

- Game-design baseline: `v0.6`.
- Technical-readiness baseline: `t0.2`.
- On 2026-08-22 the user explicitly approved the active `v0.6` game-design and `t0.2` technical/UI baselines and authorized Phase 0B implementation. Software status is `STARTED` on `codex/phase-0b-foundation`.
- The active Phase 0B scope is the local Next.js scaffold and lockfile, fixture-driven lobby/HUD/command UI, basic-primitives presentation, and deterministic pure rules with local verification.
- The target device is confirmed as Galaxy Tab S9+, and gameplay is landscape-only. Portrait must show a blocking rotate-device gate; do not rotate the app with CSS or implement portrait gameplay reflow.
- Docker and Local Supabase, every Supabase SDK/CLI/schema/Auth/RLS/Realtime or app connection, Vercel project/CLI/Git Integration/Preview, `main` merge, and every Production change remain deferred until a later explicit authorization.

## Durable implementation rules

- Keep deterministic game rules independent from React, Three.js, networking, and persistence.
- The server is authoritative for turns, randomness, movement legality, hidden information, objectives, economy, and victory.
- Never send canonical hidden state to a browser and rely on UI hiding. Return a player-specific projection.
- Treat 3D movement as presentation of a server-approved logical grid path. Do not infer game state from transforms.
- Keep secrets out of source, Markdown, logs, screenshots, chat messages, and client-prefixed environment variables.
- Use basic primitives for the first 3D demo. Preserve an adapter boundary for later GLB/glTF assets.
- Support both pointer/mouse and touch input; do not make hover the only way to discover or perform an action.

## Git and deployment

- Use `codex/*` branches for implementation work unless the user requests another branch.
- Keep commits narrowly scoped and report exactly which checks ran.
- Prefer a Draft PR and Vercel Preview before merging to `main`.
- A successful Preview is not approval for Production.
- Before Vercel Git Integration is connected, a separately approved guard-only merge must place the tracked `git.deploymentEnabled.main = false` configuration on remote `main`. Create/link the Vercel project through a non-deploying path, do not select an import `Deploy` action without Production authorization, and verify zero Production deployments immediately after connection. Keep the Vercel Production Branch set to `main`; Production is created only by a separately approved manual production command from a verified `main` commit.
- Run any approved Production build/deploy only from a separate clean detached worktree at the approved remote `main` SHA with no uncommitted or untracked files, using the lockfile-pinned Vercel CLI. Do not reset, clean, or repurpose the user's current worktree for a release.
- Do not merge to `main`, push a production release, or run a production deployment without explicit user authorization.
- Never commit `.env*` files except `.env.example`. Never commit `.vercel/`, credentials, access tokens, service-role/secret keys, or database passwords.

## Verification

- Distinguish static inspection, type checking, unit tests, builds, browser automation, two-client multiplayer tests, physical tablet tests, Preview verification, and Production verification.
- Do not claim a runtime behavior passed unless it was exercised in the corresponding environment.
- Before a code-bearing PR is ready, the expected baseline is lint, typecheck, unit tests, production build, and relevant Playwright desktop/tablet projects.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
