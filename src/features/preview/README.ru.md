# Preview - Система превью

[English](./README.md) | **Русский**

## Обзор
Высокопроизводительная система превью на базе WebGL2 с рендерингом видео в реальном времени, GPU-ускорением эффектов и умным кэшированием.

## Статус
- ✅ **Компоненты**: PreviewCanvas, PreviewControls, QualitySettings
- ✅ **Хуки**: useWebGL2Preview, usePreviewCache
- ✅ **Сервисы**: WebGL2PreviewRenderer, PreviewCache, FrameExtractor
- ✅ **Тесты**: 10+ тестов успешно проходят (рендерер, хуки, интеграция)

## Структура
```
preview/
├── components/
│   ├── preview-canvas.tsx       # Компонент canvas для превью
│   ├── preview-controls.tsx     # Элементы управления
│   └── quality-settings.tsx     # Панель настроек качества
├── hooks/
│   ├── use-webgl2-preview.ts    # Основной хук WebGL2 превью
│   └── use-preview-cache.ts     # Хук управления кэшем
├── services/
│   ├── webgl2-preview-renderer.ts  # WebGL2 рендерер
│   ├── preview-cache.ts         # Система кэширования кадров
│   └── frame-extractor.ts       # Извлечение кадров из видео
├── types/
│   └── preview.ts               # TypeScript типы
├── utils/
│   └── preview-utils.ts         # Утилиты превью
└── __tests__/
    ├── hooks/                   # Тесты хуков
    └── services/                # Тесты сервисов
```

## Возможности
### ✅ Реализовано
- [x] WebGL2 рендеринг с GPU-ускорением
- [x] Применение эффектов в реальном времени
- [x] Умная система кэширования кадров
- [x] Масштабирование качества (на основе GPU tier)
- [x] Извлечение кадров из видео
- [x] Интеграция с Timeline
- [x] Мониторинг производительности
- [x] Автоматическая адаптация под GPU

### ❌ Не реализовано
- [ ] Многослойная композиция
- [ ] Продвинутые режимы смешивания
- [ ] 3D трансформации
- [ ] Эффекты частиц
- [ ] Превью стабилизации видео
- [ ] Превью LUT

## Использование
```typescript
import { useWebGL2Preview } from '@/features/preview/hooks'

function VideoPreview() {
  const {
    canvasRef,
    videoRef,
    previewFrame,
    isInitialized,
    gpuTier,
    quality,
    setQuality,
    cacheStats
  } = useWebGL2Preview({
    cacheSize: 100,      // MB
    prefetchRange: 2,    // секунды
    updateInterval: 33   // ~30fps
  })

  return (
    <div>
      <canvas ref={canvasRef} width={1920} height={1080} />
      <video ref={videoRef} muted style={{ display: 'none' }} />

      {isInitialized && (
        <div>
          GPU Tier: {gpuTier}
          Кэш: {cacheStats?.entries} записей
        </div>
      )}
    </div>
  )
}
```

## Интеграция
- **Зависимости**: @/features/timeline, @/features/video-player, @/lib/webgl2
- **Используется в**: @/features/media-studio
- **Эффекты**: Автоматическая интеграция с унифицированной системой эффектов
- **Backend**: Только фронтенд (без команд Tauri)

## Тестирование
- **Всего тестов**: 10+ тестов
- **Покрытие**: WebGL2PreviewRenderer, useWebGL2Preview, адаптация GPU

```bash
# Запустить все тесты
bun run test src/features/preview

# Запустить конкретный тест
bun run test src/features/preview/__tests__/services/webgl2-preview-renderer.test.ts
```

## TODO / Дорожная карта
- [ ] Поддержка многослойной композиции
- [ ] Продвинутые режимы смешивания (screen, multiply, overlay)
- [ ] Эффекты 3D трансформаций
- [ ] Интеграция системы частиц
- [ ] Превью стабилизации видео в реальном времени
- [ ] Поддержка LUT (Look-Up Table)
- [ ] Поддержка HDR превью
- [ ] Превью конвертации цветового пространства
- [ ] Оптимизация превью экспорта
- [ ] Превью аппаратного кодирования
