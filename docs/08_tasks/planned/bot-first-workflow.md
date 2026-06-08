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

### B3: Worker event stream

**Цель:** дать боту live-статусы без UI.

- [ ] Добавить event sink abstraction для отправки progress updates.
- [ ] Поддержать status snapshots для reconnect/retry.
- [ ] Покрыть cancel/retry сценарии.

### B4: Publishing destinations

**Цель:** подключать Telegram/YouTube/TikTok как destination после готового render artifact.

- [ ] Добавить `IPublishService` core port.
- [ ] Добавить destination-specific publishing adapters.
- [ ] Связать publish phase с `BotRenderJobStatus = "publishing"`.

## Связанные задачи

- [#150](https://github.com/chatman-media/timeline-studio/issues/150) - Phase F / package boundaries
- [#171](https://github.com/chatman-media/timeline-studio/issues/171) - Epic: Bot-first workflow
- [#173](https://github.com/chatman-media/timeline-studio/issues/173) - B2: Bot intake contract
- [telegram-mini-app.md](./telegram-mini-app.md)
- [cloud-rendering.md](./cloud-rendering.md)
- [export-architecture-refactoring.md](./export-architecture-refactoring.md)
