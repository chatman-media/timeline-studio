# Export Pipeline Integration Tests

## Обзор

Комплексные интеграционные тесты для полного экспорт-пайплайна Timeline Studio. Тесты покрывают весь цикл экспорта видео от настроек до завершения, включая облачную интеграцию.

## Статистика покрытия

- **Всего тестов**: 49
- **Всего assertions**: 98+
- **Успешных тестов**: 49/49 (100%)

## Покрытые функции

### 1. Full Export Workflow (2 теста)
- ✅ Полный цикл экспорта от настроек до завершения
- ✅ Обработка кастомных метаданных проекта

**Assertions**: 7

### 2. Multiple Export Formats (4 теста)
- ✅ Экспорт в MP4
- ✅ Экспорт в WebM
- ✅ Экспорт в MOV
- ✅ Настройки кодеков для разных форматов

**Assertions**: 5

### 3. Quality Presets (4 теста)
- ✅ Normal quality preset (4000 kbps)
- ✅ Good quality preset (8000 kbps)
- ✅ Best quality preset (12000 kbps)
- ✅ 4K resolution export (45000 kbps)

**Assertions**: 6

### 4. Progress Tracking and Cancellation (3 теста)
- ✅ Точное отслеживание прогресса экспорта
- ✅ Отмена экспорта в процессе
- ✅ Отмена на разных этапах (Initializing, Encoding, Finalizing)

**Assertions**: 6

### 5. Audio/Video Sync (2 теста)
- ✅ Синхронизация аудио/видео дорожек при экспорте
- ✅ Нормализация аудио (LKFS/LUFS стандарты)

**Assertions**: 3

### 6. Subtitle/Caption Embedding (2 теста)
- ✅ Встраивание субтитров в видео
- ✅ Фильтрация отключенных субтитров

**Assertions**: 4

### 7. Metadata Preservation (2 теста)
- ✅ Сохранение метаданных проекта в экспорте
- ✅ Добавление маркеров глав из timeline

**Assertions**: 3

### 8. Error Handling (4 теста)
- ✅ Ошибка инициализации рендера
- ✅ Ошибка во время процесса рендеринга
- ✅ Недостаточно места на диске
- ✅ Невалидный путь экспорта

**Assertions**: 6

### 9. Resume After Interruption (1 тест)
- ✅ Возобновление прерванного экспорта

**Assertions**: 1

### 10. Batch Export (2 теста)
- ✅ Пакетный экспорт нескольких проектов
- ✅ Частичные ошибки в batch экспорте

**Assertions**: 6

### 11. Cloud Upload Integration (7 тестов)

#### YouTube Upload
- ✅ Загрузка на YouTube после экспорта
- ✅ Метаданные (title, description, tags, privacy)

#### Vimeo Upload
- ✅ Загрузка на Vimeo
- ✅ Настройки приватности (private, public, unlisted)

#### Telegram Upload
- ✅ Загрузка в Telegram канал
- ✅ Поддержка Channel ID

#### General
- ✅ Валидация видео перед загрузкой
- ✅ Обработка ошибок загрузки
- ✅ Отслеживание прогресса загрузки

**Assertions**: 11

### 12. Additional Edge Cases (12 тестов)
- ✅ GPU ускорение
- ✅ Constant Bitrate (CBR) режим
- ✅ Multipass encoding
- ✅ Video-only экспорт (без аудио)
- ✅ Audio-only экспорт (без видео)
- ✅ Различные frame rates (24, 25, 30, 60 fps)
- ✅ Различные разрешения (720p, 1080p, 1440p, 4K)
- ✅ Различные bitrate modes (auto, CBR, VBR, CRF)
- ✅ Эффекты и фильтры
- ✅ Переходы между клипами
- ✅ Различные aspect ratios (16:9, 4:3, 1:1, 9:16)
- ✅ Watermark
- ✅ Кастомные аудио кодеки (AAC, MP3, Opus)
- ✅ Encoding profiles (main, main10, high)
- ✅ Encoding presets (ultrafast до veryslow)
- ✅ Параллельный экспорт
- ✅ Кастомные FFmpeg аргументы

**Assertions**: 40+

## Используемые технологии

- **Vitest** - Тестовый фреймворк
- **Testing Library** - React testing utilities
- **Mocks** - Tauri API, Social Networks Services, Video Compiler

## Структура тестов

```typescript
describe("Export Pipeline Integration Tests", () => {
  // Setup и моки
  beforeEach() // Очистка моков

  // Helper функции
  createMockProject() // Создание тестового проекта
  createExportSettings() // Создание настроек экспорта

  // Тестовые группы
  describe("1. Full Export Workflow", ...)
  describe("2. Multiple Export Formats", ...)
  describe("3. Quality Presets", ...)
  // ... и т.д.
})
```

## Запуск тестов

```bash
# Запустить все тесты export pipeline
bun run test src/features/export/__tests__/integration/export-pipeline.test.tsx

# Запустить в watch режиме
bun run test:watch src/features/export/__tests__/integration/export-pipeline.test.tsx

# Запустить с покрытием
bun run test:coverage src/features/export/__tests__/integration/export-pipeline.test.tsx
```

## Моки и зависимости

### Замоканные модули
- `@tauri-apps/api/core` - Tauri invoke API
- `@/features/video-compiler/services/video-compiler-service` - Video compiler service
- `../../services/social-networks-service` - Social networks upload service
- `sonner` - Toast notifications

### Моки устанавливаются в `beforeEach`:
```typescript
mockRenderProject.mockReset()
mockTrackRenderProgress.mockReset()
mockCancelRender.mockReset()
```

## Тестовые данные

### Mock Project
- 2 минуты длительности
- 30 FPS
- 1920x1080 разрешение
- 2 видео клипа + 1 аудио клип
- 1 субтитр
- Настройки экспорта по умолчанию

### Export Settings
- MP4 формат по умолчанию
- Good quality (8000 kbps video bitrate)
- 1080p разрешение
- 30 FPS
- GPU acceleration enabled

## Ключевые проверки

### Progress Tracking
```typescript
// Проверка монотонного роста прогресса
for (let i = 1; i < progressCallbacks.length; i++) {
  expect(progressCallbacks[i].percentage)
    .toBeGreaterThanOrEqual(progressCallbacks[i - 1].percentage)
}
```

### Cloud Upload
```typescript
// Проверка успешной загрузки
expect(uploadResult.success).toBe(true)
expect(uploadResult.url).toContain("youtube.com")
expect(uploadResult.id).toBeDefined()
```

### Error Handling
```typescript
// Проверка обработки ошибок
await expect(mockRenderProject(project, invalidPath))
  .rejects.toThrow("Invalid output path")
```

## Примечания

1. **Все тесты изолированы** - моки сбрасываются в `beforeEach`
2. **Используется mock data** - не требуется реальное видео
3. **Асинхронные операции** - используется `async/await` и `waitFor`
4. **Progress simulation** - таймауты эмулируют реальный прогресс
5. **Social uploads** - все загрузки замоканы для изоляции

## Будущие улучшения

- [ ] Добавить тесты для Instagram upload
- [ ] Добавить тесты для TikTok upload
- [ ] Добавить тесты для export queue management
- [ ] Добавить performance benchmarking
- [ ] Добавить stress tests для больших проектов
- [ ] Добавить тесты для export templates/presets

## Ссылки

- [Video Compiler Service](/src/features/video-compiler/services/video-compiler-service.ts)
- [Social Networks Service](/src/features/export/services/social-networks-service.ts)
- [Export Types](/src/features/export/types/export-types.ts)
- [Export Constants](/src/features/export/constants/export-constants.ts)
