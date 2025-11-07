# ⚠️ DEPRECATED: Использование console.* в Timeline Studio

> **ВНИМАНИЕ:** Этот документ устарел. Timeline Studio больше НЕ использует `console.log`, `console.error`, `console.warn`.
>
> **Используйте TauriLogger:**
> См. [TauriLogger Руководство](/docs/ru/03_architecture/backend/telemetry-tauri-logger.md)
>
> **Этот файл сохранён для исторической справки.**

---

## Историческая сводка вызовов console.error

Этот документ содержит сводку всех вызовов console.error, найденных в TypeScript/JavaScript коде в директории src/features/ (на момент миграции на TauriLogger).

## Сводка по функциональным модулям

### 1. Модуль Media (`/src/features/media/`)
- **media-api.ts**: Сообщения об ошибках файловых операций (на русском)
  - "Ошибка при получении метаданных:"
  - "Ошибка при получении списка файлов:"
  - "Ошибка при выборе файлов:"
  - "Ошибка при выборе аудиофайлов:"
  - "Ошибка при выборе директории:"
  
- **media-restoration-service.ts**: Ошибки восстановления файлов (на русском)
  - "Ошибка при восстановлении файла [filename]:"
  - "Ошибка при выборе файла пользователем:"

- **use-media-import.ts**: Ошибки импорта и обработки (на русском)
  - "Preview Manager: ошибка для [fileId]:"
  - "Ошибка обработки файла [fileId]:"
  - "Ошибка при сохранении файлов в проект:"
  - "Ошибка обработки файлов:"
  - "Ошибка при импорте файлов:"
  - "Ошибка сканирования папки:"
  - "Ошибка при импорте папки:"

- **use-media-processor.ts**: Ошибки обработки (на английском)
  - "Failed to cache metadata:"
  - "Failed to scan folder:"
  - "Failed to scan folder with thumbnails:"
  - "Failed to process files:"
  - "Failed to process files with thumbnails:"
  - "Failed to cancel processing:"

- **use-simple-media-processor.ts**: Обработка файлов (на английском)
  - "Failed to process file [filePath]:"

- **use-preview-preloader.ts**: Загрузка превью (на английском)
  - "[PreviewPreloader] Failed to preload preview for: [fileId]"

- **cache-settings-modal.tsx**: Операции с кэшем (на русском)
  - "Ошибка загрузки статистики кэша:"
  - "Ошибка очистки кэша превью:"
  - "Ошибка очистки кэша кадров:"

### 2. Модуль AI Chat (`/src/features/ai-chat/`)
- **api-key-loader.ts**: Получение API ключей (на английском)
  - "Failed to get API key for [keyType]:"

- **platform-optimization-service.ts**: Оптимизация видео (на русском)
  - "Ошибка оптимизации для [platform]:"

- **multimodal-analysis-service.ts**: Анализ кадров (на русском)
  - "Ошибка анализа кадра [timestamp]:"
  - "Ошибка анализа кадра для превью [timestamp]:"
  - "Ошибка анализа видео [clipId]:"

- **ffmpeg-analysis-service.ts**: Анализ видео (на русском)
  - "Ошибка получения метаданных видео:"
  - "Ошибка детекции сцен:"
  - "Ошибка анализа качества:"
  - "Ошибка детекции тишины:"
  - "Ошибка анализа движения:"
  - "Ошибка извлечения ключевых кадров:"
  - "Ошибка анализа аудио:"
  - "Ошибка комплексного анализа:"
  - "Ошибка быстрого анализа:"

- **claude-service.ts**: Ошибки Claude API (на русском)
  - "Ошибка при отправке запроса к Claude API:"
  - "Ошибка при отправке запроса к Claude API с инструментами:"
  - "Ошибка при отправке потокового запроса к Claude API:"

- **ollama-service.ts**: Ошибки Ollama API (на русском)
  - "Ошибка при получении списка моделей Ollama:"
  - "Ошибка при отправке запроса к Ollama API:"
  - "Ошибка при отправке потокового запроса к Ollama API:"
  - "Ошибка при скачивании модели Ollama:"

- **deepseek-service.ts**: Ошибки DeepSeek API (на русском)
  - "Ошибка при отправке запроса к DeepSeek API:"
  - "Ошибка при отправке потокового запроса к DeepSeek API:"

- **whisper-service.ts**: Ошибки транскрипции (на русском)
  - "Ошибка транскрипции через OpenAI:"

### 3. Модуль Export (`/src/features/export/`)
- **tiktok-service.ts**: Ошибки загрузки (на английском)
  - "TikTok upload error:"

- **oauth-service.ts**: Ошибки OAuth (на английском)
  - "OAuth login failed for [network]:"
  - "Token refresh failed for [network]:"

- **social-networks-service.ts**: Ошибки социальных сетей (на английском)
  - "Login failed for [network]:"
  - "Upload failed for [network]:"
  - "Token refresh failed:"

- **youtube-service.ts**: Ошибки YouTube (на английском)
  - "YouTube upload error:"

- **secure-token-storage.ts**: Хранение токенов (на английском)
  - "Failed to store token for [network]:"
  - "Failed to get token for [network]:"

### 4. Модуль Video Compiler (`/src/features/video-compiler/`)
- **metadata-cache-service.ts**: Операции с кэшем (на английском)
  - "Failed to get cached metadata:"
  - "Failed to cache metadata:"
  - "Failed to get cache memory usage:"

- **video-compiler-service.ts**: Ошибки компиляции (на английском)
  - "Failed to start video compilation:"
  - "Failed to get render progress:"
  - "Failed to generate preview:"
  - "Failed to cancel render:"
  - "Failed to get active jobs:"
  - "Failed to get render job:"
  - "Failed to prerender segment:"

### 5. Модуль App State (`/src/features/app-state/`)
- **timeline-studio-project-service.ts**: Операции с проектами (на английском)
  - "Failed to open project:"
  - "Failed to save project:"

- **store-service.ts**: Операции с хранилищем (на английском с тегами)
  - "[StoreService] Error initializing store:"
  - "[StoreService] Error getting settings:"
  - "[StoreService] Error saving settings:"

- **project-file-service.ts**: Файловые операции (на английском)
  - "Error loading project from [projectPath]:"
  - "Error saving project to [projectPath]:"

- **app-directories-service.ts**: Операции с директориями (на английском)
  - "Failed to get app directories:"
  - "Failed to create app directories:"
  - "Failed to get directory sizes:"
  - "Failed to clear app cache:"

- **app-settings-machine.ts**: Загрузка настроек (на английском с тегами)
  - "[AppSettingsMachine] Error loading settings:"

- **app-settings-provider.tsx**: Управление проектами (смешанный английский/русский)
  - "Failed to load or create temp project:"
  - "Failed to create temp project:"
  - "Failed to load project data:"
  - "[openProject] Error opening project:"
  - "Failed to save project:"
  - "Failed to save new project:"
  - "[saveProject] Error saving project:"
  - "Failed to auto-save temp project:"
  - "Ошибка при восстановлении медиафайлов:"

### 6. Модуль Timeline (`/src/features/timeline/`)
- **use-timeline-actions.ts**: Операции с дорожками (на английском)
  - "Failed to create or find track for media file"

### 7. Модуль Voice Recording (`/src/features/voice-recording/`)
- **voice-recording-modal.tsx**: Запись аудио (на русском)
  - "Ошибка при сохранении аудиозаписи:"

## Общие паттерны

1. **Смешение языков**: В кодовой базе используются сообщения об ошибках как на русском, так и на английском языке
2. **Контекст ошибок**: Большинство ошибок включают контекст о том, какая операция не удалась
3. **Распространение ошибок**: Многие ошибки перехватываются, логируются, а затем пробрасываются дальше
4. **Теги сервисов**: Некоторые сервисы используют теги типа `[StoreService]` для упрощения отладки
5. **Ошибки для пользователей**: Некоторые ошибки также отображаются пользователям через toast-уведомления

## Рекомендации

1. **Стандартизация языка**: Выбрать либо английский, либо русский язык для всех сообщений об ошибках
2. **Добавить коды ошибок**: Внедрить коды ошибок для упрощения отслеживания и документирования
3. **Структурированное логирование**: Рассмотреть использование библиотеки логирования с уровнями и структурированными данными
4. **Отслеживание ошибок**: Внедрить сервис отслеживания ошибок (например, Sentry) для production
5. **Удалить консольные логи**: В production сборках console.error должен быть заменен на правильную обработку ошибок