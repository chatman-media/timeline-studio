# Bot-first workflow

**Статус:** Active, tracked in [#171](https://github.com/chatman-media/timeline-studio/issues/171)
**Приоритет:** High
**Создано:** 2026-06-08
**Ответственный:** Architecture Team

## Контекст

Целевая модель Timeline Studio - пользователь управляет созданием ролика через бота. Desktop UI остается полезным для просмотра, настройки и ручного редактирования, но основной happy path должен работать без открытия приложения: бот принимает материалы и параметры, запускает сборку проекта, рендерит видео и возвращает результат или публикует его в выбранный канал.

Это меняет приоритет архитектурной миграции: вместо отдельных UI/export slices нужно в первую очередь выделять headless contracts и worker-friendly services, которыми сможет пользоваться бот, CLI, desktop и будущий backend.

## Цели

1. Бот может создать render job из JSON-контракта без React/Tauri состояния.
2. Render job возвращает машинно-читаемый статус, прогресс, ошибки и артефакт.
3. Desktop/CLI используют тот же core port, что и будущий bot worker.
4. Публикация в соцсети подключается как destination после стабильного render job pipeline, а не как UI-first export flow.
5. Все новые slices сохраняют работоспособность desktop app и не ломают Phase F package boundaries.

## First workflow

```text
bot message
  -> parse media/template/params
  -> create BotRenderJobRequest
  -> run IRenderJobService
  -> track BotRenderJobEvent stream
  -> return file artifact or publish destination
```

## PR slices

### B1: Render job foundation

**Цель:** создать общий headless контракт и первый Node/CLI вход для bot worker.

- [x] Добавить `BotRenderJobRequest`, `BotRenderJob`, `BotRenderJobEvent` и `BotRenderJobResult` в core types.
- [x] Добавить `IRenderJobService` core port.
- [x] Добавить `NodeRenderJobService`, который запускает render через существующий `IVideoService`.
- [x] Добавить CLI-команду `render-job <job.json>` с JSON output/status file.
- [x] Покрыть Node service и CLI contract unit tests.

### B2: Bot intake contract ([#173](https://github.com/chatman-media/timeline-studio/issues/173))

**Цель:** описать вход бота до создания render job.

- [x] Добавить типы `BotWorkflowRequest`, `BotMediaAttachment`, `BotTemplateSelection`.
- [x] Добавить parser/normalizer для входа из Telegram-like payload в `BotRenderJobRequest`.
- [x] Добавить validation errors, пригодные для ответа пользователю в чате.

### B3: Worker event stream ([#175](https://github.com/chatman-media/timeline-studio/issues/175))

**Цель:** дать боту live-статусы без UI.

- [x] Добавить event sink abstraction для отправки progress updates.
- [x] Поддержать status snapshots для reconnect/retry.
- [x] Покрыть cancel/retry сценарии.

### B4: Publishing destinations ([#177](https://github.com/chatman-media/timeline-studio/issues/177))

**Цель:** подключать Telegram/YouTube/TikTok как destination после готового render artifact.

- [x] Добавить `IPublishService` core port.
- [x] Добавить destination-specific publishing adapters.
- [x] Связать publish phase с `BotRenderJobStatus = "publishing"`.

### B5: Rust render adapter ([#179](https://github.com/chatman-media/timeline-studio/issues/179))

**Цель:** подключить bot-first render job к вынесенному Rust `ts-render`, а не к старой Node ffmpeg-concat реализации.

- [x] Добавить Node `IVideoService` adapter поверх `timeline render` / `timeline-render --project`.
- [x] Добавить opt-in wiring через `initNodeApp({ rustRender })`.
- [x] Добавить CLI-флаги `render-job --rust-render`.
- [x] Покрыть completed/failed/cancel scenarios.

### B6: Bot workflow runner ([#181](https://github.com/chatman-media/timeline-studio/issues/181))

**Цель:** связать Telegram-like payload -> intake -> render job -> event stream -> result в один worker-friendly workflow.

- [x] Добавить core runner поверх `BotWorkflowRequest` и `IRenderJobService`.
- [x] Добавить Node service wiring для CLI/worker использования без React/Tauri состояния.
- [x] Добавить CLI-команду `bot-workflow <payload.json>` с JSON output/status file.
- [x] Возвращать validation errors, render result и reconnect state для бота.
- [x] Покрыть success/validation/event stream/CLI contract tests.

### B7: Bot project assembly ([#183](https://github.com/chatman-media/timeline-studio/issues/183))

**Цель:** бот может собрать renderable `ProjectSchema` из media/template payload без заранее подготовленного desktop project JSON.

- [x] Добавить deterministic core assembler для `BotRenderJobRequest -> ProjectSchema`.
- [x] Подключить assembly в workflow runner, сохраняя приоритет explicit `project=file|inline`.
- [x] Научить Node fallback читать clips из `ProjectSchema.tracks`.
- [x] Покрыть assembly, runner hydration и Node input extraction tests.

### B8: Bot media resolver ([#185](https://github.com/chatman-media/timeline-studio/issues/185))

**Цель:** перед render/project assembly превращать Telegram-like `file_id`/remote URL media в renderable локальные paths.

- [x] Добавить core media resolver boundary перед project assembly/render.
- [x] Добавить Node resolver для Telegram `getFile`/file downloads и opt-in URL downloads.
- [x] Прокинуть resolver через `NodeBotWorkflowService` и CLI `bot-workflow`.
- [x] Покрыть resolver, runner hydration, Node download и CLI contract tests.

### B9: Bot status notifier ([#187](https://github.com/chatman-media/timeline-studio/issues/187))

**Цель:** превращать validation/render events в чатовые progress/status сообщения без UI и без падения render job при сбое доставки статуса.

- [x] Добавить core status formatter/sink для bot workflow validation и render progress.
- [x] Адаптировать `BotRenderJobEventSink` events в `BotWorkflowStatusMessage`.
- [x] Добавить Node Telegram status notifier с injectable client/fetch.
- [x] Прокинуть status options через `NodeBotWorkflowService`, `initNodeApp` и CLI opt-in flags.
- [x] Покрыть validation, render progress, Node Telegram delivery и CLI contract tests.

## Связанные задачи

- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Phase F / package boundaries
- [#171](https://github.com/chatman-media/timeline-studio/issues/171) - Epic: Bot-first workflow
- [#173](https://github.com/chatman-media/timeline-studio/issues/173) - B2: Bot intake contract
- [#175](https://github.com/chatman-media/timeline-studio/issues/175) - B3: Worker event stream
- [#177](https://github.com/chatman-media/timeline-studio/issues/177) - B4: Publishing destinations
- [#179](https://github.com/chatman-media/timeline-studio/issues/179) - B5: Rust render adapter for bot jobs
- [#181](https://github.com/chatman-media/timeline-studio/issues/181) - B6: Bot workflow runner
- [#183](https://github.com/chatman-media/timeline-studio/issues/183) - B7: Bot project assembly
- [#185](https://github.com/chatman-media/timeline-studio/issues/185) - B8: Bot media resolver
- [#187](https://github.com/chatman-media/timeline-studio/issues/187) - B9: Bot status notifier
- [telegram-mini-app.md](./telegram-mini-app.md)
- [cloud-rendering.md](./cloud-rendering.md)
- [export-architecture-refactoring.md](./export-architecture-refactoring.md)
