# Roadmap Timeline Studio

*Последнее обновление: 7 июня 2026*

## Видение

Timeline Studio развивается в видеоредактор, которым можно пользоваться как через GUI, так и headless: агент получает цель, анализирует исходные медиа, строит `ProjectSchema`, рендерит, оптимизирует и публикует результат.

Ключевая архитектурная ставка: единый типизированный контракт между GUI, headless CLI, агентом и внешними интеграциями.

## Завершено

### Rust modularization

Закрыт epic [#91](https://github.com/chatman-media/timeline-studio/issues/91): backend распилен на layered `ts-*` crates.

Готово:

- Cargo workspace для `crates/*`.
- `ts-schema` и `ts-core-types` как foundation layer.
- `ts-render` и headless render path.
- Доменные крейты `ts-media`, `ts-recognition`, `ts-analysis`, `ts-montage`, `ts-subtitles`.
- `ts-state` без Tauri-зависимости.
- `ts-agent` и headless video tools.
- Slim Tauri host поверх новых крейтов.
- Изоляция heavy deps: `tauri`, `ort`, `pyo3`, `wasmtime` не протекают в общий headless path.

### Agentic headless pipeline

Закрыт epic [#119](https://github.com/chatman-media/timeline-studio/issues/119).

Готово:

- Единый `timeline` CLI.
- `render`, `ingest`, `analyze`, `montage-plan`, `optimize`, `thumbnail`.
- `publish telegram` и `publish youtube`.
- `pipeline` для базового produce-to-publish flow.
- LLM planner через OpenAI-compatible BYOK endpoint.

### Contracts

Закрыт epic [#120](https://github.com/chatman-media/timeline-studio/issues/120).

Готово:

- `ProjectSchema` JSON Schema.
- `AnalysisResult`, `OptimizeRequest/Result`, `PublishRequest/Result`.
- `@timeline/shared-types`.
- [Agent Contract Reference](../engineering/AGENT_CONTRACT_REFERENCE.md).

## Сейчас

### P0: стабилизировать CI

- [#147](https://github.com/chatman-media/timeline-studio/issues/147) - lock-файлы для `@timeline/shared-types`.
- [#148](https://github.com/chatman-media/timeline-studio/issues/148) - `ts-montage` doctest/API drift.

Acceptance:

- `bun install --frozen-lockfile` проходит.
- `npm ci --omit=optional` проходит.
- `cd crates && cargo test -p ts-montage --doc` проходит.
- Crates workspace CI больше не падает на doctest.

### P1: защитить headless pipeline

- [#149](https://github.com/chatman-media/timeline-studio/issues/149) - end-to-end smoke для agent produce-to-publish.

Acceptance:

- Быстрый smoke можно запускать локально и в CI.
- Проверяется минимальный contract/render/analyze/pipeline path без GUI.
- Failure clearly points to the broken pipeline step.

### P1: Phase F TypeScript packages

- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - JS packages/workspaces для `core`, `domains`, `adapters`, `ui`.

Acceptance:

- Есть пошаговый migration plan.
- UI не импортирует platform-specific adapters напрямую.
- Каждый slice оставляет desktop app buildable/testable.

## Далее

### Product hardening

- Реальные fixture-based integration tests для render/analyze/publish validate paths.
- Улучшение diagnostics для CLI и agent contract validation.
- Headless Docker image и runtime docs после стабилизации CI.

### Frontend architecture

- Перенести существующие Ports & Adapters правила из docs в enforceable import boundaries.
- Начать package extraction с минимального shared/core слоя, затем adapters, затем UI/features.

### Documentation

- Обновить architecture overview под `crates/*`, `packages/shared-types` и `timeline` CLI.
- Связать user-facing docs с headless/agent flows только после green smoke coverage.

## Источники правды

- [Current Status](current-status.md)
- [Agent Contract Reference](../engineering/AGENT_CONTRACT_REFERENCE.md)
- [Rust crates workspace](../../crates/Cargo.toml)
- [Shared TypeScript package](../../packages/shared-types/package.json)
