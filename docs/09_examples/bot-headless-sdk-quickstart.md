# Bot/Headless SDK Quickstart

This quickstart is for external consumers that need to create, render, review, or publish Timeline Studio projects without opening the desktop UI. The supported integration surface is intentionally small: serialized `ProjectSchema` payloads, the Rust `timeline` CLI, and the Node CLI entrypoints in `apps/cli`.

Use the fixture set in [examples/headless-postim](../../examples/headless-postim/README.md) as the runnable sample payloads. The fixture is postim-named because it was the first consumer, but the contract applies to any headless integration.

## Stable Entrypoints

| Entrypoint | Use it for | Contract output | Local validation |
| --- | --- | --- | --- |
| `ProjectSchema` | Cross-process project handoff | JSON matching the Rust schema and TypeScript type | `bun run check:examples:headless-sdk` |
| Rust `timeline` | Schema emission, render, publish validation/upload | JSON for schema/publish operations where `--json` is available | `timeline emit-schema`, `timeline publish ... --validate-only --json` |
| `render-job` | Direct one-shot render from a render job JSON file | `BotRenderJobResult` | `bun run apps/cli/src/index.ts render-job ... --pretty` |
| `bot-workflow` | One-shot Telegram-like intake without polling | `BotWorkflowRunResult` | `bun run apps/cli/src/index.ts bot-workflow ... --pretty` |
| `bot-worker` | Production Telegram polling and AI review loop | Telegram messages plus persisted session/job state | sandbox env + `bot-worker --poll` |
| `bot-cleanup` | Retention cleanup for runtime state | cleanup summary JSON | dry-run cleanup command |

Do not integrate through desktop React state, root aliases, package-private workspace files, or `src-tauri` internals. Missing capabilities should become a core port, package export, or CLI contract before external use.

## ProjectSchema Handoff

TypeScript consumers should treat `ProjectSchema` as serialized data:

```ts
import type { ProjectSchema } from "@timeline/shared-types/schema"

export async function loadProjectSchema(): Promise<ProjectSchema> {
  const response = await fetch("/api/timeline/project-schema")
  return (await response.json()) as ProjectSchema
}
```

For a local fixture:

```bash
bun run check:examples:headless-sdk
```

For Rust-generated schema and sample payloads:

```bash
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline
crates/target/debug/timeline emit-schema > project-schema.schema.json
crates/target/debug/timeline emit-example ./input.mp4 > project.json
```

## render-job

Use `render-job` when the external service already has a render job JSON payload and wants a machine-readable result:

```bash
bun run apps/cli/src/index.ts render-job examples/headless-postim/render-job.json \
  --pretty \
  --rust-render \
  --rust-render-command crates/target/debug/timeline
```

Read these stable result fields first:

- `job.status`
- `job.progress`
- `job.artifact`
- `job.publications`
- ordered `events`

Use `--status-file <path>` when the caller needs a durable final JSON payload for polling or audit.

## bot-workflow

Use `bot-workflow` for one-shot Telegram-like intake without running the long-lived worker:

```bash
bun run apps/cli/src/index.ts bot-workflow examples/headless-postim/bot-workflow-payload.json \
  --default-destination file \
  --default-output .tmp/headless-sdk/bot-workflow.mp4 \
  --pretty \
  --rust-render \
  --rust-render-command crates/target/debug/timeline
```

The input payload may carry hints such as:

```json
{
  "chat": { "id": "external-demo-chat" },
  "from": { "id": "external-demo-user" },
  "text": "project=examples/headless-postim/project-schema.json output=.tmp/headless-sdk/out.mp4 destination=file resolution=1080p"
}
```

Keep remote downloads opt-in. Use `--telegram-bot-token`, `--media-dir`, and `--download-remote-media` only when the payload must resolve Telegram file ids or remote URLs.

## bot-worker

Use `bot-worker` for production Telegram review/editing:

```bash
cp config/bot-worker.sandbox.env.example .env.telegram-ai-review-sandbox
chmod 0600 .env.telegram-ai-review-sandbox

set -a
. ./.env.telegram-ai-review-sandbox
set +a

bun run apps/cli/src/index.ts bot-worker --poll --async-workflows --rust-render --pretty
```

Start with `TIMELINE_BOT_DEFAULT_DESTINATION=file` and `TIMELINE_BOT_RUST_PUBLISH=false`. After the file-only approval loop is proven, switch to a real destination and enable Rust publish in the env file.

Production configuration starts from [config/bot-worker.production.env.example](../../config/bot-worker.production.env.example). Runtime behavior and recovery rules are documented in [Bot-First Production Contract](../engineering/bot-first-production-contract.md) and [Telegram Bot Worker Production Runbook](../06_deployment/telegram-bot-worker-production.md).

## Publish Validation

Publishing is Rust-first for supported destinations. Use file output for sandbox review, then validate credentials before real uploads:

```bash
crates/target/debug/timeline publish telegram \
  -i .tmp/headless-sdk/out.mp4 \
  --token "$TELEGRAM_BOT_TOKEN" \
  --chat "$CHAT_ID" \
  --validate-only \
  --json
```

Destination support and user-facing errors are defined in [Publish Destination Support Matrix](../engineering/publish-destination-support-matrix.md). Unsupported destinations must fail before final render/publish starts.

## Guardrails

Before sending changes to an external consumer:

```bash
bun run check:examples:headless-sdk
bun run check:examples:postim
bun run check:boundaries:external
```

These checks prove the documented examples stay parseable and avoid private import paths. They do not run a real render or Telegram upload; use the sandbox runbook for that operator-owned validation.
