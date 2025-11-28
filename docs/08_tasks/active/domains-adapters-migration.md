# Миграция Domains на Adapters (Ports & Adapters)

**Статус:** 🟢 В процессе выполнения
**Приоритет:** 🔴 Высокий
**Дата создания:** 2025-11-28
**Последнее обновление:** 2025-11-29

## Описание

Завершить миграцию архитектуры Ports & Adapters. Сейчас `features/` используют `container.get*()`, но `domains/` всё ещё вызывают `invoke()` напрямую. Нужно чтобы domains тоже работали через адаптеры.

### Текущее состояние

```
Features → container.get*() → Adapter → invoke()  ✅
Domains  → container.get*() → Adapter → invoke()  ✅ (для основных сервисов)
```

## Выполненные фазы

### Фаза 1: media-management ✅

- [x] Мигрировать на `container.getMedia()`
- [x] Обновить `media-api.ts` для использования `getMedia()` из контейнера
- [x] Обновить тесты для мокирования `@/core/container`
- [x] Коммит: `refactor(media): migrate media-management to container.getMedia()`

### Фаза 2: video-editing → IVideoService ✅

- [x] Создать `src/core/ports/video.port.ts` с IVideoService интерфейсом
- [x] Создать `src/adapters/tauri/video.ts` с TauriVideoService
- [x] Создать `src/adapters/mock/video.ts` с MockVideoService
- [x] Добавить в container: `registerVideo()`, `getVideo()`, `hasVideo()`
- [x] Зарегистрировать в `initTauriApp()` и `initMockApp()`
- [x] Коммит: `feat(ports): add IVideoService port and adapters`

**IVideoService покрывает 40+ методов:**
- Cache operations
- Hardware acceleration
- Render jobs
- Video compilation
- Compiler settings
- Effects operations
- System info
- File operations
- Frame extraction

### Фаза 3: ai-services → IAIService ✅

- [x] Создать `src/core/ports/ai.port.ts` с IAIService интерфейсом
- [x] Создать `src/adapters/tauri/ai.ts` с TauriAIService
- [x] Создать `src/adapters/mock/ai.ts` с MockAIService
- [x] Добавить в container: `registerAI()`, `getAI()`, `hasAI()`
- [x] Зарегистрировать в `initTauriApp()` и `initMockApp()`
- [x] Коммит: `feat(ports): add IAIService port and adapters`

**IAIService покрывает 80+ методов:**
- API Key Management
- MCP (Model Context Protocol)
- YOLO Detection
- Face Detection & MediaPipe
- Person Identification
- Privacy (face blurring)
- Clustering
- Video Recognition
- Audio Analysis
- Whisper Transcription (OpenAI & Local)
- Faster Whisper
- Audio Preparation
- Subtitle Generation
- Voice Recording
- Audio Correlation
- AI Director (comprehensive, quick, batch analysis)
- Unified Audio Analysis
- Montage Planner

### Фаза 4: Остальные domains 🟡

Оставшиеся domains имеют небольшое количество invoke() вызовов и могут:
1. Использовать существующие сервисы (IAIService, IVideoService)
2. Использовать IBackendService для generic команд
3. Оставаться с invoke() в tauri/ с deprecation notice

**Статус по domains:**

| Domain | invoke() | Статус |
|--------|----------|--------|
| subtitles | 4 | Может использовать IAIService (analyzeAudioPeaks) + IBackendService |
| project-management | 5 | Системные команды, можно добавить в IPlatformService |
| system-integration | 6 | Системные команды, можно добавить в IPlatformService |
| ai-tools | 3 | Может использовать IAIService |
| ai-director | 13 | Покрыто IAIService |

### Фаза 5: Финализация ⏳

- [ ] Добавить deprecation notices в старые tauri/ файлы
- [ ] Обновить документацию
- [ ] Финальный тест
- [ ] Перенести в completed/

## Созданная инфраструктура

### Порты (src/core/ports/)
- ✅ `IBackendService` - lifecycle, commands, state
- ✅ `IPlatformService` - dialogs, files, shell
- ✅ `IStorageService` - localStorage/Store
- ✅ `IEventService` - events
- ✅ `IMediaService` - media operations
- ✅ `IVideoService` - video compilation, rendering (NEW)
- ✅ `IAIService` - AI/ML operations (NEW)

### Адаптеры (src/adapters/)

**Tauri:**
- ✅ TauriBackendService
- ✅ TauriPlatformService
- ✅ TauriStorageService
- ✅ TauriEventService
- ✅ TauriMediaService
- ✅ TauriVideoService (NEW)
- ✅ TauriAIService (NEW)

**Mock:**
- ✅ MockBackendService
- ✅ MockPlatformService
- ✅ MockStorageService
- ✅ MockEventService
- ✅ MockMediaService
- ✅ MockVideoService (NEW)
- ✅ MockAIService (NEW)

## Критерии успеха

- [x] Созданы IVideoService и IAIService порты
- [x] Созданы Tauri и Mock адаптеры для новых портов
- [x] Порты зарегистрированы в container
- [x] initTauriApp() и initMockApp() обновлены
- [x] Все тесты проходят
- [ ] Документация полностью обновлена

## Связанные коммиты

1. `refactor(media): migrate media-management to container.getMedia()`
2. `feat(ports): add IVideoService port and adapters`
3. `feat(ports): add IAIService port and adapters`

---

*Создано: 2025-11-28*
*Последнее обновление: 2025-11-29*
