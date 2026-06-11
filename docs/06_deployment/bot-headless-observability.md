# Bot/Headless Operator Observability

**Status:** Phase H operator runbook for [#298](https://github.com/chatman-media/timeline-studio/issues/298)
**Related:** [Telegram Bot Worker Production Runbook](telegram-bot-worker-production.md), [Telegram AI Review Sandbox Smoke](telegram-ai-review-sandbox-smoke.md), [Bot-First Production Contract](../engineering/bot-first-production-contract.md), [External And Headless Integration Contracts](../engineering/external-headless-contracts.md), [Timeline Studio CLI](../../apps/cli/COMMANDS.md)

This runbook defines the supported operator view for Telegram bot-first and headless jobs. Use it when a production upload, AI edit, preview render, approval, final render, publish, cleanup, retry or cancel path needs investigation without reading raw internal code.

## Correlation Keys

Use these ids to connect Telegram chat activity, persisted state, render/publish handoffs and user-visible responses.

| Key | Where it appears | Use |
| --- | --- | --- |
| `updateId` | Worker stdout/result JSON, queue/job records, error metadata | Correlate one Telegram `Update` with a handled result or failed result |
| `queueId` | Queue acknowledgements, workflow job store, `/retry`, `/cancel` | Track async upload/render jobs before AI review creates an edit session |
| `chatId`, `userId`, `messageId` | Job records, edit sessions, status/review responses | Identify the source conversation; redact in public evidence |
| `session.id` | Edit session JSON, `/status`, revision observability, publish metadata | Primary AI review correlation id |
| `revision.id`, `revision.index` | `/versions`, preview caption, revision metadata, publish metadata | Identify exactly which preview was approved or published |
| `renderJobId`, `providerJobId` | `metadata.observability.renderPreview`, render artifacts | Trace preview/final render provider work |
| `publishResult.providerId`, `publishResult.url` | Edit session publish result and `lastPublish` observability | Trace destination-side publish result |

Do not paste raw bot tokens, provider API keys, authorization headers, private chat ids, channel ids, source media names or unredacted session JSON into public issues. The worker stores review metadata through `redactSensitiveMetadata`; operator reports should keep that boundary.

## Operator Entry Points

| Entry point | Command or path | What to inspect |
| --- | --- | --- |
| One-shot worker result | `bun run apps/cli/src/index.ts bot-worker --update-file <update.json> --pretty` | `updateId`, `responseText`, `queueId`, command/review action, `error` |
| Poll-once result | `bun run apps/cli/src/index.ts bot-worker --poll-once --pretty` | Telegram access, `nextOffset`, handled update results |
| Long-running worker logs | `sudo journalctl -u timeline-bot-worker -f` | Batch-level failures, service restarts, stdout JSON from command modes |
| Job store | `TIMELINE_BOT_JOB_STORE_FILE` | Queue status, retry/cancel state, render artifact/error |
| Edit session store | `TIMELINE_BOT_EDIT_SESSION_DIR` | Session status, revisions, preview artifacts, publish result, failures |
| Review chat commands | `/status`, `/versions` | User-visible session state and recent revision details |
| Cleanup dry-run | `bun run apps/cli/src/index.ts bot-cleanup --pretty` | Expired candidates, preserved active sessions and queued/running jobs |

For file-backed state, start with the session id from `/status`, then inspect only the matching JSON file in `TIMELINE_BOT_EDIT_SESSION_DIR`. Use `jq` locally to narrow evidence before sharing:

```bash
jq '{id,status,updatedAt,approvedRevisionId,publishResult,failure,metadata:{observability:.metadata.observability},revisions:[.revisions[] | {id,index,summary,diagnostics,artifact,metadata:{observability:.metadata.observability}}]}' \
  "$TIMELINE_BOT_EDIT_SESSION_DIR/<session-id>.json"
```

## Workflow Signals

| Stage | Expected status/evidence | Operator action if missing or failed |
| --- | --- | --- |
| Upload/intake | Worker result has `updateId`; async mode returns `queueId`; job store records `queued` or `running` with source chat/user/message ids | Check allowlist, media guardrails and queue limit before retrying |
| First cut | Job result creates a `preview_ready` edit session; revision `0` has `summary=Initial preview` and `renderPreview.renderJobId` | Inspect render job status and media download paths; retry the queue job if the source payload is available |
| Preview delivery | Revision metadata has `previewDelivery.status=sent`, `fallback_message` or `failed`; caption includes `Preview <revision.id>` | If `failed`, use `previewDelivery.artifactPath` or artifact URL to resend manually |
| Text/voice/video-note edit | Session moves `preview_ready -> editing -> preview_ready`; new revision has `aiEditor`, `attempts`, `commandTypes`, `changedAreas` and diagnostics | If validation fails, inspect `metadata.observability.lastError` and preserve the last valid revision |
| Versions review | `/versions` lists revision ids, editor provider/model, prompt id, attempt count, render id and artifact reference | Use the revision id to confirm which preview is being discussed |
| Approval | Session records `approvedRevisionId` and moves to `approved` or `publishing` before final publish | If state is invalid, `/status` should show current state and the user should approve only a `preview_ready` revision |
| Publish | Session status becomes `done` or `failed`; `publishResult` and `metadata.observability.lastPublish` include destination, status, provider id, URL or error | Fix destination credentials/capability, then retry publish against the approved artifact rather than editing a new revision |
| Cleanup | Dry-run lists only expired media, previews, first-cut files, drafts, terminal jobs and terminal sessions | Do not run `--delete` until active sessions and queued/running jobs are absent from candidates |

## Stable User-Facing Messages

Smoke tests and operators should treat these as the stable high-signal chat surfaces:

- `/status`: `AI review session <session.id>: <status>, revisions=<count>`, optional goal, publish line, failure line and recent revision lines.
- `/versions`: each revision line includes `#<index>`, `revision.id`, summary, editor provider/model, prompt id, attempts, render id and artifact path or URL when present.
- Preview delivery: preview video caption starts with `Preview <revision.id>`; fallback text points to the artifact when Telegram video delivery is unavailable.
- Approval success: `Published to <destination>.` with URL when the publish result includes one.
- Invalid review action: the bot returns a short state-specific message instead of silently dropping the update.
- Queue controls: `/retry <queueId>` and `/cancel <queueId>` operate on job store records and report `not_found`, `not_cancellable`, `queued`, `running`, `failed`, `cancelled` or `rejected` states.

Do not assert exact punctuation for long errors in smoke evidence. Assert session id, revision id, status, destination and redacted provider/render/publish fields.

## Retry, Cancel And Recovery

Use `/status` first to determine whether the problem is in the AI review session or in an async workflow job.

- Async upload/render job failed before an edit session exists: use `/retry <queueId>` when the job store still has the source payload/workflow. Use `/cancel <queueId>` only for queued/running jobs.
- AI edit validation or exception: the session is marked `failed` with `metadata.observability.lastError`. Restore only after an operator confirms the last valid revision and the corrected instruction path.
- Preview render failure: keep the last accepted `projectSchema`; rerun from the revision's render input/artifact metadata rather than applying another AI edit.
- Telegram preview delivery failure: the revision remains usable. Use `previewDelivery.artifactPath` or the fallback message to inspect the preview.
- Publish failure after approval: keep `approvedRevisionId`; inspect `publishResult` and `lastPublish`; fix destination config; republish the approved artifact.
- Worker restart: active edit sessions survive through `TIMELINE_BOT_EDIT_SESSION_DIR`. Queued/running jobs are retry-only when `TIMELINE_BOT_RECOVER_STALE_JOBS=true` marks stale persisted jobs failed on startup.

## Evidence Checklist

For a GitHub issue or incident note, include sanitized evidence only:

1. `session.id`, latest `revision.id`, `status`, `updatedAt` and `approvedRevisionId` when present.
2. `/status` and `/versions` output with chat ids, user ids, private URLs and media filenames redacted.
3. The relevant `metadata.observability` block for `lastError`, `renderPreview`, `previewDelivery` or `lastPublish`.
4. Job store `queueId`, `status`, `renderJobStatus`, artifact reference or error when the failure happened before review.
5. The exact local validation command used, for example `bun run test:bot-ai`, `bun run smoke:ai-review:rust` or `bot-cleanup --pretty`.

## Local Smoke Coverage

Run the mocked AI review smoke for regression coverage:

```bash
bunx vitest run --config vitest.bot-ai.config.ts \
  packages/adapters/src/node/__tests__/telegram-ai-review-workflow-smoke.test.ts
```

Run the full bot AI suite before changing runtime status/revision semantics:

```bash
bun run test:bot-ai
```

The smoke covers persisted first preview, text feedback, voice feedback, video-note feedback, worker restart, approval publish and final `done` session status. Real sandbox evidence still follows [Telegram AI Review Sandbox Smoke](telegram-ai-review-sandbox-smoke.md) and requires operator-owned Telegram and AI credentials.
