# 04. Справочник API Timeline Studio

[← Назад к оглавлению](../README.md)

## 📋 Содержание

- [Обзор](#обзор)
- [Категории команд](#категории-команд)
- [Команды медиа](#команды-медиа)
- [Команды видео компилятора](#команды-видео-компилятора)
- [Команды распознавания](#команды-распознавания)
- [Команды файловой системы](#команды-файловой-системы)
- [Команды управления приложением](#команды-управления-приложением)
- [Команды настроек](#команды-настроек)

## 🔌 Обзор

Этот документ описывает все команды Tauri, доступные для взаимодействия между фронтендом и бэкендом.

## Категории команд

- [Команды медиа](#команды-медиа)
- [Команды видео компилятора](#команды-видео-компилятора)
- [Команды распознавания](#команды-распознавания)
- [Команды файловой системы](#команды-файловой-системы)
- [Команды управления приложением](#команды-управления-приложением)
- [Команды настроек](#команды-настроек)

## Команды медиа

### `get_media_metadata`
Извлекает метаданные из медиафайла.

**Параметры:**
```typescript
{
  file_path: string;
}
```

**Возвращает:**
```typescript
{
  duration: number;      // секунды
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audio_tracks: number;
  has_video: boolean;
  has_audio: boolean;
}
```

**Пример:**
```typescript
const metadata = await invoke('get_media_metadata', {
  file_path: '/path/to/video.mp4'
});
```

### `scan_media_folder`
Сканирует папку на наличие медиафайлов.

**Параметры:**
```typescript
{
  folder_path: string;
  recursive?: boolean;
}
```

**Возвращает:**
```typescript
MediaFile[]

interface MediaFile {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'audio' | 'image';
  size: number;
  created_at: string;
  modified_at: string;
}
```

### `scan_media_folder_with_thumbnails`
Сканирует папку и генерирует миниатюры.

**Параметры:**
```typescript
{
  folder_path: string;
  options: {
    width: number;
    height: number;
    quality: number;
  }
}
```

**Возвращает:**
```typescript
MediaFileWithThumbnail[]

interface MediaFileWithThumbnail extends MediaFile {
  thumbnail: string; // base64 data URL
}
```

## Команды видео компилятора

### `compile_video`
Компилирует видеопроект.

**Параметры:**
```typescript
{
  project: ProjectSchema;
  output_path: string;
}
```

**Возвращает:**
```typescript
{
  job_id: string;
}
```

### `get_render_progress`
Получает прогресс задания рендеринга.

**Параметры:**
```typescript
{
  job_id: string;
}
```

**Возвращает:**
```typescript
{
  progress: number;      // 0-100
  eta_seconds?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}
```

### `generate_preview`
Генерирует кадр предпросмотра.

**Параметры:**
```typescript
{
  timeline: TimelineData;
  timestamp: number;
  width: number;
  height: number;
}
```

**Возвращает:**
```typescript
{
  image_data: string; // base64 PNG
}
```

### `cancel_render`
Отменяет задание рендеринга.

**Параметры:**
```typescript
{
  job_id: string;
}
```

**Возвращает:**
```typescript
{
  success: boolean;
}
```

### `get_gpu_capabilities`
Получает доступные GPU кодировщики.

**Возвращает:**
```typescript
{
  available_encoders: GpuEncoder[];
  current_encoder?: GpuEncoder;
  cuda_available: boolean;
  metal_available: boolean;
}

interface GpuEncoder {
  name: string;
  type: 'nvidia' | 'intel' | 'amd' | 'apple' | 'cpu';
  supported_codecs: string[];
}
```

### `extract_timeline_frames`
Извлекает кадры для предпросмотра таймлайна.

**Параметры:**
```typescript
{
  video_path: string;
  count: number;
  width?: number;
  height?: number;
}
```

**Возвращает:**
```typescript
{
  frames: ExtractedFrame[];
}

interface ExtractedFrame {
  timestamp: number;
  data: string;      // base64
  width: number;
  height: number;
}
```

## Команды распознавания

### `process_video_recognition`
Обрабатывает видео для распознавания объектов/лиц.

**Параметры:**
```typescript
{
  file_id: string;
  frame_paths: string[];
}
```

**Возвращает:**
```typescript
{
  objects: DetectedObject[];
  faces: DetectedFace[];
  scenes: DetectedScene[];
  processed_at: string;
}

interface DetectedObject {
  class: string;
  confidence: number;
  timestamps: number[];
  bounding_boxes: BoundingBox[];
}
```

### `get_recognition_results`
Получает сохраненные результаты распознавания.

**Параметры:**
```typescript
{
  file_id: string;
}
```

**Возвращает:**
```typescript
RecognitionResults | null
```

### `export_recognition_results`
Экспортирует результаты распознавания.

**Параметры:**
```typescript
{
  file_id: string;
  format: 'json' | 'csv';
}
```

**Возвращает:**
```typescript
{
  file_path: string;
}
```

## Команды файловой системы

### `file_exists`
Проверяет существование файла.

**Параметры:**
```typescript
{
  path: string;
}
```

**Возвращает:**
```typescript
boolean
```

### `get_file_stats`
Получает статистику файла.

**Параметры:**
```typescript
{
  path: string;
}
```

**Возвращает:**
```typescript
{
  size: number;
  created_at: string;
  modified_at: string;
  is_file: boolean;
  is_directory: boolean;
}
```

### `search_files_by_name`
Ищет файлы по шаблону имени.

**Параметры:**
```typescript
{
  directory: string;
  pattern: string;
  recursive?: boolean;
}
```

**Возвращает:**
```typescript
string[] // пути к файлам
```

## Команды управления приложением

### `get_app_directories`
Получает директории приложения.

**Возвращает:**
```typescript
{
  base_dir: string;
  projects_dir: string;
  media_cache_dir: string;
  render_cache_dir: string;
  temp_dir: string;
  recognition_dir: string;
}
```

### `create_app_directories`
Создает директории приложения.

**Возвращает:**
```typescript
{
  success: boolean;
}
```

### `get_directory_sizes`
Получает размеры директорий приложения.

**Возвращает:**
```typescript
{
  projects: number;
  media_cache: number;
  render_cache: number;
  temp: number;
  total: number;
}
```

### `clear_app_cache`
Очищает кэш приложения.

**Параметры:**
```typescript
{
  cache_types?: ('media' | 'render' | 'temp' | 'all')[];
}
```

**Возвращает:**
```typescript
{
  cleared_size: number;
}
```

## Команды настроек

### `get_app_language_tauri`
Получает текущий язык приложения.

**Возвращает:**
```typescript
{
  language: 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'de';
}
```

### `set_app_language_tauri`
Устанавливает язык приложения.

**Параметры:**
```typescript
{
  language: 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'de';
}
```

**Возвращает:**
```typescript
{
  success: boolean;
}
```

### `get_compiler_settings`
Получает настройки видео компилятора.

**Возвращает:**
```typescript
{
  ffmpeg_path?: string;
  hardware_acceleration: boolean;
  max_parallel_jobs: number;
  cache_size_mb: number;
}
```

### `update_compiler_settings`
Обновляет настройки компилятора.

**Параметры:**
```typescript
{
  settings: Partial<CompilerSettings>;
}
```

**Возвращает:**
```typescript
{
  success: boolean;
}
```

## Команды видео сервера

### `register_video`
Регистрирует видео для стриминга.

**Параметры:**
```typescript
{
  file_path: string;
}
```

**Возвращает:**
```typescript
{
  video_id: string;
  stream_url: string;
}
```

## Обработка ошибок

Все команды возвращают ошибки в следующем формате:

```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```

Общие коды ошибок:
- `FILE_NOT_FOUND` - Файл или директория не найдены
- `PERMISSION_DENIED` - Нет разрешения на доступ к ресурсу
- `INVALID_FORMAT` - Неверный формат файла
- `PROCESSING_ERROR` - Ошибка во время обработки
- `CANCELLED` - Операция была отменена

## Пример использования

```typescript
import { invoke } from '@tauri-apps/api/tauri';

async function loadVideo(path: string) {
  try {
    // Проверяем существование файла
    const exists = await invoke('file_exists', { path });
    if (!exists) {
      throw new Error('Файл не найден');
    }
    
    // Получаем метаданные
    const metadata = await invoke('get_media_metadata', {
      file_path: path
    });
    
    // Регистрируем для стриминга
    const { stream_url } = await invoke('register_video', {
      file_path: path
    });
    
    return {
      metadata,
      stream_url
    };
  } catch (error) {
    console.error('Не удалось загрузить видео:', error);
    throw error;
  }
}
```

## События

Бэкенд может генерировать события, которые фронтенд может прослушивать:

### События распознавания
```typescript
listen('recognition', (event) => {
  switch (event.payload.type) {
    case 'ProcessingStarted':
      // Обработка начала
      break;
    case 'ProcessingProgress':
      // Обработка прогресса
      break;
    case 'ProcessingCompleted':
      // Обработка завершения
      break;
    case 'ProcessingError':
      // Обработка ошибки
      break;
  }
});
```

### События рендеринга
```typescript
listen('render-progress', (event) => {
  const { job_id, progress, eta } = event.payload;
  // Обновление UI
});
```

---

*Для деталей реализации смотрите соответствующие модули Rust в `src-tauri/src/`.*