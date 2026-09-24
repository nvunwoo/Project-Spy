# Project-Spy repository instructions

Read docs/CURRENT_STAGE.md and docs/README.md before working. The six game-design documents linked in docs/README.md own the v0.7 game rules. THE_MOLE_GAME_DESIGN_PREP.md is a historical snapshot.

The project is archived with no further development planned. The main branch is the sole retained branch. GitHub Pages hosts a static, single-browser local training fixture; it is not a secure or networked two-player game. Documentation of possible future work in docs/production/FUTURE_DEVELOPMENT_PLAN.md is reference material only.

If the user later asks to resume development, first reconcile the current design, UI/UX contract, local code, and hosting requirements. Keep deterministic rules independent from React, Three.js, networking, and persistence. A future server must own canonical hidden state, turns, randomness, movement, objectives, economy, and victory and return player-specific projections. Do not infer logical positions from 3D transforms.

Preserve source, design, spreadsheet, tests, and history. Never commit real .env files, credentials, provider connection files, tokens, secrets, generated caches, or node_modules. Report static, unit, build, browser, two-client, device, and deployment verification separately.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
