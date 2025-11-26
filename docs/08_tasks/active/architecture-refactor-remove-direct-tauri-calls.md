# Рефакторинг: Удаление прямых вызовов Tauri из Features

**Статус:** 🚧 В работе (60% - Фаза 1 + Фаза 2 завершена)
**Приоритет:** 🔴 Критический
**Дата создания:** 2025-11-27
**Последнее обновление:** 2025-11-27
**Оценка:** 3-5 дней (поэтапно)

## Описание проблемы

Обнаружены **24 файла** в слое `features/`, которые напрямую вызывают Tauri команды через `invoke`. Это нарушает принципы чистой архитектуры и создаёт следующие проблемы:

### ❌ Проблемы текущей архитектуры

1. **Нарушение разделения ответственности**
   - Features знают о деталях реализации бэкенда
   - Невозможно переиспользовать бизнес-логику
   - Сложно тестировать UI отдельно от бэкенда

2. **Усложнение тестирования**
   - Нужно мокировать `invoke` в каждом тесте
   - Дублирование mock-кода
   - Невозможность использовать features без Tauri

3. **Отсутствие единой точки входа**
   - Бизнес-логика размазана по разным features
   - Сложно отследить все вызовы бэкенда
   - Невозможность добавить общие обработчики ошибок

4. **Проблемы при миграции**
   - При смене бэкенда придётся править все features
   - Невозможность постепенной миграции

## Правильная архитектура

```
┌─────────────────────────────────────────────────┐
│  Features (Presentation Layer)                  │
│  - React components                             │
│  - Hooks для UI                                 │
│  - НЕ содержат вызовов invoke                   │
└────────────────┬────────────────────────────────┘
                 │
                 │ Используют API из domains
                 ▼
┌─────────────────────────────────────────────────┐
│  Domains (Business Logic Layer)                 │
│  - XState machines                              │
│  - Services                                     │
│  - Вызовы invoke здесь                          │
│  - Event handlers                               │
└────────────────┬────────────────────────────────┘
                 │
                 │ Вызывают Tauri команды
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend (Tauri/Rust)                           │
│  - Команды Tauri                                │
│  - FFmpeg processing                            │
│  - File system                                  │
└─────────────────────────────────────────────────┘
```

## Список файлов-нарушителей (24 файла)

### 🎬 Media (5 файлов) - Приоритет 1

1. `src/features/media/hooks/use-media-processor.ts`
2. `src/features/media/hooks/use-simple-media-processor.ts`
3. `src/features/media/hooks/use-media-preview.ts`
4. `src/features/media/hooks/use-frame-preview.ts`
5. `src/features/media/utils/saved-media-utils.ts`

**Решение:** Перенести в `src/domains/media-management/`

### 🎥 Video Compiler (4 файла) - Приоритет 1

1. `src/features/video-compiler/hooks/use-cache-stats.ts`
2. `src/features/video-compiler/hooks/use-gpu-capabilities.ts`
3. `src/features/video-compiler/hooks/use-render-jobs.ts`
4. `src/features/video-compiler/hooks/use-video-compiler.ts`

**Решение:** Использовать существующий `src/domains/video-editing/`

### 🤖 AI Director (4 файла) - Приоритет 2

1. `src/features/ai-director/services/ai-director-machine.ts`
2. `src/features/ai-director/hooks/use-ai-director-analysis.ts`
3. `src/features/ai-director/hooks/use-montage-applicator.ts`
4. `src/features/ai-director/hooks/use-ai-director-analysis-v2.ts`

**Решение:** Создать `src/domains/ai-director/`

### 📝 Subtitles (2 файла) - Приоритет 2

1. `src/features/subtitles/hooks/use-subtitles-import.ts`
2. `src/features/subtitles/components/subtitle-auto-sync.tsx`

**Решение:** Создать `src/domains/subtitles/`

### 📂 Browser & Import (1 файл) - Приоритет 3

1. `src/features/browser/hooks/use-music-import.ts`

**Решение:** Использовать `src/domains/media-management/`

### 🎯 Timeline (1 файл) - Приоритет 3

1. `src/features/timeline/hooks/use-timeline-ai-analysis.ts`

**Решение:** Переместить в AI Director domain

### 🎙️ Voice Recording (1 файл) - Приоритет 3

1. `src/features/voice-recording/types/tauri.ts`

**Решение:** Создать domain или использовать audio domain

### 📤 Export (1 файл) - Приоритет 2

1. `src/features/export/hooks/use-render-queue.ts`

**Решение:** Использовать video-editing domain

### 🌐 Language (1 файл) - Приоритет 3

1. `src/features/language/hooks/use-language.ts`

**Решение:** Создать `src/domains/i18n/`

### 📱 Publication (1 файл) - Приоритет 3

1. `src/features/publication/hooks/use-publication-tasks.ts`

**Решение:** Создать `src/domains/publication/`

### 👁️ Recognition (1 файл) - Приоритет 2

1. `src/features/recognition/hooks/use-recognition-preview.ts`

**Решение:** Использовать существующий recognition domain

### 🎬 Montage Planner (1 файл) - Приоритет 2

1. `src/features/montage-planner/hooks/use-montage-backend.ts`

**Решение:** Переместить в montage-planner service

### 💬 AI Chat (1 файл) - Приоритет 3

1. `src/features/ai-chat/services/mcp-provider.tsx`

**Решение:** Создать `src/domains/ai-chat/`

## План выполнения

### Фаза 1: Media & Video Compiler (Приоритет 1) - 2 дня

**День 1: Media (5 файлов)**

1. Создать `src/domains/media-management/services/media-processor.ts`
   - Перенести логику из `use-media-processor.ts`
   - Перенести логику из `use-simple-media-processor.ts`

2. Создать `src/domains/media-management/services/media-preview.ts`
   - Перенести логику из `use-media-preview.ts`
   - Перенести логику из `use-frame-preview.ts`

3. Рефакторить `saved-media-utils.ts`
   - Переместить в domain utilities

4. Обновить features для использования domain API
   - Заменить прямые `invoke` на вызовы domain функций
   - Обновить тесты

**День 2: Video Compiler (4 файла)**

1. Расширить `src/domains/video-editing/services/`
   - Добавить cache-stats service
   - Добавить gpu-capabilities service
   - Добавить render-jobs service

2. Обновить `use-video-compiler.ts` для использования domain

3. Обновить тесты

### Фаза 2: AI Features (Приоритет 2) - 1.5 дня

**AI Director (4 файла)**

1. Создать `src/domains/ai-director/`
   - machines/ai-director-machine.ts
   - services/analysis-service.ts
   - services/montage-applicator.ts

2. Рефакторить features

**Subtitles (2 файла)**

1. Создать `src/domains/subtitles/`
   - services/subtitle-import.ts
   - services/subtitle-sync.ts

**Export, Recognition, Montage (3 файла)**

1. Переместить логику в соответствующие domains

### Фаза 3: Остальные Features (Приоритет 3) - 1.5 дня

**Создать недостающие domains:**

1. `src/domains/i18n/` - Language
2. `src/domains/publication/` - Publication
3. `src/domains/ai-chat/` - AI Chat
4. `src/domains/audio/` - Voice Recording

## Примеры рефакторинга

### ❌ До (Неправильно)

```typescript
// src/features/media/hooks/use-media-processor.ts
import { invoke } from "@tauri-apps/api/core"

export function useMediaProcessor() {
  const processVideo = async (path: string) => {
    // Прямой вызов Tauri команды из feature
    const result = await invoke("process_video", { path })
    return result
  }

  return { processVideo }
}
```

### ✅ После (Правильно)

```typescript
// src/domains/media-management/services/media-processor.ts
import { invoke } from "@tauri-apps/api/core"

export class MediaProcessor {
  async processVideo(path: string) {
    // Вызов Tauri команды в domain layer
    const result = await invoke("process_video", { path })
    return result
  }
}

export const mediaProcessor = new MediaProcessor()
```

```typescript
// src/features/media/hooks/use-media-processor.ts
import { mediaProcessor } from "@/domains/media-management/services/media-processor"

export function useMediaProcessor() {
  const processVideo = async (path: string) => {
    // Features используют API из domain
    return await mediaProcessor.processVideo(path)
  }

  return { processVideo }
}
```

## Преимущества после рефакторинга

### ✅ Улучшения

1. **Чистая архитектура**
   - Features знают только о domain API
   - Бизнес-логика в одном месте
   - Легко тестировать

2. **Переиспользование кода**
   - Domain services можно использовать из разных features
   - Нет дублирования логики

3. **Упрощение тестирования**
   - Можно мокировать целый domain
   - Не нужно мокировать `invoke` в каждом тесте
   - Unit-тесты для domain отдельно от UI

4. **Гибкость**
   - Легко заменить бэкенд
   - Можно добавить кэширование в domain
   - Единое место для обработки ошибок

5. **Поддерживаемость**
   - Понятная структура
   - Легко найти логику
   - Проще онбординг новых разработчиков

## Критерии успеха

- ✅ Все 24 файла отрефакторены
- ✅ Ни один feature не импортирует `@tauri-apps/api` напрямую
- ✅ Все тесты проходят
- ✅ Создана документация для новых domains
- ✅ Обновлена архитектурная документация

## Риски и митигация

### Риск 1: Поломка существующего функционала

**Митигация:**
- Рефакторить поэтапно (по 1-2 файла)
- Запускать тесты после каждого изменения
- Делать отдельные коммиты для каждой фазы

### Риск 2: Увеличение количества кода

**Митигация:**
- Переиспользовать domain services
- Не дублировать логику
- Создавать utility функции

### Риск 3: Сложность для разработчиков

**Митигация:**
- Написать примеры использования
- Обновить документацию
- Код-ревью с командой

## Связанные задачи

- `architecture-analysis-report.md` - Общий анализ архитектуры
- Будущая задача: Добавить ESLint rule для проверки импортов

## Примечания

- При рефакторинге НЕ менять логику, только перемещать код
- Тесты должны оставаться зелёными на каждом шаге
- После завершения добавить ESLint правило запрещающее `import { invoke } from "@tauri-apps/api"` в features/

## Чек-лист выполнения

### Фаза 1: Media & Video Compiler
- [x] Создать media-management domain services
  - [x] `file-system-service.ts`
  - [x] `media-preview-service.ts`
  - [x] `media-processor-service.ts`
- [x] Рефакторить 5 media файлов
  - [x] `use-media-preview.ts` ✅
  - [x] `use-frame-preview.ts` ✅
  - [x] `use-media-processor.ts` ✅
  - [x] `use-simple-media-processor.ts` ✅
  - [x] `saved-media-utils.ts` ✅
- [x] Расширить video-editing domain
  - [x] `video-compiler-cache-service.ts`
  - [x] `video-compiler-system-service.ts`
  - [x] `video-compiler-render-service.ts`
- [x] Рефакторить 4 video-compiler файла
  - [x] `use-cache-stats.ts` ✅
  - [x] `use-gpu-capabilities.ts` ✅
  - [x] `use-render-jobs.ts` ✅
  - [x] `use-video-compiler.ts` ✅
- [ ] Обновить тесты
- [ ] Коммит фазы 1

### Фаза 2: AI Features ✅
- [x] Создать ai-director domain ✅
  - [x] `src/domains/ai-director/tauri/ai-director-commands.ts`
  - [x] `src/domains/ai-director/services/ai-director-service.ts`
  - [x] `src/domains/ai-director/machines/ai-director-machine.ts`
  - [x] `src/domains/ai-director/hooks/use-ai-director-events.ts`
  - [x] `src/domains/ai-director/types/` (events.ts, ai-director.ts)
- [x] Рефакторить 4 ai-director файла ✅
  - [x] `ai-director-machine.ts` → re-export from domain
  - [x] `use-ai-director-analysis.ts` → uses domain
  - [x] `use-ai-director-analysis-v2.ts` → uses domain
  - [x] `use-montage-applicator.ts` → uses fileSystemService
- [x] Создать subtitles domain ✅
  - [x] `src/domains/subtitles/tauri/subtitle-commands.ts`
  - [x] `src/domains/subtitles/services/subtitle-service.ts`
  - [x] `src/domains/subtitles/types/index.ts`
- [x] Рефакторить 2 subtitles файла ✅
  - [x] `use-subtitles-import.ts` → uses readSubtitleFile from domain
  - [x] `subtitle-auto-sync.tsx` → uses analyzeAudioPeaks from domain
- [x] Рефакторить export, recognition, montage (3 файла) ✅
  - [x] `use-render-queue.ts` → uses renderProject, getActiveJobs, cancelRender from video-editing
  - [x] `use-recognition-preview.ts` → uses domain recognition commands
  - [x] `use-montage-backend.ts` → uses domain montage-planner commands
- [ ] Обновить тесты
- [ ] Коммит фазы 2

### Фаза 3: Остальные Features
- [ ] Создать i18n domain
- [ ] Создать publication domain
- [ ] Создать ai-chat domain
- [ ] Создать audio domain (если нужен)
- [ ] Рефакторить оставшиеся файлы
- [ ] Обновить тесты
- [ ] Коммит фазы 3

### Финализация
- [ ] Запустить все тесты
- [ ] Обновить документацию
- [ ] Добавить ESLint rule
- [ ] Код-ревью
- [ ] Перенести задачу в completed/

---

**Следующий шаг:** Фаза 3 - Остальные Features (browser, timeline, voice-recording, language, publication, ai-chat)
