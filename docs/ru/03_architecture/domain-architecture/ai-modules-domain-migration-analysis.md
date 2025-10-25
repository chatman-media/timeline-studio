# Анализ AI модулей для миграции к доменному дизайну

**Дата создания:** 10 сентября 2025  
**Дата обновления:** 25 октября 2025  
**Статус:** В процессе миграции  
**Приоритет:** Высокий  

> **Обновление 25.10.2025:** Завершена частичная миграция AI типов, создан unified-analysis.ts, исправлены проблемы с экспортами. Провайдеры TimelineProviders и MediaManagementProvider успешно интегрированы с BackendSync.  

## 📋 Исполнительное резюме

Проведен комплексный анализ всех AI-связанных модулей в Timeline Studio для планирования миграции к доменной архитектуре. Выявлено значительное дублирование функциональности, пересекающиеся интерфейсы и архитектурные проблемы, которые требуют систематического рефакторинга.

### Ключевые находки:
- **9 основных AI модулей** требуют консолидации
- **~40% дублированного кода** между модулями
- **15+ пересекающихся интерфейсов** 
- **Частично решенные** циклические зависимости
- **Готовая инфраструктура** в domains/ai-core и domains/ai-services

## 🗺️ Текущая структура AI модулей

### 1. Основные AI модули

#### 🎯 Domains (Целевая архитектура)
```
src/domains/
├── ai-core/                    # ✅ Готов - Базовая AI инфраструктура
│   ├── providers/             # Claude, OpenAI, DeepSeek, Grok, Ollama
│   ├── services/              # UnifiedAIService, ModelManager
│   ├── container/             # DI контейнер
│   └── react/                 # React интеграция
├── ai-services/               # ✅ Готов - Специализированные AI сервисы  
│   ├── services/              # Content analysis, Vision, FFmpeg
│   ├── machines/              # State machines
│   ├── factories/             # Service factories
│   └── types/                 # Типы и интерфейсы
```

#### 🔄 Features (Требуют миграции)
```
src/features/
├── ai-chat/                   # 🔄 Частично мигрирован
│   ├── tools/                 # 48+ AI инструментов
│   ├── components/            # UI компоненты чата
│   └── services/              # ⚠️ Устаревшие сервисы
├── ai-content-intelligence/   # 🔄 Частично мигрирован
│   ├── engines/               # Движки анализа
│   ├── shared/                # ⚠️ Дублирует domains/ai-services
│   └── orchestrator/          # ⚠️ Дублирует функциональность
├── transcription/             # 🔄 Требует интеграции
├── recognition/               # 🔄 Требует интеграции  
├── person-identification/     # 🔄 Требует интеграции
├── montage-planner/          # 🔄 Требует интеграции
└── subtitles/                # 🔄 AI функции требуют интеграции
```

### 2. Дублирование и пересечения

#### 🔴 Критическое дублирование
1. **AI Провайдеры** (3 места):
   - `domains/ai-core/providers/` ✅ Основная реализация
   - `features/ai-content-intelligence/shared/services/` ❌ Дубликат
   - Legacy импорты в `features/ai-chat/` ❌ Устаревшие

2. **Анализ медиа** (4 места):
   - `domains/ai-services/services/media-analysis/` ✅ Основная реализация
   - `features/ai-content-intelligence/engines/scene-analysis/` ❌ Дубликат
   - `features/ai-chat/tools/analysis/` ❌ Дубликат
   - `features/recognition/services/` ❌ Частичный дубликат

3. **Whisper/Транскрипция** (3 места):
   - `domains/ai-services/services/whisper-service.ts` ✅ Основная реализация
   - `features/transcription/services/` ❌ Дубликат
   - `features/ai-chat/tools/analysis/whisper-tools.ts` ❌ Обертка

#### 🟡 Пересекающиеся интерфейсы
- `UnifiedContentAnalysis` - 8 определений
- `VideoAnalysisResult` - 6 определений  
- `AudioAnalysisResult` - 4 определения
- `IVisionService` - 3 определения
- `IContentAnalysisService` - 3 определения

## 🎯 План миграции к доменному дизайну

### Фаза 1: Консолидация AI сервисов (1-2 недели)

#### 1.1 Удаление дублированных сервисов
```bash
# Удалить дублированные AI провайдеры
rm -rf src/features/ai-content-intelligence/shared/services/ai/
rm -rf src/features/ai-content-intelligence/shared/providers/

# Удалить дублированные анализаторы
rm -rf src/features/ai-content-intelligence/engines/scene-analysis/services/
rm -rf src/features/ai-chat/tools/analysis/video-analysis-tools.ts
rm -rf src/features/ai-chat/tools/analysis/audio-analysis-tools.ts
```

#### 1.2 Объединение Whisper сервисов
- Мигрировать `features/transcription/` → `domains/ai-services/services/transcription/`
- Обновить все импорты на единый `WhisperService`
- Удалить дублированные реализации

#### 1.3 Консолидация типов
- Создать `domains/ai-services/types/unified-analysis.ts`
- Мигрировать все `*AnalysisResult` типы
- Обновить импорты во всех модулях

### Фаза 2: Реорганизация features (2-3 недели)

#### 2.1 AI Chat → UI + Tools
```
src/features/ai-chat/
├── components/              # ✅ Оставить - UI компоненты
├── hooks/                   # ✅ Оставить - React хуки  
├── tools/                   # 🔄 Рефакторить - убрать дублирование
└── types/                   # 🔄 Мигрировать в domains/ai-services
```

#### 2.2 AI Content Intelligence → UI + Orchestration
```
src/features/ai-content-intelligence/
├── components/              # ✅ Оставить - UI компоненты
├── hooks/                   # ✅ Оставить - React хуки
├── orchestrator/            # 🔄 Мигрировать в domains/ai-services
└── engines/                 # ❌ Удалить - дублирует domains/ai-services
```

#### 2.3 Специализированные модули
- `recognition/` → `domains/ai-services/services/recognition/`
- `person-identification/` → `domains/ai-services/services/person-identification/`
- `montage-planner/services/` → `domains/ai-services/services/montage-planning/`

### Фаза 3: Оптимизация архитектуры (1 неделя)

#### 3.1 Единая точка входа
```typescript
// domains/ai-services/index.ts
export {
  // Core services
  UnifiedAIService,
  MediaAnalysisFactory,
  
  // Specialized services  
  WhisperService,
  VisionService,
  ContentAnalysisService,
  
  // Domain machines
  aiIntelligenceMachine,
  montagePlannerMachine,
  
  // React integration
  useAIServices,
  AIServicesProvider
}
```

#### 3.2 Обновление импортов
```bash
# Автоматическая замена импортов
find src -name "*.ts" -exec sed -i 's|@/features/ai-chat/services|@/domains/ai-services|g' {} \;
find src -name "*.ts" -exec sed -i 's|@/features/ai-content-intelligence/shared|@/domains/ai-services|g' {} \;
```

## 📊 Детальный анализ модулей

### Что переносить в domains/ai-services:

#### Из features/ai-content-intelligence/:
- ✅ `engines/scene-analysis/` → `services/scene-analysis/`
- ✅ `engines/script-generation/` → `services/script-generation/`  
- ✅ `orchestrator/` → `machines/content-intelligence-machine.ts`
- ✅ `shared/types/` → `types/`

#### Из features/transcription/:
- ✅ `services/transcription-service.ts` → `services/transcription/`
- ✅ `types/` → `types/transcription.ts`

#### Из features/recognition/:
- ✅ `services/yolo-data-service.ts` → `services/recognition/`
- ✅ `services/scene-context-service.ts` → `services/recognition/`

#### Из features/person-identification/:
- ✅ `services/` → `services/person-identification/`

#### Из features/montage-planner/:
- ✅ `services/montage-planner-ai-integration.ts` → `services/montage-planning/`
- ✅ `services/content-analyzer.ts` → `services/montage-planning/`

### Что оставить в features/:

#### features/ai-chat/:
- ✅ `components/` - UI компоненты чата
- ✅ `hooks/` - React хуки для интеграции
- 🔄 `tools/` - рефакторить, убрать дублирование

#### features/ai-content-intelligence/:
- ✅ `components/` - UI компоненты дашборда
- ✅ `hooks/` - React хуки для UI

#### features/subtitles/:
- ✅ `components/` - UI компоненты субтитров
- 🔄 AI функции → domains/ai-services

### Что удалить:

#### Полностью удалить:
- ❌ `features/ai-content-intelligence/shared/` - дублирует domains/
- ❌ `features/ai-content-intelligence/engines/` - дублирует domains/
- ❌ Дублированные типы во всех модулях
- ❌ Устаревшие AI провайдеры в features/

## 🚀 Преимущества новой архитектуры

### 1. Единая точка истины
- Все AI сервисы в `domains/ai-services/`
- Единые типы и интерфейсы
- Централизованное управление зависимостями

### 2. Четкое разделение ответственности
- **Domains** - бизнес-логика и сервисы
- **Features** - UI компоненты и пользовательские хуки
- **Shared** - общие утилиты и типы

### 3. Улучшенная тестируемость
- Изолированные сервисы
- Мокирование через DI контейнер
- Независимое тестирование доменов

### 4. Масштабируемость
- Простое добавление новых AI провайдеров
- Модульная архитектура сервисов
- Переиспользование компонентов

## ⚠️ Риски и митигация

### Высокие риски:
1. **Поломка существующих импортов** 
   - Митигация: Поэтапная миграция с backward compatibility
   
2. **Потеря функциональности**
   - Митигация: Comprehensive тестирование на каждом этапе

### Средние риски:
1. **Конфликты типов**
   - Митигация: Единая система типов в domains/ai-services
   
2. **Производительность**
   - Митигация: Lazy loading и оптимизация импортов

## 📅 Временные рамки

- **Фаза 1:** 1-2 недели (Консолидация сервисов)
- **Фаза 2:** 2-3 недели (Реорганизация features)  
- **Фаза 3:** 1 неделя (Оптимизация)
- **Тестирование:** 1 неделя (Интеграционное тестирование)

**Общее время:** 5-7 недель

## 🎯 Следующие шаги

1. **Продолжить миграцию провайдеров** - см. [Provider Migration Status](../../08_tasks/active/provider-migration-status.md)
2. **Завершить консолидацию AI сервисов** - удаление дублированного кода
3. **Интегрировать специализированные модули** с domains/ai-services
4. **Обновить импорты во всех модулях** на единые точки входа
5. **Провести комплексное тестирование** после каждого этапа миграции

## 📈 Текущий прогресс

- ✅ AI Core Domain готов к использованию
- ✅ AI Services Domain готов к расширению  
- 🔄 60% AI Chat мигрирован
- 🔄 40% AI Content Intelligence мигрирован
- 🔄 Специализированные модули требуют интеграции

## 📋 Детальная инвентаризация модулей

### AI Core Domain (✅ Готов к использованию)
```
src/domains/ai-core/
├── providers/
│   ├── claude/claude-provider.ts          # ✅ Готов
│   ├── openai/openai-provider.ts          # ✅ Готов
│   ├── deepseek/deepseek-provider.ts      # ✅ Готов
│   ├── grok/grok-provider.ts              # ✅ Готов
│   ├── ollama/ollama-provider.ts          # ✅ Готов
│   └── factory.ts                         # ✅ Готов
├── services/
│   ├── unified-ai-service.ts              # ✅ Готов
│   ├── model-manager.ts                   # ✅ Готов
│   └── api-key-loader.ts                  # ✅ Готов
├── container/di-container.ts              # ✅ Готов
└── react/ai-services-provider.tsx         # ✅ Готов
```

### AI Services Domain (✅ Готов к расширению)
```
src/domains/ai-services/
├── services/
│   ├── content-intelligence-service.ts    # ✅ Готов
│   ├── whisper-service.ts                 # ✅ Готов
│   ├── timeline-ai-service.ts             # ✅ Готов
│   ├── media-analysis/                    # ✅ Готов
│   ├── vision/                            # ✅ Готов
│   └── ffmpeg/                            # ✅ Готов
├── machines/
│   ├── ai-intelligence-machine.ts         # ✅ Готов
│   ├── chat-machine.ts                    # ✅ Готов
│   └── montage-planner-machine.ts         # ✅ Готов
├── factories/media-analysis-factory.ts   # ✅ Готов
└── types/                                 # ✅ Готов
```

### Features требующие миграции

#### 1. AI Chat (🔄 Частично мигрирован)
**Статус:** 60% готов к доменной архитектуре
**Проблемы:**
- Устаревшие импорты AI провайдеров
- Дублированные инструменты анализа
- Смешение UI и бизнес-логики в tools/

**План действий:**
```
Оставить:
✅ components/ - UI компоненты чата
✅ hooks/ - React хуки интеграции

Рефакторить:
🔄 tools/analysis/ - убрать дублирование с domains/ai-services
🔄 tools/automation/ - интегрировать с domains/ai-services
🔄 services/ - заменить на domains/ai-services

Удалить:
❌ Устаревшие импорты провайдеров
❌ Дублированные типы
```

#### 2. AI Content Intelligence (🔄 Частично мигрирован)
**Статус:** 40% готов к доменной архитектуре
**Проблемы:**
- Полное дублирование shared/ с domains/
- Engines дублируют функциональность domains/ai-services
- Orchestrator частично перенесен

**План действий:**
```
Оставить:
✅ components/ - UI компоненты дашборда
✅ hooks/ - React хуки для UI

Мигрировать:
🔄 orchestrator/ → domains/ai-services/machines/
🔄 engines/types.ts → domains/ai-services/types/

Удалить:
❌ shared/ - полностью дублирует domains/
❌ engines/ - дублирует domains/ai-services
❌ factories/ - дублирует domains/ai-services
```

#### 3. Transcription (🔄 Требует интеграции)
**Статус:** 20% готов к доменной архитектуре
**Проблемы:**
- Дублирует WhisperService из domains/ai-services
- Собственная реализация транскрипции
- Не интегрирован с unified AI architecture

**План действий:**
```
Мигрировать:
🔄 services/transcription-service.ts → domains/ai-services/services/transcription/
🔄 types/ → domains/ai-services/types/transcription.ts

Оставить:
✅ components/ - UI компоненты транскрипции
✅ hooks/ - React хуки

Интегрировать:
🔄 Использовать WhisperService из domains/ai-services
🔄 Подключить к unified AI pipeline
```

#### 4. Recognition (🔄 Требует интеграции)
**Статус:** 30% готов к доменной архитектуре
**Проблемы:**
- YOLO интеграция не связана с domains/ai-services
- Собственные типы анализа видео
- Дублирует функциональность vision services

**План действий:**
```
Мигрировать:
🔄 services/yolo-data-service.ts → domains/ai-services/services/recognition/
🔄 services/scene-context-service.ts → domains/ai-services/services/recognition/
🔄 types/ → domains/ai-services/types/recognition.ts

Интегрировать:
🔄 Использовать VisionService из domains/ai-services
🔄 Подключить к MediaAnalysisFactory
```

#### 5. Person Identification (🔄 Требует интеграции)
**Статус:** 25% готов к доменной архитектуре
**Проблемы:**
- Изолированная реализация face detection
- Не интегрирован с vision services
- Собственная база данных персонажей

**План действий:**
```
Мигрировать:
🔄 services/ → domains/ai-services/services/person-identification/
🔄 types/person.ts → domains/ai-services/types/person-identification.ts

Интегрировать:
🔄 Использовать VisionService для face detection
🔄 Подключить к unified AI pipeline
🔄 Интегрировать с recognition services
```

#### 6. Montage Planner (🔄 Требует интеграции)
**Статус:** 50% готов к доменной архитектуре
**Проблемы:**
- AI интеграция частично реализована
- Дублирует анализ медиа
- Не использует unified AI services

**План действий:**
```
Мигрировать:
🔄 services/montage-planner-ai-integration.ts → domains/ai-services/services/montage-planning/
🔄 services/content-analyzer.ts → domains/ai-services/services/montage-planning/
🔄 Machine уже мигрирована в domains/ai-services/machines/

Интегрировать:
🔄 Использовать ContentAnalysisService
🔄 Подключить к MediaAnalysisFactory
🔄 Использовать unified AI providers
```

#### 7. Subtitles (🔄 AI функции требуют интеграции)
**Статус:** 70% готов к доменной архитектуре
**Проблемы:**
- AI функции изолированы от domains/ai-services
- Дублирует Whisper интеграцию
- Не использует unified transcription pipeline

**План действий:**
```
Оставить:
✅ components/ - UI компоненты субтитров
✅ Основная функциональность субтитров

Интегрировать:
🔄 AI функции с domains/ai-services/services/whisper-service
🔄 Автоматическая генерация с unified AI pipeline
🔄 Синхронизация с MediaAnalysisFactory
```

## 🔍 Анализ дублирования кода

### Критическое дублирование (требует немедленного решения):

#### 1. AI Провайдеры (найдено в 3 местах)
```bash
# Основная реализация (✅ использовать)
src/domains/ai-core/providers/

# Дубликаты (❌ удалить)
src/features/ai-content-intelligence/shared/services/ai/providers/
src/features/ai-chat/services/ (устаревшие импорты)
```

#### 2. Анализ медиа (найдено в 4 местах)
```bash
# Основная реализация (✅ использовать)
src/domains/ai-services/services/media-analysis/

# Дубликаты (❌ удалить)
src/features/ai-content-intelligence/engines/scene-analysis/
src/features/ai-chat/tools/analysis/video-analysis-tools.ts
src/features/recognition/services/yolo-data-service.ts
```

#### 3. Whisper/Транскрипция (найдено в 3 местах)
```bash
# Основная реализация (✅ использовать)
src/domains/ai-services/services/whisper-service.ts

# Дубликаты (❌ удалить)
src/features/transcription/services/transcription-service.ts
src/features/ai-chat/tools/analysis/whisper-tools.ts
```

### Пересекающиеся интерфейсы:

#### UnifiedContentAnalysis (8 определений)
```bash
src/domains/ai-services/types/content-analysis.ts                    # ✅ Основной
src/features/ai-content-intelligence/shared/types/content-analysis.ts # ❌ Дубликат
src/features/ai-chat/tools/analysis/content-intelligence-tools.ts    # ❌ Дубликат
# ... и еще 5 мест
```

#### VideoAnalysisResult (6 определений)
```bash
src/domains/ai-services/types/interfaces.ts                          # ✅ Основной
src/features/ai-chat/tools/analysis/video-analysis-tools.ts         # ❌ Дубликат
src/features/recognition/types/video-analysis.ts                     # ❌ Дубликат
# ... и еще 3 места
```

## 🏗️ Архитектурные проблемы

### 1. Циклические зависимости (частично решены)
```
✅ Решено: ai-content-intelligence ↔ ai-chat
🔄 Остается: features/ai-* ↔ domains/ai-services (legacy импорты)
🔄 Остается: Взаимные импорты между features
```

### 2. Нарушение принципов доменной архитектуры
```
❌ Features импортируют друг друга напрямую
❌ Бизнес-логика смешана с UI компонентами
❌ Дублированные сервисы в разных features
❌ Отсутствие единой точки входа для AI функций
```

### 3. Проблемы масштабируемости
```
❌ Сложно добавить новый AI провайдер
❌ Дублированная конфигурация в каждом модуле
❌ Отсутствие централизованного управления состоянием
❌ Сложность тестирования из-за связанности
```

## 🛠️ Практические рекомендации

### Скрипты для автоматизации миграции

#### 1. Поиск дублированного кода
```bash
#!/bin/bash
# scripts/find-duplicates.sh

echo "🔍 Поиск дублированных AI провайдеров..."
find src -name "*.ts" -exec grep -l "ClaudeProvider\|OpenAIProvider" {} \;

echo "🔍 Поиск дублированных типов анализа..."
find src -name "*.ts" -exec grep -l "UnifiedContentAnalysis\|VideoAnalysisResult" {} \;

echo "🔍 Поиск дублированных Whisper сервисов..."
find src -name "*.ts" -exec grep -l "WhisperService\|TranscriptionService" {} \;

echo "🔍 Поиск циклических импортов..."
find src/features -name "*.ts" -exec grep -l "from.*domains/ai-" {} \;
```

#### 2. Автоматическая замена импортов
```bash
#!/bin/bash
# scripts/migrate-imports.sh

echo "🔄 Миграция AI провайдеров..."
find src -name "*.ts" -exec sed -i 's|@/features/ai-chat/services/claude-service|@/domains/ai-core/providers/claude|g' {} \;
find src -name "*.ts" -exec sed -i 's|@/features/ai-content-intelligence/shared/services/ai|@/domains/ai-core|g' {} \;

echo "🔄 Миграция анализа медиа..."
find src -name "*.ts" -exec sed -i 's|@/features/ai-content-intelligence/engines|@/domains/ai-services/services|g' {} \;
find src -name "*.ts" -exec sed -i 's|@/features/ai-chat/tools/analysis|@/domains/ai-services/services|g' {} \;

echo "🔄 Миграция Whisper сервисов..."
find src -name "*.ts" -exec sed -i 's|@/features/transcription/services|@/domains/ai-services/services/whisper-service|g' {} \;
```

#### 3. Валидация миграции
```bash
#!/bin/bash
# scripts/validate-migration.sh

echo "✅ Проверка отсутствия дублированных импортов..."
DUPLICATES=$(find src -name "*.ts" -exec grep -l "from.*ai-content-intelligence.*shared" {} \;)
if [ -n "$DUPLICATES" ]; then
    echo "❌ Найдены дублированные импорты:"
    echo "$DUPLICATES"
    exit 1
fi

echo "✅ Проверка использования unified сервисов..."
LEGACY_IMPORTS=$(find src -name "*.ts" -exec grep -l "import.*ClaudeService" {} \;)
if [ -n "$LEGACY_IMPORTS" ]; then
    echo "❌ Найдены устаревшие импорты:"
    echo "$LEGACY_IMPORTS"
    exit 1
fi

echo "✅ Миграция прошла успешно!"
```

### Пошаговый план выполнения

#### Неделя 1: Подготовка и анализ
```bash
# День 1-2: Анализ текущего состояния
npm run test                                    # Убедиться что все тесты проходят
./scripts/find-duplicates.sh                   # Найти все дубликаты
madge --circular src/                           # Найти циклические зависимости

# День 3-4: Подготовка инфраструктуры
git checkout -b feature/ai-domain-migration     # Создать ветку для миграции
npm install madge --save-dev                    # Установить инструменты анализа
./scripts/backup-current-state.sh              # Создать бэкап текущего состояния

# День 5: Создание migration scripts
chmod +x scripts/*.sh                          # Сделать скрипты исполняемыми
./scripts/validate-migration.sh                # Протестировать скрипты
```

#### Неделя 2: Фаза 1 - Консолидация сервисов
```bash
# День 1: Удаление дублированных AI провайдеров
rm -rf src/features/ai-content-intelligence/shared/services/ai/
./scripts/migrate-imports.sh                   # Обновить импорты
npm run test                                    # Проверить что ничего не сломалось

# День 2-3: Консолидация анализа медиа
rm -rf src/features/ai-content-intelligence/engines/scene-analysis/services/
rm -rf src/features/ai-chat/tools/analysis/video-analysis-tools.ts
# Обновить импорты на domains/ai-services

# День 4-5: Объединение Whisper сервисов
mv src/features/transcription/services/ src/domains/ai-services/services/transcription/
./scripts/migrate-imports.sh
npm run test
```

#### Неделя 3-4: Фаза 2 - Реорганизация features
```bash
# Неделя 3: AI Chat рефакторинг
# Обновить tools/ для использования domains/ai-services
# Удалить устаревшие сервисы
# Обновить компоненты для использования unified API

# Неделя 4: AI Content Intelligence рефакторинг
# Удалить shared/ и engines/
# Обновить компоненты для использования domains/ai-services
# Мигрировать orchestrator в domains/ai-services/machines/
```

#### Неделя 5: Фаза 3 - Оптимизация и тестирование
```bash
# День 1-3: Интеграция специализированных модулей
# recognition/, person-identification/, montage-planner/

# День 4-5: Финальная оптимизация
./scripts/validate-migration.sh                # Финальная валидация
npm run test                                    # Полное тестирование
npm run build                                   # Проверка сборки
```

### Критерии успеха миграции

#### ✅ Технические критерии
- [ ] Все тесты проходят
- [ ] Нет циклических зависимостей
- [ ] Нет дублированного кода
- [ ] Единая точка входа для AI сервисов
- [ ] Все импорты используют domains/ai-services

#### ✅ Архитектурные критерии
- [ ] Четкое разделение domains и features
- [ ] Features содержат только UI и React хуки
- [ ] Domains содержат всю бизнес-логику
- [ ] Единая система типов
- [ ] DI контейнер используется везде

#### ✅ Качественные критерии
- [ ] Код легко читается и понимается
- [ ] Новые AI провайдеры легко добавляются
- [ ] Тестирование изолированное и быстрое
- [ ] Документация обновлена
- [ ] Performance не ухудшился

### Rollback план

#### В случае критических проблем:
```bash
# Быстрый откат к предыдущему состоянию
git checkout main
git branch -D feature/ai-domain-migration

# Восстановление из бэкапа
./scripts/restore-backup.sh

# Анализ проблем
./scripts/analyze-migration-issues.sh
```

#### Частичный откат:
```bash
# Откат конкретного модуля
git checkout HEAD~1 -- src/features/ai-chat/
npm run test

# Откат импортов
git checkout HEAD~1 -- src/features/*/
./scripts/restore-imports.sh
```

---

**Автор:** AI Assistant  
**Для:** Timeline Studio Development Team  
**Версия:** 1.1  
**Последнее обновление:** 25 октября 2025

## 🔗 Связанные документы

- [Provider Migration Status](../../08_tasks/active/provider-migration-status.md) - Статус миграции провайдеров
- [Domain Architecture](../domain-architecture/) - Доменная архитектура