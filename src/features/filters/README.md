# Filters

## Overview / Обзор

**EN:** CSS-based video filters system with real-time preview and hardware acceleration. Provides color correction, technical, cinematic, artistic, creative, and vintage filters. Supports multiple simultaneous filters, user presets, and FFmpeg export integration. Features include brightness, contrast, saturation, hue rotation, blur, sepia, grayscale, and more.

**RU:** Система видеофильтров на основе CSS с предпросмотром в реальном времени и аппаратным ускорением. Предоставляет фильтры цветокоррекции, технические, кинематографические, художественные, креативные и винтажные. Поддерживает несколько одновременных фильтров, пользовательские пресеты и интеграцию экспорта FFmpeg. Включает яркость, контрастность, насыщенность, поворот оттенка, размытие, сепию, оттенки серого и многое другое.

## API (Backend Commands)

This module is frontend-only and does not use Tauri backend commands. All filter processing is performed client-side using CSS filters.

| Command | Parameters | Description |
|---------|------------|-------------|
| N/A | - | Pure frontend implementation using CSS Filters API |

**Note:** Filters can be exported to FFmpeg commands for final rendering via the Export module.

## 📋 Status: ✅ Production Ready

The Filters feature provides a comprehensive set of CSS-based video filters with real-time preview and user-friendly controls.

## 📁 Project Structure

```
src/features/filters/
├── components/           # React components
│   ├── filter-list.tsx  # Main filter list
│   ├── filter-group.tsx # Filter grouping
│   └── filter-preview.tsx # Filter preview
├── hooks/               # React hooks
│   └── use-filters.ts   # Filter management hooks
├── utils/               # Utilities
│   ├── filter-processor.ts # Filter data processing
│   └── css-filters.ts   # CSS filters and utilities
├── data/                # Filter definitions
│   └── filters.ts       # Available filters data
├── types/               # TypeScript types
│   └── filters.ts       # Filter type definitions
└── __tests__/          # Tests
    ├── filter-list.test.tsx
    └── filter-preview.test.tsx
```

## 🎯 Key Features

- **CSS-based filters**: Brightness, Contrast, Saturation, Hue, Blur, Sepia, Grayscale, Invert, and more
- **Real-time preview**: Instant visual feedback as you adjust filter parameters
- **Multiple filters**: Apply multiple filters to a single clip simultaneously
- **User presets**: Save and load custom filter combinations
- **Performance optimized**: Hardware-accelerated CSS filters
- **Type-safe**: Full TypeScript support with strict typing

## 🔧 Available Filters

### Basic Adjustments
- **Brightness**: Adjust image brightness (0-200%)
- **Contrast**: Control contrast levels (0-200%)
- **Saturation**: Modify color saturation (0-200%)
- **Hue Rotate**: Shift color hues (0-360°)

### Effects
- **Blur**: Apply Gaussian blur (0-20px)
- **Sepia**: Add vintage sepia tone (0-100%)
- **Grayscale**: Convert to grayscale (0-100%)
- **Invert**: Invert colors (0-100%)
- **Opacity**: Control transparency (0-100%)

## 📚 Usage

```typescript
import { useFilters } from '@/features/filters/hooks/use-filters';

function MyComponent() {
  const { filters, applyFilter, removeFilter } = useFilters();

  // Apply a filter
  applyFilter('brightness', { value: 120 });

  // Remove a filter
  removeFilter('brightness');

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

## 🧪 Testing

- **Unit tests**: Comprehensive component and hook testing
- **Coverage**: High test coverage for core functionality
- **Test utilities**: Mocked data and helpers for consistent testing

Run tests:
```bash
bun run test src/features/filters
```

## 📖 Documentation

- **[README.ru.md](./README.ru.md)**: Russian documentation
- **[DEV.md](./DEV.md)**: Developer guide and implementation details

## 🔗 Integration

The Filters feature integrates seamlessly with:
- **Timeline**: Apply filters to timeline clips
- **Video Player**: Real-time filter rendering
- **Effects System**: Combine with effects for advanced compositions

## 🎨 Design Principles

1. **Performance First**: Leverage CSS filters for hardware acceleration
2. **User Experience**: Intuitive controls with instant visual feedback
3. **Composability**: Stack multiple filters for complex effects
4. **Type Safety**: Full TypeScript coverage for reliability
5. **Testability**: Comprehensive test coverage for stability

---

For more details, see [DEV.md](./DEV.md)

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/filters/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Инициализация панели фильтров | ⏳ Planned | - | 🔴 High |
| Применение одиночного фильтра (brightness) | ⏳ Planned | - | 🔴 High |
| Применение множественных фильтров | ⏳ Planned | - | 🔴 High |
| Настройка параметров фильтра (слайдер) | ⏳ Planned | - | 🟡 Medium |
| Предпросмотр фильтра в реальном времени | ⏳ Planned | - | 🔴 High |
| Сохранение пользовательского пресета | ⏳ Planned | - | 🟡 Medium |
| Загрузка пользовательского пресета | ⏳ Planned | - | 🟡 Medium |
| Удаление фильтра | ⏳ Planned | - | 🟡 Medium |
| Сброс всех фильтров | ⏳ Planned | - | 🟡 Medium |
| Копирование фильтров между клипами | ⏳ Planned | - | 🟢 Low |
| Применение группы фильтров (категория) | ⏳ Planned | - | 🟢 Low |
| CSS фильтр рендеринг в видеоплеере | ⏳ Planned | - | 🔴 High |

### Приоритеты
- 🔴 High - критичный функционал, тестировать первым
- 🟡 Medium - важный функционал
- 🟢 Low - дополнительный функционал

### Примечания
- Модуль является чисто фронтенд реализацией (CSS Filters API)
- Не использует Tauri команды напрямую
- Интеграция с экспортом через FFmpeg (тестируется в модуле Export)
