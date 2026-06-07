# Текущий статус Timeline Studio

*Последнее обновление: 7 июня 2026*

## Сводка

Timeline Studio перешел от монолитного Rust/Tauri backend к модульной headless-ready архитектуре на `ts-*` крейтах. Эпики декомпозиции и agentic pipeline закрыты:

- [#91](https://github.com/chatman-media/timeline-studio/issues/91) - декомпозиция монолита в layered Rust workspace.
- [#119](https://github.com/chatman-media/timeline-studio/issues/119) - agent-driven headless produce-to-publish pipeline.
- [#120](https://github.com/chatman-media/timeline-studio/issues/120) - агентные контракты и `@timeline/shared-types`.

Текущий фокус: стабилизировать CI после вынесения workspace packages, добавить headless smoke coverage и продолжить Phase F для TypeScript packages/workspaces.

## Архитектура

### Rust backend

Модульная структура находится в `crates/`:

- `ts-schema` - `ProjectSchema` и контрактные типы.
- `ts-core-types` - ошибки, EventBus, progress и общие DTO.
- `ts-render` - headless render pipeline.
- `ts-media`, `ts-recognition`, `ts-analysis`, `ts-montage`, `ts-subtitles` - доменные движки.
- `ts-state` - headless `ProjectState` и `EventSink`.
- `ts-agent` - agent orchestration и video tools.
- `ts-platform`, `ts-publish`, `ts-cli` - оптимизация, публикация и единый headless CLI.

`src-tauri` теперь выступает тонким host/glue слоем и подключает новые крейты path-зависимостями.

### TypeScript packages

Сейчас вынесен первый workspace package:

- `packages/shared-types` - `@timeline/shared-types`, TS-зеркало Rust контрактов.

Следующий трек описан в [#150](https://github.com/chatman-media/timeline-studio/issues/150): вынести `core`, `domains`, `adapters`, `ui` и подготовить `apps/desktop` / `apps/cli` без big-bang миграции.

## Agent/headless integration

Headless контур уже включает:

- `timeline render` - `ProjectSchema` JSON to video.
- `timeline analyze` - media analysis JSON.
- `timeline montage-plan` - montage plan to `ProjectSchema`.
- `timeline optimize` / `thumbnail` - platform processing.
- `timeline publish telegram|youtube` - реальные publish paths.
- `timeline pipeline` - базовый `analyze -> optimize -> publish` flow.
- `timeline emit-schema` / `emit-example` - внешний контракт.

Контракт документирован в [AGENT_CONTRACT_REFERENCE.md](../engineering/AGENT_CONTRACT_REFERENCE.md).

## Текущие блокеры

- [#147](https://github.com/chatman-media/timeline-studio/issues/147) - синхронизировать `bun.lock` и `package-lock.json` после `@timeline/shared-types`.
- [#148](https://github.com/chatman-media/timeline-studio/issues/148) - исправить `ts-montage` doctest после смены API.

Эта ветка содержит исправления для обоих пунктов; после merge нужно дождаться зеленого CI на `main`.

## Следующие задачи

- [#149](https://github.com/chatman-media/timeline-studio/issues/149) - добавить end-to-end smoke для headless agent pipeline.
- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Phase F: JS packages/workspaces.
- Закрыть документационный долг в связанных архитектурных страницах после стабилизации CI.

## Проверки для ближайшего merge

Минимальный набор:

```bash
bun install --frozen-lockfile
npm ci --omit=optional
cd crates && cargo test -p ts-montage --doc
cd crates && cargo test --workspace --no-fail-fast -- --test-threads=2
```

Дополнительно для host changes:

```bash
cd src-tauri && cargo check
```
