# AI Module Stabilization and Node/Rust Orchestration

**Статус:** Completed
**Приоритет:** High
**Создано:** 2026-06-09
**Завершено:** 2026-06-10
**GitHub epic:** [#238](https://github.com/chatman-media/timeline-studio/issues/238)
**Связано:** [Telegram AI Review Editing Workflow](./telegram-ai-review-workflow.md), [Bot-first workflow](./bot-first-workflow.md), [Montage Planner Refactoring](./montage-planner-refactoring.md)

## Контекст

Telegram AI review workflow уже добавил продуктовый контракт: upload media, first preview, текстовые/голосовые правки, AI revision loop, explicit approval and publish.

Этот эпик закрывает не UX-сценарий, а production runtime:

- bot-worker CLI должен прокидывать AI review зависимости через явные CLI/env boundaries;
- production `IAIProjectEditor` должен валидировать structured output до записи revision;
- Rust `montage-plan`/`llm-plan` output не совпадает с TS `ProjectSchema` validation shape;
- AI codebase split между `src/adapters/node`, `src/domains/ai-services`, `src/features/ai-director`, `src/features/montage-planner`, `crates/ts-agent` and `crates/ts-montage`;
- publish/render уже есть в Rust, поэтому TypeScript не должен становиться вторым полноценным production backend для этих операций.

## Audit Snapshot

### Готово и можно использовать

- `NodeTelegramBotWorker` уже умеет review-loop state machine: `/approve`, `/revise`, `/versions`, `/discard`, `/cancel`, plain text feedback, voice/video-note feedback, publish after approval.
- `NodeTelegramBotWorkerOptions` уже содержит extension points: `editSessionStore`, `aiProjectEditor`, `feedbackTranscriber`, `previewRenderer`, `publishService`.
- `runAIProjectEdit` валидирует request/result, поддерживает `repairProjectEdit`, и не принимает revision без valid `ProjectSchema`.
- `NodeBotFeedbackTranscriber` уже делегирует voice transcription в `NodeAIService` через OpenAI Whisper/local Whisper/faster-whisper boundary.
- `NodeRustFirstCutPlanner` уже вызывает Rust `timeline montage-plan` или `timeline llm-plan`.
- `NodeRustRenderVideoService` already delegates rendering to `timeline render` or `timeline-render`.
- `NodeRustPublishService` already delegates Telegram/YouTube publish to `timeline publish ... --json`.
- `initNodeApp` умеет создать `botEditSessions`, `botFeedbackTranscriber`, `botFirstCutPlanner`, `botFirstCutGenerator`, `botStatus`, Rust render and Rust publish services.
- `bot-worker` CLI прокидывает edit session store, transcriber provider/model/language, Rust first-cut planner/generator fallback, AI editor, Rust preview render and Rust publish config через CLI/env.

### Follow-ups Outside This Epic

- Rust planner/editor parity still needs continued care when the Rust side changes its `ProjectSchema` emission.
- Rust `llm-plan` is currently a first-cut planner only. It is not an edit command that accepts `currentProject + instruction + revisionHistory -> nextProject`.
- Generic production topology, deployment assets, retention, cleanup jobs and sandbox operator checklist remain owned by B28/#225.

## Node/Rust Ownership Decision

### Rust owns deterministic media operations

Rust is the production owner for operations where we need deterministic, inspectable, CLI-friendly behavior:

- media analysis and montage scoring;
- `ProjectSchema` schema emission/examples and validation fixtures;
- first-cut planning when using `timeline montage-plan` or `timeline llm-plan`;
- render/preview generation;
- optimize/transcode;
- publish to Telegram/YouTube and future social providers;
- machine-readable JSON CLI output.

TypeScript may wrap these commands, but should not duplicate production render/publish implementations.

### Node owns orchestration and provider glue

Node is the production owner for chat/bot orchestration:

- Telegram polling/webhook worker;
- access policy, job store, offset store and edit session store;
- routing between collecting, preview, editing, approval and publishing states;
- media resolving/downloading before Rust CLI calls;
- provider configuration for transcription and short-term AI editor adapters;
- retry, user-facing status, diagnostics and runbook surfaces;
- thin adapters over Rust commands.

### AI project editing strategy

Completed short term:

- implement a Node OpenAI-compatible `IAIProjectEditor` adapter;
- force structured JSON output matching `AIProjectEditorResult`;
- validate with `runAIProjectEdit`;
- use repair attempts for malformed output;
- never persist a revision until validation passes.

Medium term:

- extend Rust `timeline llm-plan` into an edit-capable command, for example `timeline llm-edit --current-project <json> --instruction <text> --output <json>`;
- keep the Node adapter as the orchestration wrapper and fallback provider glue;
- keep the canonical output contract as TS/Rust `ProjectSchema`, not a model-specific schema.

## Runtime Wiring Target

`bot-worker` production mode should create the worker roughly as follows:

```text
initNodeApp({
  ai: { openaiApiKey },
  botMediaResolver: { telegram token, download dir },
  botEditSessions: { directory },
  botFeedbackTranscriber: { provider, model, language },
  botFirstCutPlanner: { command, plannerKind, apiKey, apiUrl, model },
  botFirstCutGenerator: { fallbackToDeterministic },
  rustRender: { command, commandKind },
  rustPublish: { command, telegram/youtube credentials },
  botStatus: { telegram token/default chat }
})

new NodeTelegramBotWorker({
  workflow: services.botWorkflow,
  editSessionStore: services.botEditSessions,
  feedbackTranscriber: services.botFeedbackTranscriber,
  aiProjectEditor: productionEditor,
  previewRenderer: rustPreviewRenderer,
  publishService: services.publish,
  reviewResponder: services.botStatus,
  previewResponder: services.botStatus,
  ...
})
```

## Failure Modes To Track

- Planner returns simplified JSON: fail validation, repair/wrap it, or intentionally fall back with an explicit diagnostic.
- AI editor returns malformed JSON or unsupported edit commands: reject revision and ask for a retry/repair.
- Voice feedback transcription fails: keep current revision intact and send a failed review action.
- Preview render fails: keep session in failed state with the last valid revision available.
- Telegram `sendVideo` fails: keep local artifact path and send fallback text.
- Publish fails after approval: keep `approvedRevisionId`, record failed publish result, allow retry.
- Bot worker restarts: file-backed edit session and job store must recover active state.
- CI instability hides real regressions: bot/AI tests need a small dedicated smoke path separate from the large frontend suite.

## AI Review Observability Contract

Operators should not need raw logs only to diagnose a review loop failure. The bot path persists redacted structured metadata at the same boundary where state recovery happens:

- revision metadata records AI `provider`, `model`, `promptId`, validation/repair attempts, command types, structured diagnostics and changed areas;
- revision observability records preview `renderJobId`, optional Rust/provider job id, artifact path/URL and Telegram preview delivery status;
- session observability records the latest failed AI edit stage and validation errors;
- session observability records final publish destination/status/provider id/URL/error without storing credentials.

The review chat exposes the same high-signal fields through `/status` and `/versions`: revision id, provider/model, prompt id, attempts, render job id, artifact reference, publish status and failure reason. API keys, tokens, authorization headers, secrets, passwords and credentials are redacted before they are stored or rendered.

Workflow-specific runbook details live in [Telegram AI Review Editing Workflow](./telegram-ai-review-workflow.md). Generic deployment topology, log retention and cleanup policies stay linked to B28/#225.

## PR Slices

### B39: Audit current AI module and broken headless flows

**GitHub:** [#239](https://github.com/chatman-media/timeline-studio/issues/239)

- [x] Inventory AI services, adapters, prompts and headless CLI surfaces.
- [x] Identify which Telegram review pieces are contracts/mocks vs production runtime.
- [x] Identify schema drift between Rust planner outputs and TS `ProjectSchema` validation.
- [x] Record CI/test gaps that can hide bot/AI regressions.

### B40: Define Node/Rust ownership for headless AI orchestration

**GitHub:** [#240](https://github.com/chatman-media/timeline-studio/issues/240)

- [x] Define Rust ownership for render, publish, analyze, optimize and planner CLI.
- [x] Define Node ownership for Telegram/session/orchestration/provider glue.
- [x] Define short-term Node AI editor and medium-term Rust `llm-edit` strategy.
- [x] Document that TypeScript publish remains fallback/test-only when Rust publish is configured.

### B41: Implement production AI project editor adapter

**GitHub:** [#241](https://github.com/chatman-media/timeline-studio/issues/241)

- [x] Add OpenAI-compatible `IAIProjectEditor` adapter.
- [x] Make model/base URL/API key configurable through CLI/env.
- [x] Return `AIProjectEditorResult` only; no free-form text as persisted state.
- [x] Add focused tests for valid edit, provider error and missing key.

### B42: Harden AI output schema validation, repair and fallbacks

**GitHub:** [#242](https://github.com/chatman-media/timeline-studio/issues/242)

- [x] Align Rust `montage-plan` output with TS `ProjectSchema` or add a typed wrapper converter.
- [x] Align Rust `llm-plan` prompt/output with TS `ProjectSchema`.
- [x] Add explicit diagnostics when first-cut falls back to deterministic assembly.
- [x] Enable bounded AI editor repair attempts in the Telegram review runtime with CLI/env configuration.
- [x] Add AI editor fixture tests for promo creation, shorten intro, title/captions, platform adaptation, and invalid provider output.
- [x] Add fixtures for planner valid/invalid output.

### B43: Wire Telegram bot-worker runtime to real AI review services

**GitHub:** [#243](https://github.com/chatman-media/timeline-studio/issues/243)

- [x] Add CLI/env flags for edit session store, feedback transcriber, first-cut planner/generator and AI editor.
- [x] Pass those services into `NodeTelegramBotWorker`.
- [x] Add preview renderer backed by Rust render.
- [x] Add one-shot worker smoke that uses production wiring with mocked external commands.

### B44: Add Rust preview render and publish validate smoke for AI review

**GitHub:** [#244](https://github.com/chatman-media/timeline-studio/issues/244)

- [x] Add minimal fixture path through `timeline render` or `timeline-render`.
- [x] Add `timeline publish telegram --validate-only --json` smoke.
- [x] Keep smoke small enough for CI and local debugging.

### B45: Split and stabilize CI for headless bot/AI workflow

**GitHub:** [#245](https://github.com/chatman-media/timeline-studio/issues/245)

- [x] Add dedicated bot/AI test command or CI job.
- [x] Keep full frontend suite failures from blocking visibility into headless bot regressions.
- [x] Track current unrelated failures: timeline hook mock drift, Vitest worker memory, Windows Biome install.

### B46: AI review runtime observability and runbook

**GitHub:** [#246](https://github.com/chatman-media/timeline-studio/issues/246)

- [x] Document production config boundaries and safe defaults in the workflow-specific runbook.
- [x] Add structured session/revision diagnostics for prompt id, provider/model, validation errors, repair attempts, render job id, artifact path and publish result.
- [x] Add runbook guidance for retrying failed AI edit, preview delivery/render and publish without losing the approved revision.

## Acceptance Criteria

- [x] Telegram bot can run the full AI review loop from CLI without test-only mocks.
- [x] First-cut planner output either validates as `ProjectSchema` or fails/falls back with clear diagnostics.
- [x] Text and voice revisions use the same `IAIProjectEditor` path.
- [x] Preview render and final publish go through Rust-backed adapters in production mode.
- [x] TypeScript publish/render remains a thin adapter/fallback, not the main production path.
- [x] CI has a dedicated smoke that catches bot/AI workflow regressions quickly.

## Closeout

B39-B46 are complete and the Telegram AI review runtime now has a production Node/Rust boundary: Node owns Telegram orchestration, sessions, provider glue and validation; Rust owns first-cut planning, preview rendering and final publishing through CLI adapters.

Remaining production-readiness work intentionally stays in [B28/#225](https://github.com/chatman-media/timeline-studio/issues/225): deployment topology, operator runbooks, retention/cleanup policy and sandbox checklist.
