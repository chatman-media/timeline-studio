# Effects / Эффекты

[English](./README.md) | **Русский**

## Обзор

Комплексная система видеоэффектов с 39 встроенными эффектами в 8 категориях. Включает WebGL2 GPU-ускоренный рендеринг, предпросмотр в реальном времени, интерактивные элементы управления параметрами и поддержку пользовательских пресетов. Содержит художественные, кинематографические, технические и креативные эффекты с интеграцией экспорта FFmpeg.

## Статус

- ✅ **Компоненты**: 7 компонентов полностью реализованы (EffectList, EffectPreview, EffectCategories, EffectDetail, EffectIndicators, EffectPresets, EffectParameterControls)
- ✅ **Хуки**: 8 хуков (useEffects, useEffectCategories, useUnifiedEffects, useEffectsImport, useEffectsSearch, useEffectsByCategory, useEffectById)
- ✅ **Процессоры**: WebGL2 GPU-ускоренный рендеринг, CSS preview fallback
- ✅ **Тесты**: 66+ тестов проходят (91.75% покрытие компонентов, 100% утилит)
- ✅ **Интернационализация**: 15 языков с поддержкой RTL

## Структура

```
effects/
├── components/
│   ├── effect-list.tsx
│   ├── effect-preview.tsx
│   ├── effect-categories.tsx
│   ├── effect-detail.tsx
│   ├── effect-indicators.tsx
│   ├── effect-presets.tsx
│   └── effect-parameter-controls.tsx
├── hooks/
│   ├── use-effects.ts
│   ├── use-effect-categories.ts
│   ├── use-unified-effects.ts
│   └── use-effects-import.ts
├── services/
│   ├── effect-processor.ts
│   ├── webgl2-effect-processor.ts
│   └── webgl2-unified-renderer.ts
├── utils/
│   └── css-effects.ts
├── data/
│   ├── effects.json
│   └── effect-categories.json
└── __tests__/
```

## Возможности

### ✅ Реализовано

**Категории эффектов (8 категорий)**
- [x] Цветокоррекция - яркость, контраст, насыщенность
- [x] Художественные - креативные стили и художественные эффекты
- [x] Винтажные - ретро эффекты, пленочное зерно
- [x] Кинематографические - виньетирование, профессиональные эффекты
- [x] Креативные - неон, свечение, современные эффекты
- [x] Технические - резкость, шумоподавление
- [x] Движение - управление скоростью, реверс
- [x] Искажения - специальные визуальные искажения

**Основные возможности**
- [x] 39 эффектов с полными метаданными и FFmpeg командами
- [x] Пресеты эффектов (subtle, moderate, dramatic)
- [x] Теги эффектов (популярные, профессиональные, для новичков)
- [x] Уровни сложности (базовый, средний, продвинутый)
- [x] WebGL2 GPU-ускоренный рендеринг
- [x] CSS preview fallback
- [x] Интерактивные элементы управления параметрами
- [x] Предпросмотр в реальном времени
- [x] Импорт эффектов (JSON, .cube, .lut файлы)
- [x] Система избранных эффектов
- [x] Два режима просмотра (сетка и категории)

**Интеграция**
- [x] Интеграция с вкладками браузера
- [x] Использование в TimelineResources
- [x] Система предпросмотра WebGL2

### ❌ Не реализовано

- [ ] Применение эффектов к клипам таймлайна
- [ ] Сохранение пользовательских пресетов (частично готово)
- [ ] Drag & drop на таймлайн
- [ ] Анимированные превью эффектов

## Использование

### Базовое использование

```typescript
import { useEffects, EffectList } from '@/features/effects'

function MyComponent() {
  const effects = useEffects()

  return <EffectList effects={effects} />
}
```

### WebGL2 GPU-ускоренные эффекты

```typescript
import { useUnifiedEffects } from '@/features/effects/hooks'
import { WebGL2EffectProcessor } from '@/features/effects/services'

// Инициализация процессора
const processor = new WebGL2EffectProcessor()
await processor.initialize()

// Применение эффектов с GPU ускорением
const result = await processor.processFrame(
  sourceFrame,
  [
    { type: 'colorCorrection', params: { brightness: 1.2 } },
    { type: 'gaussianBlur', params: { radius: 2.0 } }
  ]
)
```

### Импорт пользовательских эффектов

```typescript
import { useEffectsImport } from '@/features/effects/hooks'

const { importEffect, importLUT } = useEffectsImport()

// Импорт JSON эффекта
await importEffect('/path/to/effect.json')

// Импорт LUT файла
await importLUT('/path/to/lut.cube')
```

## Интеграция

- **Зависит от**: `@/domains/video-compiler`, `@/lib/webgl2`
- **Используется в**: `@/features/browser`, `@/features/timeline`

## Тестирование

- **Всего тестов**: 66+
- **Покрытие**: 64.87% общее
  - Компоненты: 91.75%
  - Утилиты: 100%
  - WebGL2 процессоры: 95%
- **Запуск тестов**: `bun test src/features/effects`
- **Отчет о покрытии**: `bun test:coverage src/features/effects`

## Производительность

**WebGL2 GPU ускорение**
- В 10 раз быстрее рендеринга по сравнению с CPU
- Настройка параметров в реальном времени без лагов
- Автоматическая настройка качества в зависимости от возможностей GPU
- Эффективное использование памяти с пулингом шейдеров и кэшированием

**Оптимизации**
- Ленивая загрузка эффектов
- Мемоизация для рендеринга списков
- Оптимизация поиска в реальном времени
- CSS preview для быстрого fallback

## TODO / Дорожная карта

- [ ] Интеграция с таймлайном - реализовать применение эффектов к клипам через WebGL2
- [ ] Drag & Drop - добавить перетаскивание эффектов на таймлайн
- [ ] Параметры в реальном времени - настройка эффектов с WebGL2 preview
- [ ] Пользовательские пресеты - сохранение настроек пользователя в файловую систему
- [ ] WebGL2 шейдеры - расширить библиотеку GLSL эффектов
- [ ] Анимированные превью - улучшить визуальную презентацию с GPU ускорением
- [ ] E2E тесты - создать комплексный набор тестов (см. секцию E2E Tests в старом README)

## Документация

- **README.md** - Английская версия
- **README.ru.md** - Этот файл (RU)
- **DEV.md** - Техническая документация, архитектура и тестирование
- **WEBGL2_MIGRATION.md** - Руководство по миграции на WebGL2
- **examples/hooks-usage.md** - Примеры использования хуков
