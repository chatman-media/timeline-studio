# Language Module

## Overview / Обзор

**EN:** Language management module for Timeline Studio. Provides seamless language switching between 15 supported languages with synchronization between frontend (i18next) and backend (Tauri). Supports RTL languages (Arabic, Persian) and automatic system language detection.

**RU:** Модуль управления языком для Timeline Studio. Обеспечивает плавное переключение между 15 поддерживаемыми языками с синхронизацией между фронтендом (i18next) и бэкендом (Tauri). Поддерживает RTL языки (арабский, персидский) и автоматическое определение системного языка.

## Supported Languages / Поддерживаемые языки

- **English** (en) - English
- **Russian** (ru) - Русский
- **Spanish** (es) - Español
- **French** (fr) - Français
- **German** (de) - Deutsch
- **Portuguese** (pt) - Português
- **Chinese** (zh) - 中文
- **Japanese** (ja) - 日本語
- **Korean** (ko) - 한국어
- **Turkish** (tr) - Türkçe
- **Italian** (it) - Italiano
- **Thai** (th) - ไทย
- **Hindi** (hi) - हिन्दी
- **Arabic** (ar) - العربية (RTL)
- **Persian** (fa) - فارسی (RTL)

## API (Backend Commands)

| Command | Parameters | Description |
|---------|------------|-------------|
| `get_app_language_tauri` | - | Returns current app language and system language |
| `set_app_language_tauri` | `{ lang: string }` | Sets application language and saves to Tauri Store |

### Response Format

```typescript
interface LanguageResponse {
  language: string        // Current app language
  system_language: string // Detected system language
}
```

## Structure / Структура

```
language/
├── hooks/
│   └── use-language.ts   # Main language management hook
└── index.ts              # Module exports
```

## Usage / Использование

### Basic Hook Usage

```typescript
import { useLanguage } from '@/features/language'

function LanguageSelector() {
  const {
    currentLanguage,    // Current app language
    systemLanguage,     // Detected system language
    isLoading,          // Loading state
    error,              // Error state
    changeLanguage,     // Change language function
    refreshLanguage,    // Refresh from backend
  } = useLanguage()

  const handleChange = async (lang: LanguageCode) => {
    await changeLanguage(lang)
  }

  return (
    <select value={currentLanguage} onChange={(e) => handleChange(e.target.value)}>
      <option value="en">English</option>
      <option value="ru">Русский</option>
      {/* ... other languages */}
    </select>
  )
}
```

### Automatic Language Detection

The hook automatically:
1. Fetches language from Tauri backend on mount
2. Detects system language
3. Applies saved language preference
4. Falls back to localStorage if Tauri is unavailable
5. Defaults to English if no preference found

### Language Persistence

Language is persisted in multiple layers:
- **Tauri Store** (primary) - Cross-platform persistent storage
- **localStorage** (fallback) - Browser-based storage
- **i18next** (runtime) - Active translation state

## Integration with i18n / Интеграция с i18n

This module works seamlessly with the main i18n system:
- Located in `/src/i18n/`
- Uses `react-i18next` for translations
- Supports language-specific formatting (dates, numbers)
- Automatic RTL detection for Arabic and Persian

Translation files location: `/src/i18n/locales/[lang].json`

## Dependencies / Зависимости

**Used by:**
- User Settings modal - Language selection UI
- App initialization - Automatic language detection
- All translated components - via i18next

**Depends on:**
- `@/i18n` - Translation constants and i18next configuration
- `@tauri-apps/api/core` - Backend language commands
- `react-i18next` - Translation runtime

## Features / Возможности

- ✅ 15 supported languages with native names
- ✅ RTL support for Arabic and Persian
- ✅ System language auto-detection
- ✅ Frontend-backend synchronization
- ✅ Persistent storage (Tauri Store + localStorage)
- ✅ Error handling with fallbacks
- ✅ TypeScript type safety
- ✅ Loading states
- ✅ Hot language switching without reload

## Future Improvements / Будущие улучшения

1. **Testing** - Add comprehensive unit tests for hook
2. **Language Packs** - Lazy loading of translation files
3. **Locale Formatting** - Enhanced date/time/number formatting per language
4. **Translation Coverage** - Ensure 100% translation coverage for all languages
5. **Voice Input** - Language-specific voice recognition

## E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/language/`

### Чеклист тестов

| Тест | Статус | Файл | Приоритет |
|------|--------|------|-----------|
| Команда `get_app_language_tauri` | ⏳ Planned | - | 🔴 High |
| Команда `set_app_language_tauri` | ⏳ Planned | - | 🔴 High |
| Автоопределение системного языка | ⏳ Planned | - | 🔴 High |
| Применение сохраненного языка при запуске | ⏳ Planned | - | 🔴 High |
| Переключение языка через useLanguage хук | ⏳ Planned | - | 🔴 High |
| Переключение на все 15 поддерживаемых языков | ⏳ Planned | - | 🔴 High |
| RTL переключение для арабского языка | ⏳ Planned | - | 🔴 High |
| RTL переключение для персидского языка | ⏳ Planned | - | 🔴 High |
| Синхронизация между фронтендом и бэкендом | ⏳ Planned | - | 🔴 High |
| Сохранение языка в Tauri Store | ⏳ Planned | - | 🔴 High |
| Fallback на localStorage при недоступности Tauri | ⏳ Planned | - | 🟡 Medium |
| Fallback на английский при отсутствии настроек | ⏳ Planned | - | 🟡 Medium |
| Обработка ошибок при смене языка | ⏳ Planned | - | 🔴 High |
| Загрузка состояния (isLoading) | ⏳ Planned | - | 🟡 Medium |
| refreshLanguage функция | ⏳ Planned | - | 🟡 Medium |
| Language selector UI в User Settings | ⏳ Planned | - | 🔴 High |
| Отображение нативных названий языков | ⏳ Planned | - | 🟡 Medium |
| i18next интеграция | ⏳ Planned | - | 🔴 High |

### Приоритеты
- 🔴 High - критичный функционал (команды Tauri, переключение языков, RTL)
- 🟡 Medium - важный функционал (fallback механизмы, UI состояния)
- 🟢 Low - дополнительный функционал

### Примечания
- Модуль использует две Tauri команды: `get_app_language_tauri` и `set_app_language_tauri`
- Критична проверка работы всех 15 языков, особенно RTL (Arabic, Persian)
- Должна быть проверена синхронизация между i18next, Tauri Store и localStorage
- Важно протестировать fallback chain: Tauri Store → localStorage → Default
- RTL тестирование требует проверки изменения направления текста в UI
- Интеграция с User Settings modal должна быть протестирована отдельно
