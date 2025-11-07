# Доработка модуля Export до 100% готовности

## 📋 Обзор

Критические исправления модуля Export для достижения заявленной 100% готовности. Выявлены серьезные пробелы в реализации социальных сетей и экспорта секций.

## 📊 Текущее состояние

### ✅ Что работает (65-70%):
- **Локальный экспорт** - полностью функционален через video-compiler
- **UI компоненты** - все 4 вкладки реализованы и работают
- **Пресеты экспорта** - конфигурации для всех платформ готовы
- **Базовая OAuth инфраструктура** - структура авторизации создана
- **Типизация** - полные TypeScript типы и константы
- **Тестирование** - хорошее покрытие базового функционала

### ❌ Критические пробелы (30-35%):

#### 1. 🚫 Социальные сети - НЕ РАБОТАЮТ
**Файл:** `src/features/export/hooks/use-social-export.ts`
- **Строки 54-56:** `uploadToSocialNetwork` выбрасывает ошибку "Social media upload requires file reading implementation in Tauri"
- **Отсутствует:** Чтение файлов через Tauri API
- **Результат:** Все загрузки в YouTube, TikTok, Vimeo, Telegram не функциональны

#### 2. 🚫 Экспорт секций - MOCK ДАННЫЕ
**Файл:** `src/features/export/components/section-export-tab.tsx`
- **Строки 52-53:** "TODO: Implement markers functionality when TimelineProject supports markers"
- **Строки 70-71:** "TODO: Implement clips functionality when TimelineProject supports tracks/clips"
- **Результат:** Использует демо-данные вместо реальных секций timeline

#### 3. 🚫 Пакетный экспорт - НЕПОЛНАЯ ИНТЕГРАЦИЯ
**Файл:** `src/features/export/hooks/use-render-queue.ts`
- **Строка 107:** `duration: 60, // TODO: Получить из реального проекта`
- **Строка 111:** Hardcoded aspect ratio без вычисления
- **Результат:** Неточные данные для рендеринга проектов

#### 4. 🚫 Отсутствующие сервисы
**Файл:** `src/features/export/services/social-networks-service.ts`
- **Строка 63:** "User info not implemented for {network}"
- **Строка 108:** "Upload not implemented for {network}"
- **Результат:** Заглушки вместо реальной функциональности

## 🎯 План исправления

### Этап 1: Критические исправления (2-3 дня) 🔴

#### 1.1 Реализовать чтение файлов для социальных сетей
```typescript
// В use-social-export.ts заменить:
throw new Error("Social media upload requires file reading implementation in Tauri")

// На реальную реализацию:
const fileData = await readBinaryFile(videoPath)
const videoBlob = new Blob([fileData], { type: 'video/mp4' })
```

#### 1.2 Интегрировать реальные данные timeline
```typescript
// В section-export-tab.tsx заменить демо-данные:
const demoSections = [ /* mock data */ ]

// На реальные данные из timeline:
const realSections = timeline.markers.map(marker => ({ /* real data */ }))
```

#### 1.3 Добавить полную загрузку проекта
```typescript
// В use-render-queue.ts заменить hardcoded значения:
duration: 60, // TODO
aspect_ratio: AspectRatio.Ratio16x9, // TODO

// На реальные данные проекта:
duration: project.totalDuration,
aspect_ratio: calculateAspectRatio(project.resolution),
```

### Этап 2: Социальные сети (1-2 дня) 🟡

#### 2.1 Реализовать upload для каждой платформы
- YouTube API интеграция
- TikTok API интеграция  
- Vimeo API интеграция
- Telegram Bot API интеграция

#### 2.2 OAuth token refresh
```typescript
// В oauth-service.ts заменить:
throw new Error(`Token refresh not implemented for ${network}`)

// На реальную реализацию refresh токенов
```

### Этап 3: Валидация и полировка (1 день) 🟢

#### 3.1 Добавить валидацию
- Проверка размера файлов для каждой соцсети
- Валидация длительности видео
- Проверка форматов и разрешений

#### 3.2 Исправить TODO/FIXME
- Убрать все TODO комментарии
- Заменить заглушки на реальные реализации
- Добавить error handling

## 📝 Файлы требующие изменений

### Критические:
1. `src/features/export/hooks/use-social-export.ts` - реализовать чтение файлов
2. `src/features/export/components/section-export-tab.tsx` - интегрировать timeline данные
3. `src/features/export/hooks/use-render-queue.ts` - добавить реальные данные проекта
4. `src/features/export/services/social-networks-service.ts` - реализовать upload методы

### Дополнительные:
5. `src/features/export/services/oauth-service.ts` - token refresh
6. `src/features/export/README.md` - обновить статус готовности
7. `docs-ru/10-roadmap/completed/export-module-completion.md` - переместить в in-progress

## 🔍 Детали проблем

### Пример кода с проблемой:
```typescript
// use-social-export.ts:54-56
const uploadToSocialNetwork = useCallback(async (videoPath: string, settings: SocialExportSettings) => {
  // TODO: Implement file reading from path in Tauri
  throw new Error("Social media upload requires file reading implementation in Tauri")
}, [])
```

### Что должно быть:
```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ExportModuleCompletionFixes')

const uploadToSocialNetwork = useCallback(async (videoPath: string, settings: SocialExportSettings) => {
  try {
    const fileData = await readBinaryFile(videoPath)
    const videoBlob = new Blob([fileData], { type: 'video/mp4' })
    
    const result = await SocialNetworksService.uploadVideo(settings.platform, videoBlob, {
      title: settings.title,
      description: settings.description,
      tags: settings.tags,
      privacy: settings.privacy,
      onProgress: setUploadProgress,
    })
    
    return result
  } catch (error) {
    logger.errorSync('Upload failed:', error)
    throw error
  }
}, [])
```

## ⏱️ Временные рамки

- **Общий объем:** 4-6 дней
- **Критический путь:** Социальные сети (требует API интеграций)
- **Параллельно:** Валидация и полировка кода
- **Результат:** Полностью функциональный модуль Export (100%)

## 🎯 Критерии завершения

### Обязательные:
- [ ] Социальные сети реально загружают видео
- [ ] Экспорт секций использует реальные данные timeline
- [ ] Пакетный экспорт корректно обрабатывает проекты
- [ ] Все TODO/FIXME комментарии исправлены
- [ ] Валидация файлов и настроек работает

### Желательные:
- [ ] Прогресс загрузки для всех платформ
- [ ] Error recovery и retry механизмы
- [ ] Расширенная валидация контента
- [ ] Оптимизация для больших файлов

## 📊 Влияние на общую готовность

**До исправления:** Export 65-70% (заявлено 100%)
**После исправления:** Export 95-100% (реально)
**Влияние на проект:** Восстановление доверия к оценкам готовности

---

*Создано: 24 июня 2025* | *Статус: 🔄 В работе* | *Приоритет: Критический* | *Исполнитель: Frontend/Backend команда*