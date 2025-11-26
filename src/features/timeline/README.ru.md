# Timeline

[English](./README.md) | **Русский**

## Обзор

Timeline - это основной компонент редактирования Timeline Studio, предоставляющий комплексные возможности редактирования видео-таймлайна с поддержкой множественных треков, управления клипами и синхронизации с видеоплеером в реальном времени.

## Статус

- ✅ **Компоненты**: Полностью реализованы с модульной архитектурой провайдеров
- ✅ **Хуки**: 6+ хуков для треков, клипов, выделения и действий
- ✅ **Сервисы**: XState машина с интеграцией backend
- ✅ **Тесты**: 1793 теста успешно пройдены (100% успешности)

## Структура

```
timeline/
├── components/           # UI компоненты (Timeline, Track, Clip)
│   └── README.md        # Документация компонентов
├── hooks/               # React хуки (useTracks, useClips, и т.д.)
│   └── README.md        # Документация хуков
├── services/            # XState машины и бизнес-логика
│   ├── providers/       # Модульные context провайдеры
│   └── README.md        # Документация сервисов
├── types/               # TypeScript определения типов
│   └── README.md        # Документация типов
├── utils/               # Вспомогательные функции и утилиты
│   └── README.md        # Документация утилит (8 утилит с поддержкой keyframe)
└── __tests__/          # Файлы тестов (1793 теста)
```

## Возможности

### ✅ Реализовано

**Управление треками:**
- [x] Создание видео/аудио треков (backend команды)
- [x] Удаление, переименование, блокировка/разблокировка треков
- [x] Скрытие/показ треков (UI состояние)
- [x] Track компоненты с полной функциональностью

**Операции с клипами:**
- [x] Размещение медиафайлов на треках
- [x] Перемещение клипов по горизонтали (move команды)
- [x] Изменение длительности клипов
- [x] Копирование/вставка клипов (буфер обмена в UI machine)
- [x] Удаление клипов
- [x] Видео, аудио и субтитры клипы компоненты

**Управление таймлайном:**
- [x] Система масштабирования Timeline
- [x] Навигация по времени
- [x] Управление масштабом
- [x] Индикатор воспроизведения
- [x] Синхронизация с плеером (timeline-player-sync сервис)

**Продвинутые возможности:**
- [x] Интеграция контроля версий - автоматические снимки
- [x] Видео переходы с затуханием
- [x] Режимы редактирования SLIP/SLIDE
- [x] Пакетные операции
- [x] Keyframe анимация
- [x] Drag & Drop система с множественным выделением
- [x] Горячие клавиши для speed ramping
- [x] Маркеры и горячие клавиши JL cut
- [x] Система кеширования эффектов (LRU кеш с prefetch)

### 🚧 Частично реализовано

- [x] Timeline-player sync сервис для синхронизации с VideoPlayer
- [x] MediaFile типы интегрированы для работы с Browser
- [ ] Полная двухсторонняя синхронизация с VideoPlayer
- [ ] Drag & Drop медиа из Browser на Timeline

## Использование

```typescript
import { TimelineProvider } from '@/features/timeline/services/providers/timeline-provider'
import { useTimelineProject, useTimelineSelection } from '@/features/timeline/services/providers'

function App() {
  return (
    <TimelineProvider>
      {/* Ваши компоненты */}
    </TimelineProvider>
  )
}

function MyComponent() {
  const { project, updateProject } = useTimelineProject()
  const { selectedClipIds, selectClips } = useTimelineSelection()
  // ...
}
```

## Интеграция

- **Зависит от**: `@/domains/app-state`, `@/domains/media-management`, `@/features/video-player`
- **Используется в**: `@/features/media-studio`, `@/features/effects`, `@/features/transitions`
- **Интеграция**: Синхронизация с backend через app-state, timeline-player-sync сервис для воспроизведения

## Тестирование

- **Всего тестов**: 1793 теста
  - Хуки: 1200+ тестов (100% покрытие)
  - Компоненты: 400+ тестов (100% покрытие)
  - Сервисы: 150+ тестов (100% покрытие)
  - Типы/Фабрики: 43 теста (100% покрытие)

```bash
# Запустить все тесты timeline
bun run test src/features/timeline

# Запустить в watch режиме
bun run test:watch src/features/timeline

# Запустить с coverage
bun run test:coverage src/features/timeline
```

## TODO / Планы развития

### Высокий приоритет
- [ ] E2E тесты для операций таймлайна (drag, trim, delete)
- [ ] Полная двухсторонняя синхронизация с VideoPlayer
- [ ] Drag & Drop медиа из Browser на Timeline

### Средний приоритет
- [ ] Продвинутые анимации переходов
- [ ] Система экспорта и рендеринга
- [ ] UI для прокрутки таймлайна и фиксированной шкалы времени

### Низкий приоритет
- [ ] Улучшения интеграции WebGL эффектов
- [ ] Оптимизация производительности для больших проектов
- [ ] Улучшения контекстных меню

## Документация

Подробная документация доступна в:
- [DEV.md](DEV.md) - Техническая документация и архитектура
- [components/README.md](components/README.md) - Документация UI компонентов
- [hooks/README.md](hooks/README.md) - Документация React хуков
- [services/README.md](services/README.md) - Документация бизнес-логики
- [utils/README.md](utils/README.md) - Документация утилит
- [types/README.md](types/README.md) - Документация TypeScript типов

---

**Версия:** 1.0
**Последнее обновление:** 26 ноября 2025
