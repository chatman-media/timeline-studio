# API референс Timeline Studio

## 📋 Содержание

- [Frontend API](#frontend-api)
- [Backend API (Tauri Commands)](#backend-api-tauri-commands)
- [Интеграции](#интеграции)
- [WebSocket API](#websocket-api)

## Frontend API

### 🎬 Основные модули

- [**Media API**](media-api.md) - Работа с медиафайлами и их персистентностью
- [**Transition Sync API**](transition-sync-api.md) - Синхронизация переходов на таймлайне
- [**Video Player Transitions API**](video-player-transitions-api.md) - Предпросмотр переходов в видеоплеере

### 🎯 Timeline и редактирование

- [**Timeline API**](timeline-api.md) - Управление таймлайном и клипами
- [**Clips API**](clips-api.md) - Операции с клипами
- [**Tracks API**](tracks-api.md) - Управление треками
- [**Effects API**](effects-api.md) - Применение и настройка эффектов
- [**Filters API**](filters-api.md) - Работа с фильтрами

### 🤖 AI и автоматизация

- [**AI Chat API**](ai-chat-api.md) - Интеграция с AI ассистентами (Claude, GPT)
- [**AI Tools API**](ai-tools-api.md) - 257 AI инструмент для автоматизации
- [**Recognition API**](recognition-api.md) - Распознавание объектов и лиц
- [**AI Content Intelligence API**](ai-content-intelligence-api.md) - Интеллектуальный анализ контента
- [**Montage Planner API**](montage-planner-api.md) - Автоматическое планирование монтажа

### 🎨 Профессиональные инструменты

- [**Color Grading API**](color-grading-api.md) - Цветокоррекция
- [**Fairlight Audio API**](fairlight-audio-api.md) - Профессиональный аудиомикшер
- [**Motion Graphics API**](motion-graphics-api.md) - Анимация и графика
- [**Multicam API**](multicam-api.md) - Многокамерное редактирование

### 📤 Экспорт и публикация

- [**Export API**](export-api.md) - Экспорт видео с GPU ускорением
- [**Social Media API**](social-media-api.md) - Публикация в социальные сети
- [**Video Compiler API**](video-compiler-api.md) - Низкоуровневый API компиляции

### 🎥 Захват и запись

- [**Camera Capture API**](camera-capture-api.md) - Захват с камеры
- [**Voice Recording API**](voice-recording-api.md) - Запись голоса
- [**Screen Recording API**](screen-recording-api.md) - Запись экрана

### 🔧 Утилиты и хелперы

- [**State Management API**](state-management-api.md) - XState машины состояний
- [**Storage API**](storage-api.md) - Локальное хранилище и кэширование
- [**Theme API**](theme-api.md) - Управление темами
- [**Localization API**](localization-api.md) - Интернационализация

## Backend API (Tauri Commands)

### 📁 Файловая система

- [**File System Commands**](backend/filesystem-commands.md) - Работа с файлами
- [**Project Commands**](backend/project-commands.md) - Управление проектами
- [**Media Import Commands**](backend/media-import-commands.md) - Импорт медиафайлов

### 🎬 Обработка видео

- [**FFmpeg Commands**](backend/ffmpeg-commands.md) - FFmpeg операции
- [**Frame Extraction Commands**](backend/frame-extraction-commands.md) - Извлечение кадров
- [**Rendering Commands**](backend/rendering-commands.md) - Рендеринг видео
- [**GPU Commands**](backend/gpu-commands.md) - GPU ускорение

### 🤖 AI обработка

- [**Recognition Commands**](backend/recognition-commands.md) - YOLO распознавание
- [**Whisper Commands**](backend/whisper-commands.md) - Транскрипция аудио
- [**AI Processing Commands**](backend/ai-processing-commands.md) - AI обработка

### 🔧 Системные команды

- [**System Info Commands**](backend/system-info-commands.md) - Информация о системе
- [**Performance Commands**](backend/performance-commands.md) - Мониторинг производительности
- [**Plugin Commands**](backend/plugin-commands.md) - Управление плагинами

## 🔌 Интеграции

### Социальные сети

- [**YouTube API Integration**](integrations/youtube-api.md)
- [**TikTok API Integration**](integrations/tiktok-api.md)
- [**Vimeo API Integration**](integrations/vimeo-api.md)
- [**Telegram API Integration**](integrations/telegram-api.md)

### AI сервисы

- [**Claude API Integration**](integrations/claude-api.md)
- [**OpenAI API Integration**](integrations/openai-api.md)
- [**Anthropic API Integration**](integrations/anthropic-api.md)

## 🌐 WebSocket API

- [**Real-time Events**](websocket/events.md) - События в реальном времени
- [**Progress Tracking**](websocket/progress.md) - Отслеживание прогресса
- [**Collaboration**](websocket/collaboration.md) - Совместная работа (планируется)

## 📚 Дополнительные ресурсы

- [Примеры использования](examples/README.md)
- [Миграция с v1 на v2](migration-guide.md)
- [Troubleshooting](troubleshooting.md)
- [Performance Best Practices](performance.md)

---

*Последнее обновление: 31 июля 2025*