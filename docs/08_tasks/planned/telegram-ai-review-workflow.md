# Telegram AI Review Editing Workflow

**Статус:** Implementation slice merged; production runtime stabilization completed in [AI Module Stabilization and Node/Rust Orchestration](./ai-module-node-rust-orchestration.md)
**Приоритет:** High
**Создано:** 2026-06-09
**Ответственный:** Architecture Team
**Связанный фундамент:** [Bot-first workflow](./bot-first-workflow.md)

## Контекст

Bot-first фундамент уже закрывает intake, Telegram polling, media resolver, render job, status updates, draft state, queue, cancellation, retry, stale recovery, throttling, idempotency and access allowlist.

Следующий продуктовый шаг - сделать Telegram не только входом для запуска render job, а основным интерфейсом итеративного AI-редактирования:

```text
upload media
  -> AI creates first cut
  -> bot sends preview/result for review
  -> user sends text or voice corrections
  -> AI edits current project
  -> bot sends next preview
  -> repeat until approval
  -> publish only after explicit approval
```

> Важно: этот документ описывает реализованный product/workflow contract. Production wiring для AI editor, Rust planner schema alignment, preview renderer and bot-worker CLI flags закрыты в [#238](https://github.com/chatman-media/timeline-studio/issues/238); deployment, retention and cleanup остаются в [#225](https://github.com/chatman-media/timeline-studio/issues/225).

## Связь с B28 / production readiness

Этот эпик зависит от `B28: Bot-first production readiness leftovers` и не должен дублировать его scope.

- B28 владеет production topology: long-polling worker vs webhook/backend handoff.
- B28 владеет deployment/runbook foundation: env template, Docker/systemd examples, startup smoke, logs.
- B28 владеет durable queue/restart recovery decision for bot jobs.
- B28 владеет media retention, cleanup, size/URL guardrails for Telegram/remote inputs.
- Этот эпик владеет продуктовым AI review loop поверх этих решений: edit session, voice/text feedback, AI editor, previews, approval gate and publish.
- B38 должен быть workflow-specific smoke/runbook, а не повтор общего deployment runbook из B28.

## Главные решения

1. Редактирование через бота должно быть stateful: у сессии есть текущий `ProjectSchema`, revision history, media context, last preview artifact и publish target.
2. Любой пользовательский текст или voice message в review state считается edit instruction, а не новым render workflow.
3. Голосовые правки сначала нормализуются в текст через transcription service, дальше идут по тому же AI edit path.
4. Preview/result отправляется в review chat, но posting в канал/соцсеть происходит только после explicit approval.
5. Publish path должен быть Rust-first. TypeScript bot layer может иметь thin adapter, но не должен становиться вторым полноценным social posting implementation рядом с `crates/ts-publish`.

## Что уже есть

- Telegram worker принимает updates, polling batches и persistent polling loop.
- Conversation draft state умеет накапливать media/hints до `/render`.
- Media resolver скачивает Telegram `file_id` и remote URLs.
- Render job runner умеет выдавать events, snapshots, cancellation и retry source context.
- Rust render adapter подключается через `--rust-render`.
- `crates/ts-publish` и `timeline publish telegram|youtube` уже покрывают реальные publish paths.
- Node AI adapter содержит Whisper/OpenAI/local transcription primitives.

## Основные gaps

- Telegram payload не поддерживает `voice` и `video_note`.
- Нет edit session state после первого render.
- Нет AI editor contract для `ProjectSchema + instruction -> ProjectSchema`.
- Нет review loop и команды `/approve`.
- Destination сейчас может запустить publish сразу после render, без review gate.
- TypeScript `NodePublishService` дублирует Telegram publish вместо делегирования в Rust publish path.

## Target Workflow

```text
1. User sends videos/photos/audio/documents/URLs and optional goal.
2. Bot stores/updates edit session media intake.
3. User sends /render or configured auto-start trigger.
4. AI generates first ProjectSchema from media and goal.
5. Rust render produces preview/result.
6. Bot sends video to the same chat with revision id and actions.
7. User sends text or voice feedback.
8. Bot transcribes voice if needed.
9. AI editor applies feedback to current ProjectSchema.
10. Rust render produces next preview/result.
11. Steps 6-10 repeat until user sends /approve.
12. Bot publishes approved artifact through Rust publish path.
```

## Workflow-specific smoke/runbook

Этот раздел дополняет B28 production runbook. Он не описывает Docker, systemd, webhook vs polling topology, общие env templates, sandbox bot checklist и generic cleanup jobs.

### Local mocked smoke

Проверка workflow без Telegram сети, реального AI, реального render и реального publish:

```bash
npx vitest run src/adapters/node/__tests__/telegram-ai-review-workflow-smoke.test.ts
```

Smoke использует committed Telegram update fixtures:

- `docs/08_tasks/planned/fixtures/telegram-ai-review-media-upload-update.json`
- `docs/08_tasks/planned/fixtures/telegram-ai-review-text-feedback-update.json`
- `docs/08_tasks/planned/fixtures/telegram-ai-review-voice-feedback-update.json`
- `docs/08_tasks/planned/fixtures/telegram-ai-review-video-note-feedback-update.json`
- `docs/08_tasks/planned/fixtures/telegram-ai-review-approve-update.json`

Покрываемый путь:

```text
media upload fixture
  -> TelegramLikeBotPayload
  -> BotWorkflowRequest
  -> first-cut revision 0
  -> file-backed edit session
  -> text feedback revision 1
  -> worker restart with same session store
  -> voice feedback transcription revision 2
  -> /approve
  -> publish through IPublishService
```

### Polling-mode wiring

Runtime должен использовать B28 deployment foundation для token/offset/job-store/logs. AI review слой добавляет только workflow-specific dependencies:

- edit session store: `NodeBotEditSessionFileStore` через `initNodeApp({ botEditSessions: { directory } })`;
- media resolver: `NodeBotMediaResolver` with Telegram Bot API token and B28 media retention settings;
- first cut: `DefaultBotFirstCutGenerator` with `NodeRustFirstCutPlanner` when `timeline montage-plan` / `timeline llm-plan` is configured;
- feedback transcription: `NodeBotFeedbackTranscriber` backed by OpenAI Whisper or local transcription;
- AI project edit: `IAIProjectEditor` implementation, mock in smoke, Node/OpenAI-compatible production adapter behind the same port short-term, and Rust `timeline llm-plan` extension as the Rust-first planner/editor strategy;
- AI edit repair: `--ai-editor-repair-attempts` / `TIMELINE_BOT_AI_EDITOR_REPAIR_ATTEMPTS`, default `1`, bounds invalid editor output repair before a revision is accepted; set `0` to disable repair.
- preview delivery: `NodeBotStatusNotifier.sendVideo` for Telegram review previews, fallback message keeps local artifact path;
- final publish: `NodeRustPublishService` (`timeline publish telegram|youtube --json`) as production path, `NodePublishService` only as simple fallback/test adapter.
- capabilities: real configured destinations are `file`, `telegram`, `youtube`; `tiktok` and `vimeo` stay visible as unsupported until Rust publish support exists.

### Runtime observability

AI review runtime stores machine-readable diagnostics in edit session metadata and revision metadata. The operator entry points are the session store JSON plus `/status` and `/versions` in the review chat.

Revision metadata includes:

- `metadata.editor`: redacted AI editor metadata, including `provider`, `model`, `promptId`, finish reason, token usage and repair attempt when available;
- `metadata.observability.aiEditor`: the same redacted editor identity for status/version output;
- `metadata.observability.attempts`: validation/repair attempt count for the accepted revision;
- `metadata.observability.diagnostics`: structured AI diagnostics with `level`, `code`, `message` and `path`;
- `metadata.observability.renderPreview`: `renderJobId`, optional `providerJobId`, render status, artifact path/URL and MIME type;
- `metadata.observability.previewDelivery`: Telegram preview delivery status, sent message id or fallback/error detail.

Session metadata includes:

- `metadata.observability.lastError`: failed stage (`ai_edit_validation` or `ai_edit_exception`), update id, source message id and validation errors;
- `metadata.observability.lastPublish`: destination, publish status, provider id, URL/error and artifact path/URL.

`/status` shows session status, latest revisions, publish result and failure reason. `/versions` lists revision ids with editor provider/model, prompt id, attempt count, render job id and artifact reference. Sensitive fields such as API keys, tokens, authorization headers, secrets and credentials are redacted before metadata is stored or rendered into responses.

Operational checks:

```bash
bun run test:bot-ai
bun run smoke:ai-review:rust
```

The repeatable sandbox operator checklist lives in [Telegram AI Review Sandbox Smoke](../../06_deployment/telegram-ai-review-sandbox-smoke.md). The production state, restart, cleanup and publish boundary lives in [Bot-First Production Contract](../../engineering/bot-first-production-contract.md).

For production polling, keep model/provider and secret config at process/env/service-manager boundaries. Do not put raw provider credentials into edit session store metadata or issue/test output. Generic log retention, deployment topology and cleanup policies remain owned by B28/#225.

### Failure recovery checks

- Worker restart: smoke reloads the active session from `NodeBotEditSessionFileStore`.
- Stale render jobs: B28/B20 job store recovery remains the owner of queued/running render job recovery.
- Invalid AI output: `runAIProjectEdit` validation/repair tests cover invalid editor output before a revision is accepted.
- Transcription failure: worker returns a failed edit session/result when voice feedback cannot be transcribed.
- Preview delivery failure: B37 tests verify failed Telegram `sendVideo` preserves artifact path and sends fallback text.
- Publish failure: approval path records failed publish result on the edit session and leaves the approved revision id intact.

Retry guidance:

- Failed AI validation/exception: inspect `metadata.observability.lastError`, keep the last valid revision, then send a corrected text/voice instruction after restoring the session to `preview_ready` if the operator decides to continue the review.
- Failed preview render: use `metadata.observability.renderPreview.renderJobId` and the Rust render command/status output to diagnose. The last accepted revision remains in history; rerun render from its `projectSchema` rather than applying a new edit.
- Failed Telegram preview delivery: use `metadata.observability.previewDelivery.artifactPath` and resend manually or let the fallback message provide the local artifact path.
- Failed publish after approval: keep `approvedRevisionId` unchanged, inspect `publishResult` and `metadata.observability.lastPublish`, fix destination credentials/capability, then retry publish for the approved revision artifact.

## PR slices

### B29: Telegram AI edit session state

**Цель:** отделить обычный render workflow от долгоживущей edit/review session.

- [x] Добавить core типы `BotEditSession`, `BotEditRevision`, `BotEditSessionStatus`.
- [x] Статусы: `collecting`, `generating`, `preview_ready`, `editing`, `approved`, `publishing`, `done`, `cancelled`, `failed`.
- [x] Хранить `chatId`, `userId`, source media, normalized goal, current `ProjectSchema`, current artifact, publish target, revision history.
- [x] Добавить `IBotEditSessionStore` port.
- [x] Добавить Node file-backed store для polling worker restarts.
- [x] Согласовать store strategy с B28 decision: this epic uses file-backed edit sessions for polling restarts; durable queue/backend handoff remains B28-owned.
- [x] Покрыть merge/load/save/list/current-session unit tests.

### B30: Telegram voice and video-note feedback intake

**Цель:** пользователь может отправлять правки голосом так же, как текстом.

- [x] Расширить Telegram update types: `voice`, `video_note`.
- [x] Конвертировать `voice`/`video_note` в `TelegramLikeBotFile` и media metadata.
- [x] Скачать voice media через existing `NodeBotMediaResolver`.
- [x] Применять B28 media retention, cleanup, size and URL guardrails к voice/video-note downloads: feedback transcriber uses the shared media resolver boundary; B28 owns the concrete retention/cleanup policy.
- [x] Добавить `IBotFeedbackTranscriber` boundary.
- [x] Подключить Node transcriber через existing `NodeAIService.whisperTranscribeOpenAI` / `whisperTranscribeLocal`.
- [x] Возвращать normalized feedback text в worker result/session event.
- [x] Покрыть update conversion, resolver integration и transcription failure behavior.

### B31: AI project editor contract

**Цель:** правки применяются к текущему проекту через AI, а не через новый blind render.

- [x] Добавить port `IAIProjectEditor`.
- [x] Input: current `ProjectSchema`, source media context, revision history summary, user instruction, target platform.
- [x] Output: next `ProjectSchema`, summary for user, changed areas, diagnostics.
- [x] Добавить schema validation before/after edit.
- [x] Добавить repair/retry policy для invalid AI output.
- [x] Добавить mock editor для deterministic tests.
- [x] Подготовить adapter strategy: Rust `timeline llm-plan` extension или Node/OpenAI-compatible adapter.

### B32: First cut generation via AI/Rust planner

**Цель:** первый результат должен быть AI-generated edit, а не deterministic 5-second clip assembly.

- [x] Добавить first-cut generator port поверх `timeline montage-plan` / `timeline llm-plan`.
- [x] Поддержать goal/platform/duration/style из Telegram text hints.
- [x] Передавать resolved local media paths в Rust planner.
- [x] Сохранять generated `ProjectSchema` как revision `0`.
- [x] Оставить deterministic assembler только как fallback/test path.
- [x] Покрыть happy path, invalid planner output и fallback behavior.

### B33: Review loop command routing

**Цель:** после preview bot понимает review commands and plain feedback.

- [x] Добавить команды `/approve`, `/revise`, `/versions`, `/discard`, `/cancel`.
- [x] В `preview_ready` plain text/voice запускает edit revision.
- [x] В `collecting` plain text/media продолжает intake, как текущий draft mode.
- [x] `/status` показывает active edit session и последние revisions.
- [x] `/cancel` отменяет session, queued edit/render job and running render where possible.
- [x] Покрыть state transitions and command routing tests.

### B34: Approval-gated render and publishing

**Цель:** публикация не происходит до явного approval.

- [x] Разделить `previewDestination` and `publishDestination`.
- [x] Preview отправлять в исходный Telegram chat независимо от final publish target.
- [x] Final publish запускать только после `/approve`.
- [x] Если publish target не задан, после approval оставить artifact as downloadable/sent result.
- [x] Добавить clear user messages for "preview ready", "approved", "publishing", "published".
- [x] Покрыть no-auto-publish and approve-to-publish tests.

### B35: Rust-first publish adapter for bot path

**Цель:** убрать полноценную bot posting реализацию из TypeScript и делегировать в Rust.

- [x] Добавить `RustPublishService` implementing `IPublishService`.
- [x] Вызывать `timeline publish telegram|youtube` из Node adapter.
- [x] Расширить Rust CLI publish commands machine-readable JSON output.
- [x] Маппить Rust publish JSON в `BotPublishResult`.
- [x] Оставить current `NodePublishService` как test/simple fallback или deprecated adapter.
- [x] Обновить bot-worker wiring: production default uses Rust publish when command is configured.
- [x] Покрыть Telegram/YouTube validate-only and publish adapter contract tests.

### B36: Destination capability validation

**Цель:** bot не принимает destinations, которые не может реально выполнить.

- [x] Добавить capability registry для `file`, `telegram`, `youtube`, `tiktok`, `vimeo`.
- [x] Валидировать destination на intake/session approval stage.
- [x] Сообщать пользователю, какие destinations доступны в текущей конфигурации.
- [x] Для unsupported destinations возвращать validation error до render/publish.
- [x] Синхронизировать README/runbook с реальными capabilities.
- [x] Покрыть configured/unconfigured capability tests.

### B37: Revision artifacts and preview delivery

**Цель:** bot reliably sends each revision result back for review.

- [x] Store artifact metadata per revision.
- [x] Add best-effort Telegram video delivery for preview revisions.
- [x] Preserve local artifact path if Telegram delivery fails.
- [x] Include revision id in status/result messages.
- [x] Применять B28 cleanup/retention boundary к preview artifacts and fallback links: this epic records artifact refs/paths, B28 owns deletion policy/jobs.
- [x] Support `/versions` response with latest revision list and artifact refs.
- [x] Cover delivery success/failure and history formatting tests.

### B38: AI review workflow runbook and end-to-end smoke

**Цель:** новый workflow можно проверить локально и запустить в polling mode.

- [x] Добавить Telegram update fixtures: media upload, voice feedback, text feedback, approve.
- [x] Добавить one-shot smoke for session creation.
- [x] Добавить mocked AI editor smoke for two revisions and approval.
- [x] Добавить workflow-specific runbook section поверх B28 deployment foundation: session store, AI services, Rust render, Rust publish.
- [x] Добавить failure recovery cases: worker restart, stale edit job, invalid AI output, publish failure.
- [x] Не дублировать B28 deployment topology, env template, Docker/systemd setup and generic sandbox bot checklist.
- [x] Обновить `docs/10_project_state/roadmap.md` после начала реализации.

## Acceptance Criteria

- Пользователь может создать ролик через Telegram без desktop UI.
- Пользователь может прислать минимум одну текстовую и одну голосовую правку.
- Каждая правка создает новую revision and preview artifact.
- Публикация не происходит до `/approve`.
- Final publish идет через Rust publish path.
- Worker restart не теряет active session или last revision.
- Unsupported publish destinations fail before rendering.
- Unit tests cover intake, session state, AI editor contract, review loop and Rust publish adapter.

## Не входит в этот эпик

- Telegram Mini App UI.
- Полноценный OAuth UI для всех соцсетей.
- Ручное редактирование timeline через desktop UI.
- Реализация TikTok/Vimeo publish в Rust, если ее нет в `ts-publish`.
- Multi-user collaborative review in one session.

## Связанные документы

- [Bot-first workflow](./bot-first-workflow.md)
- [Easy Mode AI Editor](./easy-mode-ai-editor.md)
- [Montage Planner Integration](./montage-planner-integration-concept.md)
- [Export Feature Architecture Refactoring](./export-architecture-refactoring.md)
- [Social Auth Integration](./social-auth-integration.md)
