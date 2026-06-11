# 📚 ДОКУМЕНТАЦИЯ TIMELINE STUDIO

Добро пожаловать в единую систему документации Timeline Studio!

## 🎯 О системе документации

Эта документация обеспечивает:
- **Полный контекст проекта** для разработчиков и AI-ассистентов
- **Структурированную информацию** по всем аспектам проекта
- **Актуальное состояние** разработки и прогресса
- **Билингвальность из коробки** (русский + английский)
- **Enterprise-ready организацию** с 18 специализированными секциями

## 📁 Структура документации

### [00_project_manifest/](00_project_manifest/)
Главный документ с видением, целями и ключевыми инновациями проекта:
- **[Манифест проекта](00_project_manifest/README.md)** - Полное описание проекта и его инноваций

### [01_project_docs/](01_project_docs/)
- **[Обзор архитектуры](01_project_docs/architecture-overview.md)** - Высокоуровневый обзор системы
- **[Быстрый старт](01_project_docs/quick-start.md)** - Как начать работу с проектом
- **[Установка](01_project_docs/installation.md)** - Детальное руководство по установке
- **[Структура проекта](01_project_docs/project-structure.md)** - Организация кода

### [02_requirements/](02_requirements/)
Требования к проекту и спецификации:
- **[Функциональные требования](02_requirements/functional-requirements.md)** - Детальные функциональные требования
- **[Техническое задание](02_requirements/technical-requirements.md)** - Технические требования системы
- **[Спецификация функций](02_requirements/feature-specification.md)** - Детальная спецификация возможностей
- **[AI Chat требования](02_requirements/ai-chat-requirements.md)** - Требования к AI чат модулю
- **[AI анализ требования](02_requirements/ai-analysis-requirements.md)** - Требования к AI анализу
- **[AI функции требования](02_requirements/ai-features-requirements.md)** - Требования к AI возможностям
- **[Требования расширения рынка](02_requirements/market-expansion-requirements.md)** - Требования к расширению рынка

### [03_architecture/](03_architecture/)
- **[frontend/](03_architecture/frontend/)** - React, XState, компоненты
- **[backend/](03_architecture/backend/)** - Rust, Tauri, сервисы
- **[AI сервис](03_architecture/ai-service.md)** - Архитектура AI сервисов и интеграций
- **[Поток данных](03_architecture/data-flow.md)** - Архитектура потока данных
- **[Коммуникация](03_architecture/communication.md)** - Взаимодействие компонентов

### [04_api_reference/](04_api_reference/)
Документация всех API:
- **[External And Headless Integration Contracts](engineering/external-headless-contracts.md)** - Supported `ProjectSchema`, Rust `timeline`, `render-job`, `bot-workflow`, `bot-worker`, and postim/headless integration surface
- **[Bot-First Production Contract](engineering/bot-first-production-contract.md)** - Supported Telegram bot-first production workflow, state, retry, cleanup and Rust publish boundary
- **[Media API](04_api_reference/media-api.md)** - API для работы с медиафайлами
- **[AI Chat API](04_api_reference/ai-chat-api.md)** - API для AI чат функциональности
- **[Export API](04_api_reference/export-api.md)** - API для экспорта проектов
- **[Recognition API](04_api_reference/recognition-api.md)** - API для распознавания
- **[Timeline API](04_api_reference/timeline-api.md)** - API для работы с таймлайном
- **[Video Compiler API](04_api_reference/video-compiler-api.md)** - API для компиляции видео
- **[Transition Sync API](04_api_reference/transition-sync-api.md)** - API для синхронизации переходов
- **[Video Player Transitions API](04_api_reference/video-player-transitions-api.md)** - API для переходов в плеере
- **[Backend API](04_api_reference/backend/)** - Backend API документация
- **[Интеграции](04_api_reference/integrations/)** - API интеграций

### [05_development/](05_development/)
Руководства для разработчиков:
- **[Руководство разработчика](05_development/README.md)** - Основное руководство по разработке
- **[Команды разработки](05_development/development-commands.md)** - Все команды для разработки
- **[Производительность](05_development/performance.md)** - Оптимизация производительности
- **[Настройка](05_development/setup.md)** - Настройка среды разработки
- **[Тестирование](05_development/testing.md)** - Руководство по тестированию
- **[Стандарты кодирования](05_development/coding-standards.md)** - Стандарты написания кода
- **[Контрибьютинг](05_development/contributing.md)** - Как внести вклад в проект
- **[Чеклист разработки](05_development/development-checklist.md)** - Чеклист для разработчиков
- **[Статус зависимостей](05_development/dependency-status.md)** - Обзор зависимостей проекта
- **[Линтинг и форматирование](05_development/linting-and-formatting.md)** - Инструменты качества кода
- **[Персистентность медиафайлов](05_development/media-file-persistence.md)** - Работа с медиафайлами
- **[Справочник скриптов](05_development/package-scripts-reference.md)** - Документация NPM скриптов
- **[Разработка плагинов](05_development/plugin-development.md)** - Руководство по разработке плагинов
- **[Управление версиями](05_development/version-management.md)** - Практики контроля версий
- **[Миграция WebGL](05_development/webgl-migration-guide.md)** - Руководство по миграции WebGL
- **[Примеры миграции WebGL](05_development/webgl-migration-examples.md)** - Примеры миграции WebGL
- **[Рефакторинг AI Chat](05_development/ai-chat-refactoring-report.md)** - Отчет о рефакторинге AI Chat
- **[Очистка AI Content Intelligence](05_development/ai-content-intelligence-cleanup.md)** - Очистка AI модуля
- **[Анализ AI модулей](05_development/ai-modules-analysis-report.md)** - Отчет анализа AI модулей
- **[Рефакторинг Scene Analysis](05_development/scene-analysis-services-refactoring.md)** - Рефакторинг сервисов анализа сцен
- **[Сводка ошибок консоли](05_development/console-error-summary.md)** - Сводка ошибок консоли
- **[Директории приложения](05_development/application-directories.md)** - Структура директорий

### [06_deployment/](06_deployment/)
Руководства по развертыванию:
- **[Руководство по сборке](06_deployment/build-guide.md)** - Инструкции по сборке приложения
- **[Настройка OAuth](06_deployment/oauth-setup.md)** - Настройка OAuth интеграций
- **[Telegram Bot Worker Production Runbook](06_deployment/telegram-bot-worker-production.md)** - Production topology, systemd setup, retention and sandbox smoke for bot-first worker
- **[Telegram AI Review Sandbox Smoke](06_deployment/telegram-ai-review-sandbox-smoke.md)** - Mocked and real sandbox smoke path for Telegram AI review without desktop UI
- **[Telegram AI Review Sandbox Report Template](06_deployment/telegram-ai-review-sandbox-report.template.md)** - Sanitized evidence template for real sandbox runs
- **[Платформы](06_deployment/platforms/)** - Специфика развертывания по платформам

### [08_tasks/](08_tasks/)
- **[active/](08_tasks/active/)** - Текущие задачи  
- **[completed/](08_tasks/completed/)** - Выполненные задачи
- **[planned/](08_tasks/planned/)** - Будущие задачи

### [09_architectural_decisions/](09_architectural_decisions/)
Архитектурные решения:
- **[Исследование DI](09_architectural_decisions/adr_di_research.md)** - Исследование dependency injection

### [10_project_state/](10_project_state/)
Текущее состояние проекта:
- **[Текущий статус](10_project_state/current-status.md)** - Актуальное состояние разработки
- **[Дорожная карта](10_project_state/roadmap.md)** - Планы развития проекта

### [11_legal/](11_legal/)
Юридические документы:
- **[Лицензия](11_legal/license.md)** - Информация о лицензировании

### [12_testing/](12_testing/)
Стратегии тестирования:
- **[Тестирование](12_testing/README.md)** - Основное руководство по тестированию
- **[Backend тестирование](12_testing/backend-testing.md)** - Тестирование backend части
- **[Тестирование с реальными медиа](12_testing/testing-real-media.md)** - Тестирование с медиафайлами
- **[Новое тестирование с медиа](12_testing/testing-real-media-new.md)** - Обновленное тестирование медиа
- **[Проблемы памяти в тестах](12_testing/test-memory-issues.md)** - Проблемы памяти при тестировании
- **[Сводка тестов](12_testing/test-summary.md)** - Сводка покрытия тестами
- **[Руководство по тестированию](12_testing/testing.md)** - Комплексное руководство по тестированию

### [13_ci_cd/](13_ci_cd/)
Непрерывная интеграция и развертывание:
- **[CI/CD](13_ci_cd/README.md)** - Основное руководство по CI/CD
- **[Настройка CI/CD](13_ci_cd/ci-cd-setup.md)** - Настройка пайплайнов
- **[Компоненты Codecov](13_ci_cd/codecov-components.md)** - Настройка покрытия кода
- **[Semantic Release](13_ci_cd/semantic-release.md)** - Автоматические релизы

### [14_quality_assurance/](14_quality_assurance/)
Процессы обеспечения качества:
- **[Quality Assurance](14_quality_assurance/README.md)** - Стандарты качества
- **[Руководство по Alpha тестированию](14_quality_assurance/alpha-testing-guide.md)** - Руководство по тестированию Alpha версии

### [15_security/](15_security/)
Руководства по безопасности:
- **[Безопасность](15_security/README.md)** - Руководство по безопасности
- **[Руководящие принципы безопасности](15_security/security-guidelines.md)** - Принципы безопасности

### [16_user_documentation/](16_user_documentation/)
Документация для пользователей:
- **[Пользовательская документация](16_user_documentation/README.md)** - Руководства для пользователей

### [17_releases/](17_releases/)
Управление релизами:
- **[Релизы](17_releases/README.md)** - Управление версиями и релизами

### [18_marketing/](18_marketing/) ⭐
- **[Бизнес-план](18_marketing/business-plan.md)** - Бизнес-план проекта
- **[Конкурентный анализ](18_marketing/competitive-analysis.md)** - Анализ конкурентов
- **[Финансовые прогнозы](18_marketing/financial-projections.md)** - Финансовые прогнозы
- **[Инвестиционная оценка](18_marketing/investment-valuation.md)** - Оценка для инвесторов
- **[Требования к презентации](18_marketing/pitch-deck-requirements.md)** - Требования к питч-деку
- **[Структура презентации](18_marketing/pitch-deck-structure.md)** - Структура питч-дека
- **[Модель ценообразования](18_marketing/pricing-model.md)** - Модель ценообразования
- **[Дорожная карта команды](18_marketing/team-roadmap-investment.md)** - Дорожная карта и инвестиции
- **[AI Demo слайды](18_marketing/ai-demo-slides.md)** - Слайды для демонстрации AI

## 🚀 С чего начать?

1. **Новичкам** → [Быстрый старт](01_project_docs/quick-start.md)
2. **Разработчикам** → [Обзор архитектуры](01_project_docs/architecture-overview.md)
3. **Контрибьюторам** → [Руководство разработчика](05_development/README.md)
4. **Маркетологам** → [Стратегии продвижения](18_marketing/)

## 📊 Ключевые метрики

- **Alpha готовность**: 97.5%
- **Rust workspace**: `crates/*` decomposition завершена
- **TypeScript workspace**: `packages/*` and `apps/*` extraction завершены
- **Bot/headless contracts**: Phase G закрыта, main CI зеленый

## 🤝 Как внести вклад

1. Изучите [Манифест проекта](00_project_manifest/README.md)
2. Выберите задачу из [Планируемых](08_tasks/planned/README.md)
3. Следуйте руководствам из [Development](05_development/README.md)
4. Для bot/headless задач начинайте с [Current Status](10_project_state/current-status.md) and [Roadmap](10_project_state/roadmap.md)

## 🏗️ Структура документации

**Наша документация** организована по принципам:

✅ **18 специализированных секций** для полного покрытия проекта  
✅ **Билингвальность из коробки** (ru/en структура)  
✅ **Media-First архитектура** для мультимедийных проектов  
✅ **Enterprise-ready организация** с профессиональными стандартами

## 🔗 Полезные ссылки

- **GitHub**: https://github.com/chatman-media/timeline-studio
- **Маркетинговые стратегии**: [18_marketing/](18_marketing/)
- **Текущий статус**: [10_project_state/current-status.md](10_project_state/current-status.md)
- **Roadmap**: [10_project_state/roadmap.md](10_project_state/roadmap.md)

### [99_templates/](99_templates/)
Шаблоны документов:
- **[Шаблон задачи](99_templates/task-template.md)** - Шаблон для описания задач
- **[Шаблон функции](99_templates/feature-template.md)** - Шаблон для описания функций
- **[Шаблон ADR](99_templates/adr-template.md)** - Шаблон архитектурных решений
- **[Шаблон маркетинговой стратегии](99_templates/marketing-strategy-template.md)** - Шаблон маркетинговой стратегии
- **[Шаблон релиза](99_templates/release-template.md)** - Шаблон заметок о релизе

---

*Последнее обновление: 11 июня 2026*
