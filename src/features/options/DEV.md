# Options - Техническая документация

## 📁 Структура файлов

### ✅ Существующие файлы

```
src/features/options/
├── components/
│   └── options.tsx ✅
└── index.ts ✅
```

### ❌ Требуется создать

```
src/features/options/
├── components/
│   ├── options.tsx ✅
│   ├── option-panel.tsx
│   ├── option-slider.tsx
│   ├── option-color-picker.tsx
│   ├── option-dropdown.tsx
│   └── index.ts
├── services/
│   ├── options-machine.ts
│   ├── options-provider.tsx
│   └── index.ts
├── hooks/
│   ├── use-options.ts
│   ├── use-option-presets.ts
│   └── index.ts
└── types/
    ├── options.ts
    └── index.ts
```

## 🏗️ Архитектура компонентов

### Options (текущий компонент)

**Файл**: `components/options.tsx`
**Статус**: ✅ Базовая реализация

**Текущий функционал**:

- Базовая структура компонента
- Интеграция в OptionsLayout

**Требует доработки**:

- Добавление реального функционала
- Интеграция с машиной состояний
- UI элементы управления

## 🔧 Планируемая архитектура

### OptionsMachine (требует создания)

**Файл**: `services/options-machine.ts` ❌

**Контекст**:

```typescript
interface OptionsContext {
  // Настройки видео
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;

  // Настройки аудио
  volume: number;
  bass: number;
  treble: number;

  // Настройки эффектов
  activeEffects: Effect[];
  effectParameters: Record<string, any>;

  // UI состояние
  activePanel: string;
  presets: OptionPreset[];
  isPreviewEnabled: boolean;
}
```

**События**:

```typescript
type OptionsEvents =
  | { type: "SET_VIDEO_OPTION"; option: string; value: number }
  | { type: "SET_AUDIO_OPTION"; option: string; value: number }
  | { type: "APPLY_EFFECT"; effect: Effect }
  | { type: "REMOVE_EFFECT"; effectId: string }
  | { type: "LOAD_PRESET"; presetId: string }
  | { type: "SAVE_PRESET"; name: string }
  | { type: "RESET_TO_DEFAULT" }
  | { type: "TOGGLE_PREVIEW" };
```

### OptionsProvider (требует создания)

**Файл**: `services/options-provider.tsx` ❌

**Функционал**:

- React Context для состояния опций
- Интеграция с OptionsMachine
- Предоставление хуков для компонентов

## 🎣 Планируемые хуки

### useOptions (требует создания)

**Файл**: `hooks/use-options.ts` ❌

```typescript
interface UseOptionsReturn {
  // Состояние
  videoOptions: VideoOptions;
  audioOptions: AudioOptions;
  activeEffects: Effect[];
  activePanel: string;
  isPreviewEnabled: boolean;

  // Действия
  setVideoOption: (option: string, value: number) => void;
  setAudioOption: (option: string, value: number) => void;
  applyEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;
  resetToDefault: () => void;
  togglePreview: () => void;
}
```

### useOptionPresets (требует создания)

**Файл**: `hooks/use-option-presets.ts` ❌

```typescript
interface UseOptionPresetsReturn {
  presets: OptionPreset[];
  loadPreset: (presetId: string) => void;
  savePreset: (name: string) => void;
  deletePreset: (presetId: string) => void;
  createCustomPreset: (options: OptionValues) => void;
}
```

## 📦 Планируемые типы данных

### OptionPreset (требует создания)

```typescript
interface OptionPreset {
  id: string;
  name: string;
  description?: string;
  videoOptions: VideoOptions;
  audioOptions: AudioOptions;
  effects: Effect[];
  createdAt: Date;
  isDefault: boolean;
}
```

### VideoOptions (требует создания)

```typescript
interface VideoOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  exposure: number;
  highlights: number;
  shadows: number;
}
```

### AudioOptions (требует создания)

```typescript
interface AudioOptions {
  volume: number;
  bass: number;
  treble: number;
  midrange: number;
  compressor: number;
  limiter: number;
  reverb: number;
  delay: number;
}
```

## 🔗 Планируемые интеграции

### Timeline интеграция

- Применение настроек к выбранным клипам
- Синхронизация с активным клипом
- Отображение настроек текущего клипа

### VideoPlayer интеграция

- Мгновенный предпросмотр изменений
- Применение эффектов в реальном времени
- Сравнение до/после

### Resources интеграция

- Применение эффектов из библиотеки
- Сохранение настроек как пресеты
- Импорт/экспорт конфигураций

## 🧪 Планируемое тестирование

### Компоненты (требует создания)

- Тесты UI элементов управления
- Тесты взаимодействий пользователя
- Тесты интеграции с провайдером

### Сервисы (требует создания)

- Тесты машины состояний
- Тесты провайдера контекста
- Тесты хуков

### Интеграция (требует создания)

- Тесты синхронизации с Timeline
- Тесты предпросмотра в VideoPlayer
- E2E тесты пользовательских сценариев

## 🚀 План реализации

### Этап 1: Базовая архитектура

1. Создать OptionsMachine
2. Создать OptionsProvider
3. Создать useOptions хук
4. Обновить Options компонент

### Этап 2: UI элементы

1. Создать OptionPanel компонент
2. Создать элементы управления (слайдеры, пикеры)
3. Добавить систему табов
4. Реализовать поиск по настройкам

### Этап 3: Интеграция

1. Интегрировать с Timeline
2. Добавить предпросмотр в VideoPlayer
3. Связать с Resources
4. Реализовать систему пресетов

### Этап 4: Продвинутые функции

1. Добавить инструменты анализа
2. Реализовать кастомные элементы
3. Добавить экспорт/импорт настроек
4. Оптимизировать производительность

## 📈 Приоритеты

### Критический приоритет

1. Создание базовой архитектуры
2. Основные элементы управления
3. Интеграция с Timeline

### Высокий приоритет

1. Предпросмотр в реальном времени
2. Система пресетов
3. Цветокоррекция

### Средний приоритет

1. Аудио настройки
2. Продвинутые эффекты
3. Инструменты анализа
