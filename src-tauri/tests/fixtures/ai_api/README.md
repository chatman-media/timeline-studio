# AI API Mock Responses

Эта директория содержит JSON mock-файлы для тестирования интеграции с AI провайдерами.

## Структура файлов

### Claude Vision Response (`claude_vision_response.json`)
Mock ответ от Claude API для vision analysis.

**Сценарий**: Анализ профессионального интервью
- **Тип сцены**: Interview/talking head
- **Композиция**: 8/10, следует правилу третей
- **Качество**: Высокое разрешение, хорошая резкость
- **Цвета**: Тёплые тона (60%), нейтральные (30%), холодные (10%)
- **Уровень энергии**: Средний (разговорный)

### OpenAI Vision Response (`openai_vision_response.json`)
Mock ответ от OpenAI GPT-4o для vision analysis.

**Сценарий**: Динамичная экшн-сцена
- **Тип сцены**: Action/dynamic movement
- **Композиция**: 9/10, диагональные линии для создания энергии
- **Качество**: Резкий фокус на главном объекте, лёгкое размытие фона
- **Цвета**: Холодные синие тона (40%), тёплые оранжевые акценты (30%)
- **Уровень энергии**: Высокий

### DeepSeek Vision Response (`deepseek_vision_response.json`)
Mock ответ от DeepSeek Vision для vision analysis.

**Сценарий**: Пейзажная сцена на природе
- **Тип сцены**: Landscape/nature
- **Композиция**: 7/10, горизонт в нижней трети
- **Качество**: Хорошее разрешение, адекватная резкость
- **Цвета**: Естественные зелёные тона (50%), голубое небо (30%), земляные тона (20%)
- **Уровень энергии**: Низкий (спокойный, статичный)

### Ollama Vision Response (`ollama_vision_response.json`)
Mock ответ от Ollama moondream2 для vision analysis.

**Сценарий**: Офисная рабочая среда
- **Тип сцены**: Work/office environment
- **Композиция**: Субъект по центру, умеренная глубина резкости
- **Качество**: Среднее разрешение, хорошая резкость
- **Цвета**: Нейтральные тона (70%), тёплые блики (20%), холодные тени (10%)
- **Уровень энергии**: От низкого до среднего

## Использование в тестах

### Загрузка mock-данных

```rust
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn load_mock_response(filename: &str) -> Value {
  let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  path.push("tests/fixtures/ai_api");
  path.push(filename);

  let content = fs::read_to_string(&path).unwrap();
  serde_json::from_str(&content).unwrap()
}

// Пример использования
let claude_response = load_mock_response("claude_vision_response.json");
```

### Настройка mock-сервера с mockito

```rust
use mockito::{Mock, Server};

#[tokio::test]
async fn test_with_mock_response() {
  let mut server = Server::new_async().await;
  let mock_response = load_mock_response("claude_vision_response.json");

  let _mock = server
    .mock("POST", "/v1/messages")
    .with_status(200)
    .with_header("content-type", "application/json")
    .with_body(mock_response.to_string())
    .create();

  // Ваш тест здесь
}
```

## Добавление новых mock-файлов

При добавлении новых mock-файлов:

1. **Создайте реалистичный ответ**: Используйте реальную структуру ответа API
2. **Включите все необходимые поля**: model, usage, content/choices и т.д.
3. **Добавьте описательный контент**: Текст должен содержать ключевые слова для проверки в тестах
4. **Обновите этот README**: Добавьте описание сценария и ключевые характеристики

## Проверка в тестах

Рекомендуется проверять:
- ✅ Наличие текста в ответе
- ✅ Наличие ключевых слов (composition, quality, colors, scene type)
- ✅ Наличие метаданных (model, usage)
- ✅ Корректность парсинга JSON структуры

Пример:

```rust
assert!(!response.text.is_empty(), "Response should contain text");
assert!(
  response.text.contains("composition") ||
  response.text.contains("quality"),
  "Response should contain vision analysis keywords"
);
```

## Обновление mock-файлов

Если структура API провайдеров изменится:

1. Обновите соответствующий JSON файл
2. Проверьте, что тесты всё ещё проходят
3. Обновите это README при необходимости

## Связанные файлы

- **Integration tests**: `src-tauri/tests/ai_api_integration_tests.rs`
- **AIProviderManager**: `src-tauri/src/video_compiler/commands/ai_api_proxy/provider_manager.rs`
- **Types**: `src-tauri/src/video_compiler/commands/ai_api_proxy/types.rs`
