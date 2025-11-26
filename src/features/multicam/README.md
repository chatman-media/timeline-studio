# Модуль мультикамерного монтажа (Multicam)

## 📋 Обзор

Модуль мультикамеры предоставляет полноценную систему для работы с многокамерной съемкой в Timeline Studio. Позволяет синхронизировать, переключать и редактировать видео с нескольких камер одновременно.

## API (Backend Commands)

This module is frontend-only and does not use Tauri backend commands.

## 🎯 Основные возможности

- **Переключение камер** - быстрое переключение между углами съемки
- **Синхронизация** - автоматическая и ручная синхронизация клипов
- **Горячие клавиши** - поддержка клавиш 1-9 для мгновенного переключения
- **Визуальный просмотр** - сетка превью всех углов камер
- **Гибкая синхронизация** - по таймкоду, аудио или вручную

## 🏗️ Архитектура

```
src/features/multicam/
├── components/           # UI компоненты
│   ├── angle-viewer.tsx      # Сетка превью камер
│   ├── sync-controls.tsx     # Управление синхронизацией
│   ├── sync-info.tsx         # Информация о синхронизации
│   └── audio-sync-dialog.tsx # Диалог аудио синхронизации
├── hooks/               # React хуки
│   ├── use-multicam.ts           # Основной хук мультикамеры
│   └── use-multicam-shortcuts.ts # Горячие клавиши
├── services/            # Бизнес-логика
│   ├── multicam-manager.ts  # Глобальный менеджер состояния
│   ├── timecode-sync.ts     # Синхронизация по таймкоду
│   └── audio-sync.ts        # Синхронизация по аудио
├── types/               # TypeScript типы
│   └── multicam.ts          # Определения типов
└── __tests__/           # Тесты
    └── timecode-sync.test.ts

```

## 🔧 Использование

### Базовое использование

```tsx
import { useMulticam, AngleViewer } from '@/features/multicam'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

function MulticamEditor() {
  const baseClipId = "clip-123" // ID базового клипа
  const multicam = useMulticam(baseClipId)
  
  return (
    <div>
      {/* Сетка превью камер */}
      <AngleViewer 
        baseClipId={baseClipId}
        onAngleClick={(angle, index) => {
          logger.debugSync(`Выбрана камера ${index + 1}`)
        }}
      />
      
      {/* Текущая камера */}
      <div>
        Активная камера: {multicam.activeAngle?.name}
      </div>
    </div>
  )
}
```

### Программное переключение камер

```tsx
const multicam = useMulticam(baseClipId)

// Переключиться на камеру 2
multicam.switchToAngle(1) // индекс с 0

// Следующая камера
multicam.switchToNextAngle()

// Предыдущая камера  
multicam.switchToPreviousAngle()
```

### Синхронизация

```tsx
// Автоматическая синхронизация по таймкоду
multicam.autoSyncByTimecode()

// Автоматическая синхронизация по аудио
await multicam.autoSyncByAudio()

// Ручная установка смещения
multicam.setSyncOffset(angleIndex, offsetSeconds)

// Применить синхронизацию
multicam.syncAngles()
```

## 🎨 Компоненты

### AngleViewer

Отображает сетку превью всех камер с возможностью выбора активной.

```tsx
<AngleViewer
  baseClipId={clipId}        // ID базового клипа
  maxColumns={3}             // Макс. колонок в сетке
  showLabels={true}          // Показывать метки камер
  showTimecode={false}       // Показывать таймкод
  onAngleClick={handleClick} // Обработчик клика
  className="my-viewer"      // Дополнительные стили
/>
```

### SyncControls

Выпадающее меню с опциями синхронизации.

```tsx
<SyncControls
  baseClipId={clipId}
  onSyncComplete={() => logger.debugSync('Синхронизировано!')}
  className="shadow-lg"
/>
```

### AudioSyncDialog

Модальное окно для синхронизации по аудио с визуализацией процесса.

```tsx
<AudioSyncDialog
  isOpen={isOpen}
  onClose={handleClose}
  onSync={handleSync}
  angleCount={4} // Количество камер
/>
```

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| 1-9 | Переключение на камеру 1-9 |

Горячие клавиши автоматически активируются при использовании `useMulticam`.

## 🔄 Синхронизация

### По таймкоду

Извлекает таймкод из метаданных видео (SMPTE timecode) и автоматически выравнивает клипы.

Поддерживаемые форматы:
- Стандартный таймкод: `HH:MM:SS:FF`
- Drop frame: `HH:MM:SS;FF`
- Альтернативные теги метаданных

### По аудио

Анализирует аудиодорожки и находит совпадающие участки для синхронизации.

Особенности:
- Алгоритм корреляции сигналов
- Визуализация процесса
- Оценка качества синхронизации

### Ручная

Позволяет точно настроить смещение каждой камеры с помощью слайдера.

## 🔌 Интеграция

Модуль интегрируется с:
- **Timeline** - использует систему связанных клипов (`useLinkedClips`)
- **Player** - автоматически переключает видео в плеере
- **Keyboard Shortcuts** - регистрирует горячие клавиши

## 📦 API

### useMulticam

Основной хук для работы с мультикамерой.

```typescript
interface UseMulticamReturn {
  // Состояние
  angles: MulticamAngle[]
  activeAngleIndex: number
  activeAngle: MulticamAngle | null
  isSync: boolean
  syncOffsets: number[]
  hasMulticamSupport: boolean
  
  // Переключение
  switchToAngle: (index: number) => void
  switchToNextAngle: () => void
  switchToPreviousAngle: () => void
  switchToAngleByClipId: (clipId: string) => void
  
  // Синхронизация
  syncAngles: () => void
  setSyncOffset: (index: number, offset: number) => void
  autoSyncByAudio: () => Promise<SyncResult[]>
  autoSyncByTimecode: () => void
  
  // Управление
  addAngle: (clipId: string) => void
  removeAngle: (index: number) => void
  reorderAngles: (from: number, to: number) => void
  
  // Утилиты
  getAngleByClipId: (clipId: string) => MulticamAngle | null
  isMulticamClip: (clipId: string) => boolean
}
```

### MulticamManager

Глобальный синглтон для управления состоянием мультикамеры.

```typescript
// Получить экземпляр
const manager = multicamManager

// Установить базовый клип
manager.setBaseClip(clipId)

// Переключить камеру
manager.switchToCamera(angleIndex)
manager.switchToCameraByNumber(cameraNumber) // 1-9

// События
manager.on('camera-switched', (angleIndex) => {
  logger.debugSync(`Переключено на камеру ${angleIndex + 1}`)
})
```

## 🧪 Тестирование

### Покрытие тестами

Модуль имеет обширное тестовое покрытие:

**Компоненты** (`components/__tests__/`):
- ✓ `angle-viewer.test.tsx` - Сетка превью камер
- ✓ `camera-selector.test.tsx` - Селектор камер (основной рендеринг, состояние disabled, выпадающее меню, кастомные классы)
- ✓ `multicam-indicator.test.tsx` - Индикаторы мультикамеры
- ✓ `sync-controls.test.tsx` - Управление синхронизацией
- ✓ `audio-sync-dialog.test.tsx` - Диалог аудио синхронизации

**Хуки** (`hooks/__tests__/`):
- ✓ `use-multicam.test.tsx` - Основной хук мультикамеры
- ✓ `use-multicam-shortcuts.test.tsx` - Горячие клавиши
- ✓ `use-video-lazy-loading.test.tsx` - Ленивая загрузка видео

**Сервисы** (`services/__tests__/`):
- ✓ `multicam-manager.test.ts` - Глобальный менеджер состояния
- ✓ `audio-sync.test.ts` - Синхронизация по аудио
- ✓ `timecode-sync.test.ts` - Парсинг таймкода, конвертация, синхронизация

**Утилиты** (`utils/__tests__/`):
- ✓ `simple-event-bus.test.ts` - Шина событий

**Интеграция** (`__tests__/integration/`):
- ✓ `multicam-editing.test.tsx` - Интеграционные тесты редактирования

### Запуск тестов

```bash
# Запустить тесты модуля
bun run test src/features/multicam

# С покрытием
bun run test:coverage src/features/multicam

# Конкретный тест
bun run test src/features/multicam/services/__tests__/timecode-sync.test.ts
```

## 🚀 Планы развития

- [ ] Система обнаружения хлопушки (clapperboard detection)
- [ ] Реальная интеграция с Web Audio API
- [ ] Сохранение настроек синхронизации в проект
- [ ] Поддержка более 9 камер
- [ ] Цветовая коррекция между камерами
- [ ] AI-ассистент для автоматического выбора лучшего угла

## 📝 Примечания

- Модуль использует систему связанных клипов из timeline
- Синхронизация по аудио в текущей версии использует заглушку
- Для реальной работы требуется интеграция с FFmpeg или Web Audio API

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/multicam/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация модуля мультикамеры | ⏳ Planned | - | 🔴 High |
| Создание мультикамерной группы из связанных клипов | ⏳ Planned | - | 🔴 High |
| Переключение между камерами (1-9) | ⏳ Planned | - | 🔴 High |
| Горячие клавиши переключения камер | ⏳ Planned | - | 🔴 High |
| Отображение сетки превью всех камер (AngleViewer) | ⏳ Planned | - | 🟡 Medium |
| Синхронизация по таймкоду | ⏳ Planned | - | 🟡 Medium |
| Синхронизация по аудио (диалог) | ⏳ Planned | - | 🟡 Medium |
| Ручная настройка смещения камер | ⏳ Planned | - | 🟡 Medium |
| Автоматическое переключение видео в плеере | ⏳ Planned | - | 🔴 High |
| Добавление/удаление камер из группы | ⏳ Planned | - | 🟡 Medium |
| Изменение порядка камер | ⏳ Planned | - | 🟢 Low |
| Сохранение настроек синхронизации в проект | ⏳ Planned | - | 🟡 Medium |
| Индикаторы мультикамеры на Timeline | ⏳ Planned | - | 🟢 Low |
| Работа с более чем 9 камерами | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (переключение камер, синхронизация, интеграция с Timeline)
- 🟡 Medium - важный функционал (управление группами, настройки синхронизации)
- 🟢 Low - дополнительный функционал (визуальные элементы, расширенные возможности)