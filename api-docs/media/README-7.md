# Security Module

Модуль безопасности Timeline Studio обеспечивает защиту пользовательских данных и управление API ключами.

## Структура модуля

### Основные компоненты

- **`api_validator.rs`** - Валидация API ключей различных сервисов
- **`api_validator_service.rs`** - Сервис валидации с поддержкой DI контейнера
- **`oauth_handler.rs`** - Обработка OAuth авторизации
- **`secure_storage.rs`** - Безопасное хранение ключей и токенов

### Вспомогательные модули

- **`commands.rs`** - Tauri команды для работы с безопасностью
- **`additional_commands.rs`** - Дополнительные команды безопасности
- **`env_importer.rs`** - Импорт переменных окружения
- **`registry.rs`** - Регистрация команд безопасности
- **`mod.rs`** - Модульная структура

## Основные возможности

### 🔑 Валидация API ключей

Поддерживаемые сервисы:
- OpenAI (GPT API)
- Claude (Anthropic)
- DeepSeek
- YouTube (OAuth)
- TikTok (OAuth)
- Vimeo (OAuth)
- Telegram Bot API
- Codecov
- Tauri Analytics

### 🔐 OAuth авторизация

- Поддержка OAuth 2.0 flow
- Безопасное хранение токенов
- Автоматическое обновление токенов
- Проверка срока действия

### 🛡️ Безопасное хранение

- Шифрование чувствительных данных
- Защищенное хранилище ключей
- Безопасное удаление данных

## Использование

### Валидация API ключа

```rust
use crate::security::api_validator::ApiValidator;
use crate::security::ApiKeyType;

let validator = ApiValidator::new();
let result = validator.validate_api_key(ApiKeyType::OpenAI, "sk-...").await?;

if result.is_valid {
    println!("API ключ валидный");
} else {
    println!("Ошибка: {:?}", result.error_message);
}
```

### OAuth авторизация

```rust
use crate::security::oauth_handler::OAuthHandler;

let oauth = OAuthHandler::new();
let auth_url = oauth.create_authorization_url("youtube").await?;
// Пользователь переходит по auth_url и получает код
let token = oauth.exchange_code_for_token("youtube", "auth_code").await?;
```

### Безопасное хранение

```rust
use crate::security::secure_storage::SecureStorage;

let storage = SecureStorage::new().await?;
storage.store_api_key("openai", "sk-...", None).await?;
let key = storage.get_api_key("openai").await?;
```

## Архитектура

```
Security Module
├── API Validation        # Проверка валидности ключей
├── OAuth Management      # OAuth 2.0 авторизация
├── Secure Storage        # Защищенное хранение
├── Service Integration   # Интеграция с DI контейнером
└── Tauri Commands        # Команды для фронтенда
```

## Безопасность

### Принципы защиты:
- 🔐 Все ключи шифруются перед сохранением
- 🗂️ Токены хранятся в защищенном хранилище ОС
- 🔄 Автоматическая ротация токенов
- 🚫 Отсутствие логирования чувствительных данных
- ⏰ Контроль времени жизни токенов

### Стандарты соответствия:
- OWASP рекомендации по хранению ключей
- OAuth 2.0 / OpenID Connect стандарты
- Шифрование AES-256
- Безопасное удаление из памяти

## Тестирование

Каждый модуль содержит встроенные тесты:
- Unit тесты для каждого компонента
- Integration тесты для OAuth flow
- Security тесты для проверки шифрования
- Mock тесты для внешних API

Запуск тестов:
```bash
cargo test --package timeline-studio --lib security
```

## Конфигурация

### Переменные окружения:
- `OPENAI_API_KEY` - OpenAI API ключ
- `CLAUDE_API_KEY` - Claude API ключ
- `OAUTH_CLIENT_ID` - OAuth клиент ID
- `OAUTH_CLIENT_SECRET` - OAuth клиент secret

### Настройки безопасности:
```toml
[security]
key_rotation_days = 30
token_refresh_hours = 1
storage_encryption = "AES256"
```

## См. также

- [Main README](../../../README.md) - Общая документация проекта
- [Video Compiler](../video_compiler/README.md) - Модуль компиляции видео
- [Core](../core/README.md) - Основные компоненты