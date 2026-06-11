# postim Headless Integration Example

This fixture shows the supported postim/headless path without depending on desktop internals. It is intentionally a contract example: the JSON files are valid handoff payloads, while the media path is a placeholder that must be replaced with a real file before rendering.

## Files

- `project-schema.json` is the `ProjectSchema` handoff. External TypeScript consumers should type this shape through `@timeline/shared-types/schema`.
- `render-job.json` is the direct one-shot render request for `render-job`.
- `bot-workflow-payload.json` is a Telegram-like payload for `bot-workflow` with `project=`, `output=`, `destination=`, and `resolution=` hints.

## Validate The Contract

```bash
bun run check:examples:postim
```

The check verifies that the example JSON is parseable, points at the supported `ProjectSchema` fixture, carries file-only output handoff, and does not use private repo paths in machine-readable payloads.

## TypeScript Consumer Shape

```ts
import type { ProjectSchema } from "@timeline/shared-types/schema"

export async function createPostimProject(): Promise<ProjectSchema> {
  const response = await fetch("/api/postim/project-schema")
  return (await response.json()) as ProjectSchema
}
```

Do not import package-private workspace files to build this object. Cross-process handoff should use the serialized `ProjectSchema` JSON.

## Direct Render Handoff

Build the Rust headless CLI if `timeline` is not already on `PATH`:

```bash
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline
```

Replace `examples/headless-postim/media/input.mp4` in `project-schema.json` with a real video path, then run:

```bash
bun run apps/cli/src/index.ts render-job examples/headless-postim/render-job.json \
  --pretty \
  --rust-render \
  --rust-render-command crates/target/debug/timeline
```

Expected output is `BotRenderJobResult` JSON. External callers should read `job.status`, `job.progress`, `job.artifact`, `job.publications`, and ordered `events`. For polling-style integrations, also write the final payload with `--status-file`.

## Telegram-Like Review Handoff

For one-shot bot intake without a long-running Telegram worker:

```bash
bun run apps/cli/src/index.ts bot-workflow examples/headless-postim/bot-workflow-payload.json \
  --default-destination file \
  --default-output .tmp/postim-headless/bot-workflow.mp4 \
  --pretty \
  --rust-render \
  --rust-render-command crates/target/debug/timeline
```

Expected output is `BotWorkflowRunResult` JSON. The render status and artifact are under `result.job`; intake metadata and resolved project/output hints stay in the workflow result envelope.

For production Telegram editing/review sessions, use `bot-worker` and the bot-first production contract. postim should consume the bot/headless result payloads instead of desktop state.

## Unsupported Integration Surfaces

postim must not integrate through `src-tauri`, root `@/*` aliases, `packages/*/src/**`, `apps/*/src/**` package-private modules, desktop React providers, or app-shell state. `apps/cli/src/index.ts` is the documented CLI launcher used by these examples.

Rust publish remains the production publish path when a destination is supported by `timeline publish ... --json`. Node/TypeScript should orchestrate bot-first/headless flows and hand artifact paths/status forward, not create a second production publish backend.

## Streaming Boundary

This example is a command/result contract. It records the current postim handoff without implementing streaming APIs. Future `ts-stream`/postim streaming work should depend on these stable payloads and result events rather than private runtime internals.
