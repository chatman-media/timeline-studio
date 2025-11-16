# Архитектура

## 📋 Содержание

Этот раздел содержит подробную архитектурную документацию Timeline Studio - AI-powered платформы для видеомонтажа с **257 интегрированными AI инструментами**.

> **📑 Навигация**: См. [INDEX.md](./INDEX.md) для структурированного списка всех документов по архитектуре.

## 📊 AI Архитектура - Ключевые метрики

- **🎯 Общее количество AI инструментов**: 257 (100% готовы к использованию)
- **🧠 AI модули**: 5 основных (ai-chat, ai-content-intel, recognition, transcription, montage-planner)
- **🌐 Языковая поддержка**: 15 языков
- **🔗 MCP интеграция**: ruv-swarm сервис (23 функции)
- **⚡ Smart Montage Planner**: Полностью интегрирован с генетическими алгоритмами
- **🎬 Scene Analysis Engine**: 100% интеграция в DI контейнер

### 🔄 Основные документы
- [**communication.md**](communication.md) - Взаимодействие Frontend-Backend через Tauri IPC
- [**data-flow.md**](data-flow.md) - Поток данных в приложении
- [**ai-service.md**](ai-service.md) - Архитектура AI сервисов и обработки
- [**backend-sync-architecture.md**](backend-sync-architecture.md) - Command-Event Pattern архитектура
- [**FINAL_VERIFICATION_REPORT.md**](FINAL_VERIFICATION_REPORT.md) - ✅ Финальный отчет о миграции на Event-Driven

### 🎨 Frontend архитектура
- [**frontend/**](frontend/) - Обзор Frontend архитектуры
- [**frontend/state-management.md**](frontend/state-management.md) - Управление состоянием с XState

### 🦀 Backend архитектура
- [**backend/**](backend/) - Обзор Backend архитектуры на Rust
- [**backend/rust-architecture.md**](backend/rust-architecture.md) - Архитектура Rust приложения
- [**backend/type-mapping.md**](backend/type-mapping.md) - Сопоставление типов Frontend и Backend
- [**backend/service-layer.md**](backend/service-layer.md) - Сервисный слой
- [**backend/error-handling.md**](backend/error-handling.md) - Обработка ошибок

### 🎬 Интеграции и AI
- [**backend/ffmpeg-integration.md**](backend/ffmpeg-integration.md) - Интеграция с FFmpeg
- [**backend/plugin-system.md**](backend/plugin-system.md) - Система плагинов
- [**ai-service.md**](ai-service.md) - AI сервисы и машинное обучение

### 📊 Мониторинг
- [**backend/telemetry.md**](backend/telemetry.md) - Телеметрия и метрики
- [**backend/monitoring-and-metrics.md**](backend/monitoring-and-metrics.md) - Мониторинг производительности

### 🔒 Безопасность
- [**backend/security-architecture.md**](backend/security-architecture.md) - Архитектура безопасности

### 📈 Диаграммы
- [**backend/architecture-diagram.md**](backend/architecture-diagram.md) - Архитектурные диаграммы

## 🏗️ Ключевые принципы

### 🤖 AI-First Architecture
- **257 AI инструментов**: Полностью интегрированная AI экосистема
- **DI Container**: Централизованное управление AI сервисами
- **MCP Integration**: Интеграция с внешними AI сервисами
- **Smart Montage**: AI-планировщик монтажа с генетическими алгоритмами
- **Scene Analysis**: Продвинутый анализ сцен и контента

### Frontend (React + TypeScript)
- **State Management**: XState для сложных состояний
- **Component Architecture**: Feature-based организация
- **Provider Architecture**: Event-Driven с BackendSync (17 провайдеров, 100% миграция завершена)
- **Type Safety**: Строгая типизация с TypeScript + Specta автогенерация
- **Performance**: React 19 с оптимизациями
- **AI Integration**: Seamless AI tools integration

### Backend (Rust + Tauri)
- **Type Safety**: Spekta для синхронизации типов
- **Performance**: Zero-copy операции, многопоточность
- **Security**: Sandboxed плагины, шифрование
- **GPU Acceleration**: NVENC, AMF, QuickSync, VideoToolbox
- **AI Services**: Высокопроизводительные AI вычисления

### Коммуникация
- **IPC**: Tauri команды и события
- **Type Safety**: Автогенерация типов
- **Error Handling**: Структурированные ошибки
- **Streaming**: Потоковая передача данных
- **AI Orchestration**: Координация AI сервисов

## 🔗 Связанные разделы

- [Требования](../02_requirements/) - Функциональные и технические требования
- [API Reference](../04_api_reference/) - Справочник по API
- [Разработка](../05_development/) - Руководство разработчика

## 📊 Event-Driven Migration Status

**Статус**: ✅ **Завершено** (16 ноября 2025)

Все 17 провайдеров успешно мигрированы на event-driven архитектуру с Command-Event Pattern.

- **Event-Driven провайдеры**: 12 (Timeline, UndoRedo, ProjectSettings, Browser, MediaManagement, ColorGrading, Resources, ProjectManagement, Modals, SystemIntegration, AI Services)
- **Local-First провайдеры**: 5 (Shortcuts, UserSettings, AppSettings, Language, Theme)
- **Тесты**: 9,406/9,406 пройдено (100%)
- **Документация**: [FINAL_VERIFICATION_REPORT.md](./FINAL_VERIFICATION_REPORT.md)

---

*Последнее обновление: 16 ноября 2025*