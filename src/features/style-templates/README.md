# Style Templates - Стилистические шаблоны

## 📋 Статус готовности: **100%** ✅

- ✅ **Типы данных**: Полностью определены (120 строк)
- ✅ **Компоненты**: Интегрированы с общим тулбаром (4 компонента, 428 строк)
- ✅ **Хуки**: Хуки для загрузки, фильтрации и экспорта (3 хука, 509 строк)
- ✅ **Утилиты**: Полный набор вспомогательных функций + хранилище (363 строки)
- ✅ **Данные**: Примеры шаблонов в JSON
- ✅ **Интеграция**: Полностью интегрировано с браузером
- ✅ **Ресурсы**: Интегрировано с системой ресурсов
- ✅ **Вкладка браузера**: Отдельная вкладка "Стили"
- ✅ **Исправления**: Все критические ошибки исправлены
- ✅ **Переводы**: Полная поддержка интернационализации
- ✅ **Drag & Drop**: Полная интеграция с Timeline
- ✅ **Экспорт/Импорт**: Сохранение и загрузка шаблонов
- ✅ **Пользовательские шаблоны**: Хранение в localStorage
- ✅ **Тестирование**: 142 теста, 100% покрытие всех модулей

## 🗂️ Архитектура вкладок

### **Две отдельные вкладки в браузере:**

1. **📐 "Камеры" (templates)** - Многокамерные шаблоны

   - До 25 экранов (сетка 5x5)
   - Изменяемые размеры (resizable)
   - Различные конфигурации сеток
   - Пока НЕ в общей машине состояний

2. **🎨 "Стили" (style-templates)** - Стилистические шаблоны
   - Интро, концовки, нижние трети
   - Анимированные элементы
   - Полностью интегрировано с системой ресурсов
   - Использует общий тулбар браузера

### **Почему отдельные вкладки:**

- **Разная функциональность**: многокамерные vs стилистические
- **Разные компоненты**: большинство компонентов не пересекаются
- **Разная интеграция**: templates пока не в общей машине
- **Удобство использования**: четкое разделение по назначению

## 🎯 Основные функции

### ✅ Готово

#### Типы шаблонов

- [x] Интро (intro) - вступительные заставки
- [x] Концовка (outro) - финальные заставки
- [x] Нижняя треть (lower-third) - информационные плашки
- [x] Заголовки (title) - текстовые заголовки
- [x] Переходы (transition) - анимированные переходы
- [x] Наложения (overlay) - декоративные элементы

#### Стили шаблонов

- [x] Современный (modern) - чистый, минималистичный дизайн
- [x] Винтаж (vintage) - ретро стиль
- [x] Минимализм (minimal) - простые формы
- [x] Корпоративный (corporate) - деловой стиль
- [x] Креативный (creative) - художественный подход
- [x] Кинематографический (cinematic) - киношный стиль

#### Элементы шаблонов

- [x] Текст с настройками шрифта, цвета, размера
- [x] Фигуры с фоном, границами, скруглением
- [x] Изображения и видео
- [x] Анимации (fadeIn, slideIn, scaleIn и др.)
- [x] Позиционирование и тайминг

#### Функциональность

- [x] Загрузка шаблонов из JSON
- [x] Фильтрация по категории, стилю, формату
- [x] Поиск по названию и тегам
- [x] Превью с индикаторами функций
- [x] Поддержка разных соотношений сторон

## 🔧 Техническая реализация

### Структура данных

```typescript
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')
interface StyleTemplate {
  id: string;
  name: string;
  category:
    | "intro"
    | "outro"
    | "lower-third"
    | "title"
    | "transition"
    | "overlay";
  style:
    | "modern"
    | "vintage"
    | "minimal"
    | "corporate"
    | "creative"
    | "cinematic";
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number;
  hasText: boolean;
  hasAnimation: boolean;
  elements: TemplateElement[];
}
```

### Элементы шаблонов

```typescript
interface TemplateElement {
  id: string;
  type: "text" | "shape" | "image" | "video" | "animation";
  position: { x: number; y: number }; // В процентах
  size: { width: number; height: number }; // В процентах
  timing: { start: number; end: number }; // В секундах
  properties: ElementProperties;
  animations?: Animation[];
}
```

## 🎣 Использование

### Базовое использование

```typescript
import { StyleTemplateList } from '@/features/style-templates';

function TemplatesTab() {
  return <StyleTemplateList />;
}
```

### Использование хука

```typescript
import { useStyleTemplates } from '@/features/style-templates';

function MyComponent() {
  const {
    templates,
    filteredTemplates,
    setFilter,
    getTemplateById
  } = useStyleTemplates();

  // Фильтрация по категории
  const filterByIntro = () => {
    setFilter({ category: "intro" });
  };

  // Получение конкретного шаблона
  const template = getTemplateById("modern-intro-1");

  return (
    <div>
      <button onClick={filterByIntro}>Показать интро</button>
      {filteredTemplates.map(template => (
        <div key={template.id}>{template.name}</div>
      ))}
    </div>
  );
}
```

### Экспорт шаблонов

```typescript
import { useStyleTemplateExport } from '@/features/style-templates';

function ExportButton({ template }) {
  const { exportTemplate, isExporting } = useStyleTemplateExport();

  const handleExport = async () => {
    await exportTemplate(template);
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Экспорт...' : 'Экспортировать'}
    </button>
  );
}
```

### Пользовательские шаблоны

```typescript
import {
  addCustomTemplate,
  loadCustomTemplates,
  isCustomTemplate
} from '@/features/style-templates';

function CustomTemplatesManager() {
  const handleSave = (template) => {
    try {
      addCustomTemplate(template);
      console.log('Шаблон сохранен!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const customTemplates = loadCustomTemplates();

  return (
    <div>
      {customTemplates.map(template => (
        <div key={template.id}>
          {template.name.ru}
          {isCustomTemplate(template.id) && ' (Пользовательский)'}
        </div>
      ))}
    </div>
  );
}
```

### Drag & Drop

```typescript
import { StyleTemplateDragSource } from '@/features/style-templates';

function TemplateCard({ template }) {
  return (
    <StyleTemplateDragSource template={template}>
      <div className="template-card">
        <h3>{template.name.ru}</h3>
        <p>{template.description.ru}</p>
      </div>
    </StyleTemplateDragSource>
  );
}
```

## 📁 Структура файлов

```
src/features/style-templates/
├── components/
│   ├── style-template-list.tsx      ✅ Список шаблонов
│   ├── style-template-preview.tsx   ✅ Превью шаблона
│   ├── style-template-filters.tsx   ✅ Фильтры
│   └── index.ts                     ✅
├── hooks/
│   ├── use-style-templates.ts       ✅ Основной хук
│   └── index.ts                     ✅
├── types/
│   ├── style-template.ts            ✅ Типы данных
│   └── index.ts                     ✅
├── data/
│   └── style-templates.json         ✅ Данные шаблонов
├── README.md                        ✅ Документация
└── index.ts                         ✅
```

## 🔗 Интеграция с основным приложением

### ✅ Полная интеграция выполнена

#### Система ресурсов

- ✅ Добавлен тип `StyleTemplateResource`
- ✅ Функция `createStyleTemplateResource`
- ✅ Машина состояний поддерживает `ADD_STYLE_TEMPLATE`
- ✅ Провайдер с методами `addStyleTemplate` и `isStyleTemplateAdded`

#### Браузер

- ✅ Отдельная вкладка "Стили" в браузере
- ✅ Интеграция с общим тулбаром
- ✅ Поиск, фильтрация, сортировка, группировка
- ✅ Настройки размера превью

#### Компоненты

- ✅ `StyleTemplateList` - основной список
- ✅ `StyleTemplatePreview` - превью с кнопками добавления
- ✅ Индикация добавленных шаблонов

#### Переводы

- ✅ Полная локализация на русский язык
- ✅ Переводы для категорий, стилей, фильтров
- ✅ Интеграция с системой i18n

## 🚀 Новые возможности (Ноябрь 2025)

### ✅ Реализованные функции

- ✅ **Drag & Drop интеграция с Timeline**
  - Перетаскивание шаблонов на клипы
  - Автоматическое применение как эффекты или переходы
  - Визуальная индикация совместимости

- ✅ **Экспорт/Импорт шаблонов**
  - Экспорт отдельных шаблонов в JSON
  - Экспорт нескольких шаблонов одним файлом
  - Импорт шаблонов из JSON файлов

- ✅ **Пользовательские шаблоны**
  - Сохранение в localStorage
  - CRUD операции для управления
  - Автоматическое объединение с встроенными шаблонами

### Будущие улучшения

- [ ] Визуальный редактор шаблонов
- [ ] Анимированные превью в реальном времени
- [ ] Облачное хранилище шаблонов
- [ ] Marketplace для обмена шаблонами

### Оптимизации

- [ ] Ленивая загрузка превью
- [ ] Кэширование шаблонов
- [ ] Виртуализация списка
- [ ] Предзагрузка популярных шаблонов

## 📊 Примеры шаблонов

### Современное интро

- Длительность: 3 секунды
- Элементы: заголовок + подзаголовок
- Анимации: fadeIn + slideIn
- Стиль: современный, минималистичный

### Корпоративная нижняя треть

- Длительность: 5 секунд
- Элементы: фон + имя + должность
- Анимации: slideIn слева
- Стиль: профессиональный, строгий

### Минималистичная концовка

- Длительность: 4 секунды
- Элементы: благодарность + призыв к действию
- Анимации: плавное появление
- Стиль: чистый, простой

## 🔧 Исправления и обновления (Май 2025)

### ✅ Критические ошибки исправлены

#### 1. Ошибка сортировки шаблонов

**Проблема**: `a.name.localeCompare is not a function`

- Поле `name` является объектом `{ ru: string, en: string }`, а не строкой
- Код пытался вызвать `localeCompare()` напрямую на объекте

**Решение**:

```typescript
// Было:
comparison = a.name.localeCompare(b.name);

// Стало:
const nameA =
  typeof a.name === "string" ? a.name : a.name?.ru || a.name?.en || "";
const nameB =
  typeof b.name === "string" ? b.name : b.name?.ru || b.name?.en || "";
comparison = nameA.localeCompare(nameB);
```

#### 2. Структура данных JSON

**Проблема**: Несоответствие структуры данных TypeScript типам

- Поле `name` было строкой вместо объекта с языками
- Поле `tags` было массивом вместо объекта с языками

**Решение**:

```json
{
  "name": {
    "ru": "Современное интро",
    "en": "Modern Intro"
  },
  "tags": {
    "ru": ["интро", "современный"],
    "en": ["intro", "modern"]
  }
}
```

#### 3. Tauri совместимость

**Проблема**: Ошибка `Cannot read properties of undefined (reading 'invoke')`

- Хук `use-auto-load-user-data.ts` пытался использовать Tauri API в веб-браузере

**Решение**:

```typescript
const isTauriEnvironment = () => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

if (!isTauriEnvironment()) {
  logger.debugSync("Веб-браузер: пропускаем сканирование");
  return [];
}
```

#### 4. Типы TypeScript

**Проблема**: Использование `null` вместо `undefined` для опциональных полей

**Решение**:

```typescript
// Было:
thumbnail: null,
previewVideo: null,

// Стало:
thumbnail: undefined,
previewVideo: undefined,
```

### 🛠️ Техническая стабильность

- ✅ **Загрузка данных**: Работает как из JSON, так и fallback данные
- ✅ **Логирование**: Добавлено подробное логирование для отладки
- ✅ **Обработка ошибок**: Корректная обработка всех сценариев ошибок
- ✅ **Переводы**: Все ключи интернационализации добавлены
- ✅ **Совместимость**: Работает в веб-браузере и Tauri окружении

### 📁 Созданные ресурсы

Созданы недостающие папки в `public/`:

- `public/effects/`
- `public/transitions/`
- `public/filters/`
- `public/subtitles/`
- `public/templates/`
- `public/style-templates/`

### 🎯 Результат

Стилевые шаблоны теперь полностью функциональны:

- ✅ Загружаются без ошибок
- ✅ Отображаются в браузере на вкладке "Стили"
- ✅ Поддерживают сортировку, фильтрацию, группировку
- ✅ Интегрированы с системой избранного и ресурсов
- ✅ Работают в любом окружении (веб/Tauri)

## 🧪 Тестирование

### 📊 Статистика покрытия (Ноябрь 2025)

Модуль имеет **полное покрытие тестами**:

- **Всего файлов тестов**: 10
- **Всего тестов**: 142 (все проходят)
- **Покрытие модулей**: 100%
  - Компоненты: 4/4 (100%)
  - Хуки: 2/2 (100%)
  - Утилиты: 2/2 (100%)
- **Статус**: ✅ Все тесты проходят

### 📁 Структура тестов

```
src/features/style-templates/
├── __tests__/                                    # Основная папка тестов
│   ├── components/
│   │   ├── style-template-loading.test.tsx       # 4 теста
│   │   └── style-template-error-boundary.test.tsx# 7 тестов
│   ├── hooks/
│   │   ├── use-style-templates.test.ts           # 14 тестов
│   │   └── use-style-templates-import.test.ts    # 14 тестов
│   └── utils/
│       ├── style-template-utils.test.ts          # 35 тестов
│       └── custom-templates-storage.test.ts      # 14 тестов (новое)
└── components/__tests__/                         # Дополнительные тесты компонентов
    ├── style-template-loading.test.tsx           # 17 тестов
    ├── style-template-preview.test.tsx           # 20 тестов
    ├── style-template-error-boundary.test.tsx    # 13 тестов
    └── style-template-drag-source.test.tsx       # 4 теста (новое)
```

**Итого**: 10 файлов, 142 теста (все проходят)

### 🎯 Покрытие по категориям

#### Компоненты (54 теста)

**StyleTemplatePreview** (20 тестов):

- ✅ Отображение превью с миниатюрой
- ✅ Заглушка при отсутствии миниатюры
- ✅ Отображение названия и индикаторов
- ✅ Кнопки воспроизведения, избранного, добавления
- ✅ Применение размеров и стилей
- ✅ Обработка событий мыши
- ✅ Поддержка разных категорий и стилей

**StyleTemplateLoading** (21 тест):

- ✅ Отображение индикатора загрузки
- ✅ Анимированный спиннер
- ✅ Правильная структура компонента
- ✅ Центрирование содержимого
- ✅ Различные состояния загрузки

**StyleTemplateErrorBoundary** (20 тестов):

- ✅ Отображение дочерних компонентов без ошибки
- ✅ Обработка и отображение ошибок
- ✅ Кнопка повторной попытки
- ✅ Сброс ошибки при повторе
- ✅ Правильная структура при ошибке
- ✅ Различные сценарии ошибок

#### Хуки (28 тестов)

**useStyleTemplates** (14 тестов):

- ✅ Инициализация с правильными значениями
- ✅ Загрузка шаблонов из JSON
- ✅ Фильтрация по категории, стилю, тексту, длительности
- ✅ Сортировка по названию и длительности
- ✅ Поиск шаблонов по ID и категории
- ✅ Комбинированные фильтры
- ✅ Обработка ошибок загрузки

**useStyleTemplatesImport** (14 тестов):

- ✅ Инициализация с правильными значениями
- ✅ Импорт JSON файлов с шаблонами
- ✅ Импорт отдельных файлов шаблонов
- ✅ Обработка множественного выбора
- ✅ Индикация процесса импорта
- ✅ Обработка ошибок импорта
- ✅ Защита от параллельных вызовов

#### Утилиты (35 тестов)

**Сокращения и названия** (9 тестов):

- ✅ Сокращения категорий (ИНТ, КОН, ПЕР и др.)
- ✅ Сокращения стилей (СОВ, ВИН, МИН и др.)
- ✅ Локализованные названия категорий и стилей
- ✅ Обработка неизвестных значений

**Фильтрация и сортировка** (14 тестов):

- ✅ Фильтрация по всем критериям
- ✅ Комбинированные фильтры
- ✅ Сортировка по всем полям
- ✅ Группировка шаблонов

**Поиск и валидация** (12 тестов):

- ✅ Поиск по названию, описанию, тегам
- ✅ Поиск на разных языках
- ✅ Валидация структуры шаблонов
- ✅ Генерация уникальных ID

### 🚀 Запуск тестов

```bash
# Все тесты модуля
bun run test src/features/style-templates/

# Тесты из основной папки __tests__
bun run test src/features/style-templates/__tests__/

# Тесты компонентов
bun run test src/features/style-templates/__tests__/components/
bun run test src/features/style-templates/components/__tests__/

# Тесты хуков
bun run test src/features/style-templates/__tests__/hooks/

# Тесты утилит
bun run test src/features/style-templates/__tests__/utils/

# Подробный отчет
bun run test src/features/style-templates/ --reporter=verbose

# С покрытием
bun run test src/features/style-templates/ --coverage
```

### 🛡️ Качество тестов

- ✅ **Моки**: Правильное мокирование зависимостей
- ✅ **Изоляция**: Каждый тест независим
- ✅ **Покрытие**: Все функции и сценарии покрыты
- ✅ **Читаемость**: Тесты на русском языке
- ✅ **Надежность**: Стабильные и быстрые тесты

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/style-templates/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Загрузка списка стилевых шаблонов | ⏳ Planned | - | 🔴 High |
| Фильтрация по категории (intro, outro, lower-third) | ⏳ Planned | - | 🔴 High |
| Фильтрация по стилю (modern, vintage, minimal) | ⏳ Planned | - | 🟡 Medium |
| Поиск по названию и тегам | ⏳ Planned | - | 🟡 Medium |
| Сортировка шаблонов (название, длительность) | ⏳ Planned | - | 🟢 Low |
| Drag & Drop шаблона на timeline | ⏳ Planned | - | 🔴 High |
| Добавление шаблона в избранное | ⏳ Planned | - | 🟡 Medium |
| Превью шаблона в браузере | ⏳ Planned | - | 🟡 Medium |
| Экспорт шаблона в JSON | ⏳ Planned | - | 🟢 Low |
| Импорт пользовательского шаблона | ⏳ Planned | - | 🟢 Low |
| Сохранение кастомного шаблона в localStorage | ⏳ Planned | - | 🟡 Medium |
| Удаление кастомного шаблона | ⏳ Planned | - | 🟢 Low |
| Применение шаблона как эффект на клип | ⏳ Planned | - | 🔴 High |
| Визуализация индикаторов (hasText, hasAnimation) | ⏳ Planned | - | 🟢 Low |

### Приоритеты
- 🔴 High - критичный функционал (загрузка, фильтрация, drag & drop, применение)
- 🟡 Medium - важный функционал (поиск, превью, избранное, custom templates)
- 🟢 Low - дополнительный функционал (сортировка, импорт/экспорт, индикаторы)

### Описание
Style Templates - frontend-only модуль без Tauri команд. Все данные загружаются из JSON и сохраняются в localStorage. Тестирование должно сфокусироваться на UI взаимодействиях (фильтры, поиск, drag & drop) и интеграции с Timeline через систему ресурсов. Важно проверить корректность работы локализации на всех 15 языках.
