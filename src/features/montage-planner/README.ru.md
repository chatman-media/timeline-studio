# Smart Montage Planner

[English](./README.md) | **Русский**

## Обзор

AI-система интеллектуального планирования монтажа, которая анализирует видео/аудио контент, обнаруживает ключевые моменты и генерирует оптимизированные планы монтажа с использованием YOLO детекции, FFmpeg анализа и генетических алгоритмов.

## Статус

- ✅ **Компоненты**: Полный dashboard с анализом, редактированием и превью
- ✅ **Хуки**: Полная React интеграция с backend сервисами
- ✅ **Backend интеграция**: YOLO, FFmpeg, оптимизация генетическим алгоритмом
- ✅ **Тесты**: 1 тестовый файл с покрытием всех backend команд

## Структура

```
montage-planner/
├── components/
│   ├── planner-dashboard/     # Главная панель управления
│   ├── analysis/              # Компоненты анализа контента
│   ├── editor/                # Компоненты редактирования планов
│   └── montage-planner.tsx    # Главный компонент
├── hooks/
│   ├── use-montage-planner.ts     # Основной хук
│   ├── use-content-analysis.ts    # Анализ контента
│   ├── use-montage-backend.ts     # Связь с backend
│   └── use-timeline-integration.ts # Интеграция с Timeline
├── services/
│   ├── montage-planner-machine.ts # XState машина
│   ├── content-analyzer.ts        # Сервис анализа
│   ├── moment-detector.ts         # Детектор ключевых моментов
│   └── plan-generator.ts          # Генерация планов
└── types/
    └── index.ts                   # TypeScript определения
```

## Возможности

### ✅ Реализовано

- [x] Автоматический анализ видео/аудио контента (YOLO + FFmpeg)
- [x] Детекция ключевых моментов с оценкой качества
- [x] Генерация планов монтажа генетическим алгоритмом
- [x] Множество предустановленных стилей (Dynamic Action, Cinematic, Music Video и др.)
- [x] Поддержка создания пользовательских стилей
- [x] Интеграция с Timeline (применение планов, создание маркеров)
- [x] Real-time превью с метриками качества
- [x] Расчёт ритма и темпа
- [x] Профилирование эмоциональной дуги
- [x] Интеграция детекции лиц и объектов

### ❌ Не реализовано

- [ ] Система кэширования результатов анализа
- [ ] Export/import UI для планов (backend готов)
- [ ] Расширенные алгоритмы детекции темпа
- [ ] Продвинутая синхронизация с битом для музыкальных видео

## Использование

### Базовая настройка

```typescript
import { MontagePlannerProvider } from '@/features/montage-planner'

function App() {
  return (
    <MontagePlannerProvider>
      <YourComponent />
    </MontagePlannerProvider>
  )
}
```

### Анализ и генерация

```typescript
import { useMontagePlanner } from '@/features/montage-planner/hooks'

function PlannerComponent() {
  const {
    analyzeProject,
    generatePlan,
    applyToTimeline
  } = useMontagePlanner()

  const handleGenerate = async () => {
    await analyzeProject()
    const plan = await generatePlan({
      style: 'cinematic-drama',
      targetDuration: 300,
      quality: 'high'
    })
    await applyToTimeline(plan)
  }
}
```

### Доступные стили

- **Dynamic Action** - Быстрый ритм, много переходов
- **Cinematic Drama** - Медленный темп, эмоциональные паузы
- **Music Video** - Синхронизация с битом
- **Documentary** - Естественный ритм, информативность
- **Social Media** - Fast-paced, привлечение внимания
- **Corporate** - Профессиональный, размеренный темп

## Интеграция

- **Зависит от**: `@/features/recognition` (YOLO), `@/features/timeline`, `@tauri-apps/api`, FFmpeg, YOLO модели
- **Используется в**: Рабочий процесс монтажа, AI Director для автоматического создания видео
- **Backend**: 6 Tauri команд (analyze_video_composition, detect_key_moments, generate_montage_plan, analyze_video_quality, analyze_frame_quality, analyze_audio_content)

## Тестирование

- **Всего тестов**: 1 тестовый файл (use-montage-backend.test.ts)
- **Покрытие**: Все 6 backend команд, обработка ошибок, управление состоянием
- Протестированные backend команды:
  - ✓ analyzeVideoComposition - Анализ видео с YOLO
  - ✓ detectKeyMoments - Детекция ключевых моментов
  - ✓ generateMontagePlan - Оптимизация генетическим алгоритмом
  - ✓ analyzeVideoQuality - FFmpeg анализ качества
  - ✓ analyzeFrameQuality - Метрики конкретного кадра
  - ✓ analyzeAudioContent - Извлечение аудио фич

Запуск тестов:
```bash
bun run test src/features/montage-planner
```

## Производительность

- **Скорость анализа**: <5 минут для 1 часа материала
- **Генерация плана**: <30 секунд
- **Real-time превью**: Мгновенные обновления
- **Параллельная обработка**: Оптимизированная backend обработка
- **Кэширование**: Рекомендуется для повторных операций

## TODO / Roadmap

- [ ] Реализовать слой кэширования результатов анализа
- [ ] Добавить export/import UI для планов монтажа
- [ ] Улучшить детекцию темпа с ML алгоритмами
- [ ] Добавить продвинутую синхронизацию с битом для музыкальных видео
- [ ] Создать маркетплейс пресетов для пользовательских стилей
- [ ] Реализовать совместное планирование монтажа
- [ ] Добавить A/B тестирование разных вариаций монтажа
