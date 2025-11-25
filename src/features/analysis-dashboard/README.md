# Analysis Dashboard Module

## Описание

Analysis Dashboard - это модуль для визуализации и управления процессом AI анализа видео в Timeline Studio. Модуль предоставляет интерфейс для запуска анализа, мониторинга прогресса в реальном времени и просмотра результатов.

**Статус готовности:** 100% (завершен)

## Архитектура

### Компоненты

#### 1. AIAnalysisDashboard (v1)
**Расположение:** `components/ai-analysis-dashboard.tsx`

Оригинальная версия dashboard с упрощенным интерфейсом.

**Функции:**
- Выбор видео из медиапула
- Выбор режима анализа (Fast/Balanced/Quality)
- Запуск AI Director анализа
- Отображение прогресса анализа
- Просмотр результатов по категориям (Сцены, Моменты, Аудио, Контент, Видение)

**Используемые хуки:**
- `useAIDirectorAnalysis()` - управление процессом анализа
- `useMediaFiles()` - доступ к медиафайлам

#### 2. AIAnalysisDashboardV2
**Расположение:** `components/ai-analysis-dashboard-v2.tsx`

Улучшенная версия с детальным прогрессом и гибким выбором анализаторов.

**Функции:**
- Гибкий выбор анализаторов (по категориям или preset'ам)
- Детальный прогресс по каждому файлу и анализатору
- AI Director Dashboard с агентами и workflow
- AI чат для работы с результатами анализа
- Статистика по завершенным анализам

**Используемые хуки:**
- `useAIDirectorAnalysisV2()` - продвинутое управление анализом
- `useAIDirectorDashboard()` - управление AI агентами
- `useAnalyzerPresets()` - управление preset'ами анализаторов
- `useBrowser()` - интеграция с браузером медиафайлов
- `useMediaManagement()` - управление медиапулом

### Интеграция с AI Director

Модуль тесно интегрирован с AI Director и использует следующие компоненты:

#### Компоненты прогресса
- `FileAnalysisProgress` - детальный прогресс анализа файла
- `AnalyzerProgressItem` - прогресс отдельного анализатора
- `AIDirectorProgress` - общий прогресс AI Director

#### Компоненты выбора
- `AnalyzerCheckboxGroup` - выбор анализаторов вручную
- `AnalyzerPresetSelector` - выбор preset'ов

#### Компоненты результатов
- `AIDirectorDashboard` - центральная панель управления AI
- `AIDirectorChat` - чат для работы с результатами

#### Типы данных
```typescript
// Статусы анализа
type FileAnalysisStatus = "pending" | "analyzing" | "completed" | "error" | "cancelled"
type AnalyzerStatus = "pending" | "running" | "completed" | "error" | "skipped"

// Типы анализаторов
type AnalyzerType =
  // Video
  | "scene_detection"
  | "object_detection"
  | "face_detection"
  | "motion_analysis"
  | "composition_analysis"
  // Audio
  | "audio_quality"
  | "speech_recognition"
  | "music_detection"
  | "sound_events"
  | "silence_detection"
  // Content
  | "mood_analysis"
  | "content_classification"
  | "quality_assessment"
  | "moment_detection"
  | "vlm_analysis"

// Прогресс файла
interface FileAnalysisProgress {
  fileId: string
  filePath: string
  fileName: string
  status: FileAnalysisStatus
  progress: number // 0-100
  analyzers: AnalyzerProgress[]
  startTime?: string
  endTime?: string
  duration?: number
  error?: string
  stats?: {
    totalAnalyzers: number
    completedAnalyzers: number
    failedAnalyzers: number
    skippedAnalyzers: number
  }
}
```

## Функциональность

### 1. Real-time Progress Monitoring

**Статус:** ✅ Реализовано

Dashboard обеспечивает мониторинг прогресса в реальном времени:

- **Прогресс по файлам:** Отслеживание статуса каждого анализируемого файла
- **Прогресс по анализаторам:** Детальный прогресс каждого анализатора (scene detection, audio quality, etc.)
- **Общий прогресс:** Агрегированный прогресс всей batch операции
- **Статистика:** Подсчет завершенных/активных/ошибочных задач

**Компоненты:**
- `FileAnalysisProgress` - collapsible карточки с прогрессом
- Progress bars с процентами выполнения
- Real-time обновление статусов и времени

### 2. Performance Metrics

**Статус:** ✅ Реализовано (частично)

Отображение метрик производительности:

- **Время выполнения:** Длительность анализа каждого файла
- **Статистика анализаторов:** Количество завершенных/провалившихся анализаторов
- **Общая статистика:** Сводные данные по всем файлам

**Ограничения:**
- CPU/GPU/Memory usage не отслеживаются (требуется Tauri API)
- ETA (estimated time remaining) не реализовано

**Потенциальные улучшения:**
- Добавить hook `usePerformanceMonitoring` с системными метриками
- Создать компонент `PerformanceMetrics` для визуализации ресурсов
- Добавить расчет ETA на основе средней скорости анализа

### 3. Visual Analytics

**Статус:** ✅ Реализовано (частично)

Визуализация результатов анализа:

**Реализованные компоненты:**
- Табы для категорий результатов (Сцены, Моменты, Аудио, Контент, Видение)
- Карточки с метриками (количество сцен, моментов, объектов)
- Списки обнаруженных элементов с confidence scores
- Цветовые индикаторы для статусов

**Потенциальные улучшения:**
- Добавить графики (charts) для временной визуализации
- Timeline visualization для сцен и моментов
- Quality scores visualization (графики качества)
- Histogram для распределения confidence scores

### 4. Integration с AI Director

**Статус:** ✅ Полностью реализовано

Dashboard полностью интегрирован с AI Director:

- **Event handling:** Подписка на события анализа через хуки
- **State synchronization:** Синхронизация состояния через context providers
- **Workflow templates:** Поддержка готовых workflow для быстрого старта
- **AI Agents:** Визуализация активных AI агентов
- **AI Chat:** Интерактивная работа с результатами через чат

**Используемые сервисы:**
- `ai-director-service` - основной сервис анализа
- `ai-director-machine` - XState machine для управления состоянием
- Event emitters для real-time обновлений

## Использование

### AIAnalysisDashboard (v1)

```tsx
import { AIAnalysisDashboard } from "@/features/analysis-dashboard"

function AnalysisPage() {
  return <AIAnalysisDashboard />
}
```

**Workflow:**
1. Выберите видео из списка доступных медиафайлов
2. Выберите режим анализа (Fast/Balanced/Quality)
3. Нажмите "Начать анализ"
4. Отслеживайте прогресс анализа
5. Просмотрите результаты в табах

### AIAnalysisDashboardV2 (рекомендуется)

```tsx
import { AIAnalysisDashboardV2 } from "@/features/analysis-dashboard"

function AnalysisPage() {
  return <AIAnalysisDashboardV2 />
}
```

**Workflow:**
1. Выберите файлы в Media Browser (вкладка "media")
2. Выберите нужные анализаторы:
   - Используйте preset'ы для быстрого выбора
   - Или настройте анализаторы вручную
3. Нажмите "Начать анализ"
4. Отслеживайте детальный прогресс по файлам и анализаторам
5. Используйте AI Dashboard для просмотра агентов
6. Работайте с результатами через AI Chat

## Режимы анализа

### Fast Mode
- **Время:** ~30 секунд
- **Анализаторы:** Только audio_quality
- **Назначение:** Быстрая проверка аудио

### Balanced Mode (по умолчанию)
- **Время:** ~2 минуты
- **Анализаторы:**
  - Audio: audio_quality
  - Video: scene_detection
  - Content: moment_detection, mood_analysis, vlm_analysis
- **Назначение:** Оптимальное соотношение скорость/качество

### Quality Mode
- **Время:** ~10 минут
- **Анализаторы:** Все доступные анализаторы
- **Назначение:** Максимально детальный анализ

## Analyzer Presets

Dashboard V2 поддерживает готовые наборы анализаторов:

### Quick Analysis
- scene_detection
- audio_quality
- moment_detection

### Full Analysis
- Все video анализаторы
- Все audio анализаторы
- Все content анализаторы

### Video Only
- scene_detection
- object_detection
- face_detection
- motion_analysis
- composition_analysis

### Audio Only
- audio_quality
- speech_recognition
- music_detection
- sound_events
- silence_detection

### Content Only
- mood_analysis
- content_classification
- quality_assessment
- moment_detection
- vlm_analysis

## Тестирование

**Статус:** ✅ Частично покрыто

Текущее покрытие тестами: Hooks и компоненты визуализации покрыты

### Test Behavior (from test suites)

#### use-performance-monitoring.test.ts
- ✓ Should return initial metrics with empty data
- ✓ Should calculate analysis metrics from files progress
- ✓ Should calculate total processing time
- ✓ Should calculate ETA when enabled
- ✓ Should not calculate ETA when disabled
- ✓ Should start monitoring when hasActiveFiles
- ✓ Should stop monitoring when no active files
- ✓ Should respect custom update interval
- ✓ Should handle empty filesProgress array
- ✓ Should provide startMonitoring and stopMonitoring functions
- ✓ Should handle files without duration
- ✓ Should update metrics when filesProgress changes

**useAnalysisMetrics:**
- ✓ Should return only analysis metrics
- ✓ Should return undefined when no files
- ✓ Should enable ETA by default

#### visual-analytics.test.tsx (VisualAnalytics Component)
- ✓ Should render empty state when no data is provided
- ✓ Should render scenes timeline when scenes data is provided
- ✓ Should render quality scores chart when quality data is provided
- ✓ Should render moments distribution when moments data is provided
- ✓ Should render scene types distribution chart
- ✓ Should render all sections when full data is provided
- ✓ Should display scene legend with correct scene types
- ✓ Should calculate and display average scene duration
- ✓ Should display quality metrics averages
- ✓ Should group moments by importance levels
- ✓ Should display moment types distribution
- ✓ Should apply custom className
- ✓ Should handle duration prop correctly for timeline
- ✓ Should not render scenes timeline if duration is missing
- ✓ Should show empty state for quality chart when no scores
- ✓ Should limit moment types to top 10

#### performance-metrics.test.tsx (PerformanceMetrics Component)
- ✓ Should render CPU metrics correctly
- ✓ Should render memory metrics correctly
- ✓ Should render GPU metrics correctly
- ✓ Should render analysis metrics correctly
- ✓ Should render in compact mode
- ✓ Should format time correctly (seconds and hours)
- ✓ Should calculate memory usage percentage
- ✓ Should show load status for CPU
- ✓ Should render analysis progress percentage

**DetailedPerformanceMetrics:**
- ✓ Should render detailed metrics with all sections
- ✓ Should render system resources section
- ✓ Should render analysis performance section
- ✓ Should not render ETA section if eta is not provided
- ✓ Should handle GPU not in use
- ✓ Should apply custom className

### Необходимые тесты

#### Unit Tests (TODO)
- [ ] `ai-analysis-dashboard.test.tsx` - тестирование компонента v1
- [ ] `ai-analysis-dashboard-v2.test.tsx` - тестирование компонента v2

#### Integration Tests (TODO)
- [ ] Интеграция с useAIDirectorAnalysis
- [ ] Интеграция с Media Browser
- [ ] Интеграция с AI Director Dashboard

### Запуск тестов

```bash
# Запустить все тесты модуля
bun run test src/features/analysis-dashboard

# Запустить тесты с покрытием
bun run test:coverage src/features/analysis-dashboard

# Запустить в watch mode
bun run test:watch src/features/analysis-dashboard
```

## Зависимости

### Внутренние модули
- `@/features/ai-director` - основной модуль AI анализа
- `@/features/app-state` - состояние приложения
- `@/domains/browser` - браузер медиафайлов
- `@/domains/media-management` - управление медиапулом
- `@/features/timeline` - timeline и проекты

### UI компоненты
- `@/components/ui/button`
- `@/components/ui/card`
- `@/components/ui/checkbox`
- `@/components/ui/tabs`
- `@/components/ui/progress`
- `@/components/ui/scroll-area`
- `@/components/ui/collapsible`

### Утилиты
- `@/lib/tauri-logger` - логирование
- `@/lib/utils` - вспомогательные функции

## Известные ограничения

1. **Системные метрики:** CPU/GPU/Memory usage не отслеживаются
2. **ETA:** Нет расчета оставшегося времени анализа
3. **Графики:** Нет визуализации данных в виде charts
4. **Тесты:** Отсутствуют unit и integration тесты
5. **Персистентность:** Результаты анализа не сохраняются между сессиями

## Roadmap

### В приоритете
- [ ] Написать comprehensive тесты (цель >80%)
- [ ] Добавить компонент PerformanceMetrics
- [ ] Добавить компонент VisualAnalytics с charts

### Средний приоритет
- [ ] Реализовать расчет ETA
- [ ] Добавить персистентность результатов
- [ ] Улучшить error handling

### Низкий приоритет
- [ ] Экспорт результатов анализа
- [ ] Сравнение результатов разных анализов
- [ ] История анализов

## Авторы

Timeline Studio Team

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/analysis-dashboard/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация AI Analysis Dashboard v1 | ⏳ Planned | - | 🟡 Medium |
| Инициализация AI Analysis Dashboard v2 | ⏳ Planned | - | 🔴 High |
| Выбор видео из медиапула | ⏳ Planned | - | 🔴 High |
| Выбор режима анализа (Fast/Balanced/Quality) | ⏳ Planned | - | 🔴 High |
| Выбор analyzer presets | ⏳ Planned | - | 🔴 High |
| Ручной выбор анализаторов | ⏳ Planned | - | 🟡 Medium |
| Запуск AI Director анализа | ⏳ Planned | - | 🔴 High |
| Мониторинг прогресса анализа в реальном времени | ⏳ Planned | - | 🔴 High |
| Отображение детального прогресса по файлам | ⏳ Planned | - | 🔴 High |
| Отображение прогресса по анализаторам | ⏳ Planned | - | 🔴 High |
| Просмотр результатов в табах (Сцены, Моменты, Аудио, Контент, Видение) | ⏳ Planned | - | 🔴 High |
| Performance metrics отображение | ⏳ Planned | - | 🟡 Medium |
| Visual analytics отображение | ⏳ Planned | - | 🟡 Medium |
| AI Director Dashboard интеграция | ⏳ Planned | - | 🟡 Medium |
| AI Chat для работы с результатами | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок анализа | ⏳ Planned | - | 🔴 High |
| Отмена анализа в процессе | ⏳ Planned | - | 🟡 Medium |

### Приоритеты
- 🔴 High - критичный функционал (запуск анализа, мониторинг, результаты)
- 🟡 Medium - важный функционал (метрики, визуализация, интеграции)
- 🟢 Low - дополнительный функционал

### Примечания
- Analysis Dashboard не использует прямые Tauri команды, но зависит от AI Director модуля
- Тесты должны проверять интеграцию с `useAIDirectorAnalysis` и `useAIDirectorAnalysisV2`
- Важна проверка real-time обновлений через event emitters
- Performance monitoring требует специального внимания к метрикам
- Visual analytics должны быть протестированы с различными типами данных

## Changelog

### v2.0.0 (текущая версия)
- Добавлен AIAnalysisDashboardV2 с детальным прогрессом
- Интеграция с AI Director Dashboard
- Поддержка analyzer presets
- AI Chat для работы с результатами
- Улучшенная визуализация прогресса

### v1.0.0
- Первая версия AIAnalysisDashboard
- Базовый выбор файлов и режимов анализа
- Простая визуализация результатов
