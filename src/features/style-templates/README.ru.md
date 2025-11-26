# Style Templates / Стилистические шаблоны

[English](./README.md) | **Русский**

## Обзор

Система стилистических шаблонов для Timeline Studio, предоставляющая анимированные интро, концовки, нижние трети, заголовки, переходы и наложения. Включает CSS-анимации, интеграцию drag & drop и создание пользовательских шаблонов с сохранением в localStorage.

## Статус

- ✅ **Компоненты**: 4 компонента полностью интегрированы с тулбаром браузера
- ✅ **Хуки**: 3 хука для загрузки, фильтрации и экспорта
- ✅ **Утилиты**: Полный набор вспомогательных функций и система хранения
- ✅ **Тесты**: 142 теста проходят, 100% покрытие модулей

## Структура

```
style-templates/
├── components/
│   ├── style-template-list.tsx      # Список шаблонов
│   ├── style-template-preview.tsx   # Превью шаблона
│   ├── style-template-filters.tsx   # Фильтры
│   └── index.ts
├── hooks/
│   ├── use-style-templates.ts       # Основной хук
│   ├── use-style-template-export.ts # Функциональность экспорта
│   └── index.ts
├── types/
│   ├── style-template.ts            # Определения типов
│   └── index.ts
├── utils/
│   ├── style-template-utils.ts      # Вспомогательные функции
│   └── custom-templates-storage.ts  # Управление хранилищем
├── data/
│   └── style-templates.json         # Данные шаблонов
└── __tests__/                       # 142 теста
```

## Функции

### ✅ Реализовано

- [x] **Типы шаблонов**: Интро, Концовка, Нижняя треть, Заголовок, Переход, Наложение
- [x] **Стили шаблонов**: Современный, Винтаж, Минимализм, Корпоративный, Креативный, Кинематографический
- [x] **Элементы шаблонов**: Текст, фигуры, изображения, видео с анимациями
- [x] **Анимации**: fadeIn, slideIn, scaleIn и другие CSS анимации
- [x] **Drag & Drop**: Интеграция с Timeline для применения шаблонов
- [x] **Экспорт/Импорт**: Сохранение и загрузка шаблонов в формате JSON
- [x] **Пользовательские шаблоны**: Созданные пользователем шаблоны с сохранением в localStorage
- [x] **Поиск и фильтрация**: По категории, стилю, соотношению сторон
- [x] **Превью**: Предпросмотр шаблона с демо-контентом

### ❌ Не реализовано

- [ ] Визуальный редактор шаблонов
- [ ] Предпросмотр анимаций в реальном времени
- [ ] Облачное хранилище шаблонов
- [ ] Маркетплейс шаблонов

## Использование

```typescript
import { useStyleTemplates } from '@/features/style-templates'

function TemplatesTab() {
  const {
    templates,
    filteredTemplates,
    setFilter,
    getTemplateById
  } = useStyleTemplates()

  // Фильтрация по категории
  const filterByIntro = () => {
    setFilter({ category: "intro" })
  }

  // Получение конкретного шаблона
  const template = getTemplateById("modern-intro-1")

  return (
    <div>
      <button onClick={filterByIntro}>Показать интро</button>
      {filteredTemplates.map(template => (
        <div key={template.id}>{template.name}</div>
      ))}
    </div>
  )
}
```

### Экспорт шаблонов

```typescript
import { useStyleTemplateExport } from '@/features/style-templates'

function ExportButton({ template }) {
  const { exportTemplate, isExporting } = useStyleTemplateExport()

  const handleExport = async () => {
    await exportTemplate(template)
  }

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Экспорт...' : 'Экспортировать'}
    </button>
  )
}
```

### Пользовательские шаблоны

```typescript
import {
  addCustomTemplate,
  loadCustomTemplates,
  isCustomTemplate
} from '@/features/style-templates'

function CustomTemplatesManager() {
  const handleSave = (template) => {
    try {
      addCustomTemplate(template)
      console.log('Шаблон сохранен!')
    } catch (error) {
      console.error('Ошибка сохранения:', error)
    }
  }

  const customTemplates = loadCustomTemplates()

  return (
    <div>
      {customTemplates.map(template => (
        <div key={template.id}>
          {template.name.ru}
          {isCustomTemplate(template.id) && ' (Пользовательский)'}
        </div>
      ))}
    </div>
  )
}
```

## Интеграция

- **Зависит от**: @/domains/resources, @/features/browser
- **Используется в**: Timeline, Media Studio, Browser
- **Ресурсы**: Интегрировано с ResourcesProvider для управления проектом

## Тестирование

- **Всего тестов**: 142 теста
- **Файлы тестов**: 10 файлов тестов, покрывающих компоненты, хуки и утилиты
- **Покрытие**: 100% всех модулей

```bash
# Запустить все тесты стилистических шаблонов
bun run test src/features/style-templates/

# Запустить конкретную категорию тестов
bun run test src/features/style-templates/__tests__/components/
bun run test src/features/style-templates/__tests__/hooks/
bun run test src/features/style-templates/__tests__/utils/

# С покрытием
bun run test src/features/style-templates/ --coverage
```

## TODO / Дорожная карта

- [ ] Реализовать визуальный редактор шаблонов для пользовательского создания
- [ ] Добавить предпросмотр анимаций в реальном времени
- [ ] Реализовать облачное хранилище и синхронизацию шаблонов
- [ ] Создать маркетплейс шаблонов для обмена
- [ ] Добавить версионирование шаблонов и историю
- [ ] Оптимизировать рендеринг превью с ленивой загрузкой
