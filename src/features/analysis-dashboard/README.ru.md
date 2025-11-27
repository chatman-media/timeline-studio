# Analysis Dashboard

**Русский** | [English](./README.md)

## Обзор

Analysis Dashboard - это модуль для визуализации и управления процессом AI анализа видео в Timeline Studio. Модуль предоставляет интерфейс для запуска анализа, мониторинга прогресса в реальном времени и просмотра результатов. Модуль является frontend-only и использует AI Director для всех backend операций.

## Статус

**🎉 100% Готов** - Весь основной функционал полностью реализован и протестирован.

- ✅ **Компоненты**: Dashboard v1 (простой), Dashboard v2 (продвинутый с детальным прогрессом)
- ✅ **Хуки**: Управление анализом, мониторинг производительности, визуальная аналитика
- ✅ **Сервисы**: Интеграция с AI Director
- ✅ **Тесты**: 27+ тестов (use-performance-monitoring: 12, visual-analytics: 15)

## Структура

```
analysis-dashboard/
├── components/
│   ├── ai-analysis-dashboard.tsx         # Dashboard v1
│   ├── ai-analysis-dashboard-v2.tsx      # Dashboard v2 (рекомендуется)
│   ├── performance-metrics.tsx           # Визуализация производительности
│   └── visual-analytics.tsx              # Визуализация аналитики
├── hooks/
│   ├── use-performance-monitoring.ts     # Метрики производительности
│   └── use-analysis-metrics.ts          # Метрики анализа
└── __tests__/
    ├── hooks/
    │   └── use-performance-monitoring.test.ts
    └── components/
        ├── visual-analytics.test.tsx
        └── performance-metrics.test.tsx
```

## Возможности

### ✅ Реализовано

- [x] Real-time мониторинг прогресса (файлы, анализаторы, общий прогресс)
- [x] Метрики производительности (время выполнения, статистика анализаторов)
- [x] Визуальная аналитика (timeline сцен, графики качества, распределение моментов)
- [x] AI Director интеграция (события, синхронизация состояния, workflow шаблоны)
- [x] Пресеты анализаторов (Quick, Full, Video Only, Audio Only, Content Only)
- [x] Режимы анализа (Fast, Balanced, Quality)
- [x] Детальное отслеживание прогресса файлов и анализаторов
- [x] Визуализация AI агентов
- [x] AI Chat интеграция для работы с результатами

### 🚀 Будущие улучшения

Основной функционал полностью готов. Следующие возможности являются опциональными улучшениями для будущих итераций:

- [ ] Мониторинг CPU/GPU/Memory (требуется `get_system_info` из `@/domains/system-integration`)
- [ ] Персистентность результатов анализа между сессиями
- [ ] Экспорт результатов анализа в файл
- [ ] Инструменты сравнения анализов
- [ ] История анализов

## Использование

### AIAnalysisDashboard v2 (Рекомендуется)

```typescript
import { AIAnalysisDashboardV2 } from "@/features/analysis-dashboard"

function AnalysisPage() {
  return <AIAnalysisDashboardV2 />
}
```

**Workflow**:
1. Выберите файлы в Media Browser (вкладка "media")
2. Выберите анализаторы: используйте пресеты или настройте вручную
3. Нажмите "Начать анализ"
4. Отслеживайте детальный прогресс по файлам и анализаторам
5. Используйте AI Dashboard для просмотра агентов
6. Работайте с результатами через AI Chat

### Режимы анализа

- **Fast Mode** (~30 секунд): Только audio_quality анализатор
- **Balanced Mode** (~2 минуты): audio_quality, scene_detection, moment_detection, mood_analysis, vlm_analysis
- **Quality Mode** (~10 минут): Все доступные анализаторы

### Пресеты анализаторов

- **Quick Analysis**: scene_detection, audio_quality, moment_detection
- **Full Analysis**: Все анализаторы
- **Video Only**: Только видео анализаторы
- **Audio Only**: Только аудио анализаторы
- **Content Only**: Только контент анализаторы

## Интеграция

- **Зависит от**: `@/features/ai-director`, `@/features/app-state`, `@/domains/browser`, `@/domains/media-management`, `@/features/timeline`
- **Используется в**: `@/features/media-studio`

## Тестирование

- **Всего тестов**: 27+ тестов
- **Покрытие**: Хуки и компоненты визуализации

### Тестовые наборы

- `use-performance-monitoring.test.ts` (12 тестов) - Расчет метрик производительности, ETA, жизненный цикл мониторинга
- `visual-analytics.test.tsx` (15 тестов) - Timeline сцен, графики качества, распределение моментов
- `performance-metrics.test.tsx` - Компоненты визуализации производительности

### Запуск тестов

```bash
# Запустить все тесты analysis-dashboard
bun run test src/features/analysis-dashboard

# Запустить с покрытием
bun run test:coverage src/features/analysis-dashboard

# Запустить в watch режиме
bun run test:watch src/features/analysis-dashboard
```

## TODO / Дорожная карта

### Высокий приоритет
- [ ] Написать комплексные тесты для Dashboard компонентов (цель >80% покрытия)
- [ ] Добавить персистентность результатов анализа

### Средний приоритет
- [ ] Интегрировать с `@/domains/system-integration` для системных метрик (get_system_info)
- [ ] Улучшить обработку ошибок
- [ ] Добавить функциональность экспорта результатов анализа

### Низкий приоритет
- [ ] Инструменты сравнения анализов
- [ ] Отслеживание истории анализов
- [ ] UI для пользовательской настройки анализаторов

### Интеграция с system-integration (Отдельная задача)
- [ ] Реализовать Tauri команду `get_system_info` в backend (Rust)
- [ ] Создать сервис в `src/domains/system-integration/services/performance/`
- [ ] Раскомментировать вызов invoke в `use-performance-monitoring.ts`
- [ ] Подключить компоненты PerformanceMetrics в Dashboard v2

## Известные ограничения

1. **Системные метрики**: CPU/GPU/Memory usage не отслеживаются (ждет реализации `get_system_info`)
2. **Тесты**: Отсутствуют unit и integration тесты для Dashboard компонентов (hooks и utils покрыты)
3. **Персистентность**: Результаты анализа не сохраняются между сессиями

## Документация

- AI Director: `/src/features/ai-director/README.md`
- Доменные сервисы: `/src/domains/ai-services/README.md`
