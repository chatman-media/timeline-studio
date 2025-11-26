# Project Templates

[English](./README.md) | **Русский**

## Обзор

Система шаблонов проектов для Timeline Studio. Предоставляет предварительно настроенные конфигурации проектов для разных типов видеоконтента (YouTube, соцсети, подкасты). Включает выбор шаблонов, валидацию, настройку и автоматическую генерацию структуры проекта.

## Статус

- ✅ **Компоненты**: Выбор шаблонов, настройка, превью, мастер
- ✅ **Хуки**: use-project-template (30 тестов), use-template-picker
- ✅ **Сервисы**: Менеджер шаблонов, применение, валидация
- ✅ **Тесты**: 52 теста проходят

## Структура

```
project-templates/
├── components/          # UI компоненты
│   ├── template-customizer.tsx
│   ├── template-picker.tsx
│   ├── template-preview.tsx
│   └── template-wizard.tsx
├── hooks/              # React хуки
│   ├── use-project-template.ts
│   └── use-template-picker.ts
├── lib/                # Библиотеки шаблонов
│   ├── podcast-templates.ts
│   ├── social-templates.ts
│   ├── templates.ts
│   └── youtube-templates.ts
├── services/           # Бизнес-логика
│   ├── project-template-manager.ts
│   ├── template-applier.ts
│   └── template-validator.ts
├── types/              # TypeScript типы
│   └── project-template.ts
└── __tests__/          # Тесты (52 теста)
```

## Функции

### ✅ Реализовано

- [x] Категории шаблонов (YouTube, Social Media, Podcasts, Commercial, Presentation)
- [x] Поддержка соотношений сторон (16:9, 9:16, 1:1, 4:3)
- [x] Выбор и превью шаблонов
- [x] Фильтрация по категории, платформе, соотношению сторон, длительности
- [x] Поиск по названию и описанию
- [x] Сортировка по названию, длительности, категории
- [x] Валидация и проверка совместимости шаблонов
- [x] Применение шаблона к проекту
- [x] Добавление/удаление кастомных шаблонов
- [x] Экспорт/импорт шаблонов в JSON
- [x] Генерация структуры проекта (секции, треки, тайминги)
- [x] Плейсхолдеры (intro, outro, контент, музыка, главы)

### ❌ Не реализовано

- [ ] Шеринг шаблонов и marketplace
- [ ] Облачная синхронизация кастомных шаблонов
- [ ] Продвинутая система версионирования
- [ ] Генерация превью видео для шаблонов

## Использование

```typescript
import { useProjectTemplate } from '@/features/project-templates'

function ProjectWizard() {
  const {
    selectedTemplate,
    selectTemplate,
    applyTemplate,
    filteredTemplates,
    filterTemplates,
    searchTemplates,
  } = useProjectTemplate()

  return (
    <div>
      <input
        onChange={(e) => searchTemplates(e.target.value)}
        placeholder="Поиск шаблонов..."
      />
      {filteredTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => selectTemplate(template.id)}
        >
          {template.name}
        </button>
      ))}
      <button onClick={applyTemplate}>Применить шаблон</button>
    </div>
  )
}
```

## Интеграция

- **Зависит от**:
  - `@/features/project-settings` - для типов проекта
  - `@/lib/tauri-logger` - для логирования
- **Используется в**:
  - Мастере создания проектов
  - Настройках проекта
  - AI Director (для автоматической настройки)

## Тестирование

- **Всего тестов**: 52
- **Покрытие**: Компоненты, хуки, сервисы
- **Тестовые файлы**:
  - `project-template-manager.test.ts` - Логика менеджера шаблонов
  - `use-project-template.test.tsx` - Функциональность хука

## TODO / Roadmap

- [ ] E2E тесты для workflow шаблонов (15 тестов запланировано)
- [ ] Интеграция marketplace шаблонов
- [ ] Облачный бэкап кастомных шаблонов
- [ ] Генерация превью видео для шаблонов
- [ ] Продвинутый UI настройки шаблонов
- [ ] Система версионирования шаблонов
- [ ] Совместное редактирование шаблонов
