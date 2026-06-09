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

### B10: Telegram bot worker entrypoint ([#189](https://github.com/chatman-media/timeline-studio/issues/189))

**Цель:** принять настоящий Telegram `Update`/`getUpdates` batch и запустить bot-first workflow без промежуточного hand-written payload JSON.

- [x] Добавить Node worker, который конвертирует Telegram `Update` в `TelegramLikeBotPayload`.
- [x] Добавить Telegram Bot API `getUpdates` client с injectable `fetch`.
- [x] Поддержать token-based Telegram `sendVideo` publishing для возврата готового ролика в чат.
- [x] Добавить CLI `bot-worker` для `--update-file` и `--poll-once`.
- [x] Автоматически прокидывать Telegram `chatId` в render params для publish phase.
- [x] Покрыть update conversion, worker handling, polling, Bot API publishing, CLI contract tests.

### B11: Telegram bot polling loop state ([#191](https://github.com/chatman-media/timeline-studio/issues/191))

**Цель:** запускать Telegram bot worker как долгоживущий polling-процесс и не переобрабатывать старые updates после рестарта.

- [x] Добавить polling loop API поверх `NodeTelegramBotWorker.pollOnce`.
- [x] Добавить offset store boundary и Node file-backed offset store.
- [x] Сохранять `nextOffset` после обработанных batches.
- [x] Добавить CLI `bot-worker --poll` с `--offset-file`, `--max-batches`, `--idle-delay`.
- [x] Сохранить поведение `--poll-once` без изменений.
- [x] Покрыть polling loop, offset persistence, file offset store и CLI contract tests.

### B12: Telegram bot command routing ([#193](https://github.com/chatman-media/timeline-studio/issues/193))

**Цель:** обрабатывать служебные команды бота до render workflow, чтобы `/start` и `/help` не превращались в validation error.

- [x] Добавить detection для `/start` и `/help` в Node Telegram worker.
- [x] Отправлять command responses через injected responder или Telegram Bot API token.
- [x] Возвращать machine-readable command-handled worker result без запуска render workflow.
- [x] Оставить возможность отключить command routing для command-like workflow messages.
- [x] Покрыть command routing, Bot API command response delivery и command parser tests.

### B13: Bot worker runtime config and smoke runbook ([#195](https://github.com/chatman-media/timeline-studio/issues/195))

**Цель:** сделать Telegram bot worker проще запускать и проверять локально без длинных команд и ручных fixtures.

- [x] Добавить env-backed defaults для Telegram token, media dir, offset file, destination, Rust render и polling timings.
- [x] Сохранить приоритет явных CLI flags над env defaults.
- [x] Добавить committed Telegram `/help` smoke update fixture.
- [x] Документировать one-shot smoke и continuous polling worker runbook в CLI README.
- [x] Покрыть env default precedence и CLI contract tests.

### B14: Telegram bot update error isolation ([#197](https://github.com/chatman-media/timeline-studio/issues/197))

**Цель:** один проблемный Telegram update не должен валить polling worker и заставлять бота переобрабатывать тот же input после рестарта.

- [x] Изолировать update-level exceptions внутри `pollOnce`, сохраняя наружу Bot API `getUpdates` failures.
- [x] Возвращать machine-readable failed update result в worker JSON output.
- [x] Продолжать обработку batch и продвигать `nextOffset` после failed update.
- [x] Отвечать в Telegram chat коротким error message, когда в update есть chat/message metadata.
- [x] Покрыть polling isolation, error reply delivery и CLI failed-result detection tests.

### B15: Telegram bot conversation draft state ([#199](https://github.com/chatman-media/timeline-studio/issues/199))

**Цель:** пользователь может прислать media и render hints несколькими Telegram сообщениями, а бот запускает render только после `/render`.

- [x] Добавить core draft contract и deterministic merge для chat/user session.
- [x] Добавить Node file-backed draft store для polling worker и рестартов.
- [x] Добавить opt-in Telegram worker draft mode: save input, `/render`, `/cancel`.
- [x] Прокинуть draft storage через CLI/env без изменения one-shot режима.
- [x] Документировать conversation draft runbook и покрыть core/store/worker/CLI tests.

### B16: Bot text media and shorthand hints ([#201](https://github.com/chatman-media/timeline-studio/issues/201))

**Цель:** бот понимает обычный Telegram текст вроде `https://cdn.example.com/input.mov 1080p telegram`, а не только `key=value` hints.

- [x] Извлекать bare HTTP/HTTPS URLs из bot text как media attachments.
- [x] Поддержать media aliases `media=`, `url=`, `input=` и `source=`.
- [x] Поддержать deterministic destination/resolution shorthand tokens без `key=value`.
- [x] Сохранить существующий structured/key-value behavior и приоритеты.
- [x] Обновить `/help`, CLI runbook и unit tests для нового intake behavior.

### B17: Telegram bot async workflow queue ([#203](https://github.com/chatman-media/timeline-studio/issues/203))

**Цель:** долгий render workflow не блокирует Telegram polling loop и прием следующих сообщений.

- [x] Добавить opt-in in-memory workflow queue с bounded concurrency.
- [x] Возвращать machine-readable queued update result без ожидания render completion.
- [x] Публиковать финальный workflow result через worker callbacks/status sinks после завершения queued job.
- [x] Сохранить synchronous one-shot behavior по умолчанию.
- [x] Подключить queue к `bot-worker --poll` через CLI/env flags.
- [x] Сохранить безопасную draft semantics: success очищает draft, validation failure оставляет draft.
- [x] Документировать polling runbook и покрыть queue/CLI tests.

### B18: Telegram bot queued workflow acknowledgements ([#205](https://github.com/chatman-media/timeline-studio/issues/205))

**Цель:** после постановки render workflow в очередь пользователь сразу получает chat acknowledgement, даже если очередь занята.

- [x] Отправлять concise Telegram acknowledgement при queued workflow result.
- [x] Поддержать injected queue responder/formatter и token-backed Bot API delivery.
- [x] Добавлять queued response metadata в machine-readable worker result.
- [x] Делать queue acknowledgement best-effort: сбой доставки не ломает queued update.
- [x] Сохранить synchronous one-shot behavior.
- [x] Документировать queued acknowledgement behavior и покрыть delivery/failure tests.

### B19: Telegram bot workflow queue backpressure ([#207](https://github.com/chatman-media/timeline-studio/issues/207))

**Цель:** render workflow queue имеет управляемый лимит backlog и отвечает пользователю busy/retry вместо бесконечного роста в памяти.

- [x] Добавить optional pending queue capacity limit в in-memory Telegram workflow queue.
- [x] Возвращать machine-readable rejected update result при полной очереди.
- [x] Отправлять concise best-effort Telegram busy/retry response для rejected queued workflows.
- [x] Сохранить unbounded behavior по умолчанию.
- [x] Прокинуть queue limit через `bot-worker --poll` CLI/env config.
- [x] Не запускать workflow для rejected updates и учитывать rejected result в CLI failure detection.
- [x] Документировать backpressure setting и покрыть queue capacity/rejection tests.

### B20: Telegram bot workflow job status store ([#209](https://github.com/chatman-media/timeline-studio/issues/209))

**Цель:** bot-first worker сохраняет machine-readable историю queued/running/done/failed/rejected workflow jobs и отвечает на `/status` без desktop UI.

- [x] Добавить Node workflow job store boundary для Telegram worker.
- [x] Добавить in-memory и file-backed реализации status/history store.
- [x] Записывать queued/running/completed/failed/rejected lifecycle для async workflow jobs.
- [x] Добавить `/status` command routing с recent jobs по текущему chat.
- [x] Прокинуть job store через `bot-worker` CLI/env config.
- [x] Документировать `/status` runbook и покрыть worker/store/CLI tests.

### B21: Telegram bot queued workflow cancellation ([#211](https://github.com/chatman-media/timeline-studio/issues/211))

**Цель:** пользователь может отменить pending queued workflow из Telegram через `/cancel <queueId>`, не открывая desktop UI.

- [x] Добавить cancellation API для pending jobs в in-memory Telegram workflow queue.
- [x] Сохранить `/cancel` без аргументов как draft-clearing command.
- [x] Добавить `/cancel <queueId>` routing для queued workflow jobs.
- [x] Проверять job ownership/status через workflow job store перед отменой.
- [x] Записывать `cancelled` status в job store и возвращать concise Telegram response.
- [x] Оставить running render cancellation вне scope и возвращать not-cancellable response.
- [x] Документировать command/runbook и покрыть queue/worker/CLI tests.

### B22: Telegram bot running render cancellation ([#213](https://github.com/chatman-media/timeline-studio/issues/213))

**Цель:** пользователь может отменить уже running render job из Telegram через тот же `/cancel <queueId>`, когда worker знает render job id.

- [x] Добавить tracking event sink, который пишет render job id/status в Telegram workflow job store во время выполнения.
- [x] Экспортировать `NodeBotWorkflowService.cancelRenderJob()` поверх render job port.
- [x] Расширить `/cancel <queueId>`: pending jobs отменяются через queue, running jobs через render job service.
- [x] Сохранить chat ownership/status checks перед отменой.
- [x] Записывать `cancelled` status для running cancellation и не перезаписывать cancelled финальный result как failed.
- [x] Возвращать clear not-cancellable response, если running job еще не имеет render job id.
- [x] Документировать behavior и покрыть running cancellation tests.

### B23: Telegram bot workflow retry command ([#215](https://github.com/chatman-media/timeline-studio/issues/215))

**Цель:** пользователь может повторить failed/cancelled job из Telegram через `/retry <queueId>` без повторного ввода media/template hints.

- [x] Сохранять retry source context (`sourcePayload` или `sourceWorkflow`) в Telegram workflow job store.
- [x] Добавить `/retry <queueId>` command routing.
- [x] Проверять chat ownership и retryable statuses через job store.
- [x] Разрешать retry только для failed/cancelled jobs.
- [x] Запускать retry через тот же sync/async workflow path с новым queue id.
- [x] Сохранять `retryOf` в new job record/result.
- [x] Документировать command/runbook и покрыть retry/not-retryable tests.

### B24: Telegram bot stale workflow recovery ([#217](https://github.com/chatman-media/timeline-studio/issues/217))

**Цель:** после рестарта polling worker старые queued/running jobs из persisted store не остаются вечными in-progress и становятся retryable.

- [x] Добавить recovery helper для workflow job store.
- [x] Помечать stale queued/running records как failed с понятной restart/interruption причиной.
- [x] Сохранять source payload/workflow context для `/retry`.
- [x] Подключить opt-in recovery к `bot-worker` через CLI/env.
- [x] Документировать production runbook и покрыть store/CLI tests.

### B25: Bot workflow status update throttling ([#219](https://github.com/chatman-media/timeline-studio/issues/219))

**Цель:** production bot не отправляет каждый render progress event в Telegram и снижает риск chat spam/429.

- [x] Добавить configurable status update policy в core workflow status options.
- [x] Отправлять первый status, terminal states и lifecycle transitions без задержки.
- [x] Throttle repeated `rendering` progress по minimum interval/progress delta.
- [x] Прокинуть policy через `bot-worker` и `bot-workflow` CLI flags/env.
- [x] Документировать production runbook и покрыть core/CLI tests.

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
- [#189](https://github.com/chatman-media/timeline-studio/issues/189) - B10: Telegram bot worker entrypoint
- [#191](https://github.com/chatman-media/timeline-studio/issues/191) - B11: Telegram bot polling loop state
- [#193](https://github.com/chatman-media/timeline-studio/issues/193) - B12: Telegram bot command routing
- [#195](https://github.com/chatman-media/timeline-studio/issues/195) - B13: Bot worker runtime config and smoke runbook
- [#197](https://github.com/chatman-media/timeline-studio/issues/197) - B14: Telegram bot update error isolation
- [#199](https://github.com/chatman-media/timeline-studio/issues/199) - B15: Telegram bot conversation draft state
- [#201](https://github.com/chatman-media/timeline-studio/issues/201) - B16: Bot text media and shorthand hints
- [#203](https://github.com/chatman-media/timeline-studio/issues/203) - B17: Telegram bot async workflow queue
- [#205](https://github.com/chatman-media/timeline-studio/issues/205) - B18: Telegram bot queued workflow acknowledgements
- [#207](https://github.com/chatman-media/timeline-studio/issues/207) - B19: Telegram bot workflow queue backpressure
- [#209](https://github.com/chatman-media/timeline-studio/issues/209) - B20: Telegram bot workflow job status store
- [#211](https://github.com/chatman-media/timeline-studio/issues/211) - B21: Telegram bot queued workflow cancellation
- [#213](https://github.com/chatman-media/timeline-studio/issues/213) - B22: Telegram bot running render cancellation
- [#215](https://github.com/chatman-media/timeline-studio/issues/215) - B23: Telegram bot workflow retry command
- [#217](https://github.com/chatman-media/timeline-studio/issues/217) - B24: Telegram bot stale workflow recovery
- [#219](https://github.com/chatman-media/timeline-studio/issues/219) - B25: Bot workflow status update throttling
- [telegram-mini-app.md](./telegram-mini-app.md)
- [cloud-rendering.md](./cloud-rendering.md)
- [export-architecture-refactoring.md](./export-architecture-refactoring.md)
