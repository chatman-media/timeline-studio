# Console.error Calls in Timeline Studio Codebase

This document summarizes all console.error calls found in the TypeScript/JavaScript code within the src/features/ directory.

## Summary by Feature

### 1. Media Feature (`/src/features/media/`)
- **media-api.ts**: Error messages for file operations (Russian)
  - "Ошибка при получении метаданных:"
  - "Ошибка при получении списка файлов:"
  - "Ошибка при выборе файлов:"
  - "Ошибка при выборе аудиофайлов:"
  - "Ошибка при выборе директории:"
  
- **media-restoration-service.ts**: File restoration errors (Russian)
  - "Ошибка при восстановлении файла [filename]:"
  - "Ошибка при выборе файла пользователем:"

- **use-media-import.ts**: Import and processing errors (Russian)
  - "Preview Manager: ошибка для [fileId]:"
  - "Ошибка обработки файла [fileId]:"
  - "Ошибка при сохранении файлов в проект:"
  - "Ошибка обработки файлов:"
  - "Ошибка при импорте файлов:"
  - "Ошибка сканирования папки:"
  - "Ошибка при импорте папки:"

- **use-media-processor.ts**: Processing errors (English)
  - "Failed to cache metadata:"
  - "Failed to scan folder:"
  - "Failed to scan folder with thumbnails:"
  - "Failed to process files:"
  - "Failed to process files with thumbnails:"
  - "Failed to cancel processing:"

- **use-simple-media-processor.ts**: File processing (English)
  - "Failed to process file [filePath]:"

- **use-preview-preloader.ts**: Preview loading (English)
  - "[PreviewPreloader] Failed to preload preview for: [fileId]"

- **cache-settings-modal.tsx**: Cache operations (Russian)
  - "Ошибка загрузки статистики кэша:"
  - "Ошибка очистки кэша превью:"
  - "Ошибка очистки кэша кадров:"

### 2. AI Chat Feature (`/src/features/ai-chat/`)
- **api-key-loader.ts**: API key retrieval (English)
  - "Failed to get API key for [keyType]:"

- **platform-optimization-service.ts**: Video optimization (Russian)
  - "Ошибка оптимизации для [platform]:"

- **multimodal-analysis-service.ts**: Frame analysis (Russian)
  - "Ошибка анализа кадра [timestamp]:"
  - "Ошибка анализа кадра для превью [timestamp]:"
  - "Ошибка анализа видео [clipId]:"

- **ffmpeg-analysis-service.ts**: Video analysis (Russian)
  - "Ошибка получения метаданных видео:"
  - "Ошибка детекции сцен:"
  - "Ошибка анализа качества:"
  - "Ошибка детекции тишины:"
  - "Ошибка анализа движения:"
  - "Ошибка извлечения ключевых кадров:"
  - "Ошибка анализа аудио:"
  - "Ошибка комплексного анализа:"
  - "Ошибка быстрого анализа:"

- **claude-service.ts**: Claude API errors (Russian)
  - "Ошибка при отправке запроса к Claude API:"
  - "Ошибка при отправке запроса к Claude API с инструментами:"
  - "Ошибка при отправке потокового запроса к Claude API:"

- **ollama-service.ts**: Ollama API errors (Russian)
  - "Ошибка при получении списка моделей Ollama:"
  - "Ошибка при отправке запроса к Ollama API:"
  - "Ошибка при отправке потокового запроса к Ollama API:"
  - "Ошибка при скачивании модели Ollama:"

- **deepseek-service.ts**: DeepSeek API errors (Russian)
  - "Ошибка при отправке запроса к DeepSeek API:"
  - "Ошибка при отправке потокового запроса к DeepSeek API:"

- **whisper-service.ts**: Transcription errors (Russian)
  - "Ошибка транскрипции через OpenAI:"

### 3. Export Feature (`/src/features/export/`)
- **tiktok-service.ts**: Upload errors (English)
  - "TikTok upload error:"

- **oauth-service.ts**: OAuth errors (English)
  - "OAuth login failed for [network]:"
  - "Token refresh failed for [network]:"

- **social-networks-service.ts**: Social network errors (English)
  - "Login failed for [network]:"
  - "Upload failed for [network]:"
  - "Token refresh failed:"

- **youtube-service.ts**: YouTube errors (English)
  - "YouTube upload error:"

- **secure-token-storage.ts**: Token storage (English)
  - "Failed to store token for [network]:"
  - "Failed to get token for [network]:"

### 4. Video Compiler Feature (`/src/features/video-compiler/`)
- **metadata-cache-service.ts**: Cache operations (English)
  - "Failed to get cached metadata:"
  - "Failed to cache metadata:"
  - "Failed to get cache memory usage:"

- **video-compiler-service.ts**: Compilation errors (English)
  - "Failed to start video compilation:"
  - "Failed to get render progress:"
  - "Failed to generate preview:"
  - "Failed to cancel render:"
  - "Failed to get active jobs:"
  - "Failed to get render job:"
  - "Failed to prerender segment:"

### 5. App State Feature (`/src/features/app-state/`)
- **timeline-studio-project-service.ts**: Project operations (English)
  - "Failed to open project:"
  - "Failed to save project:"

- **store-service.ts**: Store operations (English with tags)
  - "[StoreService] Error initializing store:"
  - "[StoreService] Error getting settings:"
  - "[StoreService] Error saving settings:"

- **project-file-service.ts**: File operations (English)
  - "Error loading project from [projectPath]:"
  - "Error saving project to [projectPath]:"

- **app-directories-service.ts**: Directory operations (English)
  - "Failed to get app directories:"
  - "Failed to create app directories:"
  - "Failed to get directory sizes:"
  - "Failed to clear app cache:"

- **app-settings-machine.ts**: Settings loading (English with tags)
  - "[AppSettingsMachine] Error loading settings:"

- **app-settings-provider.tsx**: Project management (Mixed English/Russian)
  - "Failed to load or create temp project:"
  - "Failed to create temp project:"
  - "Failed to load project data:"
  - "[openProject] Error opening project:"
  - "Failed to save project:"
  - "Failed to save new project:"
  - "[saveProject] Error saving project:"
  - "Failed to auto-save temp project:"
  - "Ошибка при восстановлении медиафайлов:"

### 6. Timeline Feature (`/src/features/timeline/`)
- **use-timeline-actions.ts**: Track operations (English)
  - "Failed to create or find track for media file"

### 7. Voice Recording Feature (`/src/features/voice-recording/`)
- **voice-recording-modal.tsx**: Audio recording (Russian)
  - "Ошибка при сохранении аудиозаписи:"

## Common Patterns

1. **Language Mix**: The codebase uses both Russian and English error messages
2. **Error Context**: Most errors include context about what operation failed
3. **Error Propagation**: Many errors are caught, logged, and then re-thrown
4. **Service Tagging**: Some services use tags like `[StoreService]` for easier debugging
5. **User-Facing Errors**: Some errors are also displayed to users via toast notifications

## Recommendations

1. **Standardize Language**: Choose either English or Russian for all error messages
2. **Add Error Codes**: Implement error codes for easier tracking and documentation
3. **Structured Logging**: Consider using a logging library with levels and structured data
4. **Error Tracking**: Implement error tracking service (like Sentry) for production
5. **Remove Console Logs**: In production builds, console.error should be replaced with proper error handling