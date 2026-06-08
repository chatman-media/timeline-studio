# Миграция на JS workspaces и модульную архитектуру

**Статус:** Active, tracked in [#150](https://github.com/chatman-media/timeline-studio/issues/150)
**Приоритет:** High
**Создано:** 2025-11-29
**Актуализировано:** 2026-06-07
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

После F5 пакеты имеют физические workspace shells (`packages/*`, `apps/*`), а runtime-код пока остается в текущих `src/*` деревьях и подключается через bridge wrappers:

- `@timeline-studio/core` -> `packages/core/src/*` -> `src/core`
- `@timeline-studio/domains` / `@timeline-studio/domains/*` -> `packages/domains/src/*` -> `src/domains`
- `@timeline-studio/adapters` / `@timeline-studio/adapters/*` -> `packages/adapters/src/*` -> `src/adapters`
- `@timeline-studio/ui/features/*` -> `packages/ui/src/features/*` -> `src/features/*`
- `@timeline-studio/ui/components/*` -> `packages/ui/src/components/*` -> `src/components/ui/*`

Границы и правила описаны в [package-boundaries.md](../../engineering/package-boundaries.md) и `config/package-boundaries.json`.

## Граф зависимостей

```text
app-shell -> ui + domains + adapters
ui -> core
domains -> core
adapters -> core
```

`app-shell` - это композиционный слой (`src/app`, `src/cli`, `src/config`), где допустимо связывать UI, domains и adapters. Все остальные слои должны двигаться к зависимостям через `core`.

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
- [ ] Следующие маленькие кандидаты: `color-scheme`, `keyboard-shortcuts`, `color-grading`.

## Проверка каждого PR

Минимальный набор для каждого Phase F slice:

```bash
bun install --frozen-lockfile --ignore-scripts
bun run check:boundaries
bun run check:boundaries:baseline
bun run check:workspaces
bun run check:type
```

Для PR, который меняет runtime wiring или adapters, дополнительно запускать targeted unit tests и relevant e2e/headless сценарии.

## Текущий baseline

`bun run check:boundaries` сейчас работает в report-only режиме. Это намеренно: текущий код содержит известные нарушения, которые нужно снимать отдельными PR.

CI использует `bun run check:boundaries:baseline`, который сравнивает отчет с `config/package-boundaries-baseline.json` и падает только при росте total/severity/edge counts. Strict mode останется выключенным до burn-down `domains -> ui`, `domains -> app-shell` и `ui -> domains`.

Baseline на 2026-06-08:

- Scanned files: 1587
- Violations: 417
- `error`: 0
- `warn`: 417
- Edges: `ui -> domains` 417

Следующие PR должны уменьшать этот отчет и не добавлять новые нарушения без явного follow-up.

## Риски и митигация

| Риск | Влияние | Митигация |
|------|---------|-----------|
| Большой перенос файлов ломает desktop app | Высокое | Делать split только после F2-F4, когда alias и ports уже проверены |
| Циклические зависимости остаются незаметными | Высокое | Запускать `bun run check:boundaries` в каждом PR |
| UI продолжает импортировать Tauri adapters | Высокое | F3 закрывает `ui -> adapters`; после burn-down включить strict gate |
| Lockfile drift между npm и bun | Среднее | После workspace/package changes запускать frozen install и держать `package-lock.json` metadata синхронной |

## Связанные задачи

- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Epic: Phase F
- [#91](https://github.com/chatman-media/timeline-studio/issues/91) - Rust decomposition
- [#104](https://github.com/chatman-media/timeline-studio/issues/104), [#120](https://github.com/chatman-media/timeline-studio/issues/120) - shared types extraction
