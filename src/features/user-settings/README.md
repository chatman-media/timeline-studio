# User Settings - Функциональные требования

## 📋 Статус готовности (v3 Architecture)

- ✅ **Компоненты**: Полностью реализованы (виджеты, табы, модальные окна)
- ✅ **Сервисы**: Машина состояний и провайдер готовы
- ✅ **Хуки**: useUserSettings и useApiKeys полностью протестированы
- ✅ **Тесты**: Покрытие 87%+ (126 тестов)
- ✅ **Валидация API**: Client-side + server-side валидация
- ✅ **Типизация**: Полная TypeScript типизация для всех операций
- ✅ **Основная логика**: Управление пользовательскими настройками и API ключами

## 🎯 Основные функции

### ✅ Готово

#### Управление интерфейсом
- [x] Переключение активной вкладки браузера
- [x] Изменение макета интерфейса (default, options, vertical, dual)
- [x] Переключение видимости браузера
- [x] Горячие клавиши (Cmd+B)

#### Настройки путей
- [x] Настройка пути для сохранения скриншотов
- [x] Настройка пути для скриншотов плеера
- [x] Валидация путей

#### Настройки медиа
- [x] Регулировка громкости плеера (0-100)
- [x] Сохранение настроек громкости

#### API интеграция (v3)
- [x] Настройка API ключей для множества сервисов (OpenAI, Claude, Grok, DeepSeek, Gemini)
- [x] OAuth интеграция (YouTube, Vimeo, Facebook, Instagram, TikTok, Twitter)
- [x] Telegram Bot интеграция
- [x] Client-side валидация формата ключей (regex паттерны)
- [x] Server-side валидация через реальные API запросы
- [x] Автоматическая проверка каждые 24 часа
- [x] Безопасное хранение ключей в зашифрованном виде
- [x] Маскирование ключей в UI и логах
- [x] Информация о rate limits и статусе аккаунта

#### Интерфейс настроек
- [x] UserSettingsModal - модальное окно настроек
- [x] Формы для всех настроек
- [x] Валидация ввода
- [x] Мгновенное применение изменений

## 🔧 Техническая реализация (v3)

### Архитектура
- **XState машина состояний** для управления настройками
- **React Context** для предоставления данных компонентам
- **Tauri Store** для персистентного хранения
- **Rust Backend** для безопасного управления API ключами
- **TypeScript** для строгой типизации всех операций
- **Client-side + Server-side валидация** для надежности

### Состояние
```typescript
interface UserSettingsContext {
  activeTab: BrowserTab           // Активная вкладка
  layoutMode: LayoutMode          // Макет интерфейса
  screenshotsPath: string         // Путь скриншотов
  playerScreenshotsPath: string   // Путь скриншотов плеера
  playerVolume: number            // Громкость плеера
  openAiApiKey: string           // API ключ OpenAI
  claudeApiKey: string           // API ключ Claude
  isBrowserVisible: boolean      // Видимость браузера
}
```

### События машины состояний
- `UPDATE_ACTIVE_TAB` - Смена активной вкладки
- `UPDATE_LAYOUT` - Смена макета
- `UPDATE_SCREENSHOTS_PATH` - Изменение пути скриншотов
- `UPDATE_PLAYER_SCREENSHOTS_PATH` - Изменение пути скриншотов плеера
- `UPDATE_PLAYER_VOLUME` - Изменение громкости
- `UPDATE_OPENAI_API_KEY` - Изменение API ключа OpenAI
- `UPDATE_CLAUDE_API_KEY` - Изменение API ключа Claude
- `TOGGLE_BROWSER_VISIBILITY` - Переключение видимости браузера

## 🎣 Использование

### Базовое использование
```typescript
import { useUserSettings } from '@/features/user-settings';

function MyComponent() {
  const {
    activeTab,
    layoutMode,
    playerVolume,
    handleTabChange,
    handleLayoutChange,
    handlePlayerVolumeChange
  } = useUserSettings();

  return (
    <div>
      <p>Активная вкладка: {activeTab}</p>
      <p>Макет: {layoutMode}</p>
      <p>Громкость: {playerVolume}</p>

      <button onClick={() => handleTabChange('media')}>
        Переключить на медиа
      </button>

      <button onClick={() => handleLayoutChange('vertical')}>
        Вертикальный макет
      </button>

      <input
        type="range"
        min="0"
        max="100"
        value={playerVolume}
        onChange={(e) => handlePlayerVolumeChange(Number(e.target.value))}
      />
    </div>
  );
}
```

### Провайдер
```typescript
import { UserSettingsProvider } from '@/features/user-settings';

function App() {
  return (
    <UserSettingsProvider>
      <MyComponent />
    </UserSettingsProvider>
  );
}
```

## 🔗 Интеграция с другими компонентами

### MediaStudio
- Использует `layoutMode` для выбора макета интерфейса
- Реагирует на изменения макета в реальном времени

### Browser
- Использует `activeTab` для отображения активной вкладки
- Использует `isBrowserVisible` для показа/скрытия

### VideoPlayer
- Использует `playerVolume` для установки громкости
- Использует `playerScreenshotsPath` для сохранения скриншотов

### AI Chat
- Использует `openAiApiKey` и `claudeApiKey` для API запросов
- Проверяет наличие ключей перед отправкой запросов

## 🧪 Тестирование

### Запуск тестов
```bash
bun test src/features/user-settings
```

### Покрытие
- Машина состояний: 100%
- Провайдер: 95%
- Хуки: 100%
- Компоненты: 90%

## 🔐 Валидация API ключей (v3)

### Client-side валидация
Перед отправкой на backend происходит проверка формата ключа:

```typescript
import { validateApiKeyFormat, getValidationErrorMessage } from '@/features/user-settings/constants/api-validation-patterns'

// Проверка формата ключа
const isValid = validateApiKeyFormat('openai', 'sk-...')
if (!isValid) {
  const error = getValidationErrorMessage('openai')
  console.error(error) // "OpenAI API ключ должен начинаться с 'sk-' и быть не менее 40 символов"
}
```

### Поддерживаемые форматы ключей

- **OpenAI**: `sk-[a-zA-Z0-9]{20,}` (мин. 40 символов)
- **Claude**: `sk-ant-api03-[a-zA-Z0-9_-]{95,}` (мин. 100 символов)
- **Grok**: `xai-[a-zA-Z0-9]{32,}` (мин. 35 символов)
- **DeepSeek**: `sk-[a-zA-Z0-9]{32,}` (мин. 35 символов)
- **Gemini**: `AIza[a-zA-Z0-9_-]{35,}` (мин. 39 символов)
- **Telegram**: `\d{8,10}:[a-zA-Z0-9_-]{35,}` (формат bot token)

### Server-side валидация
После успешной client-side валидации backend выполняет реальный API запрос:

```typescript
const { testApiKey, getValidationError } = useApiKeys()

// Тестирование ключа
const isValid = await testApiKey('openai')
if (!isValid) {
  const error = getValidationError('openai')
  console.error(error) // Конкретная ошибка от API (например, "Insufficient credits")
}
```

### Автоматическая проверка
Система автоматически проверяет все сохраненные ключи каждые 24 часа:
- Обновляет статус валидации (valid/invalid)
- Сохраняет информацию о rate limits
- Обновляет timestamp последней проверки
- Показывает актуальный статус в UI

### Маскирование ключей

```typescript
import { maskApiKey } from '@/features/user-settings/constants/api-validation-patterns'

const masked = maskApiKey('openai', 'sk-proj-abcdefghijklmnop1234567890')
console.log(masked) // "sk-proj•••••••••••••••••••••1234"
```

## 🚀 Будущие улучшения

### Планируемые функции
- [x] Импорт/экспорт настроек (реализовано через .env)
- [ ] Профили настроек
- [ ] Синхронизация между устройствами
- [ ] Темы интерфейса
- [ ] Расширенные горячие клавиши

### Оптимизации
- [ ] Дебаунс для частых изменений
- [ ] Кэширование настроек
- [x] Валидация API ключей (реализовано в v3)
- [ ] Автоматическое резервное копирование

**Версия:** 0.60.1
**Последнее обновление:** 1 августа 2025
**Разработано с ❤️ командой Timeline Studio**
