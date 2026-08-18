# Project-Spy repository instructions

These instructions apply to the entire repository.

## Read before working

1. Read `docs/CURRENT_STAGE.md` first.
2. Read `docs/CODEX_WORKING_RULES.md` and `docs/technical/TECHNICAL_READINESS.md` before changing technical files.
3. Treat the six active documents listed in `docs/README.md` as the authoritative game-design rules.
4. The root `THE_MOLE_GAME_DESIGN_PREP.md` is a historical snapshot, not the active specification.

## Current boundary

- Game-design baseline: `v0.5`.
- Technical-readiness baseline: `t0.1`.
- Software status remains `NOT STARTED` until the user explicitly authorizes implementation.
- Technical preparation may update documentation, repository safeguards, and connection-status records.
- Do not scaffold the application, install project packages, create database schemas, create hosting projects, or deploy without a later explicit implementation or setup instruction.

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
- Do not merge to `main`, push a production release, or run a production deployment without explicit user authorization.
- Never commit `.env*` files other than `.env.example`, `.vercel/`, credentials, access tokens, service-role/secret keys, or database passwords.

## Verification

- Distinguish static inspection, type checking, unit tests, builds, browser automation, two-client multiplayer tests, physical tablet tests, Preview verification, and Production verification.
- Do not claim a runtime behavior passed unless it was exercised in the corresponding environment.
- Before a code-bearing PR is ready, the expected baseline is lint, typecheck, unit tests, production build, and relevant Playwright desktop/tablet projects.

