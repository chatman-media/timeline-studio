# External And Headless Integration Contracts

**Status:** Completed Phase G contract hardening for closed [#282](https://github.com/chatman-media/timeline-studio/issues/282)
**Related:** [G1](https://github.com/chatman-media/timeline-studio/issues/283), [G2](https://github.com/chatman-media/timeline-studio/issues/284), [Bot-First Production Contract](bot-first-production-contract.md), [Telegram AI Review Sandbox Smoke](../06_deployment/telegram-ai-review-sandbox-smoke.md), [postim Headless Integration Example](../../examples/headless-postim/README.md), [Package Boundaries](package-boundaries.md), [Root Compatibility Shims](root-compatibility-shims.md), [Agent Contract Reference](AGENT_CONTRACT_REFERENCE.md)

This document defines the supported integration surface for external consumers after the workspace extraction. It is intentionally narrow: consumers should build against `ProjectSchema`, the Rust `timeline` CLI, and the headless Node CLI commands. They should not import private package files, root aliases, or `src-tauri` internals.

## Supported Entrypoints

| Entrypoint | Owner | Stability | Use for |
| --- | --- | --- | --- |
| `ProjectSchema` | `@timeline/shared-types/schema` and Rust render schema | Supported contract | Project payloads for planning, editing, render, preview, and publish handoff |
| `timeline` CLI | `crates/ts-cli` | Supported headless CLI | Rust-owned render, publish, analysis, optimization, schema emission, and planner paths |
| `render-job` | `apps/cli/src/commands/render-job.ts` | Supported headless Node CLI | Running a machine-readable bot render job through the Node orchestration layer |
| `bot-workflow` | `apps/cli/src/commands/bot-workflow.ts` | Supported headless Node CLI | Normalizing Telegram-like payloads into render jobs without running a long-lived bot |
| `bot-worker` | `apps/cli/src/commands/bot-worker.ts` | Supported production worker | Telegram polling, sessions, status, review loop, render, and publish orchestration |
| `bot-cleanup` | `apps/cli/src/commands/bot-cleanup.ts` | Supported operations CLI | Runtime retention cleanup for media, previews, drafts, jobs, and edit sessions |

## Unsupported Entrypoints

External consumers must not depend on:

- `src-tauri/**` internals, Rust module paths, generated files, or Tauri command implementation details.
- Root aliases such as `@/core`, `@/domains`, `@/adapters`, `@/features`, or direct `src/**` imports.
- Package-private source files under `packages/*/src/**` or `apps/*/src/**` unless they are explicitly documented as a supported CLI command or package export.
- Desktop-only React providers, app-shell state, or Tauri `AppHandle` state.

If a needed capability is not reachable through the supported surfaces above, add a core port, package export, or CLI contract first.

Root compatibility paths that still exist for desktop/build compatibility are inventoried in [Root Compatibility Shims](root-compatibility-shims.md). They are not supported external entrypoints.

## ProjectSchema Contract

`ProjectSchema` is the canonical payload for a renderable project.

For TypeScript consumers:

```ts
import type { ProjectSchema } from "@timeline/shared-types/schema"
```

For Rust/headless validation and examples:

```bash
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline
crates/target/debug/timeline emit-schema > project-schema.schema.json
crates/target/debug/timeline emit-example ./input.mp4 > project.json
```

Rules:

- Validate or generate `ProjectSchema` through the Rust schema/CLI path when crossing process boundaries.
- AI planners and editors should output a full next `ProjectSchema`, not model-specific partial state.
- Publish and render handoff should carry artifact paths and metadata separately from the project payload.

## Rust timeline CLI Contract

Rust owns production render/publish work where a Rust-backed command exists.

Common calls:

```bash
# Render a ProjectSchema to a local video artifact.
timeline render ./project.json ./out.mp4

# Validate Telegram publish configuration without uploading.
timeline publish telegram -i ./out.mp4 --token "$TELEGRAM_BOT_TOKEN" --chat "$CHAT_ID" --validate-only --json

# Emit contract fixtures for external validation.
timeline emit-schema
timeline emit-example ./input.mp4
```

Node/TypeScript may wrap these commands for orchestration, but it should not grow a second production render or social publish backend when the Rust path supports the destination.

## render-job Contract

`render-job` runs a machine-readable render request through the Node headless service. It is the smallest supported Node entrypoint for external job runners.

Example request:

```json
{
  "source": "cli",
  "project": {
    "type": "file",
    "path": "./project.json"
  },
  "output": {
    "format": "mp4",
    "path": "./out.mp4",
    "destination": "file",
    "resolution": "1080p"
  }
}
```

Run it:

```bash
bun run apps/cli/src/index.ts render-job ./render-job.json --pretty --rust-render
```

Expected output is `BotRenderJobResult` JSON with `job.status`, `job.progress`, `job.artifact`, `job.publications`, and ordered `events`.

## bot-workflow Contract

`bot-workflow` accepts a Telegram-like payload JSON, normalizes intake, resolves media where configured, creates a render job, and returns a machine-readable workflow result. Use this for one-shot automation and integration tests that should not run the long-lived Telegram worker.

Fixture examples live in `docs/08_tasks/planned/fixtures/`:

- `telegram-help-update.json`
- `telegram-ai-review-media-upload-update.json`
- `telegram-ai-review-text-feedback-update.json`
- `telegram-ai-review-voice-feedback-update.json`
- `telegram-ai-review-video-note-feedback-update.json`
- `telegram-ai-review-approve-update.json`

Run it:

```bash
bun run apps/cli/src/index.ts bot-workflow ./payload.json \
  --default-destination file \
  --default-output ./.tmp/out.mp4 \
  --pretty \
  --rust-render
```

Use `--telegram-bot-token`, `--media-dir`, and `--download-remote-media` only when the payload needs Telegram file resolution or remote URL downloads. Keep remote URL downloads opt-in.

The postim one-shot headless fixture lives in [examples/headless-postim](../../examples/headless-postim/README.md). Validate it with:

```bash
bun run check:examples:postim
```

## bot-worker Production Contract

`bot-worker` is the supported Telegram production runtime:

- single active long-polling process per Telegram bot token;
- durable offset, draft, job, media, preview, and edit-session storage;
- text, voice, and video-note feedback routed into the AI review loop;
- explicit approval before final render/publish;
- Rust-backed preview render and final publish where configured;
- `/status`, `/retry`, `/cancel`, `/versions`, and approval/revision command handling.

The full production state, publish and recovery contract lives in [Bot-First Production Contract](bot-first-production-contract.md). Production setup lives in [Telegram Bot Worker Production Runbook](../06_deployment/telegram-bot-worker-production.md), sandbox validation lives in [Telegram AI Review Sandbox Smoke](../06_deployment/telegram-ai-review-sandbox-smoke.md), and CLI flags live in [Timeline Studio CLI](../../apps/cli/COMMANDS.md).

## postim / Headless Consumer Guidance

postim and similar external consumers should integrate through the bot-first/headless layer:

1. Build or receive a valid `ProjectSchema`.
2. Use `render-job` for direct render execution, or `bot-workflow`/`bot-worker` for Telegram-like intake and review sessions.
3. Read machine-readable `BotRenderJobResult`, workflow result, session status, preview artifact, and publish result payloads.
4. Use Rust `timeline publish ... --json` indirectly through the configured Node adapter or directly when only publish validation/upload is needed.

The supported runnable handoff example is [examples/headless-postim](../../examples/headless-postim/README.md). It includes `ProjectSchema`, `render-job`, and `bot-workflow` payloads plus a validation command that checks the fixture does not depend on private repo internals.

postim must not:

- import `src-tauri` modules or root `@/*` aliases;
- depend on desktop React providers or app-shell state;
- call package-private adapter/domain files directly;
- implement a separate production publish path when Rust publish already supports the destination.

Streaming is a separate future track. `ts-stream`/postim streaming work should depend on the stable boundaries in this document instead of being folded into Phase G.

## Change Policy

- Additive fields in result JSON should be optional for consumers.
- Breaking changes to `ProjectSchema`, render-job, bot-workflow, or bot-worker result shapes require a versioned migration note and fixture update.
- Any new supported external entrypoint must be listed here and must avoid package-private source paths.
