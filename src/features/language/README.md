# Language

**English** | [Русский](./README.ru.md)

## Overview

Language management module for Timeline Studio. Provides seamless language switching between 15 supported languages with synchronization between frontend (i18next) and backend (Tauri). Supports RTL languages (Arabic, Persian) and automatic system language detection.

## Status

- ✅ **Hooks**: useLanguage (automatic detection, change, persistence)
- ✅ **Integration**: i18next, Tauri Store, localStorage fallback
- ✅ **Languages**: 15 languages with native names and RTL support
- ❌ **Tests**: No unit tests yet (planned)

## Structure

```
language/
├── hooks/
│   └── use-language.ts   # Main language management hook
└── index.ts              # Module exports
```

## Supported Languages

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

## Features

### ✅ Implemented

- [x] 15 supported languages with native names
- [x] RTL support for Arabic and Persian
- [x] System language auto-detection
- [x] Frontend-backend synchronization
- [x] Persistent storage (Tauri Store + localStorage)
- [x] Error handling with fallbacks
- [x] TypeScript type safety
- [x] Loading states
- [x] Hot language switching without reload

### ❌ Not Implemented

- [ ] Unit tests for useLanguage hook
- [ ] Language packs with lazy loading
- [ ] Locale-specific date/time/number formatting
- [ ] Voice input with language-specific recognition
- [ ] Translation coverage validation (100% for all languages)

## Usage

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

## Integration

- **Depends on**:
  - `@/i18n` - Translation constants and i18next configuration
  - `@tauri-apps/api/core` - Backend language commands (`get_app_language_tauri`, `set_app_language_tauri`)
  - `react-i18next` - Translation runtime

- **Used by**:
  - User Settings modal - Language selection UI
  - App initialization - Automatic language detection
  - All translated components - via i18next

## Testing

- **Total tests**: 0 (not yet implemented)
- **Planned coverage**: Hook functionality, Tauri integration, fallback mechanisms

```bash
# Run tests (when implemented)
bun test src/features/language/
```

## Tauri Commands

The module uses two Tauri commands:

| Command | Parameters | Response | Description |
|---------|------------|----------|-------------|
| `get_app_language_tauri` | - | `{ language: string, system_language: string }` | Returns current app language and system language |
| `set_app_language_tauri` | `{ lang: string }` | `{ language: string, system_language: string }` | Sets application language and saves to Tauri Store |

## TODO / Roadmap

- [ ] **Testing** - Add comprehensive unit tests for useLanguage hook
- [ ] **Language Packs** - Lazy loading of translation files to reduce bundle size
- [ ] **Locale Formatting** - Enhanced date/time/number formatting per language
- [ ] **Translation Coverage** - Ensure 100% translation coverage for all 15 languages
- [ ] **Voice Input** - Language-specific voice recognition for accessibility
- [ ] **E2E Tests** - Complete E2E test coverage
  - All 15 language switching
  - RTL layout changes for Arabic/Persian
  - Tauri Store persistence
  - Fallback chain validation (Tauri → localStorage → default)
  - Integration with User Settings modal
