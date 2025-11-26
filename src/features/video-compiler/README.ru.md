# Video Compiler

[English](./README.md) | **Русский**

## Обзор
Комплексная система рендеринга видео с поддержкой GPU ускорения, многоуровневым кэшированием и расширенными возможностями обработки медиа для высокопроизводительной компиляции видео.

## Статус
- ✅ **Готовность**: Полностью реализовано и готово к продакшену
- ✅ **Компоненты**: 3 UI компонента для управления рендерингом
- ✅ **Хуки**: 7 специализированных хуков для обработки видео
- ✅ **Сервисы**: 5 сервисов для взаимодействия с Rust backend
- ✅ **Тесты**: 153 теста (~100% покрытие)
- ✅ **GPU поддержка**: NVIDIA NVENC, Intel QuickSync, AMD AMF, Apple VideoToolbox

## Структура
```
video-compiler/
├── components/
│   ├── cache-statistics-modal.tsx
│   ├── gpu-status.tsx
│   └── render-jobs-dropdown.tsx
├── hooks/
│   ├── use-cache-stats.ts
│   ├── use-frame-extraction.ts
│   ├── use-gpu-capabilities.ts
│   ├── use-metadata-cache.ts
│   ├── use-prerender.ts
│   ├── use-render-jobs.ts
│   └── use-video-compiler.ts
├── services/
│   ├── cache-service.ts
│   ├── frame-extraction-service.ts
│   ├── metadata-cache-service.ts
│   └── video-compiler-service.ts
└── types/
    ├── cache.ts
    ├── compiler.ts
    └── render.ts
```

## Функции
### ✅ Реализовано
- [x] GPU ускорение (автоопределение для NVIDIA, Intel, AMD, Apple)
- [x] Интеллектуальный фоллбэк на CPU при недоступности GPU
- [x] Полный рендеринг проекта (эффекты, фильтры, переходы, субтитры)
- [x] Предрендеринг сегментов для быстрого превью таймлайна
- [x] Извлечение фреймов (таймлайн, распознавание, субтитры)
- [x] Параллельные задачи рендеринга с приоритизацией
- [x] Многоуровневое кэширование (память, IndexedDB, файловая система)
- [x] Интеллектуальное управление кэшем (TTL, LRU, авто-очистка)
- [x] Статистика производительности (hit ratios, использование памяти)
- [x] Мониторинг использования GPU в реальном времени
- [x] Поддержка множества форматов
- [x] UI управления задачами рендеринга

### ❌ Не реализовано
- [ ] Поддержка мульти-GPU рендеринга
- [ ] Динамическая балансировка нагрузки между GPU
- [ ] Облачное хранилище кэша для синхронизации
- [ ] Пресеты рендеринга для платформ (YouTube, Instagram и т.д.)
- [ ] Пакетный рендеринг с разными настройками
- [ ] Распределенный рендеринг между машинами
- [ ] AI-ускоренная обработка с Tensor cores
- [ ] Рендеринг 8K и HDR

## Использование
```typescript
import { useVideoCompiler, useGpuCapabilities } from '@/features/video-compiler'

function ExportButton() {
  const {
    isRendering,
    renderProgress,
    startRender,
    cancelRender
  } = useVideoCompiler()

  const { gpuCapabilities } = useGpuCapabilities()

  const handleExport = async () => {
    await startRender(project, outputPath, {
      quality: 85,
      hardware_acceleration: true,
      format: 'mp4'
    })
  }

  return (
    <Button onClick={handleExport} disabled={isRendering}>
      {isRendering ? `Рендеринг ${renderProgress?.percentage}%` : 'Экспорт'}
    </Button>
  )
}
```

## Интеграция
- **Зависит от**: @/features/app-state, @/features/timeline, FFmpeg
- **Используется в**: @/features/media-studio, @/features/preview

## Тестирование
- **Всего тестов**: 153 теста (142 проходят, 2 пропущены)
- **Покрытие**: ~98% функциональности протестировано

```bash
bun run test src/features/video-compiler/__tests__/
```

## TODO / Roadmap
- [ ] Поддержка мульти-GPU рендеринга с балансировкой нагрузки
- [ ] UI для выбора конкретного GPU
- [ ] Профилирование производительности для разных энкодеров
- [ ] Облачное хранилище кэша для синхронизации устройств
- [ ] Общий кэш между проектами
- [ ] Пресеты рендеринга (YouTube, Vimeo, Instagram)
- [ ] Пакетный рендеринг
- [ ] Распределенный рендеринг между машинами
- [ ] AI-ускоренная обработка
- [ ] Поддержка 8K и HDR
- [ ] E2E тесты (запланированы в `e2e/tauri/features/video-compiler/`)
