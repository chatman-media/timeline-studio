# Templates / Многокамерные шаблоны

[English](./README.md) | **Русский**

## Обзор

Система многокамерных шаблонов с поддержкой разделенных экранов от 2 до 25 видеопотоков. Использует конфигурационную архитектуру с анимациями, кастомизацией и изменяемыми шаблонами для профессионального видеомонтажа.

## Статус

- ✅ **Компоненты**: 6 компонентов для рендеринга и кастомизации
- ✅ **Хуки**: 2 хука для управления шаблонами и импорта
- ✅ **Шаблоны**: 159 шаблонов (78 базовых + 26 PiP + 20 профессиональных + 30 дополнительных + 5 вариантов)
- ✅ **Тесты**: 227 тестов проходят с покрытием >85%

## Структура

```
templates/
├── components/
│   ├── animated-cell.tsx            # Анимированные ячейки
│   ├── resizable-template.tsx       # Интерактивный шаблон
│   ├── template-customizer.tsx      # UI кастомизации
│   ├── template-preview.tsx         # Миниатюры шаблонов
│   ├── template-renderer.tsx        # Универсальный рендерер
│   └── video-panel-component.tsx    # Видеопанели
├── hooks/
│   ├── use-templates.ts             # Разрешение шаблонов
│   └── use-templates-import.ts      # Загрузка шаблонов
├── lib/
│   ├── all-template-configs.tsx     # Все 159 конфигураций
│   ├── additional-templates.tsx     # 30 дополнительных шаблонов
│   ├── pip-templates.tsx            # 26 PiP шаблонов
│   ├── professional-layouts.tsx     # 20 профессиональных шаблонов
│   ├── template-config.ts           # Интерфейсы конфигурации
│   ├── template-labels.ts           # Помощники локализации
│   └── templates.tsx                # Наследуемая система шаблонов
├── services/
│   ├── custom-template-storage.ts   # Хранилище пользовательских шаблонов
│   └── template-service.ts          # Логика позиционирования видео
└── __tests__/                       # 227 тестов >85% покрытие
```

## Функции

### ✅ Реализовано

- [x] **Типы шаблонов**: Вертикальные, горизонтальные, диагональные, сетки, кастомные макеты
- [x] **Количество экранов**: 2-25 видеопанелей с различными конфигурациями
- [x] **Анимации**: Затухание, слайд, масштабирование, переворот
- [x] **Кастомизация**: Цвета, границы, фоны, анимации
- [x] **Изменяемые**: Интерактивное изменение размеров для поддерживаемых шаблонов
- [x] **Пользовательские шаблоны**: Созданные пользователем шаблоны с localStorage
- [x] **Экспорт/Импорт**: Обмен шаблонами через JSON
- [x] **Соотношения сторон**: Альбомная (16:9), Портретная (9:16), Квадрат (1:1)
- [x] **Система конфигурации**: Унифицированный рендерер для всех типов шаблонов

### ❌ Не реализовано

- [ ] Визуальный редактор шаблонов
- [ ] Маркетплейс шаблонов
- [ ] Облачное хранилище шаблонов

## Использование

### Базовое использование шаблона

```typescript
import { ResizableTemplate } from '@/features/templates'

function VideoEditor() {
  const appliedTemplate = {
    template: getTemplateById('split-vertical-landscape'),
    videos: videoFiles
  }

  return (
    <ResizableTemplate
      appliedTemplate={appliedTemplate}
      videos={videoFiles}
      activeVideoId={activeId}
      videoRefs={videoRefs}
    />
  )
}
```

### Выбор шаблона

```typescript
import { TemplateList, useTemplates } from '@/features/templates'

function TemplatePicker() {
  const { templates, getTemplateById } = useTemplates()

  return (
    <TemplateList
      aspectRatio="landscape"
      resolution="1920x1080"
      onTemplateSelect={(template) => applyTemplate(template)}
    />
  )
}
```

### Кастомная конфигурация шаблона

```typescript
import { getAllTemplateConfig } from '@/features/templates'

// Получить конфигурацию шаблона для рендеринга
const config = getAllTemplateConfig('split-diagonal-landscape')

// Рендерить с кастомным рендерером ячеек
<TemplateRenderer
  config={config}
  renderCell={(index, cellConfig) => (
    <VideoPanel video={videos[index]} config={cellConfig} />
  )}
/>
```

### Кастомизация шаблона

```typescript
import { TemplateCustomizer } from '@/features/templates'

<TemplateCustomizer
  template={currentTemplate}
  onUpdate={handleTemplateUpdate}
  onSave={handleSaveCustomTemplate}
/>
```

## Интеграция

- **Зависит от**: @/lib/tauri-logger
- **Используется в**: Media Studio, Timeline, Browser
- **Хранилище**: Пользовательские шаблоны сохраняются в localStorage

## Тестирование

- **Всего тестов**: 227 тестов
- **Покрытие**: >85% общего
- **Категории**:
  - Компоненты: Полное покрытие UI компонентов
  - Хуки: Управление шаблонами и импорт
  - Сервисы: Валидация бизнес-логики
  - Конфигурации: Все 159 конфигураций шаблонов проверены

```bash
# Запустить все тесты шаблонов
bun run test src/features/templates/

# Запустить конкретный файл теста
bun run test src/features/templates/__tests__/lib/all-template-configs.test.ts

# Режим наблюдения
bun run test:watch src/features/templates/
```

## TODO / Дорожная карта

- [ ] Добавить визуальный редактор шаблонов для пользовательских макетов
- [ ] Реализовать маркетплейс шаблонов для обмена
- [ ] Добавить облачное хранилище и синхронизацию
- [ ] Оптимизировать рендеринг для очень больших сеток (20+ панелей)
- [ ] Добавить версионирование шаблонов и историю
- [ ] Реализовать анимации предпросмотра шаблонов
