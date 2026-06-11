# Миграция на JS workspaces и модульную архитектуру

**Статус:** Completed, tracked in closed [#150](https://github.com/chatman-media/timeline-studio/issues/150)
**Приоритет:** High
**Создано:** 2025-11-29
**Актуализировано:** 2026-06-11
**Завершено:** 2026-06-10
**Ответственный:** Architecture Team

## Контекст

Rust decomposition закрыта в [#91](https://github.com/chatman-media/timeline-studio/issues/91), `@timeline/shared-types` уже вынесен через [#104](https://github.com/chatman-media/timeline-studio/issues/104) и [#120](https://github.com/chatman-media/timeline-studio/issues/120). Следующий этап - перевести TypeScript/frontend часть на управляемые workspace-пакеты без большого одномоментного переноса файлов.

Главное ограничение Phase F: desktop app должен оставаться рабочим после каждого PR.

## Цели

1. UI не импортирует platform adapters напрямую.
2. Domains и adapters зависят от core-контрактов, а не друг от друга через app/runtime coupling.
3. Core остается platform-neutral и пригодным для Desktop, CLI и будущего Web shell.
4. Переход идет через проверяемые PR slices: каждый срез добавляет контракт, уменьшает coupling или готовит workspace split.

## Целевая структура

```text
timeline-studio/
├── packages/
│   ├── core/       # @timeline-studio/core
│   ├── domains/    # @timeline-studio/domains
│   ├── adapters/   # @timeline-studio/adapters
│   ├── ui/         # @timeline-studio/ui
│   └── shared-types/
├── apps/
│   ├── desktop/
│   └── cli/
├── package.json
└── bun.lock
```

После F5 пакеты получили физические workspace shells (`packages/*`, `apps/*`). После F7 package-boundary baseline снижен до нуля. F9-F14 завершили физический перенос в реальные владельцы кода:

- F9: `packages/core/src` становится владельцем core-контрактов, сервисов, hooks и типов.
- F10: `packages/domains/src` становится владельцем domain-модулей.
- F11: `packages/adapters/src` становится владельцем Node/Tauri/HTTP/Mock/React adapters.
- F12: `packages/ui/src` становится владельцем package-safe UI primitives и reusable feature surfaces.
- F13: `apps/desktop` и `apps/cli` становятся владельцами app-level entrypoints, насколько это допускают Next/Tauri constraints.

Границы и правила описаны в [package-boundaries.md](../../engineering/package-boundaries.md) и `config/package-boundaries.json`.

## Граф зависимостей

```text
app-shell -> ui + domains + adapters
ui -> core
domains -> core
adapters -> core
```

`app-shell` - это композиционный слой (`apps/cli/src`, `src/app`, `src/config`, `apps/desktop` compatibility ownership), где допустимо связывать UI, domains и adapters. Все остальные слои должны двигаться к зависимостям через `core`.

## Bot-first priority

С 2026-06-08 верхнеуровневым вектором был [Bot-first workflow](./bot-first-workflow.md). Phase F была обязательной инженерной базой и quality gate для этого направления: render job contracts, worker/event stream, intake contract and publishing destinations.

На 2026-06-11 Phase F закрыта, а следующий фокус описан в [Roadmap](../../10_project_state/roadmap.md#далее-phase-h-proposal): production rollout and external integration readiness.

## Phase F PR slices

### F1: Package boundaries baseline

**Цель:** зафиксировать правила до переноса файлов.

- [x] Расширить root workspaces до `packages/*` и `apps/*`.
- [x] Добавить bridge-алиасы `@timeline-studio/*` для текущей структуры `src/*`.
- [x] Добавить `config/package-boundaries.json`.
- [x] Добавить `bun run check:boundaries` в report-only режиме.
- [x] Документировать PR slices и критерии проверки.

### F2: Core bridge и ports

**Цель:** убрать зависимость core от domains и начать снимать `ui -> domains` coupling.

- [x] Найти `core -> domains` импорты через `bun run check:boundaries`.
- [x] Вынести UI-facing контракты в `src/core/ports`.
- [x] Добавить bridge API в `src/core/container` или соседний composition module.
- [x] Перевести первый набор hooks/features с прямых domain imports на core API.
- [x] Оставить desktop поведение неизменным.

### F3: Adapter contracts

**Цель:** закрыть прямые импорты adapters из UI.

- [x] Найти `ui -> adapters` импорты через `bun run check:boundaries`.
- [x] Перенести нужные операции за core ports.
- [x] Инициализировать Tauri/Node/Mock implementations только в app-shell/adapters.
- [x] Подготовить mock adapter path для UI tests.

### F4: UI pilot package

**Цель:** проверить форму `@timeline-studio/ui` на одном вертикальном feature slice.

- [x] Выбрать feature с небольшим числом domain imports: pilot slice - `src/features/version-control`.
- [x] Перевести его public API на `@timeline-studio/ui/features/version-control`.
- [x] Убедиться, что feature не импортирует adapters и новые domain imports не добавляются.
- [x] Обновить relevant tests.

Следующие UI slices после pilot:

1. `developer-tools` - самый маленький feature slice без domain/adapter imports.
2. `drag-drop` - небольшой UI-only slice для проверки non-modal feature shape.
3. `language` - небольшой slice с одним domain import; хороший кандидат для следующего core bridge.
4. `color-scheme` и `options` - следующие после burn-down оставшихся settings/domain связей.

### F5: Workspace split и CI

**Цель:** физически создать пакеты/apps после burn-down основных циклов.

- [x] Создать `package.json` для `packages/core`, `packages/domains`, `packages/adapters`, `packages/ui`.
- [x] Создать `apps/desktop` и `apps/cli` без изменения runtime behavior.
- [x] Обновить build/test scripts, TypeScript paths и lockfiles.
- [x] Настроить CI cache для workspace scripts.
- [x] Добавить CI gate по committed baseline; strict mode оставить на следующий burn-down этап.

### F6: Boundary error burn-down

**Цель:** убрать hard errors из package-boundaries report перед дальнейшим `ui -> domains` burn-down.

- [x] Перенести domain-facing service config из app-shell в shared domain utility.
- [x] Перенести domain-used montage/resources/color-scheme контракты из feature слоя в domain/shared.
- [x] Убрать provider re-exports из `src/domains/video-editing`.
- [x] Обновить committed baseline до warning-only отчета.

### F7: UI-to-domains warning burn-down

**Цель:** постепенно снижать warning-only `ui -> domains` baseline маленькими UI slices.

- [x] `language`: добавить core language port/service и перевести `features/language` с `@/domains/system-integration` на core service.
- [x] `options`: добавить core-facing `MediaFile` type bridge и убрать type-only imports из `@/domains/media-management`.
- [x] `keyboard-shortcuts`: перевести modal hook imports на feature-facing compatibility layer `@/features/modals/services`.
- [x] `color-scheme`: расширить feature-facing `user-settings` adapter и убрать прямые imports из `project-management`/`system-integration`.
- [x] `color-grading`: перевести modal hook imports на feature-facing compatibility layer `@/features/modals/services`.
- [x] `fairlight-audio`: перевести MIDI modal hook imports на feature-facing compatibility layer `@/features/modals/services`.
- [x] Довести оставшиеся `ui -> domains` предупреждения до нуля через core registries/facades для browser state, media management, video editing и montage planner.

### F8: Close F7 zero-boundary baseline and extraction prep

**Цель:** сделать нулевой baseline официальной стартовой точкой для физического переноса пакетов.

- [x] Создать follow-up задачи [#272](https://github.com/chatman-media/timeline-studio/issues/272)-[#278](https://github.com/chatman-media/timeline-studio/issues/278) для F8-F14.
- [x] Обновить `config/package-boundaries-baseline.json` до `0` violations.
- [x] Обновить GitHub issue [#165](https://github.com/chatman-media/timeline-studio/issues/165) финальным статусом после PR [#279](https://github.com/chatman-media/timeline-studio/pull/279).
- [x] Решить, включать ли `check:boundaries:strict` в default CI после физического переноса или оставить отдельным gate до удаления compatibility shims.

### F9: Physically extract core into `packages/core`

**Цель:** `packages/core/src` владеет реальной core-реализацией, а не bridge re-exports в `src/core`.

- [x] Перенести core container, ports, services, hooks, types и core utils в `packages/core/src`.
- [x] Оставить `src/core` как временный compatibility layer только для старых imports: не потребовалось, imports переведены на `@timeline-studio/core`.
- [x] Обновить package exports, TS paths и tests на moved source.
- [x] Проверить, что core не импортирует domains, adapters, app-shell или feature UI.

### F10: Physically extract domains into `packages/domains`

**Цель:** `packages/domains/src` владеет domain-модулями за стабильными package exports.

- [x] Перенести domain modules из `src/domains` в `packages/domains/src` небольшими subdomain slices.
- [x] Сохранить app-shell как место композиции domains/adapters/UI.
- [x] Оставить `src/domains` compatibility shims только на время миграции imports: не потребовалось, imports переведены на `@timeline-studio/domains`.
- [x] Не допустить domain dependencies на UI или platform adapters.

### F11: Physically extract adapters into `packages/adapters`

**Цель:** adapter implementations живут в `packages/adapters/src`.

- [x] Перенести mock/node/tauri/http/react adapters по runtime families.
- [x] Зафиксировать текущие Tauri adapter -> domains dependencies в package metadata; отдельный contract burn-down нужен перед core-only adapters strict gate.
- [x] Сохранить `src/adapters` compatibility entrypoints для root/app imports на время миграции: не потребовалось, imports переведены на `@timeline-studio/adapters`.
- [x] Проверить bot/headless Node adapter paths и desktop app init.

### F12: Physically extract reusable UI into `packages/ui`

**Цель:** package-safe UI primitives и reusable feature surfaces живут в `packages/ui/src`.

- [x] Перенести shared UI primitives из `src/components/ui`.
- [x] Перенести только те feature surfaces, которые не тащат domains/adapters напрямую: pilot `version-control`.
- [x] Мигрировать imports на `@timeline-studio/ui/*` для moved public surfaces.
- [x] Проверить, что `packages/ui` зависит только от UI/core-safe контрактов.

### F13: Move desktop and CLI entrypoints into `apps`

**Цель:** `apps/desktop` и `apps/cli` перестают быть только package-manager shells.

- [x] Перенести или явно зафиксировать compatibility ownership для Next/Tauri entrypoints: `apps/desktop/entrypoints.json` владеет root paths `src/app`, `src/config`, `next.config.ts`, `src-tauri`.
- [x] Перенести CLI command ownership в `apps/cli`: source и tests живут в `apps/cli/src`.
- [x] Сохранить root scripts для developer compatibility.
- [x] Документировать root files, которые пока нельзя перенести из-за Next/Tauri constraints.

### F14: Finalize workspace CI, build, and docs

**Цель:** закрепить итоговую workspace ownership model в scripts, CI и docs.

- [x] Обновить workspace scripts, package exports, TS paths, test configs и CI cache keys.
- [x] Удалить устаревшие bridge wrappers или документировать оставшиеся shims с owners: desktop root compatibility paths documented in `apps/desktop/entrypoints.json`.
- [x] Решить судьбу `check:boundaries:strict` как default CI gate: основной CI запускает strict gate; baseline остается audit-командой.
- [x] Проверить lockfiles и package metadata: `bun install --frozen-lockfile --ignore-scripts` проходит без изменений.

## Проверка каждого PR

Минимальный набор для каждого Phase F slice:

```bash
bun install --frozen-lockfile --ignore-scripts
bun run check:boundaries
bun run check:boundaries:strict
bun run check:boundaries:baseline
bun run check:workspaces
bun run check:type
```

Для PR, который меняет runtime wiring или adapters, дополнительно запускать targeted unit tests и relevant e2e/headless сценарии.

## Текущий baseline

`bun run check:boundaries` сейчас работает в report-only режиме. После F7 отчет должен оставаться на нуле; любые новые нарушения считаются регрессией.

CI использует `bun run check:boundaries:strict` как default gate после F14. `check:boundaries:baseline` остается audit-командой, которая сравнивает отчет с `config/package-boundaries-baseline.json` и падает при росте total/severity/edge counts.

Baseline на 2026-06-11:

- Scanned files: 1730
- Violations: 0
- `error`: 0
- `warn`: 0

Следующие PR должны сохранять этот отчет на нуле. Если compatibility shim временно требует нового правила, это должно быть явно отражено в F8-F14 issue и PR description.

## Риски и митигация

| Риск | Влияние | Митигация |
|------|---------|-----------|
| Большой перенос файлов ломает desktop app | Высокое | Делать split только после F2-F4, когда alias и ports уже проверены |
| Циклические зависимости остаются незаметными | Высокое | Запускать `bun run check:boundaries` в каждом PR |
| UI продолжает импортировать Tauri adapters | Высокое | F3 закрывает `ui -> adapters`; после burn-down включить strict gate |
| Lockfile drift между npm и bun | Среднее | После workspace/package changes запускать frozen install и держать `package-lock.json` metadata синхронной |
| Compatibility shims маскируют незавершенный перенос | Среднее | В F9-F14 каждый shim должен быть временным и иметь owner/follow-up |

## Связанные задачи

- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Epic: Phase F
- [#165](https://github.com/chatman-media/timeline-studio/issues/165) - Phase F7: ui-to-domains warning burn-down
- [#272](https://github.com/chatman-media/timeline-studio/issues/272)-[#278](https://github.com/chatman-media/timeline-studio/issues/278) - F8-F14 physical extraction follow-ups
- [#91](https://github.com/chatman-media/timeline-studio/issues/91) - Rust decomposition
- [#104](https://github.com/chatman-media/timeline-studio/issues/104), [#120](https://github.com/chatman-media/timeline-studio/issues/120) - shared types extraction
