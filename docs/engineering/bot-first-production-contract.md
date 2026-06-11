# Bot-First Production Contract

**Status:** Completed Phase G contract hardening for closed [#288](https://github.com/chatman-media/timeline-studio/issues/288)
**Related:** [External And Headless Integration Contracts](external-headless-contracts.md), [Rust/Node AI Edit Parity](rust-node-ai-edit-parity.md), [Telegram Bot Worker Production Runbook](../06_deployment/telegram-bot-worker-production.md), [Telegram AI Review Sandbox Smoke](../06_deployment/telegram-ai-review-sandbox-smoke.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

This contract defines the supported bot-first/headless production path for Telegram AI review. Operators and external consumers should be able to understand this path without reading package internals.

## Ownership Boundary

| Layer | Owner | Production responsibility |
| --- | --- | --- |
| Telegram intake, polling, access policy | Node `bot-worker` | Read updates, enforce allowlists, normalize payloads, send user-visible messages |
| Drafts, jobs, edit sessions | Node `bot-worker` + filesystem stores | Persist offset, draft, queue/job history, preview sessions, revisions and publish metadata |
| AI edit loop | Node orchestration + configured AI editor/transcriber | Apply text, voice and video-note corrections to the current `ProjectSchema` |
| Render and preview artifacts | Rust `timeline` through Node adapters | Render first preview, revised preview and final artifact where Rust render is configured |
| Publish | Rust `timeline publish` through `NodeRustPublishService` where available | Validate/upload final approved artifact to Telegram/YouTube-style destinations |
| Cleanup | Node `bot-cleanup` | Enforce retention for media, previews, drafts, jobs and terminal edit sessions |

TypeScript owns orchestration, adapters, status delivery and state recovery. It must not grow a second production social-publish backend for a destination already supported by Rust `timeline publish`. A TypeScript `IPublishService` implementation in production should wrap the Rust publish adapter unless the destination has no Rust support yet and the exception is documented.

Destination support and user-facing unavailable-destination behavior are documented in [Publish Destination Support Matrix](publish-destination-support-matrix.md).

## Supported Workflow

1. Upload intake: the user sends Telegram media with a caption or a draft sequence of messages. Direct Telegram uploads are the default. Remote URL downloads stay disabled unless `TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA=true` is explicitly configured with host allow/block lists.
2. Workflow normalization: `bot-worker` converts the raw Telegram `Update` into a Telegram-like bot payload and records the source chat/user/message ids.
3. Media resolution: Telegram file ids or approved remote URLs are resolved into `TIMELINE_BOT_MEDIA_DIR`, subject to `TIMELINE_BOT_MEDIA_MAX_BYTES`.
4. First cut: the worker creates a `ProjectSchema` through the configured first-cut planner, then renders a first preview through Rust when `TIMELINE_BOT_RUST_RENDER=true`.
5. Review session: the worker persists the edit session in `TIMELINE_BOT_EDIT_SESSION_DIR`, sends the preview artifact, and waits for text, voice or video-note feedback.
6. Corrections: each feedback message produces a new revision with a full next `ProjectSchema`, a rendered preview artifact, and redacted provider/render metadata.
7. Approval: `/approve` marks the current revision as approved. Final publish reads only the approved session state and the current artifact.
8. Publish: when `TIMELINE_BOT_RUST_PUBLISH=true`, final publish goes through Rust `timeline publish` via the Node Rust publish adapter. `destination=file` is the supported file-only review path.
9. Status and recovery: `/status`, `/versions`, `/retry`, `/cancel` and persisted job/session stores are the supported operator surfaces.
10. Cleanup: `bot-cleanup` is dry-run by default and only deletes terminal/expired artifacts when `--delete` or `TIMELINE_BOT_CLEANUP_DELETE=true` is used.

## Runtime State Contract

| State | Required production setting | Restart expectation |
| --- | --- | --- |
| Telegram offset | `TIMELINE_BOT_OFFSET_FILE` | Already consumed updates are not replayed |
| Drafts | `TIMELINE_BOT_DRAFT_DIR` | Multi-message drafts survive restart |
| Job history | `TIMELINE_BOT_JOB_STORE_FILE` | `/status`, `/retry` and `/cancel` can reason about known jobs |
| Edit sessions | `TIMELINE_BOT_EDIT_SESSION_DIR` | Active AI review sessions and revisions survive restart |
| Downloaded media | `TIMELINE_BOT_MEDIA_DIR` | Inputs remain available for retry while retained |
| Review previews | `TIMELINE_BOT_REVIEW_PREVIEW_DIR` | Preview artifacts remain inspectable and resendable while retained |
| First-cut temp files | `TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR` | Planner intermediates are retained briefly for diagnosis |

Interrupted queued/running jobs are retry-only. `TIMELINE_BOT_RECOVER_STALE_JOBS=true` marks persisted queued/running jobs as failed on startup so they do not hang forever in `/status`.

## Production Env Surface

Use [config/bot-worker.production.env.example](../../config/bot-worker.production.env.example) as the source of truth. The minimum production groups are:

| Group | Variables |
| --- | --- |
| Telegram access | `TIMELINE_BOT_TELEGRAM_TOKEN`, `TIMELINE_BOT_ALLOWED_CHAT_IDS`, `TIMELINE_BOT_ALLOWED_USER_IDS`, optional `TIMELINE_BOT_STATUS_CHAT_ID` |
| Durable state | `TIMELINE_BOT_OFFSET_FILE`, `TIMELINE_BOT_DRAFT_DIR`, `TIMELINE_BOT_JOB_STORE_FILE`, `TIMELINE_BOT_EDIT_SESSION_DIR`, `TIMELINE_BOT_MEDIA_DIR`, `TIMELINE_BOT_REVIEW_PREVIEW_DIR` |
| Queue/restart | `TIMELINE_BOT_ASYNC_WORKFLOWS`, `TIMELINE_BOT_WORKFLOW_CONCURRENCY`, `TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT`, `TIMELINE_BOT_RECOVER_STALE_JOBS` |
| Status throttling | `TIMELINE_BOT_STATUS_MIN_INTERVAL`, `TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA` |
| Media guardrails | `TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA`, `TIMELINE_BOT_MEDIA_MAX_BYTES`, `TIMELINE_BOT_REMOTE_MEDIA_ALLOW_HOSTS`, `TIMELINE_BOT_REMOTE_MEDIA_BLOCK_HOSTS` |
| Rust render | `TIMELINE_BOT_RUST_RENDER`, `TIMELINE_BOT_RUST_RENDER_COMMAND`, `TIMELINE_BOT_RUST_RENDER_KIND`, `TIMELINE_BOT_RENDER_TIMEOUT` |
| Rust publish | `TIMELINE_BOT_DEFAULT_DESTINATION`, `TIMELINE_BOT_RUST_PUBLISH`, `TIMELINE_BOT_RUST_PUBLISH_COMMAND`, provider tokens such as `TIMELINE_BOT_YOUTUBE_ACCESS_TOKEN` |
| AI review | `TIMELINE_BOT_AI_EDITOR_*`, `TIMELINE_BOT_FEEDBACK_TRANSCRIBER_*`, `TIMELINE_BOT_FIRST_CUT_PLANNER_*` |
| Cleanup | `TIMELINE_BOT_CLEANUP_*_RETENTION`, optional `TIMELINE_BOT_CLEANUP_DELETE` |

## Status, Retry And Cleanup Expectations

- `/status` shows active review session status, recent revisions, publish result and failed jobs for the current chat.
- `/versions` lists revision ids and redacted editor/render/publish metadata.
- `/retry <queueId>` is valid only for failed/cancelled persisted jobs with stored source workflow payload.
- `/cancel <queueId>` cancels pending queued jobs or running render jobs from the current chat.
- Voice and video-note feedback require a configured feedback transcriber; missing transcription support fails the edit session rather than silently dropping feedback.
- Publish failure records a failed publish result on the approved session and leaves the approved revision id intact for operator retry.
- `bot-cleanup` preserves active edit sessions and queued/running jobs; it only removes expired media, preview, first-cut, draft, terminal job and terminal edit-session records.

## Consumer Contract

External consumers such as postim should use this layer through documented entrypoints only:

- `ProjectSchema` for project payload interchange.
- `render-job` for direct headless render jobs.
- `bot-workflow` for one-shot Telegram-like intake without polling.
- `bot-worker` for production Telegram polling and AI review.
- Rust `timeline publish ... --json` directly only for standalone publish validation/upload.

Do not import root aliases, desktop providers, `src-tauri` internals or package-private source files. If a capability is missing from the supported surfaces, add a core port, package export or CLI contract before integrating.
