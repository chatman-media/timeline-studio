# Recognition Module - YOLO Integration

## Обзор

Модуль распознавания предоставляет интеграцию с YOLO v11 для обнаружения объектов и лиц в видео. Система построена на базе ONNX Runtime с динамической загрузкой библиотек.

## Текущий статус

✅ **Модуль активен и готов к использованию**
- ORT настроен с версией `2.0.0-rc.10` и `load-dynamic` feature
- Все команды Tauri зарегистрированы и доступны
- RecognitionState корректно инициализируется при запуске приложения

## Архитектура

### Компоненты

1. **YoloProcessor** - Основной процессор для работы с YOLO моделями (yolo_processor.rs)
2. **ModelManager** - Управление загрузкой и доступом к YOLO моделям (model_manager.rs)
3. **FrameProcessor** - Обработка отдельных кадров (frame_processor.rs)
4. **ResultAggregator** - Агрегация и форматирование результатов (result_aggregator.rs)
5. **RecognitionService** - Сервис для обработки видео и управления результатами
6. **Commands** - Tauri команды для взаимодействия с фронтендом (commands/)

### Структура после рефакторинга (2025)

```
recognition/
├── mod.rs                    # Главный модуль и реэкспорт
├── commands/                 # Tauri команды
│   ├── mod.rs               # Реэкспорт команд
│   └── yolo_commands.rs     # Команды YOLO процессора
├── model_manager.rs         # Управление моделями (329 строк)
├── frame_processor.rs       # Обработка кадров
├── result_aggregator.rs     # Агрегация результатов
├── yolo_processor.rs        # Основной процессор (из 1030 строк)
├── yolo_processor_refactored.rs # Новая архитектура процессора
├── service.rs               # Сервис распознавания
├── registry.rs              # Регистрация команд
└── tests.rs                 # Тесты модуля
```

### Поддерживаемые модели

- **YOLOv11 Detection** - Обнаружение 80 классов объектов
- **YOLOv11 Segmentation** - Сегментация объектов
- **YOLOv11 Face** - Специализированная модель для лиц
- **YOLOv8** модели (legacy поддержка)
- **Custom** - Пользовательские ONNX модели

## Процесс работы

### 1. Извлечение кадров

Перед распознаванием необходимо извлечь кадры из видео:

```rust
// Используйте video_compiler для извлечения кадров
let frames = extract_recognition_frames(
    video_path,
    ExtractionPurpose::ObjectDetection,
    10 // количество кадров
).await?;
```

Параметры извлечения для распознавания:
- Разрешение: 1280x720
- Качество: 85%
- Формат: PNG
- GPU декодирование: включено

### 2. Загрузка модели

```rust
let mut processor = YoloProcessor::new(
    YoloModel::YoloV11Detection,
    0.5 // confidence threshold
)?;

// Загружаем модель (требует файл models/yolo11n.onnx)
processor.load_model().await?;
```

### 3. Обработка изображений

```rust
// Обработка одного изображения
let detections = processor.process_image(&image_path).await?;

// Или пакетная обработка
let all_detections = processor.process_batch(image_paths).await?;
```

### 4. Результаты

Каждая детекция содержит:
- `class` - название класса объекта
- `class_id` - ID класса
- `confidence` - уверенность (0.0 - 1.0)
- `bbox` - координаты ограничивающей рамки
- `attributes` - дополнительные атрибуты (для лиц)

## Интеграция с фронтендом

### Команды Tauri

1. **process_video_recognition** - Обработать видео
   ```typescript
   const results = await invoke('process_video_recognition', {
     fileId: 'video_123',
     framePaths: ['/path/to/frame1.png', '/path/to/frame2.png']
   });
   ```

2. **get_recognition_results** - Получить сохраненные результаты
   ```typescript
   const results = await invoke('get_recognition_results', {
     fileId: 'video_123'
   });
   ```

### События

Система отправляет события через Tauri:
- `ProcessingStarted` - начало обработки
- `ProcessingProgress` - прогресс (current/total)
- `ProcessingCompleted` - завершение с результатами
- `ProcessingError` - ошибка обработки

## Установка моделей

1. Скачайте модели YOLO v11:
   - [yolo11n.onnx](https://github.com/ultralytics/assets/releases) - базовая модель
   - [yolo11n-face.onnx](https://github.com/ultralytics/assets/releases) - для лиц
   - [yolo11n-seg.onnx](https://github.com/ultralytics/assets/releases) - сегментация

2. Поместите файлы в директорию `models/` в корне проекта

## Конфигурация ORT

Модуль использует ONNX Runtime с динамической загрузкой:
```toml
ort = { version = "=2.0.0-rc.10", default-features = false, features = ["std", "load-dynamic"] }
```

Для корректной работы необходимо установить ONNX Runtime на системе:
```bash
# macOS
brew install onnxruntime

# Или установить переменную окружения
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

## Структура данных

### RecognitionResults
```rust
pub struct RecognitionResults {
    pub objects: Vec<DetectedObject>,    // Обнаруженные объекты
    pub faces: Vec<DetectedFace>,        // Обнаруженные лица
    pub scenes: Vec<DetectedScene>,      // Определенные сцены
    pub processed_at: DateTime<Utc>,     // Время обработки
}
```

### DetectedObject
```rust
pub struct DetectedObject {
    pub class: String,                   // Класс объекта
    pub confidence: f32,                 // Уверенность
    pub timestamps: Vec<f64>,            // Временные метки появления
    pub bounding_boxes: Vec<BoundingBox>,// Координаты для каждого появления
}
```

## Оптимизация производительности

1. **GPU ускорение**: ONNX Runtime автоматически использует GPU если доступен
2. **Пакетная обработка**: Обрабатывайте несколько кадров за раз
3. **Кэширование**: Результаты сохраняются в `Recognition/` директории
4. **Параллельная обработка**: Используйте несколько процессоров для разных типов детекции

## Примеры использования

### Базовое распознавание
```rust
// Создаем сервис
let service = RecognitionService::new(app_dir)?;

// Обрабатываем видео
let results = service.process_video(
    "video_123",
    vec![
        PathBuf::from("frame_001.png"),
        PathBuf::from("frame_002.png"),
    ]
).await?;

// Результаты автоматически сохраняются
```

### Фильтрация по классам
```rust
let mut processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.7)?;

// Ищем только людей и автомобили
processor.set_target_classes(vec![
    "person".to_string(),
    "car".to_string()
]);
```

### Анализ сцен
```rust
// Сервис автоматически определяет типы сцен:
// - "people" - сцены с людьми
// - "traffic" - сцены с транспортом
// - и другие на основе обнаруженных объектов
```

## Тестирование

Запуск тестов:
```bash
cargo test --package timeline-studio --lib recognition
```

Интеграционные тесты (требуют модели):
```bash
cargo test --package timeline-studio --lib recognition -- --ignored
```

## Известные ограничения

1. Модели YOLO должны быть загружены отдельно
2. Первая загрузка модели может занять время
3. Требуется достаточно памяти для обработки 4K видео
4. Точность зависит от качества извлеченных кадров

## Планы развития

1. Интеграция с трекингом объектов между кадрами
2. Поддержка real-time обработки
3. Добавление моделей для распознавания текста
4. Интеграция с базой данных лиц
5. Экспорт результатов в различные форматы