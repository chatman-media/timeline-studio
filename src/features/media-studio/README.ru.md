# Media Studio

[English](./README.md) | **Русский**

## Обзор

Media Studio — это основной модуль-оркестратор Timeline Studio, который объединяет все компоненты редактора в единый интерфейс. Предоставляет корневой компонент приложения, систему макетов и глобальные провайдеры состояния.

## Статус

- ✅ **Компоненты**: MediaStudio, 4 макета (Default, Vertical, Options, Chat), LayoutPreviews
- ✅ **Хуки**: useAutoLoadUserData (автозагрузка медиа и ресурсов)
- ✅ **Сервисы**: Providers (композиция глобального контекста)
- ✅ **Тесты**: 65 тестов в 9 файлах

## Структура

```
media-studio/
├── components/
│   ├── media-studio.tsx          # Корневой компонент
│   └── layout/
│       ├── default-layout.tsx    # Стандартный макет
│       ├── vertical-layout.tsx   # Вертикальный макет
│       ├── options-layout.tsx    # Макет с панелью опций
│       ├── chat-layout.tsx       # Макет с AI чатом
│       ├── layout-previews.tsx   # Компонент выбора макета
│       └── layouts-markup.tsx    # Визуальные превью макетов
├── hooks/
│   └── use-auto-load-user-data.ts # Автозагрузка пользовательских данных
├── services/
│   └── providers.tsx             # Глобальные провайдеры
└── __tests__/                    # Тесты компонентов
```

## Возможности

### ✅ Реализовано

- [x] Корневой компонент MediaStudio с композицией провайдеров
- [x] 4 варианта макетов (Default, Vertical, Options, Chat)
- [x] Автоматическая загрузка медиа и ресурсов при запуске
- [x] Адаптивная видимость панелей (Browser, Timeline, Options, Chat)
- [x] Глобальные провайдеры состояния (AppState, UserSettings, Modal, Timeline и др.)
- [x] Управление состоянием загрузки
- [x] Переключение макетов через пользовательские настройки

### ❌ Не реализовано

- [ ] Пользовательские макеты
- [ ] Сохранение и восстановление состояний макетов
- [ ] Анимации переключения макетов
- [ ] Динамическая загрузка компонентов для оптимизации
- [ ] Плагин-архитектура для расширений

## Использование

### Корневое приложение

```tsx
import { MediaStudio } from '@/features/media-studio'

function App() {
  return <MediaStudio />
}
```

### Композиция провайдеров

```tsx
import { Providers } from '@/features/media-studio'

function CustomApp() {
  return (
    <Providers>
      <YourCustomComponents />
    </Providers>
  )
}
```

### Хук автозагрузки

```typescript
import { useAutoLoadUserData } from '@/features/media-studio'

function MyComponent() {
  const { isLoading, error, data } = useAutoLoadUserData()

  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />

  return <div>Загружено: {data.media.length} файлов</div>
}
```

## Система макетов

### DefaultLayout
- Классический макет с браузером слева, видео в центре, таймлайном внизу
- Адаптивен к видимости панелей через `useUserSettings`

### VerticalLayout
- Вертикальное расположение с видео справа
- Оптимизирован для работы с вертикальным контентом

### OptionsLayout
- Включает панель опций справа
- Адаптивное показ/скрытие панели опций

### ChatLayout
- Интегрирует AI чат справа
- Поддерживает все комбинации видимости панелей

## Интеграция

- **Зависит от**:
  - `@/features/top-bar` - Верхняя панель управления
  - `@/features/browser` - Браузер медиафайлов
  - `@/features/timeline` - Таймлайн
  - `@/features/video-player` - Видеоплеер
  - `@/features/ai-chat` - AI помощник
  - `@/features/options` - Панель опций
  - `@/features/user-settings` - Пользовательские настройки
  - `@/features/modals` - Модальные окна

- **Используется в**:
  - Корневом компоненте `App` в Next.js
  - Всех фичах Timeline Studio через контекст провайдеров

## Тестирование

- **Всего тестов**: 65 тестов в 9 файлах
- **Покрытие**: Компоненты, макеты, хуки и сервисы
- **Тестовые файлы**:
  - `providers.test.tsx` (12 тестов)
  - `use-auto-load-user-data.test.ts` (8 тестов)
  - `default-layout.test.tsx`, `vertical-layout.test.tsx` и др.

```bash
# Запустить все тесты
bun test src/features/media-studio/

# Запустить конкретный тест
bun test src/features/media-studio/__tests__/services/providers.test.tsx
```

## Композиция провайдеров

Компонент `Providers` объединяет все необходимые контекст-провайдеры:
- `TauriMockProvider` - Мокирование Tauri API для тестов
- `AppStateProvider` - Глобальное состояние приложения
- `UserSettingsProvider` - Пользовательские настройки
- `ModalProvider` - Управление модальными диалогами
- `TimelineProvider` - Состояние таймлайна
- `CommandProvider` - Обработка горячих клавиш
- Другие провайдеры функций

## TODO / Roadmap

- [ ] **Пользовательские макеты** - Конфигурации макетов, определяемые пользователем
- [ ] **Персистентность макетов** - Сохранение и восстановление состояний макетов для каждого проекта
- [ ] **Анимации макетов** - Плавные переходы при переключении макетов
- [ ] **Динамическая загрузка** - Code splitting для компонентов макетов
- [ ] **Плагин-архитектура** - Система расширений для пользовательских панелей
- [ ] **E2E тесты** - Полное E2E покрытие
  - Инициализация компонента MediaStudio
  - Поток переключения макетов
  - Автозагрузка с интеграцией Tauri
  - Переключение видимости панелей
  - Валидация композиции провайдеров
