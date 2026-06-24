# Montage Planner Module

Интеллектуальный планировщик монтажа для Timeline Studio, использующий AI для автоматической генерации видеомонтажа.

## Обзор

Модуль Montage Planner анализирует видеоконтент и автоматически создает оптимальные планы монтажа на основе:
- Анализа активности в кадре
- Детекции эмоций
- Качества композиции
- Аудио-анализа
- Обнаружения ключевых моментов

## Структура модуля

```
montage_planner/
├── mod.rs              # Основной модуль
├── commands.rs         # Tauri команды
├── types.rs            # Типы данных
└── services/           # Основные сервисы
    ├── mod.rs
    ├── activity_calculator.rs     # Расчет активности
    ├── audio_analyzer.rs          # Анализ аудио
    ├── composition_analyzer.rs    # Анализ композиции
    ├── emotion_detector.rs        # Детекция эмоций
    ├── moment_detector.rs         # Обнаружение моментов
    ├── plan_generator.rs          # Генерация планов
    ├── quality_analyzer.rs        # Анализ качества
    ├── video_processor.rs         # Обработка видео
    └── tests/                     # Comprehensive тесты
        ├── mod.rs
        ├── integration_tests.rs
        ├── comprehensive_tests.rs
        └── *_deep_tests.rs
```

## Основные компоненты

### 🎬 Video Processor
Центральный компонент для обработки видео:
- Извлечение кадров
- Анализ временных меток
- Координация между анализаторами

### 📊 Activity Calculator
Расчет уровня активности в видео:
- Motion detection
- Scene change detection
- Activity scoring по временным отрезкам

### 🎵 Audio Analyzer
Анализ аудио дорожки:
- Volume level analysis
- Beat detection
- Frequency analysis
- Audio quality metrics

### 🖼️ Composition Analyzer
Анализ композиции кадра:
- Rule of thirds
- Leading lines
- Balance analysis
- Visual weight distribution

### 😊 Emotion Detector
Детекция эмоций в видео:
- Face detection
- Emotion classification
- Sentiment analysis
- Emotional arc tracking

### ⭐ Moment Detector
Обнаружение ключевых моментов:
- Highlight detection
- Peak moment identification
- Scene importance scoring

### 🏆 Quality Analyzer
Анализ качества видео:
- Technical quality assessment
- Visual appeal scoring
- Content quality metrics

### 📋 Plan Generator
Генерация планов монтажа:
- Segment optimization
- Cut point selection
- Transition recommendations
- Timing optimization

## Использование

### Создание плана монтажа

```rust
use crate::montage_planner::services::plan_generator::PlanGenerator;

let generator = PlanGenerator::new();
let plan = generator.generate_montage_plan(
    video_path,
    montage_settings
).await?;

println!("Generated {} segments", plan.segments.len());
```

### Анализ активности

```rust
use crate::montage_planner::services::activity_calculator::ActivityCalculator;

let calculator = ActivityCalculator::new();
let activity = calculator.calculate_activity(frames, timestamps).await?;
println!("Average activity: {}", activity.average_score);
```

### Детекция эмоций

```rust
use crate::montage_planner::services::emotion_detector::EmotionDetector;

let detector = EmotionDetector::new();
let emotions = detector.detect_emotions(frame_data).await?;
```

## AI/ML Возможности

### Алгоритмы анализа:
- **Computer Vision** для анализа кадров
- **Audio Signal Processing** для аудио анализа
- **Machine Learning** для детекции эмоций
- **Statistical Analysis** для оценки качества

### Метрики оптимизации:
- Activity score (0.0 - 1.0)
- Emotion intensity 
- Composition quality
- Audio engagement
- Overall appeal

## Типы данных

### MontageSettings
```rust
pub struct MontageSettings {
    pub target_duration: f64,
    pub style: MontageStyle,
    pub music_sync: bool,
    pub emotion_weight: f32,
    pub activity_weight: f32,
}
```

### MontagePlan
```rust
pub struct MontagePlan {
    pub segments: Vec<MontageSegment>,
    pub total_duration: f64,
    pub quality_score: f64,
    pub transitions: Vec<TransitionType>,
}
```

### ActivityData
```rust
pub struct ActivityData {
    pub timestamp: f64,
    pub motion_score: f64,
    pub scene_change_score: f64,
    pub overall_activity: f64,
}
```

## Конфигурация

### Настройки анализа:
```toml
[montage_planner]
activity_threshold = 0.3
emotion_sensitivity = 0.7
quality_min_score = 0.5
max_segments = 50
```

### AI модели:
- YOLO для object detection
- OpenCV для motion analysis
- Custom ML models для emotion detection

## Тестирование

Модуль включает comprehensive test suite:

```bash
# Запуск всех тестов
cargo test --package timeline-studio montage_planner

# Интеграционные тесты
cargo test --package timeline-studio montage_planner::services::tests::integration_tests

# Deep тесты для конкретного компонента
cargo test --package timeline-studio montage_planner::services::tests::activity_calculator_deep_tests
```

### Тестовые категории:
- **Unit tests** - тестирование отдельных функций
- **Integration tests** - тестирование взаимодействия компонентов
- **Deep tests** - comprehensive тестирование каждого сервиса
- **Performance tests** - тестирование производительности

## Performance

### Оптимизации:
- Lazy loading анализаторов
- Parallel processing кадров
- Caching результатов анализа
- Memory-efficient streaming

### Benchmarks:
- Video processing: ~30 fps на среднем железе
- Plan generation: <2 секунды для 5-минутного видео
- Memory usage: <500MB для HD видео

## См. также

- [Main README](../../../README.md) - Общая документация
- [Video Compiler](../video_compiler/README.md) - Компиляция видео
- [Recognition](../recognition/README.md) - Распознавание объектов
- [Media](../media/README.md) - Работа с медиафайлами