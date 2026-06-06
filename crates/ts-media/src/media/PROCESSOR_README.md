# Media Processor Module

Модуль для асинхронной обработки медиафайлов с поддержкой параллельной обработки и генерации превью.

## Основные возможности

- **Асинхронное сканирование папок** - рекурсивный поиск медиафайлов
- **Параллельная обработка** - одновременная обработка нескольких файлов
- **События через Tauri** - отправка событий о прогрессе обработки
- **Генерация превью** - создание миниатюр для видео и изображений
- **Управление ошибками** - обработка ошибок без остановки всего процесса

## Использование

### На стороне Rust

```rust
use media::{MediaProcessor, ThumbnailOptions};
use std::path::Path;

// Создание процессора
let processor = MediaProcessor::new(app_handle, thumbnail_dir);

// Сканирование папки без превью
let files = processor.scan_and_process(folder_path, None).await?;

// Сканирование с генерацией превью
let thumbnail_options = Some(ThumbnailOptions {
    width: 320,
    height: 180,
    format: ImageFormat::Jpeg,
    quality: 85,
    time_offset: 1.0, // Для видео - секунда от начала
});
let files = processor.scan_and_process(folder_path, thumbnail_options).await?;
```

### Tauri команды

```rust
// Сканирование без превью
#[tauri::command]
async fn scan_media_folder(
    folder_path: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<MediaFile>, String>

// Сканирование с превью
#[tauri::command]
async fn scan_media_folder_with_thumbnails(
    folder_path: String,
    width: u32,
    height: u32,
    app_handle: tauri::AppHandle,
) -> Result<Vec<MediaFile>, String>
```

### На стороне TypeScript/React

```typescript
import { useMediaProcessor } from '@/features/media/hooks/use-media-processor';

function MyComponent() {
  const {
    scanFolder,
    scanFolderWithThumbnails,
    isProcessing,
    progress,
    errors,
  } = useMediaProcessor({
    onFilesDiscovered: (files) => {
      console.log(`Обнаружено ${files.length} файлов`);
    },
    onMetadataReady: (fileId, metadata) => {
      console.log(`Метаданные готовы для ${fileId}`);
    },
    onThumbnailReady: (fileId, thumbnailPath, thumbnailData) => {
      console.log(`Превью готово для ${fileId}`);
    },
    onProgress: (current, total) => {
      console.log(`Прогресс: ${current}/${total}`);
    },
  });

  // Сканирование папки
  const files = await scanFolderWithThumbnails('/path/to/folder', 320, 180);
}
```

## События

Процессор отправляет следующие события через канал `media-processor`:

### FilesDiscovered
```typescript
{
  type: 'FilesDiscovered',
  data: {
    files: DiscoveredFile[],
    total: number
  }
}
```

### MetadataReady
```typescript
{
  type: 'MetadataReady',
  data: {
    file_id: string,
    file_path: string,
    metadata: MediaFile
  }
}
```

### ThumbnailReady
```typescript
{
  type: 'ThumbnailReady',
  data: {
    file_id: string,
    file_path: string,
    thumbnail_path: string,
    thumbnail_data?: string // Base64
  }
}
```

### ProcessingError
```typescript
{
  type: 'ProcessingError',
  data: {
    file_id: string,
    file_path: string,
    error: string
  }
}
```

### ScanProgress
```typescript
{
  type: 'ScanProgress',
  data: {
    current: number,
    total: number
  }
}
```

## Архитектура

### Параллельная обработка

Процессор использует `Semaphore` для ограничения количества одновременно обрабатываемых файлов (по умолчанию 4). Это предотвращает перегрузку системы при обработке большого количества файлов.

### Генерация превью

Для видео:
- Извлекается кадр на указанной позиции (по умолчанию 1 секунда)
- Используется FFmpeg для извлечения кадра
- Кадр изменяется до указанного размера с сохранением пропорций

Для изображений:
- Загружается исходное изображение
- Изменяется размер с сохранением пропорций

### Кеширование

Превью сохраняются в директории кеша приложения в папке `thumbnails`. Имена файлов генерируются на основе UUID для избежания конфликтов.

## Зависимости

- **tokio** - асинхронная обработка
- **image** - работа с изображениями
- **FFmpeg** - извлечение кадров из видео (должен быть установлен в системе)
- **base64** - кодирование превью для передачи через события

## Производительность

- Параллельная обработка до 4 файлов одновременно
- Асинхронное сканирование директорий
- Событийная модель позволяет обновлять UI без блокировки
- Превью генерируются только по запросу

## Примеры использования

### Компонент сканера медиафайлов

См. файл `/src/features/media/components/media-scanner.tsx` для полного примера React компонента, использующего процессор.

### Интеграция с браузером медиафайлов

Процессор может быть интегрирован с существующим браузером медиафайлов для:
- Предварительной загрузки метаданных
- Генерации превью для отображения в сетке
- Фоновой обработки больших медиатек