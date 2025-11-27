# User Settings

[English](./README.md) | **Русский**

## Обзор
Модуль управления пользовательскими настройками с конфигурацией интерфейса, путей медиа, API ключей и OAuth интеграций с комплексной валидацией и шифрованием.

## Статус: 100% Готов
- ✅ **Компоненты**: Полностью реализованы (виджеты, табы, модальные окна)
- ✅ **Сервисы**: Orchestrator и провайдер готовы
- ✅ **Хуки**: useUserSettings и useApiKeys полностью протестированы
- ✅ **Тесты**: Покрытие 87%+ (126 тестов)

## Структура
```
user-settings/
├── components/
│   ├── user-settings-modal.tsx
│   └── api-keys-form.tsx
├── hooks/
│   ├── use-user-settings.ts
│   └── use-api-keys.ts
├── services/
│   ├── user-settings-orchestrator.ts
│   └── user-settings-provider.tsx
├── constants/
│   └── api-validation-patterns.ts
└── types/
    └── settings.ts
```

## Функции
### ✅ Реализовано (Основной функционал)
- [x] Переключение вкладок браузера и режимов макета (default, options, vertical, dual)
- [x] Настройка путей скриншотов с валидацией
- [x] Управление громкостью плеера (0-100)
- [x] Управление API ключами (OpenAI, Claude, Grok, DeepSeek, Gemini)
- [x] OAuth интеграция (YouTube, Vimeo, Facebook, Instagram, TikTok, Twitter)
- [x] Интеграция Telegram Bot
- [x] Client-side валидация формата (regex паттерны)
- [x] Server-side валидация через реальные API запросы
- [x] Автоматическая проверка каждые 24 часа
- [x] Безопасное зашифрованное хранение ключей
- [x] Маскирование ключей в UI и логах
- [x] Информация о rate limits и статусе аккаунта
- [x] Импорт/экспорт через .env формат

### Будущие улучшения
Опциональные улучшения для будущих релизов:
- [ ] Профили настроек (переключение между наборами конфигураций)
- [ ] Синхронизация между устройствами (облачная)
- [ ] Кастомизация темы UI
- [ ] Расширенная настройка горячих клавиш
- [ ] Дебаунс изменений настроек
- [ ] Автоматический бэкап в облако

## Использование
```typescript
import { useUserSettings, useApiKeys } from '@/features/user-settings'

function MyComponent() {
  const {
    activeTab,
    layoutMode,
    playerVolume,
    handleTabChange,
    handleLayoutChange,
    handlePlayerVolumeChange
  } = useUserSettings()

  const { saveSimpleApiKey, testApiKey } = useApiKeys()

  return (
    <div>
      <p>Активная вкладка: {activeTab}</p>
      <p>Макет: {layoutMode}</p>
      <p>Громкость: {playerVolume}</p>
    </div>
  )
}
```

## Интеграция
- **Зависит от**: @/lib/tauri-utils, React Context
- **Используется в**: @/features/media-studio, @/features/browser, @/features/video-player, @/features/ai-chat

## Тестирование
- **Всего тестов**: 126 тестов
- **Покрытие**: 87%+ (Orchestrator: 100%, Provider: 95%, Hooks: 100%, Components: 90%)

```bash
bun test src/features/user-settings
```
