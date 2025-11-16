# Архитектура Timeline Studio

## Обзор системы

- [README.md](./README.md) - Общий обзор архитектуры проекта

## Event-Driven Architecture

### Основная документация
- [backend-sync-architecture.md](./backend-sync-architecture.md) - Полное описание Command-Event Pattern
- [backend-sync-quick-start.md](./backend-sync-quick-start.md) - Быстрый старт для разработчиков

### Отчеты о миграции
- [FINAL_VERIFICATION_REPORT.md](./FINAL_VERIFICATION_REPORT.md) - **Финальный отчет о завершении миграции**
- [REMAINING_PROVIDERS_AUDIT.md](./REMAINING_PROVIDERS_AUDIT.md) - Аудит всех провайдеров
- [COMPLETE_MIGRATION_REPORT.md](./COMPLETE_MIGRATION_REPORT.md) - Полный отчет по миграции
- [ALL_PROVIDERS_MIGRATION_COMPLETE.md](./ALL_PROVIDERS_MIGRATION_COMPLETE.md) - Статус миграции всех провайдеров

### Специфические миграции
- [MIGRATION_BACKEND_SYNC.md](./MIGRATION_BACKEND_SYNC.md) - Миграция BackendSync
- [MODAL_PROVIDER_MIGRATION.md](./MODAL_PROVIDER_MIGRATION.md) - Миграция Modal Provider
- [shortcuts-provider-migration.md](./shortcuts-provider-migration.md) - Миграция Shortcuts Provider

## Компоненты системы

### AI Services
- [ai-service.md](./ai-service.md) - Архитектура AI сервисов
- [ai-director.md](./ai-director.md) - AI Director
- [ai-director-architecture.md](./ai-director-architecture.md) - Детальная архитектура AI Director

### Коммуникация и data flow
- [communication.md](./communication.md) - Паттерны коммуникации
- [data-flow.md](./data-flow.md) - Поток данных в приложении
- [frontend-backend-commands-coverage.md](./frontend-backend-commands-coverage.md) - Покрытие команд

### Backend
- [backend/](./backend/) - Документация Rust backend

### Frontend
- [frontend/](./frontend/) - Документация React frontend

### Domain Architecture
- [domain-architecture/](./domain-architecture/) - Архитектура доменов

## Статус миграции

**Статус**: ✅ **Завершено** (16 ноября 2025)

Все провайдеры успешно мигрированы на event-driven архитектуру. Подробности в [FINAL_VERIFICATION_REPORT.md](./FINAL_VERIFICATION_REPORT.md).

- **Event-Driven провайдеры**: 12 штук (Timeline, UndoRedo, ProjectSettings, Browser, MediaManagement, ColorGrading, Resources, ProjectManagement, Modals, SystemIntegration, AI Services)
- **Local-First провайдеры**: 5 штук (Shortcuts, UserSettings, AppSettings, Language, Theme)
- **Тесты**: 9,406 пройдено (100%)
- **Архитектура**: Command-Event Pattern с Backend как Single Source of Truth
