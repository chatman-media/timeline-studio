# AI Module Stabilization and Node/Rust Orchestration

**Статус:** Active
**Приоритет:** High
**Создано:** 2026-06-09
**GitHub epic:** [#238](https://github.com/chatman-media/timeline-studio/issues/238)
**Связано:** [Telegram AI Review Editing Workflow](./telegram-ai-review-workflow.md), [Bot-first workflow](./bot-first-workflow.md), [Montage Planner Refactoring](./montage-planner-refactoring.md)

## Контекст

Telegram AI review workflow уже добавил продуктовый контракт: upload media, first preview, текстовые/голосовые правки, AI revision loop, explicit approval and publish.

Следующая проблема не в UX-сценарии, а в production runtime:

- текущий bot-worker CLI не прокидывает все AI review зависимости;
- production `IAIProjectEditor` еще не реализован;
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

### Production gaps

- `src/cli/commands/bot-worker.ts` creates `NodeTelegramBotWorker` without `editSessionStore`, `aiProjectEditor`, `feedbackTranscriber`, `previewRenderer` and `botFirstCutGenerator`.
- `src/adapters/node/ai.ts` is mostly media/transcription and analysis stubs. It does not implement project editing or chat-completions for `IAIProjectEditor`.
- Only `MockAIProjectEditor` implements `IAIProjectEditor`; it is deterministic test scaffolding, not production AI editing.
- `DefaultBotFirstCutGenerator` validates planner output with `validateProjectSchemaShape`; invalid Rust planner output silently falls back to deterministic clip assembly unless fallback is disabled.
- `crates/ts-montage/src/headless.rs` emits simplified JSON with `id`, `name`, `timeline`, `tracks`, `settings`, `meta`; it does not emit required TS contract fields such as `version`, `metadata`, `effects`, `filters`, `templates`, `style_templates`, `subtitles`.
- `crates/ts-agent/src/llm_planner.rs` prompt asks for a simplified schema with camelCase clip fields; it also omits required TS `ProjectSchema` fields.
- Rust `llm-plan` is currently a first-cut planner only. It is not an edit command that accepts `currentProject + instruction + revisionHistory -> nextProject`.
- Legacy AI docs and modules claim a broader ready state than the actual headless bot path supports.

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

Short term:

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

- [ ] Add OpenAI-compatible `IAIProjectEditor` adapter.
- [ ] Make model/base URL/API key configurable through CLI/env.
- [ ] Return `AIProjectEditorResult` only; no free-form text as persisted state.
- [ ] Add focused tests for valid edit, provider error and missing key.

### B42: Harden AI output schema validation, repair and fallbacks

**GitHub:** [#242](https://github.com/chatman-media/timeline-studio/issues/242)

- [ ] Align Rust `montage-plan` output with TS `ProjectSchema` or add a typed wrapper converter.
- [ ] Align Rust `llm-plan` prompt/output with TS `ProjectSchema`.
- [ ] Add explicit diagnostics when first-cut falls back to deterministic assembly.
- [ ] Add fixtures for planner valid/invalid output.

### B43: Wire Telegram bot-worker runtime to real AI review services

**GitHub:** [#243](https://github.com/chatman-media/timeline-studio/issues/243)

- [ ] Add CLI/env flags for edit session store, feedback transcriber, first-cut planner/generator and AI editor.
- [ ] Pass those services into `NodeTelegramBotWorker`.
- [ ] Add preview renderer backed by Rust render.
- [ ] Add one-shot worker smoke that uses production wiring with mocked external commands.

### B44: Add Rust preview render and publish validate smoke for AI review

**GitHub:** [#244](https://github.com/chatman-media/timeline-studio/issues/244)

- [x] Add minimal fixture path through `timeline render` or `timeline-render`.
- [x] Add `timeline publish telegram --validate-only --json` smoke.
- [x] Keep smoke small enough for CI and local debugging.

### B45: Split and stabilize CI for headless bot/AI workflow

**GitHub:** [#245](https://github.com/chatman-media/timeline-studio/issues/245)

- [ ] Add dedicated bot/AI test command or CI job.
- [ ] Keep full frontend suite failures from blocking visibility into headless bot regressions.
- [ ] Track current unrelated failures: timeline hook mock drift, Vitest worker memory, Windows Biome install.

### B46: AI review runtime observability and runbook

**GitHub:** [#246](https://github.com/chatman-media/timeline-studio/issues/246)

- [ ] Document production env variables and safe defaults.
- [ ] Add structured logs for session id, revision id, planner/editor provider and Rust command status.
- [ ] Add runbook for retrying failed preview/publish without losing approved revision.

## Acceptance Criteria

- Telegram bot can run the full AI review loop from CLI without test-only mocks.
- First-cut planner output either validates as `ProjectSchema` or fails/falls back with clear diagnostics.
- Text and voice revisions use the same `IAIProjectEditor` path.
- Preview render and final publish go through Rust-backed adapters in production mode.
- TypeScript publish/render remains a thin adapter/fallback, not the main production path.
- CI has a dedicated smoke that catches bot/AI workflow regressions quickly.
