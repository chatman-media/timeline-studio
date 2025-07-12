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

Модуль security имеет комплексное покрытие тестами с организованной структурой:

### 📁 Структура тестов

```
src/security/tests/
├── mod.rs                          # Модульная структура тестов
├── additional_commands_test.rs     # Тесты дополнительных команд
├── api_validator_service_test.rs   # Тесты сервиса валидации
├── commands_test.rs                # Тесты основных команд
├── commands_additional_test.rs     # Дополнительные тесты команд
├── registry_test.rs                # Тесты регистрации команд
└── secure_storage_test.rs          # Тесты безопасного хранения
```

### ✅ Покрытие тестами

**36 тестов покрывают все основные компоненты:**

#### 🔑 API Key Management (commands_test.rs)
- Сериализация/десериализация структур данных
- Валидация параметров API ключей
- Обработка OAuth credentials
- Информация о пользователях и токенах

#### 🛡️ Secure Storage (secure_storage_test.rs)
- Типы API ключей и их преобразования
- OAuth credentials с expiry dates
- Сериализация данных ключей
- Создание и управление ключами шифрования

#### ⚙️ Command Registry (registry_test.rs)
- Регистрация команд безопасности
- Реализация CommandRegistry trait

#### 🔧 Additional Commands (additional_commands_test.rs)
- Структуры результатов SecureStorage
- Encryption key operations
- Security check parameters
- Storage information

#### 🌐 OAuth & API Validation (api_validator_service_test.rs)
- Создание сервиса валидации
- Проверка доступности API
- Validation results и rate limits
- Service lifecycle management

#### 📡 Command Functions (commands_additional_test.rs)
- OAuth URL generation
- Callback URL parsing
- Parameter structures creation
- Error handling scenarios

### 🚀 Запуск тестов

```bash
# Все тесты security модуля
cargo test --lib security::tests

# Конкретный набор тестов
cargo test --lib security::tests::secure_storage_test
cargo test --lib security::tests::commands_test

# С подробным выводом
cargo test --lib security::tests -- --nocapture

# Только быстрые тесты (без внешних API)
cargo test --lib security::tests --no-fail-fast
```

### 📊 Метрики покрытия

- **Всего тестов:** 36 ✅
- **Время выполнения:** ~5 секунд
- **Покрытие модулей:** 100% основных компонентов
- **Статус:** Все тесты проходят успешно

### 🧪 Типы тестов

1. **Unit тесты** - изолированное тестирование функций
2. **Serialization тесты** - проверка JSON сериализации
3. **Structure тесты** - создание и валидация структур
4. **Error handling тесты** - обработка ошибочных сценариев
5. **Integration тесты** - взаимодействие компонентов

### 🔍 Mock Strategy

Тесты используют моки для внешних зависимостей:
- **API calls** - мокирование HTTP запросов
- **Storage operations** - тестовые хранилища
- **OAuth flows** - симуляция авторизации
- **Encryption** - тестовые ключи шифрования

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