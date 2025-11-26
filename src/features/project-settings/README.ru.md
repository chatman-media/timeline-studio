# Project Settings - Настройки проекта

[English](./README.md) | **Русский**

## Обзор
Модуль управления конфигурацией проекта с настройками видео, соотношениями сторон, частотой кадров и выбором цветового пространства на базе XState.

## Статус
- ✅ **Компоненты**: ProjectSettingsModal полностью реализован
- ✅ **Хуки**: useProjectSettings готов
- ✅ **Сервисы**: Машина XState и провайдер завершены
- ✅ **Тесты**: 89% покрытие (89% выражений, 87% функций, 48+ тестов)

## Структура
```
project-settings/
├── components/
│   └── project-settings-modal.tsx   # Модальное окно настроек
├── hooks/
│   └── use-project-settings.ts      # Хук настроек
├── services/
│   ├── project-settings-machine.ts  # Машина XState
│   └── project-settings-provider.tsx # React Context провайдер
├── types/
│   ├── project.ts                   # TypeScript типы
│   └── timeline-studio-project.ts   # Типы проекта
├── utils/
│   ├── aspect-ratio-utils.ts        # Утилиты соотношений сторон
│   ├── localization-utils.ts        # Утилиты локализации
│   └── settings-utils.ts            # Утилиты настроек
└── __tests__/
    ├── components/                  # Тесты компонентов (48 тестов)
    ├── hooks/                       # Тесты хуков
    ├── services/                    # Тесты сервисов
    ├── utils/                       # Тесты утилит
    └── integration/                 # Интеграционные тесты
```

## Возможности
### ✅ Реализовано
- [x] Выбор соотношения сторон (16:9, 9:16, 1:1, 4:3, 21:9, custom)
- [x] Пресеты разрешений видео (HD, Full HD, 4K, custom)
- [x] Выбор частоты кадров (24, 25, 30, 50, 60, 120 fps)
- [x] Выбор цветового пространства (Rec.709, Rec.2020, DCI-P3, sRGB)
- [x] Блокировка соотношения сторон с авто-расчетом
- [x] Валидация ввода (320x240 до 7680x4320)
- [x] Поддержка локализации (15 языков)

### ❌ Не реализовано
- [ ] Шаблоны и пресеты настроек
- [ ] Импорт/экспорт настроек
- [ ] Пресеты для соцсетей (YouTube, Instagram, TikTok)
- [ ] Расширенные настройки кодирования
- [ ] Настройки HDR
- [ ] Автосохранение изменений

## Использование
```typescript
import { useProjectSettings, ProjectSettingsProvider } from '@/features/project-settings'

// В компонентах
function MyComponent() {
  const { settings, updateSettings, resetSettings } = useProjectSettings()

  return (
    <div>
      <h1>{settings.name}</h1>
      <p>Разрешение: {settings.resolution}</p>
      <p>Частота кадров: {settings.frameRate} fps</p>

      <button onClick={() => updateSettings({
        ...settings,
        name: 'Новый проект'
      })}>
        Изменить название
      </button>
    </div>
  )
}

// Обернуть приложение провайдером
<ProjectSettingsProvider>
  <MyComponent />
</ProjectSettingsProvider>
```

## Интеграция
- **Зависимости**: @/i18n (локализация)
- **Используется в**: @/features/timeline, @/features/video-player, @/features/export
- **TopBar**: Отображает название проекта, кнопка настроек
- **Timeline**: Использует разрешение для масштабирования, частоту для воспроизведения

## Тестирование
- **Всего тестов**: 48+ тестов
- **Покрытие**: 89% выражений, 87% функций

```bash
# Запустить все тесты
bun test src/features/project-settings

# Запустить конкретную группу тестов
bun test src/features/project-settings/__tests__/components
bun test src/features/project-settings/__tests__/utils
```

## TODO / Дорожная карта
- [ ] Система шаблонов настроек
- [ ] Функциональность импорта/экспорта настроек
- [ ] Пресеты для платформ социальных сетей
- [ ] Расширенная конфигурация кодирования
- [ ] HDR и продвинутые настройки цветового пространства
- [ ] Автосохранение с debouncing
- [ ] Отмена/Повтор для изменений настроек
- [ ] Улучшения валидации настроек
- [ ] Пакетные обновления настроек проекта
