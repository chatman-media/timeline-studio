# VLM Integration - Интеграция Vision Language Models

## Обзор

Timeline Studio поддерживает анализ видео через Vision Language Models (VLM) - мультимодальные AI модели, способные анализировать изображения и генерировать текстовые описания. VLM используется для определения настроения (mood), объектов, типа сцены и других характеристик видеокадров.

## Поддерживаемые провайдеры

### 1. Ollama (Локальный, бесплатный) ⭐ Рекомендуется

**Модели:**
- `moondream2` - компактная vision модель (по умолчанию)
- `llava` - LLaVA 1.5 13B, высокое качество
- `llama3.2-vision` - Llama 3.2 Vision

**Преимущества:**
- ✅ Полностью бесплатно
- ✅ Работает локально (privacy)
- ✅ Не требует API ключ
- ✅ Быстрый отклик (зависит от железа)

**Недостатки:**
- ⚠️ Требует GPU с VRAM 8GB+ для llava
- ⚠️ Качество ниже чем у GPT-4o/Claude

**Установка:**
```bash
# Установить Ollama
brew install ollama  # macOS
# или скачать с https://ollama.com

# Запустить сервис
ollama serve

# Скачать модель (один раз)
ollama pull moondream2  # ~1.7 GB
ollama pull llava       # ~4.7 GB
ollama pull llama3.2-vision  # ~7.9 GB
```

**Конфигурация:**
```typescript
const config: VisionAnalysisConfig = {
  provider: "Ollama",
  model: "moondream2",  // или "llava", "llama3.2-vision"
  num_frames: 5,
  temperature: 0.7,
  max_tokens: 1024
}
```

### 2. DeepSeek Vision (~$0.01 за 10-мин видео) 💰 Лучший баланс

**Модели:**
- `deepseek-vl` - DeepSeek Vision Language model

**Преимущества:**
- ✅ В 8-12 раз дешевле OpenAI/Claude
- ✅ Хорошее качество анализа
- ✅ Поддержка мультимодального контента

**Недостатки:**
- ⚠️ Требует API ключ
- ⚠️ Платный (но очень дешёвый)

**Получение API ключа:**
1. Зарегистрироваться на https://platform.deepseek.com
2. Создать API ключ в разделе API Keys
3. Пополнить баланс (минимум $5)

**Конфигурация:**
```typescript
const config: VisionAnalysisConfig = {
  provider: "DeepSeek",
  model: "deepseek-vl",
  num_frames: 10,  // можно больше, т.к. дёшево
  temperature: 0.7,
  max_tokens: 1024
}

// В User Settings добавить API ключ
userSettings.deepseekApiKey = "sk-..."
```

**Стоимость:**
- Input: $0.14 / 1M tokens (~$0.0001 за кадр)
- Output: $0.28 / 1M tokens
- **Итого**: ~$0.01 за 10-минутное видео (10 кадров)

### 3. OpenAI GPT-4o (~$0.08 за 10-мин видео)

**Модели:**
- `gpt-4o` - Лучшее качество vision анализа
- `gpt-4-turbo` - Старая версия (не рекомендуется)

**Преимущества:**
- ✅ Высочайшее качество
- ✅ Детальные описания
- ✅ Стабильный API

**Недостатки:**
- ⚠️ Дороже чем DeepSeek (в 8x)
- ⚠️ Требует API ключ

**Конфигурация:**
```typescript
const config: VisionAnalysisConfig = {
  provider: "OpenAI",
  model: "gpt-4o",
  num_frames: 5,
  temperature: 0.7,
  max_tokens: 1024
}
```

**Стоимость:**
- Input: $2.50 / 1M tokens (~$0.015 за кадр)
- Output: $10.00 / 1M tokens
- **Итого**: ~$0.08 за 10-минутное видео (5 кадров)

### 4. Claude 4.5 Sonnet (~$0.12 за 10-мин видео) 👑 Премиум

**Модели:**
- `claude-3-5-sonnet-20241022` - Новейшая версия
- `claude-3-opus-20240229` - Максимальное качество

**Преимущества:**
- ✅ Лучшее понимание контекста
- ✅ Продвинутый reasoning
- ✅ Высокое качество описаний

**Недостатки:**
- ⚠️ Самый дорогой провайдер
- ⚠️ Требует API ключ

**Конфигурация:**
```typescript
const config: VisionAnalysisConfig = {
  provider: "Claude",
  model: "claude-3-5-sonnet-20241022",
  num_frames: 5,
  temperature: 0.7,
  max_tokens: 1024
}
```

**Стоимость:**
- Input: $3.00 / 1M tokens (~$0.02 за кадр)
- Output: $15.00 / 1M tokens
- **Итого**: ~$0.12 за 10-минутное видео (5 кадров)

## Таблица совместимости

| Провайдер | Модель | Vision Support | Function Calling | Streaming | Стоимость |
|-----------|--------|----------------|------------------|-----------|-----------|
| **Ollama** | moondream2 | ✅ | ❌ | ✅ | $0 |
| **Ollama** | llava | ✅ | ❌ | ✅ | $0 |
| **Ollama** | llama3.2-vision | ✅ | ❌ | ✅ | $0 |
| **DeepSeek** | deepseek-vl | ✅ | ✅ | ✅ | ~$0.01/видео |
| **OpenAI** | gpt-4o | ✅ | ✅ | ✅ | ~$0.08/видео |
| **OpenAI** | gpt-4-turbo | ✅ | ✅ | ✅ | ~$0.10/видео |
| **Claude** | claude-4.5-sonnet | ✅ | ✅ | ✅ | ~$0.12/видео |
| **Claude** | claude-3-opus | ✅ | ✅ | ✅ | ~$0.15/видео |

## Архитектура VLM Pipeline

```
┌───────────────────────────────────────────────────────────┐
│ 1. Video Input                                             │
│    video.mp4 (любая длина, любой формат)                  │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 2. Frame Extraction (FFmpeg)                              │
│                                                            │
│   for i in 1..num_frames:                                 │
│     timestamp = (i * duration) / (num_frames + 1)        │
│     ffmpeg -ss {timestamp} -i video.mp4 \                │
│            -vframes 1 frame_{i}.jpg                       │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 3. Image Encoding (Base64)                                │
│                                                            │
│   frame_bytes = read_file("frame_1.jpg")                 │
│   base64_data = BASE64.encode(frame_bytes)               │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 4. VLM Analysis Request                                   │
│                                                            │
│   POST https://api.{provider}.com/v1/...                 │
│   {                                                        │
│     "model": "gpt-4o",                                    │
│     "messages": [{                                         │
│       "role": "user",                                      │
│       "content": [                                         │
│         { "type": "text",                                  │
│           "text": "Describe this frame..." },            │
│         { "type": "image_url",                            │
│           "image_url": {                                   │
│             "url": "data:image/jpeg;base64,..."          │
│           }}                                               │
│       ]                                                    │
│     }]                                                     │
│   }                                                        │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 5. VLM Response (JSON)                                    │
│                                                            │
│   {                                                        │
│     "description": "A person sitting at desk...",         │
│     "objects": ["person", "desk", "laptop"],             │
│     "scene_type": "indoor",                               │
│     "mood": "focused"                                     │
│   }                                                        │
└───────────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────┐
│ 6. Aggregation & Summary                                  │
│                                                            │
│   - Объединить анализ всех кадров                        │
│   - Определить общее настроение видео                     │
│   - Извлечь темы (объекты встречающиеся >30%)           │
│   - Сгенерировать overall summary                         │
└───────────────────────────────────────────────────────────┘
```

## Примеры кода

### Rust (Backend)

```rust
use crate::analysis::services::vision_analyzer::{
    VisionAnalyzer, VisionAnalysisConfig
};
use crate::video_compiler::commands::ai_api_proxy::types::AIProvider;

// Создать анализатор
let config = VisionAnalysisConfig {
    provider: AIProvider::Ollama,
    model: "moondream2".to_string(),
    num_frames: 5,
    temperature: 0.7,
    max_tokens: 1024,
};

let analyzer = VisionAnalyzer::new(config);

// Проанализировать видео
let result = analyzer
    .analyze_video("path/to/video.mp4", "dummy-api-key")
    .await?;

// Использовать результаты
for frame in result.frames {
    println!("Frame at {}s: {}",
        frame.timestamp,
        frame.description
    );
    println!("  Objects: {:?}", frame.detected_objects);
    println!("  Mood: {:?}", frame.mood);
}

println!("Overall summary: {}", result.overall_summary);
println!("Themes: {:?}", result.themes);
```

### TypeScript (Frontend)

```typescript
import { useAIDirector } from '@/features/ai-director/hooks/use-ai-director'

function VideoAnalysisComponent() {
  const { analyzeComprehensive, state } = useAIDirector()

  const handleAnalyze = async () => {
    const config: AIDirectorConfig = {
      // VLM Configuration
      enable_vision_language_model: true,
      vlm_provider: 'Ollama',
      vlm_model: 'moondream2',
      vlm_num_frames: 5,
      vlm_temperature: 0.7,
      vlm_max_tokens: 1024,

      // Other settings
      performance_mode: 'Balanced',
      enable_emotion_analysis: true,
    }

    await analyzeComprehensive('video.mp4', config)
  }

  return (
    <div>
      <button onClick={handleAnalyze}>
        Analyze Video
      </button>

      {state.currentResult?.vision_analysis && (
        <div>
          <h3>Vision Analysis</h3>
          <p>{state.currentResult.vision_analysis.overall_summary}</p>

          <h4>Detected Themes:</h4>
          <ul>
            {state.currentResult.vision_analysis.themes.map(theme => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

## Настройка API ключей

### В UI приложения

1. Открыть **Settings** → **User Settings**
2. Перейти в раздел **API Keys**
3. Ввести API ключ для нужного провайдера:
   - **OpenAI**: `sk-proj-...` или `sk-...`
   - **Claude**: `sk-ant-api03-...`
   - **DeepSeek**: `sk-...`
   - **Ollama**: не требуется

### Через файл конфигурации

API ключи хранятся в `~/.timeline-studio/user-settings.json`:

```json
{
  "openAiApiKey": "sk-proj-...",
  "claudeApiKey": "sk-ant-api03-...",
  "deepseekApiKey": "sk-..."
}
```

## Troubleshooting

### Ошибка: "Ollama not running"

**Проблема**: Ollama сервис не запущен

**Решение**:
```bash
# Проверить статус
curl http://localhost:11434

# Запустить Ollama
ollama serve

# Или добавить в автозагрузку (macOS)
brew services start ollama
```

### Ошибка: "Model not found"

**Проблема**: Модель не скачана

**Решение**:
```bash
# Скачать модель
ollama pull moondream2
ollama pull llava

# Проверить список моделей
ollama list
```

### Ошибка: "Invalid API key"

**Проблема**: Неверный формат API ключа или ключ не активен

**Решение**:
1. Проверить формат ключа:
   - OpenAI: начинается с `sk-proj-` или `sk-`
   - Claude: начинается с `sk-ant-api03-`
   - DeepSeek: начинается с `sk-`
2. Проверить баланс на платформе провайдера
3. Создать новый API ключ

### Ошибка: "Rate limit exceeded"

**Проблема**: Превышен лимит запросов

**Решение**:
1. Подождать 1 минуту
2. Уменьшить `num_frames` в конфигурации
3. Использовать другой провайдер (Ollama не имеет лимитов)

### Низкое качество анализа

**Проблема**: VLM дает неточные описания

**Решение**:
1. Увеличить `num_frames` (больше кадров = лучше понимание)
2. Использовать более продвинутую модель:
   - Ollama: `moondream2` → `llava`
   - OpenAI: `gpt-4-turbo` → `gpt-4o`
3. Настроить `temperature` (0.3-0.5 для более точных результатов)

### Медленная обработка

**Проблема**: Анализ занимает слишком много времени

**Решение**:
1. Уменьшить `num_frames` (5 → 3)
2. Использовать более быструю модель:
   - Ollama: `llava` → `moondream2`
   - Claude: `opus` → `sonnet`
3. Для Ollama: убедиться что используется GPU
   ```bash
   # Проверить использование GPU
   nvidia-smi  # или watch nvidia-smi
   ```

## Лучшие практики

### Выбор количества кадров

- **Короткие видео (<1 мин)**: 3-5 кадров
- **Средние видео (1-10 мин)**: 5-10 кадров
- **Длинные видео (>10 мин)**: 10-15 кадров

### Оптимизация стоимости

1. **Для разработки**: используйте Ollama (бесплатно)
2. **Для production**: используйте DeepSeek (дёшево, качественно)
3. **Для критичных задач**: используйте GPT-4o или Claude

### Управление API ключами

1. **НЕ хардкодить** API ключи в коде
2. **Хранить** в user-settings (зашифровано)
3. **Ротировать** ключи каждые 90 дней
4. **Мониторить** расходы через dashboard провайдера

## Дополнительные ресурсы

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Claude Vision API](https://docs.anthropic.com/claude/docs/vision)
- [DeepSeek API](https://platform.deepseek.com/docs)
