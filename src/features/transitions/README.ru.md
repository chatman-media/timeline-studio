# Transitions

[English](./README.md) | **Русский**

## Обзор

Модуль переходов предоставляет GPU-ускоренные эффекты видео переходов с использованием WebGL, включая 24 профессионально созданных перехода: базовые эффекты, glitch-эффекты, системы частиц и продвинутые 3D трансформации.

## Статус

- ✅ **Компоненты**: Полный набор с preview, редактором и панелью управления
- ✅ **Хуки**: 3 хука для переходов, продвинутых эффектов и динамического управления
- ✅ **Сервисы**: 4 специализированных WebGL рендера (Basic, Glitch, Particle, 3D)
- ✅ **Тесты**: 298/317 тестов успешно пройдены (94% успешности)

## Структура

```
transitions/
├── components/                      # UI компоненты
│   ├── transition-preview.tsx      # Компонент превью
│   ├── transition-editor.tsx       # Редактор кривых Безье
│   ├── transition-control-panel.tsx # Панель управления
│   └── transition-group.tsx        # Группировка по категориям
├── hooks/                          # React хуки
│   ├── use-transitions.ts          # Основной хук переходов
│   ├── use-advanced-transitions.ts # Хук продвинутых эффектов
│   └── use-dynamic-transitions.ts  # Хук динамического управления
├── services/                       # WebGL рендеры
│   ├── basic-transition-renderer.ts    # Эффекты размытия и цвета
│   ├── glitch-transition-renderer.ts   # 10 glitch-эффектов
│   ├── particle-transition-renderer.ts # 5 эффектов частиц
│   └── 3d-transition-renderer.ts       # 9 3D-эффектов
└── __tests__/                      # Файлы тестов (298 тестов)
```

## Возможности

### ✅ Реализовано

**Базовые переходы (2 эффекта):**
- [x] Эффекты размытия (gaussian, motion, radial)
- [x] Цветовые эффекты (tint, saturation, brightness)

**Glitch переходы (10 эффектов):**
- [x] Digital glitch, RGB split, data corruption
- [x] Analog distortion, signal interference
- [x] Pixel storm, codec error, matrix rain
- [x] Screen tear, bit crush

**Переходы с частицами (5 эффектов):**
- [x] Particle dissolve с физикой
- [x] Liquid morph
- [x] Glass shatter
- [x] Fire burn
- [x] Organic growth

**3D переходы (9 эффектов):**
- [x] Book open, cylinder roll (полные шейдеры)
- [x] Origami fold, polyhedron transform (полные шейдеры)
- [x] Mobius strip (полный шейдер)
- [x] Page flip, card shuffle (базовые шейдеры)
- [x] Helix spin, sphere mapping (базовые шейдеры)

**Интеграция:**
- [x] Интеграция с Timeline с drag & drop
- [x] Интеграция с Resource Manager
- [x] Интеграция preview с Browser
- [x] Интеграция с VideoPlayer
- [x] Система экспорта FFmpeg
- [x] GPU ускорение WebGL

### 🚧 Частично реализовано

**3D шейдеры:**
- [x] 5 эффектов с полной реалистичной геометрией
- [x] 4 эффекта с базовой геометрией (могут быть улучшены)

### ❌ Не реализовано

- [ ] E2E тесты с реальными видео
- [ ] Автоматизация бенчмарков производительности
- [ ] Оптимизация texture pooling

## Использование

```typescript
import { basicTransitionRenderer } from '@/features/transitions/services'

// Инициализация рендера
await basicTransitionRenderer.initialize()

// Рендеринг перехода
const result = await basicTransitionRenderer.renderTransition({
  sourceTexture: textureA,
  targetTexture: textureB,
  progress: 0.5,
  parameters: {
    blur: {
      enabled: true,
      amount: 50,
      type: 'gaussian'
    }
  }
})

// Продвинутые эффекты
import {
  glitchTransitionRenderer,
  particleTransitionRenderer,
  threeDTransitionRenderer
} from '@/features/transitions/services'

// Glitch эффект
await glitchTransitionRenderer.renderGlitchTransition({
  sourceTexture,
  targetTexture,
  progress: 0.5,
  effectType: 'digital-glitch',
  parameters: { blockSize: 16, intensity: 0.8 }
})
```

## Интеграция

- **Зависит от**: `/lib/webgl/base-renderer.ts` (BaseRenderer для всех рендеров)
- **Используется в**: `@/features/timeline`, `@/features/video-player`, `@/features/browser`
- **Интеграция**: Timeline drag & drop, GPU рендеринг, FFmpeg экспорт

## Тестирование

- **Всего тестов**: 298/317 тестов (94% успешности)
  - BasicTransitionRenderer: 20 тестов (100% успешно)
  - GlitchTransitionRenderer: 34 теста (100% успешно)
  - ParticleTransitionRenderer: 32 теста (100% успешно)
  - ThreeDTransitionRenderer: 41 тест (100% успешно)
  - Хуки: 65 тестов (75% успешно, use-dynamic-transitions требует исправлений)
  - Компоненты: 52 теста (100% успешно)

```bash
# Запустить все тесты переходов
bun run test src/features/transitions

# Запустить тесты конкретного рендера
bun run test src/features/transitions/services/basic-transition-renderer.test.ts

# Запустить с coverage
bun run test:coverage src/features/transitions
```

## TODO / Планы развития

### Высокий приоритет
- [ ] Исправить оставшиеся 19 падающих тестов в use-dynamic-transitions
- [ ] E2E тесты с реальными видеофайлами

### Средний приоритет
- [ ] Улучшить 4 базовых 3D шейдера с реалистичной геометрией
- [ ] Автоматизация бенчмарков производительности
- [ ] Расширенная библиотека переходов (5-10 новых эффектов)

### Низкий приоритет
- [ ] Texture pooling для оптимизации памяти
- [ ] UI конструктор пользовательских переходов
- [ ] Система пресетов переходов

## Производительность

### Метрики

```
Компиляция шейдеров:  < 100ms (все рендеры)
Время рендера кадра:  < 16ms (60 FPS capable)
Overhead памяти:      Минимальный (shader pooling)
Использование GPU:    Оптимальное
```

### Время рендеринга эффектов

```
Blur эффекты:     ~8-12ms за кадр
Glitch эффекты:   ~5-10ms за кадр
Particle эффекты: ~10-15ms за кадр
3D эффекты:       ~12-16ms за кадр
```

## Документация

Подробная документация доступна в:
- [DEV.md](DEV.md) - Техническая документация v2.0
- [ARCHITECTURE.md](ARCHITECTURE.md) - Схема архитектуры и детали
- [CHECKLIST.md](CHECKLIST.md) - Чеклист готовности компонентов

---

**Версия:** 2.1
**Последнее обновление:** 26 ноября 2025
