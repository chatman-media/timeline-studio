# Video Player

[English](./README.md) | **Русский**

## Обзор
Комплексный модуль воспроизведения видео с поддержкой различных форматов, превью эффектов, переходов, HDR контента и полной интеграцией с экосистемой Timeline Studio через архитектуру XState.

## Статус
- ✅ **Компоненты**: Полностью реализованы (100% покрытие тестами)
- ✅ **Хуки**: Полностью реализованы (100% покрытие тестами)
- ✅ **Сервисы**: State machine и провайдер готовы (100% покрытие тестами)
- ✅ **Тесты**: 257 тестов проходят
- ✅ **Tauri интеграция**: Полная поддержка desktop через convertVideoSrc
- ✅ **Backend Sync**: Синхронизация состояния в реальном времени

## Структура
```
video-player/
├── components/
│   ├── video-player.tsx
│   ├── player-controls.tsx
│   ├── volume-slider.tsx
│   ├── enhanced-video-player.tsx
│   ├── hdr-video-player.tsx
│   ├── effects-preview-player.tsx
│   └── video-player-with-transitions.tsx
├── hooks/
│   ├── use-fullscreen.ts
│   ├── use-player-ai-analysis.ts
│   ├── use-player-speed-ramping.ts
│   ├── use-transition-preview.ts
│   ├── use-video-element.ts
│   └── use-video-selection.ts
├── services/
│   ├── player-machine.ts
│   ├── player-provider.tsx
│   ├── frame-capture-service.ts
│   ├── codec-support.ts
│   └── hdr-support.ts
└── __tests__/
```

## Функции
### ✅ Реализовано
- [x] Воспроизведение видео с поддержкой форматов через Tauri
- [x] Play/pause, seek, покадровая навигация
- [x] Управление громкостью со слайдером
- [x] Полноэкранный режим
- [x] Управление скоростью воспроизведения (0.25x - 2x)
- [x] Мониторинг статуса GPU ускорения
- [x] Оверлей AI анализа контента
- [x] Превью эффектов в реальном времени
- [x] Превью переходов
- [x] Поддержка HDR контента
- [x] Поддержка мульти-форматных кодеков
- [x] Горячие клавиши
- [x] Запись с камеры
- [x] Сетка для композиции

### ❌ Не реализовано
- [ ] A-B loop повтор
- [ ] Закладки/маркеры
- [ ] Поддержка субтитров
- [ ] Отображение гистограммы
- [ ] Векторскоп
- [ ] Отображение информации о кодеке
- [ ] Статистика битрейта

## Использование
```typescript
import { VideoPlayer, useVideoElement } from '@/features/video-player'

function PlayerComponent() {
  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek
  } = useVideoElement()

  return (
    <VideoPlayer
      ref={videoRef}
      src="/path/to/video.mp4"
      onPlay={play}
      onPause={pause}
      onTimeUpdate={(time) => seek(time)}
    />
  )
}
```

## Интеграция
- **Зависит от**: @/features/project-settings, @/domains/project-management, @/lib/tauri-utils
- **Используется в**: @/features/media-studio, @/features/timeline, @/features/browser, @/features/effects

## Тестирование
- **Всего тестов**: 257 тестов (все проходят)
- **Покрытие**: 100% для всех файлов video-player
- **Тесты компонентов**: 82 теста
- **Тесты хуков**: 71 тест
- **Тесты сервисов**: 104 теста

```bash
bun run test src/features/video-player
```

## TODO / Roadmap
- [ ] A-B loop функция для повтора фрагмента
- [ ] Расширенная навигация с закладками
- [ ] Поддержка субтитров (множество форматов)
- [ ] Инструменты анализа видео (гистограмма, векторскоп)
- [ ] Отображение информации о кодеке
- [ ] Улучшения WebGL обработки видео
- [ ] Опции кастомизации UI
- [ ] E2E тесты (запланированы в `e2e/tauri/features/video-player/`)
