# Telegram Bot Worker Production Runbook

**Status:** Production foundation documented for [#225](https://github.com/chatman-media/timeline-studio/issues/225)
**Related:** [Telegram AI Review Workflow](../08_tasks/planned/telegram-ai-review-workflow.md), [AI Module Stabilization](../08_tasks/planned/ai-module-node-rust-orchestration.md)

This runbook defines the supported operating model for the Telegram bot-first and AI review worker. It covers topology, persistence, deployment, restart behavior, media retention, startup smoke and sandbox validation.

## Supported Topology

The supported production topology is a single long-polling `bot-worker` process per Telegram bot token.

- Run exactly one active worker for a given bot token and offset file.
- Use `--poll`, `TIMELINE_BOT_OFFSET_FILE`, `TIMELINE_BOT_JOB_STORE_FILE`, `TIMELINE_BOT_DRAFT_DIR` and `TIMELINE_BOT_EDIT_SESSION_DIR`.
- Keep `TIMELINE_BOT_WORKFLOW_CONCURRENCY=1` unless render capacity and downstream publish limits are explicitly tested.
- Keep `TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT` finite so the bot returns a busy response instead of accepting unbounded work.
- Webhook/backend handoff is not the supported production path yet.

Node owns Telegram orchestration, sessions, provider glue and state recovery. Rust owns first-cut planning, preview rendering and final publish through `timeline` CLI adapters.

## Runtime Layout

Use durable storage for all bot state. A recommended system layout:

```text
/opt/timeline-studio/                         repo checkout or release bundle
/etc/timeline-studio/bot-worker.env           secrets and runtime config, mode 0600
/var/lib/timeline-studio/bot/offset.json      Telegram getUpdates offset
/var/lib/timeline-studio/bot/jobs.json        workflow job history for /status and /retry
/var/lib/timeline-studio/bot/drafts/          multi-message draft state
/var/lib/timeline-studio/bot/edit-sessions/   AI review edit sessions and revisions
/var/lib/timeline-studio/bot/media/           downloaded Telegram/remote media
/var/lib/timeline-studio/bot/previews/        rendered review preview artifacts
/var/lib/timeline-studio/bot/first-cut/       Rust planner temp ProjectSchema files
```

The env template lives at [config/bot-worker.production.env.example](../../config/bot-worker.production.env.example). A systemd service example lives at [config/systemd/timeline-bot-worker.service](../../config/systemd/timeline-bot-worker.service).

## Deployment

Recommended host setup:

```bash
sudo useradd --system --home /opt/timeline-studio --shell /usr/sbin/nologin timeline-bot
sudo mkdir -p /opt/timeline-studio /etc/timeline-studio /var/lib/timeline-studio/bot
sudo chown -R timeline-bot:timeline-bot /opt/timeline-studio /var/lib/timeline-studio
sudo install -m 0600 -o root -g timeline-bot config/bot-worker.production.env.example /etc/timeline-studio/bot-worker.env
```

Install dependencies and build the Rust CLI in `/opt/timeline-studio`:

```bash
bun install --frozen-lockfile
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline
sudo install -m 0755 crates/target/debug/timeline /usr/local/bin/timeline
```

Install and start the service:

```bash
sudo install -m 0644 config/systemd/timeline-bot-worker.service /etc/systemd/system/timeline-bot-worker.service
sudo systemctl daemon-reload
sudo systemctl enable --now timeline-bot-worker
sudo journalctl -u timeline-bot-worker -f
```

The existing `docker/Dockerfile.headless` image is a Rust `timeline` CLI runtime. It is useful for headless render/publish smoke, but it is not the production Node `bot-worker` runtime. Keep systemd as the supported deployment path until a separate bot-worker image exists.

## Startup Smoke

Run these before enabling the service in a real chat:

```bash
# 1. Local command smoke, no Telegram token or network required.
bun run src/cli/index.ts bot-worker \
  --update-file docs/08_tasks/planned/fixtures/telegram-help-update.json \
  --pretty

# 2. Rust-backed AI review render/publish validation smoke.
bun run smoke:ai-review:rust

# 3. One Telegram getUpdates batch against the sandbox bot.
set -a
. /etc/timeline-studio/bot-worker.env
set +a
bun run src/cli/index.ts bot-worker --poll-once --pretty
```

Expected smoke results:

- `/help` returns a command-handled JSON result locally.
- Rust smoke validates the render path and skips network publish unless provider tokens are explicitly configured.
- `--poll-once` returns `updates` and advances `nextOffset` when sandbox updates exist.
- No API keys, tokens or authorization headers appear in stdout, session metadata or GitHub issue/test output.

## Sandbox Telegram Checklist

Use a non-production bot and private channel/chat first.

1. Create the bot in BotFather and put the token in `TIMELINE_BOT_TELEGRAM_TOKEN`.
2. Set `TIMELINE_BOT_ALLOWED_CHAT_IDS` and/or `TIMELINE_BOT_ALLOWED_USER_IDS` before polling.
3. Set `TIMELINE_BOT_STATUS_CHAT_ID` only if fallback status delivery is needed.
4. Start the worker and send `/help`.
5. Send a small video with a simple caption, for example `Make a 15s product promo destination=file`.
6. Confirm the bot sends queued/running status and a preview artifact.
7. Send one text revision and one voice revision.
8. Run `/versions` and confirm revision ids, provider/model and artifact references are present.
9. Run `/approve`; for `destination=file` the approved artifact stays downloadable, for `telegram` final publish goes through Rust `timeline publish`.
10. Restart the worker during an active session and confirm `/status` still shows the latest session/revision.

## Restart And Queue Decision

Interrupted queued/running workflow jobs are retry-only.

- `TIMELINE_BOT_OFFSET_FILE` prevents replay of already consumed Telegram updates.
- `TIMELINE_BOT_JOB_STORE_FILE` keeps job history for `/status`, `/cancel` and `/retry`.
- `TIMELINE_BOT_RECOVER_STALE_JOBS=true` marks persisted queued/running jobs as failed on startup.
- Users can run `/retry <queueId>` for failed/cancelled jobs when source payload/workflow is available.
- Active AI review edit sessions survive restart through `TIMELINE_BOT_EDIT_SESSION_DIR`.

The current in-process queue is not a durable resumable queue. Do not run active/active workers against the same bot token and offset file. A backend-backed durable queue is a future topology, not part of #225.

## Media Retention And Cleanup

Recommended retention defaults:

| State | Path | Retention |
| --- | --- | --- |
| Downloaded upload/voice media | `TIMELINE_BOT_MEDIA_DIR` | 7 days |
| Review preview artifacts | `TIMELINE_BOT_REVIEW_PREVIEW_DIR` | 7 days |
| First-cut planner temp files | `TIMELINE_BOT_FIRST_CUT_PLANNER_TEMP_DIR` | 1 day |
| Drafts | `TIMELINE_BOT_DRAFT_DIR` | 14 days if no update |
| Terminal edit sessions | `TIMELINE_BOT_EDIT_SESSION_DIR` | 30 days after `done`, `cancelled` or `failed` |
| Offset | `TIMELINE_BOT_OFFSET_FILE` | Keep indefinitely |
| Job store | `TIMELINE_BOT_JOB_STORE_FILE` | Keep latest 100 records by default |

Safe cleanup before [#262](https://github.com/chatman-media/timeline-studio/issues/262) should only remove media/previews/temp files by age. Do not delete edit session JSON blindly because active sessions are also file-backed.

Example cron/systemd-timer command for file artifacts:

```bash
find /var/lib/timeline-studio/bot/media -type f -mtime +7 -delete
find /var/lib/timeline-studio/bot/previews -type f -mtime +7 -delete
find /var/lib/timeline-studio/bot/first-cut -type f -mtime +1 -delete
```

## Media Size And URL Guardrails

Current safe production policy:

- Keep `TIMELINE_BOT_DOWNLOAD_REMOTE_MEDIA=false` unless the bot runs in a restricted egress network.
- Use Telegram/user allowlists for every production bot.
- Prefer direct Telegram uploads over arbitrary remote URLs.
- Enforce network-level allowlists for remote media hosts until runtime URL policy exists.
- Use sandbox bot testing for the largest expected upload before enabling a channel.

Runtime enforcement of max media size and URL host allowlists is tracked in [#261](https://github.com/chatman-media/timeline-studio/issues/261).

## Logs And Secrets

- `bot-worker` writes machine-readable results to stdout for one-shot modes; systemd captures long-running worker logs in journald.
- Review/session observability stores redacted provider/model/prompt/render/publish metadata.
- Keep `/etc/timeline-studio/bot-worker.env` mode `0600` and owned by root with read access only for the service group.
- Do not commit real Telegram tokens, AI keys or channel ids to docs, fixtures or issue comments.

## Done Checklist For #225

- Production topology: single long-polling worker.
- Deployment path: systemd service with durable filesystem state.
- Restart model: retry-only interrupted jobs; edit sessions survive restart.
- Cleanup policy: retention windows documented, automated cleanup tracked in #262.
- Guardrails policy: documented safe defaults, runtime enforcement tracked in #261.
- Sandbox smoke: token, allowlist, status and expected chat outputs documented.
