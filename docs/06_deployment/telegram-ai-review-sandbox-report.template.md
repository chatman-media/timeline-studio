# Telegram AI Review Sandbox Report

Use this template for a real sandbox run. Keep tokens, raw chat ids, channel names, provider keys and private media out of the report.

## Run Metadata

| Field | Value |
| --- | --- |
| Date | YYYY-MM-DD |
| Operator |  |
| Git branch / commit |  |
| Sandbox bot username | redacted or internal reference |
| Sandbox chat/channel | redacted or internal reference |
| Env file | `.env.telegram-ai-review-sandbox` |
| Rust `timeline` binary | `crates/target/debug/timeline` or installed path |
| AI editor provider/model |  |
| Transcriber provider/model |  |
| Final destination | `file` or `telegram` |

## Preflight

| Check | Command / Evidence | Result |
| --- | --- | --- |
| Dependencies installed | `bun install --frozen-lockfile --ignore-scripts` |  |
| Rust CLI built | `cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline` |  |
| Mocked AI review smoke | `bunx vitest run --config vitest.bot-ai.config.ts packages/adapters/src/node/__tests__/telegram-ai-review-workflow-smoke.test.ts` |  |
| Rust AI review smoke | `bun run smoke:ai-review:rust` |  |
| Telegram access check | `bot-worker --poll-once --pretty` with review env disabled |  |

## Chat Workflow

| Step | User action | Expected bot response | Observed evidence | Result |
| --- | --- | --- | --- | --- |
| Help | `/help` | Command list or command-handled response | Message id / screenshot ref |  |
| Upload | Small video with `Make a 15s product promo destination=file` | Queued/running status and first preview | Preview message id + artifact path |  |
| Text correction | Plain text feedback | `Applied revision: ...` and new preview | Revision id + preview path |  |
| Voice correction | Voice message | Transcription succeeds, `Applied revision: ...`, new preview | Revision id + preview path |  |
| Video-note correction | Video note | Transcription succeeds, `Applied revision: ...`, new preview | Revision id + preview path |  |
| Versions | `/versions` | Revision list with redacted provider/render metadata | Redacted response |  |
| Restart | Stop/start worker, then `/status` | Latest session/revision survives restart | Status response |  |
| Approval | `/approve` | Approved revision; file-only publish done or Telegram publish result | Publish result |  |
| Cleanup dry-run | `bot-cleanup --pretty` | Active sessions preserved, only expired terminal artifacts listed | Redacted JSON/log |  |

## Artifact Checklist

Record paths only; do not attach private media unless the sandbox asset is explicitly shareable.

- Offset file:
- Job store:
- Edit session JSON:
- Media download directory:
- Preview directory:
- Final output path:
- First-cut temp directory:

## Gaps / Follow-Up

- [ ] 
