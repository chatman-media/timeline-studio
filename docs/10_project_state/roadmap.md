# Roadmap Timeline Studio

*Последнее обновление: 11 июня 2026*

## Видение

Timeline Studio развивается в видеоредактор, которым можно пользоваться через desktop GUI, CLI и bot-first/headless workflows. Целевой поток: пользователь или внешний сервис передает медиа и цель, Timeline Studio строит `ProjectSchema`, рендерит, оптимизирует, возвращает preview, принимает правки и публикует только после явного approval.

Ключевая архитектурная ставка: один типизированный контракт между GUI, Rust CLI, Node bot worker, AI orchestration and external consumers.

## Завершено

### Rust modularization

Закрыт epic [#91](https://github.com/chatman-media/timeline-studio/issues/91).

Готово:

- Cargo workspace для `crates/*`.
- `ts-schema` and `ts-core-types` foundation layer.
- `ts-render` and headless render path.
- Domain crates: `ts-media`, `ts-recognition`, `ts-analysis`, `ts-montage`, `ts-subtitles`.
- `ts-state` without Tauri dependency.
- `ts-agent` and headless video tools.
- Slim Tauri host over workspace crates.
- Heavy dependencies isolated from the common headless path.

### Agentic headless pipeline

Закрыт epic [#119](https://github.com/chatman-media/timeline-studio/issues/119).

Готово:

- Rust `timeline` CLI.
- `render`, `ingest`, `analyze`, `montage-plan`, `optimize`, `thumbnail`.
- `publish telegram` and `publish youtube`.
- `pipeline` for the basic produce-to-publish flow.
- LLM planner through OpenAI-compatible BYOK endpoint.

### Contracts

Закрыт epic [#120](https://github.com/chatman-media/timeline-studio/issues/120).

Готово:

- `ProjectSchema` JSON Schema.
- `AnalysisResult`, `OptimizeRequest/Result`, `PublishRequest/Result`.
- `@timeline/shared-types`.
- [Agent Contract Reference](../engineering/AGENT_CONTRACT_REFERENCE.md).

### Bot-first workflow

Закрыт epic [#171](https://github.com/chatman-media/timeline-studio/issues/171).

Готово:

- `render-job`, `bot-workflow`, `bot-worker` CLI paths.
- Telegram-like intake, media resolver, draft state, async queue, retry/cancel/status commands.
- Bot workflow job store and polling offset store.
- Rust render/publish adapters for bot-first paths.
- Backpressure, acknowledgements and update-level error isolation.

### Telegram AI review workflow

Закрыт epic [#226](https://github.com/chatman-media/timeline-studio/issues/226).

Готово:

- Upload -> first preview -> text/voice/video-note revisions -> approval -> publish.
- File-backed edit sessions and revision history.
- AI project editor contract with validation/repair boundary.
- First-cut generator via Rust planner with deterministic fallback.
- Review commands: `/approve`, `/revise`, `/versions`, `/discard`, `/cancel`.
- Per-revision preview artifact metadata and Telegram preview delivery.

### AI module stabilization and Node/Rust orchestration

Закрыт epic [#238](https://github.com/chatman-media/timeline-studio/issues/238).

Готово:

- Node owns Telegram orchestration, sessions, provider glue and validation.
- Rust owns first-cut planning, preview rendering and final publishing through CLI adapters.
- `bot-worker` production mode wires real AI review services, not only mocked unit smoke.
- Dedicated bot/AI headless CI protects review-loop regressions.

### Phase F: TypeScript workspaces

Закрыт epic [#150](https://github.com/chatman-media/timeline-studio/issues/150).

Готово:

- `packages/core`, `packages/domains`, `packages/adapters`, `packages/ui`, `packages/shared-types`.
- `apps/desktop` and `apps/cli`.
- Zero package-boundary baseline.
- `check:boundaries:strict` in CI.
- Workspace-local test setup helpers.

### Phase G: External/headless contract hardening

Закрыт epic [#282](https://github.com/chatman-media/timeline-studio/issues/282).

Готово:

- Supported external entrypoints documented: `ProjectSchema`, Rust `timeline`, `render-job`, `bot-workflow`, `bot-worker`, `bot-cleanup`.
- `postim`/headless guidance: use bot-first/headless layer, not `src-tauri`, root aliases or package-private paths.
- Root compatibility shims documented with owners and removal criteria.
- External contract examples guarded by `bun run check:boundaries:external`.
- Telegram AI review sandbox smoke documented and expanded to text, voice and video-note feedback.
- Bot-first production contract documents state, restart, retry, cleanup and Rust publish boundary.

## Сейчас

There is no open GitHub Project backlog left for the completed bot/headless migration track. The immediate project need is not another broad refactor; it is a new production/external rollout roadmap.

Current baseline:

- `main` is green after PR [#290](https://github.com/chatman-media/timeline-studio/pull/290).
- Issues [#282](https://github.com/chatman-media/timeline-studio/issues/282)-[#289](https://github.com/chatman-media/timeline-studio/issues/289) are closed and `Done`.
- Supported headless boundaries are now documented and enforced for docs examples.

## Далее: Phase H proposal

Recommended next epic: **Phase H - Bot-first production rollout and external integration readiness**.

This phase should be hardening for real consumers, not another extraction phase. It should keep the official entrypoints stable and prove they are usable outside the desktop app.

### H1: Real Telegram AI review sandbox

Goal: run the documented Telegram AI review loop against a real sandbox bot/channel with redacted logs and repeatable operator steps.

Acceptance:

- Real media upload produces first preview.
- Text, voice and video-note revisions produce validated previews.
- Approval gates publish.
- Failure/retry path is documented with safe recovery.

### H2: `postim`/headless integration example

Goal: give external consumers a concrete integration path without importing internals.

Acceptance:

- Example uses only `ProjectSchema`, `render-job`, `bot-workflow`, `bot-worker`, `bot-cleanup` or Rust `timeline`.
- No root aliases, `src-tauri`, `packages/*/src`, or desktop-only paths.
- Example is covered by `check:boundaries:external`.

### H3: Root shim retirement execution

Goal: turn the shim inventory into migration slices.

Acceptance:

- Each root compatibility path has an owner, package replacement and removal condition.
- Migration docs show old import -> supported import mapping.
- No external/headless docs recommend root shims.

### H4: Rust/Node AI edit parity plan

Goal: define the path from Node-only `IAIProjectEditor` to Rust-backed `llm-edit` without blocking current production bot usage.

Acceptance:

- `llm-edit` input/output contract is documented.
- Current Node AI editor remains supported orchestration glue.
- `ProjectSchema` stays canonical.

### H5: Publish destination support matrix

Goal: make publish behavior explicit across Telegram, YouTube and future destinations.

Acceptance:

- Matrix documents render support, validate-only support, credential requirements and failure modes.
- Unsupported destinations fail before render/publish with actionable diagnostics.
- TypeScript does not become a second production publish backend for Rust-supported destinations.

### H6: Operator observability

Goal: make bot-worker production failures debuggable without reading raw logs only.

Acceptance:

- Session/revision/publish diagnostics are persisted with redaction.
- `/status` and `/versions` expose high-signal fields.
- Preview render and publish failures retain enough metadata for retry.

### H7: Docs and SDK examples

Goal: make the supported contract copy-pasteable for integrators.

Acceptance:

- Minimal `ProjectSchema` example.
- `render-job` JSON example.
- `bot-workflow` Telegram-like fixture example.
- `bot-worker` production/sandbox config example.
- Docs examples pass boundary guardrails.

## Separate Future Track

Streaming should remain separate from Phase H.

Recommended future track: `ts-stream` / postim streaming integration after Phase H confirms stable headless contracts. It should depend on the supported entrypoints and add streaming-specific APIs only where the current render/publish contract is insufficient.

## Current Quality Gates

For changes touching headless contracts, run:

```bash
bun run check:boundaries:strict
bun run check:boundaries:external
bun run test:bot-ai
bun run check:type
```

For broad workspace changes, also run:

```bash
bun run lint:ci
bun run test
```

## Источники правды

- [Current Status](current-status.md)
- [External And Headless Integration Contracts](../engineering/external-headless-contracts.md)
- [Bot-First Production Contract](../engineering/bot-first-production-contract.md)
- [Telegram AI Review Sandbox Smoke](../06_deployment/telegram-ai-review-sandbox-smoke.md)
- [Root Compatibility Shims](../engineering/root-compatibility-shims.md)
- [Package Boundaries](../engineering/package-boundaries.md)
- [Timeline Studio CLI](../../apps/cli/COMMANDS.md)
