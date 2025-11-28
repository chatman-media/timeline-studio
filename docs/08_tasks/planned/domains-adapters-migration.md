# Миграция Domains на Adapters (Ports & Adapters)

**Статус:** 🟡 Запланировано
**Приоритет:** 🔴 Высокий
**Дата создания:** 2025-11-28
**Оценка:** 5-7 дней

## Описание

Завершить миграцию архитектуры Ports & Adapters. Сейчас `features/` используют `container.get*()`, но `domains/` всё ещё вызывают `invoke()` напрямую. Нужно чтобы domains тоже работали через адаптеры.

### Текущее состояние

```
Features → container.get*() → Adapter → invoke()  ✅
Domains  → invoke() напрямую                      ❌
```

### Целевое состояние

```
Features → Domains (services/hooks) → container.get*() → Adapter → invoke()
```

## Статистика

- **20 файлов** в `domains/*/tauri/` с прямыми `invoke()`
- **235 вызовов** `invoke()` всего
- **10 domains** затронуто

### Распределение по domains

| Domain | Файлов | invoke() | Приоритет |
|--------|--------|----------|-----------|
| ai-services | 10 | 149 | 1 - Самый большой |
| video-editing | 1 | 44 | 2 |
| ai-director | 1 | 13 | 3 |
| media-management | 1 | 12 | 4 - Уже есть IMediaService |
| system-integration | 4 | 6 | 5 |
| project-management | 1 | 5 | 6 |
| subtitles | 1 | 3 | 7 |
| ai-tools | 1 | 3 | 8 |

## Существующая инфраструктура

### Порты (src/core/ports/)
- ✅ `IBackendService` - generic команды
- ✅ `IPlatformService` - диалоги, файлы, shell
- ✅ `IStorageService` - localStorage/Store
- ✅ `IEventService` - события
- ✅ `IMediaService` - медиа операции

### Адаптеры (src/adapters/)
- ✅ Tauri: `TauriBackendService`, `TauriMediaService`, etc.
- ✅ Mock: `MockBackendService`, `MockMediaService`, etc.
- ✅ Node: `NodeMediaService` (частично)

## План миграции

### Подход 1: Расширение существующих портов (Рекомендуется)

Использовать `IBackendService.executeCommand<T>(command, args)` для всех Tauri команд.

**Преимущества:**
- Минимум новых интерфейсов
- Быстрее реализовать
- Гибкость

**Недостатки:**
- Меньше типизации
- Нужны типы для каждой команды

### Подход 2: Создание специализированных портов

Создать отдельный порт для каждого domain.

**Новые порты:**
- `IAIService` - ai-director, recognition, person-identification
- `IVideoService` - compiler, render
- `ISubtitleService` - subtitles
- `ISystemService` - updates, workspace, language, plugins
- `IProjectService` - project management

**Преимущества:**
- Полная типизация
- Чёткое разделение

**Недостатки:**
- Много boilerplate
- Дольше реализовывать

### Рекомендация: Гибридный подход

1. Для **media** - уже есть `IMediaService`, мигрировать на него
2. Для **video-editing** - создать `IVideoService` (много вызовов, важный функционал)
3. Для **ai-services** - создать `IAIService` (самый большой domain)
4. Для остальных - использовать `IBackendService.executeCommand()`

## Детальный план выполнения

### Фаза 1: media-management (1 день)

**Задача:** Мигрировать с `domains/media-management/tauri/media-commands.ts` на `container.getMedia()`

- [ ] Найти все импорты из `media-commands.ts`
- [ ] Заменить на `container.getMedia().*`
- [ ] Удалить или deprecate `media-commands.ts`
- [ ] Обновить тесты

**Файлы для миграции:**
```
src/domains/media-management/tauri/media-commands.ts (12 invoke)
```

### Фаза 2: video-editing (1.5 дня)

**Задача:** Создать `IVideoService` и `TauriVideoService`

- [ ] Создать `src/core/ports/video.port.ts`
- [ ] Создать `src/adapters/tauri/video.ts`
- [ ] Создать `src/adapters/mock/video.ts`
- [ ] Добавить в container: `registerVideo()`, `getVideo()`
- [ ] Зарегистрировать в `initTauriApp()` и `initMockApp()`
- [ ] Мигрировать `compiler-commands.ts` (44 invoke)
- [ ] Обновить тесты

**Методы IVideoService:**
```typescript
interface IVideoService {
  // Compilation
  startCompilation(config: CompilationConfig): Promise<string>
  cancelCompilation(jobId: string): Promise<void>
  getCompilationProgress(jobId: string): Promise<CompilationProgress>

  // Render
  renderProject(project: ProjectSchema): Promise<RenderResult>
  getActiveJobs(): Promise<RenderJob[]>
  cancelRender(jobId: string): Promise<void>

  // Cache
  getCacheStats(): Promise<CacheStats>
  clearCache(): Promise<void>

  // GPU
  getGPUCapabilities(): Promise<GPUCapabilities>
}
```

### Фаза 3: ai-services (2 дня)

**Задача:** Создать `IAIService` и `TauriAIService`

- [ ] Создать `src/core/ports/ai.port.ts`
- [ ] Создать `src/adapters/tauri/ai.ts`
- [ ] Создать `src/adapters/mock/ai.ts`
- [ ] Добавить в container
- [ ] Мигрировать все 10 файлов (149 invoke)

**Файлы для миграции:**
```
ai-director-commands.ts (13)
audio-commands.ts (15)
chat-commands.ts (5)
content-intelligence-commands.ts (13)
montage-planner-commands.ts (17)
person-identification-commands.ts (34)
platform-optimization-commands.ts (7)
recognition-commands.ts (32)
service-utils.ts (1)
workflow-automation-commands.ts (12)
```

**Структура IAIService:**
```typescript
interface IAIService {
  // AI Director
  analyzeComprehensive(path: string, config?: AIConfig): Promise<AIAnalysis>
  analyzeQuick(path: string): Promise<QuickAnalysis>
  analyzeBatch(paths: string[], config?: AIConfig): Promise<BatchAnalysis>

  // Recognition
  detectObjects(path: string): Promise<DetectionResult>
  detectFaces(path: string): Promise<FaceResult[]>

  // Person Identification
  identifyPerson(faceData: FaceData): Promise<PersonMatch>
  addPersonToDatabase(person: PersonData): Promise<string>

  // Audio
  analyzeAudio(path: string): Promise<AudioAnalysis>
  transcribeAudio(path: string, lang?: string): Promise<Transcription>

  // Content Intelligence
  analyzeContent(path: string): Promise<ContentAnalysis>
  generateMontage(config: MontageConfig): Promise<MontagePlan>

  // Chat
  sendMessage(message: string, context?: ChatContext): Promise<ChatResponse>

  // Workflow
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>
}
```

### Фаза 4: Остальные domains (1.5 дня)

Использовать `IBackendService.executeCommand()` для небольших domains.

#### system-integration (6 invoke)
- [ ] `language-commands.ts` → `backend.executeCommand("get_system_language")`
- [ ] `update-commands.ts` → `backend.executeCommand("check_updates")`
- [ ] `plugin-commands.ts` → `backend.executeCommand("load_plugins")`
- [ ] `workspace-commands.ts` → `backend.executeCommand("save_workspace")`

#### project-management (5 invoke)
- [ ] `project-commands.ts` → `backend.executeCommand("save_project")`

#### subtitles (3 invoke)
- [ ] `subtitle-commands.ts` → `backend.executeCommand("parse_subtitles")`

#### ai-tools (3 invoke)
- [ ] `ai-tools-commands.ts` → `backend.executeCommand("execute_tool")`

#### ai-director (13 invoke)
- [ ] Объединить с `IAIService` или отдельный `backend.executeCommand()`

### Фаза 5: Финализация (0.5 дня)

- [ ] Удалить/deprecate все `domains/*/tauri/*-commands.ts`
- [ ] Обновить документацию
- [ ] Проверить все тесты
- [ ] Обновить README domains

## Критерии успеха

- [ ] Ни один файл в `domains/` не импортирует `@tauri-apps/api` напрямую
- [ ] Все 235 вызовов `invoke()` мигрированы
- [ ] Созданы Mock адаптеры для всех новых портов
- [ ] Все тесты проходят
- [ ] Документация обновлена

## Риски

### Риск 1: Большой объём изменений
**Митигация:** Поэтапная миграция, коммиты после каждой фазы

### Риск 2: Поломка функционала
**Митигация:** Тесты после каждого изменения, сохранение обратной совместимости

### Риск 3: Сложность типизации
**Митигация:** Использовать существующие типы из `tauri-bindings`

## Связанные задачи

- ✅ `architecture-refactor-remove-direct-tauri-calls.md` - Features миграция (завершена)
- ✅ `ports-and-adapters-architecture.md` - Инфраструктура (завершена)

## Чек-лист выполнения

### Фаза 1: media-management
- [ ] Мигрировать на `container.getMedia()`
- [ ] Обновить тесты
- [ ] Коммит

### Фаза 2: video-editing
- [ ] Создать `IVideoService` порт
- [ ] Создать `TauriVideoService` адаптер
- [ ] Создать `MockVideoService` адаптер
- [ ] Обновить container
- [ ] Мигрировать `compiler-commands.ts`
- [ ] Обновить тесты
- [ ] Коммит

### Фаза 3: ai-services
- [ ] Создать `IAIService` порт
- [ ] Создать `TauriAIService` адаптер
- [ ] Создать `MockAIService` адаптер
- [ ] Обновить container
- [ ] Мигрировать все 10 файлов
- [ ] Обновить тесты
- [ ] Коммит

### Фаза 4: Остальные domains
- [ ] Мигрировать system-integration
- [ ] Мигрировать project-management
- [ ] Мигрировать subtitles
- [ ] Мигрировать ai-tools
- [ ] Мигрировать ai-director
- [ ] Обновить тесты
- [ ] Коммит

### Фаза 5: Финализация
- [ ] Удалить deprecated файлы
- [ ] Обновить документацию
- [ ] Финальный тест
- [ ] Перенести в completed/

---

*Создано: 2025-11-28*
*Последнее обновление: 2025-11-28*
