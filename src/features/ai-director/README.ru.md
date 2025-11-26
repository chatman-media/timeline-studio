# AI Director

**Русский** | [English](./README.md)

## Обзор

AI Director - это комплексный оркестратор анализа медиа, предоставляющий интеллектуальный анализ видео, обнаружение сцен, планирование монтажа и автоматизацию рабочих процессов. Служит центральным движком AI-анализа для Timeline Studio.

## Статус

- ✅ **Компоненты**: Dashboard, планировщик монтажа, отслеживание прогресса, селектор шаблонов
- ✅ **Хуки**: Управление анализом, пресеты, применение монтажа
- ✅ **Сервисы**: XState машина, сервисный слой с backend интеграцией
- ✅ **Тесты**: 60+ интеграционных тестов полного workflow

## Структура

```
ai-director/
├── components/        # UI компоненты
│   ├── ai-director-chat.tsx
│   ├── ai-director-dashboard.tsx
│   ├── ai-director-modal.tsx
│   ├── analyzer-checkbox-group.tsx
│   ├── analyzer-preset-selector.tsx
│   ├── analyzer-progress-item.tsx
│   ├── file-analysis-progress.tsx
│   ├── montage-plan-editor.tsx
│   ├── montage-plan-preview.tsx
│   ├── montage-template-selector.tsx
│   └── v3/           # V3 dashboard компоненты
├── hooks/            # React хуки
│   ├── use-ai-director.tsx
│   ├── use-ai-director-analysis.tsx
│   ├── use-analyzer-presets.tsx
│   ├── use-montage-applicator.tsx
│   └── use-montage-template.tsx
├── services/         # Бизнес-логика и state машины
│   ├── ai-director-machine.ts
│   └── ai-director-service.ts
├── types/           # TypeScript типы
│   ├── ai-director.ts
│   ├── analysis-progress.ts
│   ├── analyzer-presets.ts
│   ├── dashboard.ts
│   ├── montage-plan.ts
│   └── montage-templates.ts
├── utils/           # Утилиты
│   ├── montage-plan-io.ts
│   └── montage-plan-parser.ts
└── __tests__/       # Тестовые файлы
    └── integration/
```

## Возможности

### ✅ Реализовано

- [x] **Режимы анализа**: Fast (~30с), Balanced (~2мин), Quality (~10мин)
- [x] **Видео анализаторы**: scene_detection, object_detection, face_detection, motion_analysis, composition_analysis
- [x] **Аудио анализаторы**: audio_quality, speech_recognition, music_detection, sound_events, silence_detection
- [x] **Контент анализаторы**: mood_analysis, content_classification, quality_assessment, moment_detection, vlm_analysis
- [x] **Планирование монтажа**: Генерация на основе шаблонов (TikTok, Highlight Reel и др.)
- [x] **Dashboard функции**: Real-time мониторинг прогресса, визуализация AI агентов, workflow шаблоны
- [x] **Выбор клипов по качеству**: Автоматическая фильтрация по порогу качества
- [x] **Редактирование по ритму**: Нарезка по битам
- [x] **Мультифайловый монтаж**: Поддержка нескольких исходных файлов
- [x] **Экспорт/Импорт**: Сериализация планов монтажа

### ❌ Не реализовано

- [ ] Real-time превью во время анализа
- [ ] Индикаторы GPU ускорения
- [ ] Пользовательские плагины анализаторов

## Использование

```typescript
import { AIDirectorService } from '@/features/ai-director'

// Комплексный анализ
const service = AIDirectorService.getInstance()
const result = await service.analyzeComprehensive('/path/to/video.mp4', {
  mode: 'balanced'
})

// Быстрый анализ
const quickResult = await service.analyzeQuick('/path/to/video.mp4')

// Пакетный анализ
const batchResults = await service.analyzeBatch([
  '/path/to/video1.mp4',
  '/path/to/video2.mp4'
])

// Получить возможности системы
const capabilities = await service.getCapabilities()

// Проверка здоровья
const health = await service.healthCheck()
```

## Интеграция

- **Зависит от**: `@/domains/ai-services`, `@/domains/media-management`, `@/features/app-state`, `@/features/timeline`
- **Используется в**: `@/features/analysis-dashboard`, `@/features/ai-chat`

## Тестирование

- **Всего тестов**: 60+ интеграционных тестов
- **Покрытие**: Комплексный workflow, интеграции и тесты шаблонов

### Тестовые наборы

- `ai-workflow.test.tsx` - Полный workflow анализа (30+ тестов)
- `montage-planner-integration.test.tsx` - Интеграция планирования монтажа (15+ тестов)
- `workflow-templates.test.tsx` - Валидация встроенных шаблонов (15+ тестов)

### Запуск тестов

```bash
# Запустить все AI Director тесты
bun run test src/features/ai-director/

# Запустить конкретные наборы
bun run test src/features/ai-director/__tests__/integration/ai-workflow.test.tsx
bun run test src/features/ai-director/__tests__/integration/montage-planner-integration.test.tsx
```

## TODO / Дорожная карта

### Высокий приоритет
- [ ] Real-time генерация превью во время анализа
- [ ] Оптимизация производительности для пакетной обработки
- [ ] Улучшенные механизмы восстановления после ошибок

### Средний приоритет
- [ ] Система пользовательских плагинов анализаторов
- [ ] Индикаторы GPU ускорения в UI
- [ ] Продвинутые инструменты редактирования планов монтажа
- [ ] Кэширование результатов анализа

### Низкий приоритет
- [ ] История и сравнение анализов
- [ ] Экспорт отчетов анализа (PDF, JSON)
- [ ] Интеграция с внешними сервисами анализа

## E2E тесты

**Расположение**: `e2e/tauri/features/ai-director/`

**Статус**: 11 тестов реализовано в `backend-integration.spec.ts` покрывающих:
- Инициализацию Tauri backend
- Команды: `ai_director_get_capabilities`, `ai_director_get_default_config`, `ai_director_health_check`
- Настройку event listeners
- UI навигацию и интеграцию

**Запланировано**: Analysis workflows, пакетная обработка, real-time события прогресса, генерация планов монтажа
