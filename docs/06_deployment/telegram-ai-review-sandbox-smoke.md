# Telegram AI Review Sandbox Smoke

**Status:** Phase H real sandbox runbook for [#293](https://github.com/chatman-media/timeline-studio/issues/293), building on completed Phase G sandbox contract [#289](https://github.com/chatman-media/timeline-studio/issues/289)
**Related:** [Bot-First Production Contract](../engineering/bot-first-production-contract.md), [Telegram Bot Worker Production Runbook](telegram-bot-worker-production.md), [Bot/Headless Operator Observability](bot-headless-observability.md), [Telegram AI Review Workflow](../08_tasks/planned/telegram-ai-review-workflow.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

This smoke path validates the bot-first AI review loop without opening the desktop UI.

## Mocked Local Smoke

Run the repeatable mocked review loop:

```bash
bunx vitest run --config vitest.bot-ai.config.ts \
  packages/adapters/src/node/__tests__/telegram-ai-review-workflow-smoke.test.ts
```

The same test is included in:

```bash
bun run test:bot-ai
```

The smoke covers:

1. media upload fixture creates a persisted first-preview edit session;
2. text feedback creates revision 1 and sends a revised preview;
3. voice feedback is transcribed and creates revision 2;
4. video-note feedback is transcribed and creates revision 3;
5. worker restart reloads the active edit session from the filesystem store;
6. `/approve` publishes the approved revision through a mocked `IPublishService`;
7. final session status is `done`, with `approvedRevisionId`, publish metadata and four revisions.

## Fixtures

Fixtures live in `docs/08_tasks/planned/fixtures/`.

| Fixture | Purpose | Expected smoke artifact |
| --- | --- | --- |
| `telegram-ai-review-media-upload-update.json` | User uploads a source video with `destination=telegram` caption | Session `edit:telegram:smoke-chat:smoke-user`, revision 0, preview artifact path |
| `telegram-ai-review-text-feedback-update.json` | User sends plain text correction | Revision 1 and a revised preview video |
| `telegram-ai-review-voice-feedback-update.json` | User sends voice correction | Feedback transcriber receives `kind=voice`, revision 2 |
| `telegram-ai-review-video-note-feedback-update.json` | User sends video-note correction | Feedback transcriber receives `kind=video_note`, revision 3 |
| `telegram-ai-review-approve-update.json` | User sends `/approve` | Publish handoff uses revision 3 artifact and records provider id/url |

Do not put real Telegram tokens, chat ids, provider keys or channel names into fixtures.

## Expected Bot Messages

In a real sandbox chat, operators should see this progression:

| Step | User action | Expected bot-visible response |
| --- | --- | --- |
| Help | `/help` | Command list or command-handled response |
| Upload | Send a small video with a goal caption | Queued/running status, then a preview video or fallback artifact path |
| Text correction | Send plain text feedback | `Applied revision: ...` and a new preview |
| Voice correction | Send a voice message | `Applied revision: ...` and a new preview after transcription |
| Video-note correction | Send a video-note message | `Applied revision: ...` and a new preview after transcription |
| Versions | `/versions` | Revision list with redacted editor/render metadata |
| Approval | `/approve` | `Published to telegram.` when publish succeeds, or a failed publish result stored on the session |
| Status | `/status` | Session status, recent revisions, publish result and failure reason if present |

## Real Sandbox Checklist

Use a non-production bot, private chat/channel and small media file. The sandbox env template is [config/bot-worker.sandbox.env.example](../../config/bot-worker.sandbox.env.example). It intentionally defaults final approval to `destination=file` and `TIMELINE_BOT_RUST_PUBLISH=false`; real Telegram final publish is an opt-in second pass.

Prepare the local env and disposable state directories:

```bash
cp config/bot-worker.sandbox.env.example .env.telegram-ai-review-sandbox
chmod 0600 .env.telegram-ai-review-sandbox

mkdir -p \
  .tmp/timeline-bot-sandbox/drafts \
  .tmp/timeline-bot-sandbox/edit-sessions \
  .tmp/timeline-bot-sandbox/media \
  .tmp/timeline-bot-sandbox/previews \
  .tmp/timeline-bot-sandbox/first-cut \
  .tmp/timeline-bot-sandbox/final
```

Edit `.env.telegram-ai-review-sandbox` and set only sandbox values:

- `TIMELINE_BOT_TELEGRAM_TOKEN`;
- `TIMELINE_BOT_ALLOWED_CHAT_IDS` or `TIMELINE_BOT_ALLOWED_USER_IDS`;
- `TIMELINE_BOT_AI_EDITOR_API_KEY`, or `OPENAI_API_KEY`/`LLM_API_KEY` in the shell;
- optional AI/transcriber model overrides.

Run local preflight checks before polling Telegram:

```bash
bun install --frozen-lockfile --ignore-scripts
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline

bunx vitest run --config vitest.bot-ai.config.ts \
  packages/adapters/src/node/__tests__/telegram-ai-review-workflow-smoke.test.ts

bun run smoke:ai-review:rust
```

Check Telegram access before enabling AI review state. This intentionally disables review-specific env for the access check, because `TIMELINE_BOT_EDIT_SESSION_DIR` enables AI review mode and requires an AI editor key.

```bash
set -a
. ./.env.telegram-ai-review-sandbox
set +a

env \
  -u TIMELINE_BOT_EDIT_SESSION_DIR \
  -u TIMELINE_BOT_REVIEW_PREVIEW_DIR \
  -u TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR \
  -u TIMELINE_BOT_AI_EDITOR_API_KEY \
  -u TIMELINE_BOT_AI_EDITOR \
  bun run apps/cli/src/index.ts bot-worker --poll-once --pretty
```

Start the real sandbox worker after access succeeds:

```bash
set -a
. ./.env.telegram-ai-review-sandbox
set +a

bun run apps/cli/src/index.ts bot-worker \
  --poll \
  --async-workflows \
  --rust-render \
  --pretty
```

Exercise the chat workflow:

1. Send `/help`.
2. Send a small video with a caption such as `Make a 15s product promo destination=file`.
3. Confirm queued/running status and first preview delivery.
4. Send one text correction.
5. Send one voice correction.
6. Send one video-note correction.
7. Run `/versions` and confirm revision ids, provider/model and artifact references are present and secrets are redacted.
8. Stop and restart the worker, then run `/status` and confirm the latest session/revision survives.
9. Run `/approve` only after verifying the preview. In the default file-only pass, approval should record a `file` publish result against the approved preview artifact. For real Telegram final publish, first complete the file-only pass, then explicitly set `TIMELINE_BOT_DEFAULT_DESTINATION=telegram` and `TIMELINE_BOT_RUST_PUBLISH=true` in the sandbox env.
10. Run `bot-cleanup --pretty` in dry-run mode and confirm active sessions are preserved.

Capture sanitized evidence with [telegram-ai-review-sandbox-report.template.md](telegram-ai-review-sandbox-report.template.md) and the field checklist in [Bot/Headless Operator Observability](bot-headless-observability.md). Do not paste raw tokens, chat ids, provider keys, private media names or unredacted session JSON into public issues.

## Publish Validation

Mocked smoke never uses real network credentials. Rust publish validation is opt-in:

```bash
# Local render smoke; publish checks skip when network/token config is absent.
bun run smoke:ai-review:rust

# Optional Telegram validate-only call against the sandbox provider.
AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK=1 \
AI_REVIEW_RUST_SMOKE_TELEGRAM_TOKEN=123:token \
AI_REVIEW_RUST_SMOKE_TELEGRAM_CHAT_ID=@sandbox_channel \
bun run smoke:ai-review:rust
```

Do not run real publish validation with production tokens from a developer shell. Use service-managed sandbox credentials and keep command output out of public issues when it contains chat/channel identifiers.
