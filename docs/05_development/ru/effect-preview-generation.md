# Генерация превью для эффектов

## Обзор

Timeline Studio включает систему генерации превью-видео для эффектов. Эта система позволяет создавать короткие демонстрационные видео с применённым эффектом для каждого эффекта в библиотеке.

## Архитектура

### Компоненты

1. **Утилиты генерации** (`src/features/effects/utils/generate-effect-previews.ts`)
   - `generateEffectPreview()` - генерация превью для одного эффекта
   - `generateAllEffectPreviews()` - пакетная генерация для множества эффектов
   - `updateEffectsWithPreviews()` - обновление метаданных эффектов

2. **React Hook** (`src/features/effects/hooks/use-effect-preview-generator.ts`)
   - `useEffectPreviewGenerator()` - управление состоянием генерации
   - Поддержка прогресса и отмены

3. **UI Компоненты**
   - `EffectPreviewGenerator` - панель управления генерацией
   - `DeveloperToolsModal` - модальное окно с инструментами разработчика
   - `DeveloperToolsButton` - кнопка доступа к Dev Tools

## Использование

### Доступ к Developer Tools

1. Откройте браузер ресурсов (панель Browser)
2. Переключитесь на вкладку "Effects"
3. Нажмите кнопку с иконкой `<Code2>` в toolbar
4. Откроется модальное окно Developer Tools

### Генерация превью

1. В модальном окне Developer Tools выберите вкладку "Effect Previews"
2. Настройте параметры генерации:
   - **Source Video** - исходное видео для применения эффекта (по умолчанию `/t1.mp4`)
   - **Duration** - длительность превью в секундах (рекомендуется 3-5 секунд)
   - **Quality** - качество видео (0-100, рекомендуется 75)
   - **Output Directory** - директория для сохранения превью

3. Нажмите "Generate Previews"
4. Отслеживайте прогресс генерации

### Использование сгенерированных превью

После генерации превью автоматически используются в компоненте `EffectPreview`:

1. Компонент проверяет наличие поля `effect.preview` с путём к превью
2. Если превью существует - использует его
3. Если нет - использует текущее видео из плеера

## Технические детали

### Процесс генерации

1. Создаётся минимальная схема проекта с одним клипом и эффектом
2. Применяются параметры эффекта по умолчанию
3. Вызывается Rust команда `prerender_segment` для рендеринга
4. Результат сохраняется в указанную директорию
5. Путь к превью сохраняется в метаданных эффекта

### Интеграция с бэкендом

Используется существующая система пререндеринга Timeline Studio:
- **Rust Command**: `prerender_segment` из `video-compiler`
- **Frontend Hook**: `usePrerender`
- **Compiler Service**: `prerenderSegment()` функция

### Формат превью

- **Формат файла**: MP4
- **Именование**: `effect_<effectId>.mp4`
- **Местоположение**: `preview-videos/effects/` (настраивается)
- **Длительность**: 3-5 секунд (настраивается)

## Расширение

### Добавление новых инструментов

Для добавления новых инструментов в Developer Tools:

1. Создайте компонент инструмента в `src/features/developer-tools/components/`
2. Добавьте новую вкладку в `DeveloperToolsModal`
3. Экспортируйте из `index.ts`

Пример:

```typescript
// src/features/developer-tools/components/cache-manager.tsx
export function CacheManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
      </CardHeader>
      {/* ... */}
    </Card>
  )
}

// src/features/developer-tools/components/developer-tools-modal.tsx
<TabsList>
  <TabsTrigger value="effect-previews">Effect Previews</TabsTrigger>
  <TabsTrigger value="cache-management">Cache Management</TabsTrigger>
</TabsList>

<TabsContent value="cache-management">
  <CacheManager />
</TabsContent>
```

## Локализация

Добавьте переводы в файлы локализации:

```json
{
  "developerTools": {
    "title": "Developer Tools",
    "openButton": "Open Developer Tools",
    "tabs": {
      "effectPreviews": "Effect Previews"
    }
  },
  "effects": {
    "preview": {
      "generator": {
        "title": "Effect Preview Generator",
        "generate": "Generate Previews",
        "cancel": "Cancel Generation"
      }
    }
  }
}
```

## Производительность

- Генерация превью использует Rust бэкенд для максимальной производительности
- Поддерживается отслеживание прогресса в реальном времени
- Возможность отмены процесса генерации
- Пакетная обработка для эффективности

## Ограничения

- Требуется FFmpeg для рендеринга
- Генерация может занять несколько минут для большой библиотеки эффектов
- Предварительный просмотр зависит от производительности GPU для WebGL эффектов
