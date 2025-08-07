# AI Tools для Timeline Studio

> 🎆 **Новая архитектура!** Инструменты теперь организованы по доменам (core, analysis, automation, integration)

## 🏗️ Новая структура каталога

```
tools/
├── 📁 core/               # Основные инструменты
│   ├── timeline/         # Работа с таймлайном
│   ├── resources/        # Управление ресурсами
│   ├── browser/          # Браузер медиа
│   ├── player/           # Управление плеером
│   └── *.ts              # Эффекты, настройки
├── 🔬 analysis/          # Инструменты анализа
│   ├── video-analysis.ts # Анализ видео
│   ├── audio-analysis.ts # Анализ аудио
│   ├── content-intelligence.ts
│   └── ...
├── ⚙️ automation/        # Автоматизация
│   ├── workflow-tools.ts # Workflow автоматизация
│   ├── batch-processing.ts
│   └── ...
├── 🔗 integration/       # Интеграции
│   ├── export-tools.ts   # Экспорт
│   ├── platform-integration.ts
│   └── ...
└── 📕 base-ai-tool.ts    # Базовый класс
```

## 📦 Домены инструментов

### Core Domain - Основные инструменты
Базовая функциональность Timeline Studio:
- **Timeline Tools** - создание проектов, управление секциями и клипами
- **Resources Tools** - управление эффектами, фильтрами, переходами
- **Browser Tools** - навигация по медиафайлам, выбор ресурсов
- **Player Tools** - управление воспроизведением, навигация
- **Effects & Filters** - применение визуальных эффектов
- **Settings Configuration** - управление настройками проекта

### Analysis Domain - Инструменты анализа
Анализ и обработка контента:
- **Video Analysis** - детекция сцен, анализ качества
- **Audio Analysis** - анализ звука, детекция тишины
- **Content Intelligence** - анализ структуры и содержания
- **Multimodal Analysis** - комбинированный анализ видео и аудио
- **Whisper Tools** - транскрипция речи
- **Person Identification** - распознавание лиц
- **Color & Style Analysis** - анализ цвета и стиля

### Automation Domain - Автоматизация
Автоматические процессы:
- **Workflow Automation** - создание автоматических workflow
- **Batch Processing** - пакетная обработка файлов
- **Performance Optimization** - оптимизация производительности
- **Smart Templates** - интеллектуальные шаблоны
- **Subtitle Generation** - генерация субтитров

### Integration Domain - Интеграции
Экспорт и интеграции:
- **Export Management** - экспорт в различные форматы
- **Platform Integration** - интеграция с соцсетями
- **Format Conversion** - конвертация форматов

## 🚀 Использование

### Импорт всех инструментов
```typescript
import { allTools } from '@/features/ai-chat/tools'

// Использование в AI сервисе
const tools = allTools
```

### Импорт по доменам
```typescript
import { coreTools } from '@/features/ai-chat/tools/core'
import { analysisTools } from '@/features/ai-chat/tools/analysis'
import { automationTools } from '@/features/ai-chat/tools/automation'
import { integrationTools } from '@/features/ai-chat/tools/integration'
```

### Импорт конкретных инструментов
```typescript
import { timelineTools } from '@/features/ai-chat/tools/core/timeline'
import { videoAnalysisTools } from '@/features/ai-chat/tools/analysis/video-analysis-tools'
```

## 🛠️ Базовый класс BaseAITool

Все инструменты наследуются от `BaseAITool`, который предоставляет:
- Унифицированную обработку ошибок
- Логирование операций
- Retry механизм
- Таймауты выполнения
- Метрики производительности

```typescript
export class MyTool extends BaseAITool {
  constructor() {
    super('MyTool')
  }

  async execute(input: MyInput): Promise<AIToolResult<MyResult>> {
    return this.executeWithErrorHandling(async () => {
      // Логика инструмента
      return result
    })
  }
}
```

## 📊 Статистика

- **Всего инструментов**: 48
- **Core домен**: ~18 инструментов
- **Analysis домен**: ~15 инструментов
- **Automation домен**: ~10 инструментов
- **Integration домен**: ~5 инструментов

## 🔧 Преимущества новой архитектуры

### ✅ Логическая группировка
- Инструменты сгруппированы по функциональности
- Четкое разделение ответственности
- Интуитивная навигация

### ⚡ Производительность
- Lazy loading по доменам
- Меньший размер bundle
- Быстрая загрузка нужных инструментов

### 🛠️ Разработка
- Простое добавление новых инструментов
- Изолированное тестирование доменов
- Упрощенный рефакторинг

### 📦 Масштабируемость
- Независимое развитие каждого домена
- Возможность вынесения доменов в отдельные пакеты
- Гибкая архитектура для будущих расширений

---

**Статус**: ✅ **ГОТОВО К ИСПОЛЬЗОВАНИЮ** - Новая архитектура внедрена!