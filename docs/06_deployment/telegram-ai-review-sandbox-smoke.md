# Telegram AI Review Sandbox Smoke

**Status:** Completed Phase G sandbox contract for closed [#289](https://github.com/chatman-media/timeline-studio/issues/289)
**Related:** [Bot-First Production Contract](../engineering/bot-first-production-contract.md), [Telegram Bot Worker Production Runbook](telegram-bot-worker-production.md), [Telegram AI Review Workflow](../08_tasks/planned/telegram-ai-review-workflow.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

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

Use a non-production bot, private chat/channel and small media file.

1. Build/install the Rust `timeline` CLI and ensure `TIMELINE_BOT_RUST_RENDER=true`.
2. Copy [config/bot-worker.production.env.example](../../config/bot-worker.production.env.example) to a local sandbox env file and set only sandbox tokens/ids.
3. Set `TIMELINE_BOT_ALLOWED_CHAT_IDS` or `TIMELINE_BOT_ALLOWED_USER_IDS`.
4. Use temporary sandbox directories for offset, jobs, drafts, media, previews and edit sessions.
5. Start `bot-worker --poll --rust-render`; use `--poll-once` first if validating update access.
6. Send `/help`, then a small video with a caption such as `Make a 15s product promo destination=telegram`.
7. Confirm preview delivery, then send one text correction, one voice correction and one video-note correction.
8. Run `/versions` and confirm revision ids, provider/model and artifact references are present and secrets are redacted.
9. Restart the worker, run `/status`, and confirm the latest session/revision survives.
10. Run `/approve` only after verifying the preview; confirm publish result or stored publish failure.
11. Run `bot-cleanup --pretty` in dry-run mode and confirm active sessions are preserved.

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
