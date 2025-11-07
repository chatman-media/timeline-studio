# Модуль мультикамерного монтажа (Multicam)

## 📋 Обзор

Модуль мультикамеры предоставляет полноценную систему для работы с многокамерной съемкой в Timeline Studio. Позволяет синхронизировать, переключать и редактировать видео с нескольких камер одновременно.

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

```bash
# Запустить тесты модуля
bun run test src/features/multicam

# С покрытием
bun run test:coverage src/features/multicam
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