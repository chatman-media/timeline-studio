# ОБЗОР АРХИТЕКТУРЫ TIMELINE STUDIO

## 🏗️ Общая архитектура

Timeline Studio построен на современной модульной архитектуре, сочетающей мощь нативных десктопных приложений с удобством веб-технологий.

```
┌─────────────────────────────────────────────────────────────┐
│                      Timeline Studio                         │
├─────────────────────────┬───────────────────────────────────┤
│      Frontend          │           Backend                  │
│    (Next.js 15)        │         (Rust + Tauri)           │
├─────────────────────────┼───────────────────────────────────┤
│  • React 19            │  • Video Compiler (FFmpeg)        │
│  • XState v5           │  • GPU Acceleration               │
│  • shadcn/ui           │  • Media Processing               │
│  • Tailwind CSS v4     │  • Plugin System                  │
│  • Feature-based       │  • Security Layer                 │
└─────────────────────────┴───────────────────────────────────┘
```

## 🎨 Frontend архитектура

### Feature-based организация

Каждая функция в `/src/features/` является самодостаточным модулем:

```
src/features/
├── timeline/           # Основной редактор
│   ├── components/    # React компоненты
│   ├── hooks/         # Кастомные хуки
│   ├── services/      # Бизнес-логика и XState машины
│   ├── types/         # TypeScript типы
│   ├── utils/         # Вспомогательные функции
│   └── __tests__/     # Тесты
├── video-player/      # Видеоплеер
├── media-studio/      # Главный интерфейс
├── ai-chat/          # AI ассистент
├── ai-content-intelligence/  # Интеллектуальный анализ контента
├── montage-planner/   # AI-планировщик монтажа
├── person-identification/    # Распознавание персонажей
├── fairlight-audio/   # Профессиональный аудио микшер
├── color-grading/     # Цветокоррекция
├── motion-graphics/   # Анимация и графика
├── multicam/          # Многокамерная съемка
├── camera-capture/    # Захват с камеры
├── voice-recording/   # Запись голоса
└── ...               # Другие функции
```

### State Management

- **XState v5** для сложной логики (timeline, player, browser)
- **React Context** для глобального состояния
- **Tauri Store** для персистентного хранения данных
- **Local Storage** для временных настроек пользователя

### UI архитектура

- **shadcn/ui** - готовые компоненты на базе Radix UI
- **Tailwind CSS v4** - утилитарные стили
- **CSS Variables** - темизация
- **Framer Motion** - анимации

### Ключевые модули

#### AI модули
- **AI Content Intelligence** - анализ контента, распознавание сцен/объектов (YOLO/ONNX), генерация скриптов
- **Montage Planner** - автоматическая генерация монтажных планов с AI-анализом материалов
- **Person Identification** - детекция и идентификация лиц, кластеризация DBSCAN

#### Профессиональные инструменты
- **Fairlight Audio** - полноценный аудио микшер с Web Audio API, эффектами и MIDI
- **Color Grading** - профессиональная цветокоррекция с LUT, кривыми и скоупами
- **Motion Graphics** - система ключевых кадров с expression engine

#### Дополнительные возможности
- **Multicam** - синхронизация многокамерной съемки по таймкоду/аудио
- **Camera Capture** - захват видео с камеры и экрана через WebRTC
- **Voice Recording** - профессиональная запись закадрового голоса

## ⚙️ Backend архитектура

### Модульная структура

```
src-tauri/src/
├── core/              # Базовая инфраструктура
│   ├── di/           # Dependency Injection
│   ├── events/       # EventBus система
│   ├── performance/  # Управление памятью
│   ├── plugins/      # Система плагинов
│   └── telemetry/    # Метрики и мониторинг
├── security/          # Безопасность
│   ├── secure_storage.rs    # Шифрование данных
│   ├── oauth_handler.rs     # OAuth для соцсетей
│   └── api_validator.rs     # Валидация API ключей
├── media/             # Обработка медиа
│   ├── metadata.rs   # Анализ файлов
│   ├── ffmpeg.rs     # FFmpeg интеграция
│   └── preview.rs    # Генерация превью
├── video_compiler/    # Компиляция видео
│   ├── core/         # GPU, pipeline, кодеки
│   ├── services/     # Сервисный слой
│   └── cache/        # LRU кеш
├── recognition/       # AI распознавание
│   ├── yolo_processor.rs    # YOLO модели
│   ├── face_detection.rs    # Детекция лиц
│   └── scene_analysis.rs    # Анализ сцен
├── audio/             # Аудио обработка
│   ├── fairlight_engine.rs  # Аудио движок
│   ├── effects_chain.rs     # Цепь эффектов
│   └── midi_handler.rs      # MIDI контроллеры
├── analysis/          # 🆕 Unified Audio Analysis System
│   ├── types/         # f64 precision audio types + comprehensive error handling
│   ├── services/      # UnifiedAudioAnalyzer + AnalysisEngine + Whisper integration
│   ├── commands/      # Tauri commands для unified analysis + system capabilities
│   ├── database/      # Analysis data storage + SQLite integration
│   └── tests/         # Comprehensive unit tests for all audio types
├── color/             # Цветокоррекция
│   ├── grading_engine.rs    # Движок цветокоррекции
│   ├── lut_processor.rs     # Обработка LUT
│   └── scopes.rs            # Профессиональные скоупы
└── montage/           # Монтажный планировщик
    ├── content_analyzer.rs   # Анализ контента
    ├── plan_generator.rs     # Генератор планов
    └── rhythm_calculator.rs  # Расчет ритма
```

### Ключевые компоненты

1. **Video Compiler** - ядро обработки видео на FFmpeg
2. **GPU Service** - аппаратное ускорение (NVENC, QuickSync)
3. **Plugin System** - расширяемость через плагины
4. **Security Layer** - безопасное хранение и OAuth
5. **Media Pipeline** - конвейер обработки медиа
6. **AI Recognition** - YOLO/ONNX модели для анализа контента
7. **Fairlight Engine** - профессиональная аудио обработка
8. **🆕 Unified Audio Analysis** - f64 precision система с comprehensive error handling, Whisper integration, real-time analysis engine
9. **Color Engine** - GPU-ускоренная цветокоррекция
10. **Montage AI** - интеллектуальный анализ и планирование

## 🔌 Коммуникация Frontend ↔ Backend

### Tauri Commands

```rust
// Backend
#[tauri::command]
async fn process_video(path: String, options: VideoOptions) -> Result<VideoOutput> {
    // Обработка видео
}

// 🆕 Unified Audio Analysis Commands
#[tauri::command] 
async fn analyze_audio_unified(file_path: String, config: Option<String>) -> Result<String> {
    // Unified audio analysis с f64 precision + comprehensive error handling
}

#[tauri::command]
async fn get_audio_system_capabilities() -> Result<String> {
    // System capabilities detection для audio analysis
}

#[tauri::command]
async fn get_recommended_audio_config(file_path: String) -> Result<String> {
    // AI-powered configuration recommendations
}

// Frontend
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('process_video', {
    path: '/path/to/video.mp4',
    options: { format: 'mp4', quality: 'high' }
});

// 🆕 Unified Audio Analysis с comprehensive capabilities
const audioAnalysis = await invoke('analyze_audio_unified', {
    filePath: '/path/to/audio.mp3',
    config: JSON.stringify({ 
        performance_mode: 'quality',
        enable_whisper: true,
        enable_montage_integration: true 
    })
});

// System capabilities detection
const capabilities = await invoke('get_audio_system_capabilities');

// AI-powered config recommendations
const recommendedConfig = await invoke('get_recommended_audio_config', {
    filePath: '/path/to/audio.mp3'
});
```

### Event System

```typescript
// Frontend подписка
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('render-progress', (event) => {
    console.log('Progress:', event.payload.percent);
});

// Backend отправка
window.emit("render-progress", ProgressPayload { percent: 75.0 });
```

## 🔐 Безопасность

### API ключи
- Хранятся в системном keychain (macOS), Credential Store (Windows), Secret Service (Linux)
- Шифруются AES-256 перед сохранением
- Никогда не передаются в открытом виде

### OAuth токены
- Используется PKCE flow для безопасности
- Токены обновляются автоматически
- Поддержка YouTube, TikTok, Vimeo, Telegram

## 🚀 Производительность

### Frontend оптимизации
- Code splitting по маршрутам
- Lazy loading компонентов
- Мемоизация дорогих вычислений
- Виртуализация больших списков

### Backend оптимизации
- GPU ускорение для рендеринга
- LRU кеш для превью
- Параллельная обработка через tokio
- Zero-copy операции где возможно

## 🧪 Тестирование

### Frontend
- **Vitest** для unit тестов
- **Testing Library** для компонентов
- **Playwright** для E2E тестов
- **80%+** покрытие кода

### Backend
- **Cargo test** для unit тестов
- **Integration tests** для команд
- **Mockall** для моков
- **Proptest** для property-based тестов

## 📦 Система сборки

### Development
```bash
bun run tauri dev  # Hot reload для frontend и backend
```

### Production
```bash
bun run tauri build  # Оптимизированная сборка
```

### Платформы
- **Windows**: MSI/NSIS инсталлятор
- **macOS**: DMG/App bundle
- **Linux**: AppImage/deb/rpm

---

*Для детальной информации смотрите специализированные документы в разделах архитектуры*