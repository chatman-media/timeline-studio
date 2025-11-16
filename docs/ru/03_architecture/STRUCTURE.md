# Структура документации по архитектуре

```
docs/ru/03_architecture/
│
├── 📄 INDEX.md                          # Навигация по всем документам
├── 📄 README.md                         # Главная страница архитектуры
│
├── 📁 Event-Driven Architecture
│   ├── backend-sync-architecture.md     # Command-Event Pattern
│   ├── backend-sync-quick-start.md      # Быстрый старт
│   │
│   ├── 📁 Migration Reports
│   │   ├── FINAL_VERIFICATION_REPORT.md           # ✅ Финальный отчет
│   │   ├── REMAINING_PROVIDERS_AUDIT.md           # Аудит провайдеров
│   │   ├── COMPLETE_MIGRATION_REPORT.md           # Полный отчет
│   │   └── ALL_PROVIDERS_MIGRATION_COMPLETE.md    # Статус миграции
│   │
│   └── 📁 Specific Migrations
│       ├── MIGRATION_BACKEND_SYNC.md              # BackendSync
│       ├── MODAL_PROVIDER_MIGRATION.md            # Modal Provider
│       └── shortcuts-provider-migration.md        # Shortcuts Provider
│
├── 📁 AI Services
│   ├── ai-service.md                    # Архитектура AI сервисов
│   ├── ai-director.md                   # AI Director
│   └── ai-director-architecture.md      # Детальная архитектура
│
├── 📁 Communication & Data Flow
│   ├── communication.md                 # Паттерны коммуникации
│   ├── data-flow.md                     # Поток данных
│   └── frontend-backend-commands-coverage.md  # Покрытие команд
│
├── 📁 backend/                          # Backend (Rust) документация
│   ├── README.md
│   ├── rust-architecture.md
│   ├── architecture-diagram.md
│   ├── service-layer.md
│   ├── type-mapping.md
│   ├── error-handling.md
│   ├── security-architecture.md
│   ├── ffmpeg-integration.md
│   ├── plugin-system.md
│   ├── telemetry.md
│   ├── telemetry-tauri-logger.md
│   └── monitoring-and-metrics.md
│
├── 📁 frontend/                         # Frontend (React) документация
│   ├── README.md
│   └── state-management.md
│
└── 📁 domain-architecture/              # Domain-driven design
    ├── ADR-001-ai-domain-migration.md
    ├── AI-DOMAIN-EXPANSION-ANALYSIS.md
    ├── AI-DOMAIN-EXPANSION-IMPLEMENTATION-PLAN.md
    ├── AI-DOMAIN-EXPANSION-SUMMARY.md
    ├── ai-modules-domain-migration-analysis.md
    ├── AI-TOOLS-ANALYSIS-MIGRATION-REPORT.md
    ├── AI-TOOLS-AUTOMATION-MIGRATION-REPORT.md
    └── AI-TOOLS-SHARED-TYPES-MIGRATION.md
```

## Быстрый доступ

### 🎯 Для новых разработчиков
1. Начните с [README.md](./README.md) - общий обзор
2. Прочитайте [backend-sync-quick-start.md](./backend-sync-quick-start.md) - быстрый старт
3. Изучите [FINAL_VERIFICATION_REPORT.md](./FINAL_VERIFICATION_REPORT.md) - текущий статус

### 🏗️ Для архитекторов
1. [backend-sync-architecture.md](./backend-sync-architecture.md) - Command-Event Pattern
2. [communication.md](./communication.md) - Паттерны коммуникации
3. [data-flow.md](./data-flow.md) - Архитектура потока данных

### 🤖 Для AI разработчиков
1. [ai-service.md](./ai-service.md) - AI сервисы
2. [domain-architecture/](./domain-architecture/) - Domain-driven design
3. [ai-director-architecture.md](./ai-director-architecture.md) - AI Director

### 🔧 Для DevOps
1. [backend/monitoring-and-metrics.md](./backend/monitoring-and-metrics.md)
2. [backend/telemetry.md](./backend/telemetry.md)
3. [backend/security-architecture.md](./backend/security-architecture.md)

## Статистика документации

- **Всего документов**: 39 файлов
- **Backend документов**: 12
- **Frontend документов**: 2
- **Domain архитектура**: 8
- **Migration отчетов**: 7
- **AI документов**: 3
- **Основных документов**: 7

---

*Последнее обновление: 16 ноября 2025*
