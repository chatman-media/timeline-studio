# Publish Destination Support Matrix

**Status:** Phase H destination contract for [#297](https://github.com/chatman-media/timeline-studio/issues/297)
**Related:** [Bot-First Production Contract](bot-first-production-contract.md), [External And Headless Integration Contracts](external-headless-contracts.md), [Telegram Bot Worker Production Runbook](../06_deployment/telegram-bot-worker-production.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

This matrix defines what bot/headless workflows may publish to today, which layer owns the destination, and what validation must happen before final render starts.

## Matrix

| Destination | Status | Owner | Required configuration | Pre-render validation | User-facing failure |
| --- | --- | --- | --- | --- | --- |
| `file` | Supported file-only handoff | Node bot/headless artifact handoff | Output path or default runtime output path | Always available; no social upload credentials required | File output path errors fail the render job with the artifact/output error. |
| `telegram` | Supported Rust-first publish | Rust `timeline publish telegram --json` via `NodeRustPublishService` | Telegram bot token and chat id from session/default metadata | Destination capability must be `available`; token is checked by publisher capability and chat id is checked during publish | `Publishing to telegram is not configured. Add the required credentials or choose another destination.` |
| `youtube` | Supported Rust-first publish when OAuth token is configured | Rust `timeline publish youtube --json` via `NodeRustPublishService` | YouTube access token plus title/metadata defaults | Destination capability must be `available`; missing token blocks intake before render | `Publishing to youtube is not configured. Add the required credentials or choose another destination.` |
| `tiktok` | Unsupported publish destination | No production publish owner yet | None | Default capability registry marks it unsupported; do not add it to `supportedDestinations` until a Rust or documented external handoff exists | `Publishing to tiktok is not supported by this bot worker.` |
| `vimeo` | Unsupported publish destination | No production publish owner yet | None | Default capability registry marks it unsupported; do not add it to `supportedDestinations` until a Rust or documented external handoff exists | `Publishing to vimeo is not supported by this bot worker.` |

The `BotRenderJobDestination` type includes `tiktok` and `vimeo` so intake can return stable validation errors for user hints, not because those destinations are production publish targets.

## Dry-Run And Validation Modes

- `destination=file` is the default safe review path and should be used for sandbox approval before any real upload.
- Rust Telegram/YouTube publish supports `--validate-only --json` for credential/config validation without final upload.
- `NodeRustPublishService` forwards validate-only publish requests through `params.validateOnly === true`.
- The Telegram AI review sandbox defaults to file-only approval; real Telegram final publish is an explicit second pass.

## Validation Contract

Bot/headless intake must validate destination support before final render begins:

1. Parse destination hints from Telegram text/caption or workflow JSON.
2. Reject unknown destination strings with `This publishing destination is not available yet.`
3. Build destination capabilities from the configured `IPublishService`.
4. Reject supported-but-unconfigured destinations with a missing-auth message.
5. Reject unsupported destinations with an unsupported-destination message.
6. Only create the approval-gated render/publish workflow when destination capability is available, or when destination is `file`.

The current implementation path is `createBotDestinationCapabilityRegistry` -> `validateBotDestinationCapability` -> bot workflow intake. The existing test coverage is `packages/core/src/services/__tests__/bot-destination-capabilities.test.ts`.

## Ownership Rules

- Rust owns production upload for destinations implemented by `timeline publish ... --json`.
- Node owns orchestration, approval gating, status messages and adaptation to `IPublishService`.
- Node may keep `file` as a local artifact handoff and may wrap Rust publish.
- Node must not implement a second Telegram/YouTube production uploader while Rust publish supports those destinations.
- A future destination must add a Rust publish command or an explicitly documented external/manual handoff before it is marked supported in bot capabilities.

## Follow-Up

No new Phase H issue is needed for `file`, `telegram`, or `youtube`; they already have owners and validation behavior. Future work should be opened only when a new destination is requested, with one issue per destination and acceptance criteria for credentials, validate-only behavior, user messages and sandbox evidence.
