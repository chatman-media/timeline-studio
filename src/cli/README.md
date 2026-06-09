# Timeline Studio CLI

Командная строка для работы с медиафайлами и проектами Timeline Studio.

## Установка

```bash
# Запуск через ts-node
npx ts-node src/cli/index.ts --help

# Или через bun
bun run src/cli/index.ts --help
```

## Команды

### info - Информация о медиафайле

Получение метаданных видео/аудио/изображения.

```bash
# Базовое использование
npx ts-node src/cli/index.ts info video.mp4

# Вывод в JSON
npx ts-node src/cli/index.ts info video.mp4 --json

# Сохранить превью
npx ts-node src/cli/index.ts info video.mp4 --thumbnail thumb.jpg
```

**Пример вывода:**
```
📁 Информация о файле:
────────────────────────────────────────
  Путь:        /path/to/video.mp4
  Имя:         video.mp4
  Тип:         Video
  Длительность: 2:34.567
  Разрешение:  1920x1080
  Частота:     30 fps
  Кодек:       h264
  Битрейт:     8.50 Mbps
  Размер:      156.32 MB
```

### transcribe - Транскрибация

Транскрибация аудио/видео с помощью Whisper.

```bash
# Базовое использование
npx ts-node src/cli/index.ts transcribe video.mp4

# С указанием языка
npx ts-node src/cli/index.ts transcribe video.mp4 --language ru

# Выбор модели
npx ts-node src/cli/index.ts transcribe video.mp4 --model large

# Сохранить в файл
npx ts-node src/cli/index.ts transcribe video.mp4 --output transcript.txt

# Формат субтитров
npx ts-node src/cli/index.ts transcribe video.mp4 --format srt --output subtitles.srt

# Использовать OpenAI API
npx ts-node src/cli/index.ts transcribe video.mp4 --openai --api-key sk-...
```

**Опции:**
| Опция | Описание |
|-------|----------|
| `-l, --language <lang>` | Код языка (ru, en, etc.) |
| `-m, --model <model>` | Модель Whisper (tiny, base, small, medium, large) |
| `-o, --output <path>` | Сохранить результат в файл |
| `-f, --format <format>` | Формат вывода (text, json, srt, vtt) |
| `--openai` | Использовать OpenAI API |
| `--api-key <key>` | API ключ OpenAI |

### render - Рендеринг проекта

Рендеринг проекта Timeline Studio в видеофайл.

```bash
# Базовое использование
npx ts-node src/cli/index.ts render project.json output.mp4

# С настройками качества
npx ts-node src/cli/index.ts render project.json output.mp4 --quality ultra

# Указать разрешение
npx ts-node src/cli/index.ts render project.json output.mp4 --width 3840 --height 2160

# Без аудио
npx ts-node src/cli/index.ts render project.json output.mp4 --no-audio

# Подробный вывод
npx ts-node src/cli/index.ts render project.json output.mp4 --verbose
```

**Опции:**
| Опция | Описание |
|-------|----------|
| `-q, --quality <quality>` | Качество (low, medium, high, ultra) |
| `-f, --format <format>` | Формат видео (mp4, webm, mov) |
| `--width <width>` | Ширина видео |
| `--height <height>` | Высота видео |
| `--fps <fps>` | Частота кадров |
| `--no-audio` | Отключить аудио |
| `-v, --verbose` | Подробный вывод |

### bot-worker - Telegram bot-first worker

Запуск Telegram worker для bot-first workflow: обработка raw `Update`, один `getUpdates` batch или долгоживущий polling loop.
В polling-режиме ошибки обработки отдельного update возвращаются как failed-result, отправляют короткий ответ в чат при наличии chat id и не останавливают batch.

```bash
# Локальный smoke без Telegram token и без сетевых вызовов
bun run src/cli/index.ts bot-worker \
  --update-file docs/08_tasks/planned/fixtures/telegram-help-update.json \
  --pretty

# Один getUpdates batch
TIMELINE_BOT_TELEGRAM_TOKEN=123:token \
bun run src/cli/index.ts bot-worker --poll-once --pretty

# Долгоживущий polling worker с сохранением offset
TIMELINE_BOT_TELEGRAM_TOKEN=123:token \
TIMELINE_BOT_ALLOWED_CHAT_IDS=123456789,-1001234567890 \
TIMELINE_BOT_OFFSET_FILE=.tmp/timeline-bot/offset.json \
TIMELINE_BOT_DRAFT_DIR=.tmp/timeline-bot/drafts \
TIMELINE_BOT_JOB_STORE_FILE=.tmp/timeline-bot/jobs.json \
TIMELINE_BOT_RECOVER_STALE_JOBS=true \
TIMELINE_BOT_STATUS_MIN_INTERVAL=30000 \
TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA=10 \
TIMELINE_BOT_ASYNC_WORKFLOWS=true \
TIMELINE_BOT_WORKFLOW_CONCURRENCY=1 \
TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT=20 \
TIMELINE_BOT_MEDIA_DIR=.tmp/timeline-bot/media \
bun run src/cli/index.ts bot-worker --poll --rust-render
```

Для проверки Rust-backed AI review preview/publish path без запуска Telegram worker:

```bash
# Собрать headless Rust CLI, если локального timeline еще нет
cargo build --manifest-path crates/Cargo.toml -p ts-cli --bin timeline

# Локальный smoke: render через Rust, publish validate skipped без сетевого opt-in
bun run smoke:ai-review:rust

# Опционально проверить publish validate-only через provider API
AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK=1 \
AI_REVIEW_RUST_SMOKE_TELEGRAM_TOKEN=123:token \
AI_REVIEW_RUST_SMOKE_TELEGRAM_CHAT_ID=@channel \
bun run smoke:ai-review:rust
```

Для production задавайте `--allowed-chat-ids` и/или `--allowed-user-ids`, чтобы render workflows могли запускать только разрешенные Telegram chats/users.
Если задан `--draft-dir` или `TIMELINE_BOT_DRAFT_DIR`, worker включает conversation draft mode:
обычные сообщения сохраняют media и render hints, `/render` запускает merged workflow, а `/cancel` очищает draft.
В тексте сообщения можно отправлять bare URL и короткие hints, например `https://cdn.example.com/input.mov 1080p telegram`;
также поддерживаются `media=`, `url=`, `input=` и `source=`.
Для production polling включайте `--async-workflows`: worker быстро ставит render workflow в очередь и продолжает читать Telegram updates.
Когда workflow поставлен в очередь, bot-worker сразу отправляет queued acknowledgement в исходный чат; финальный progress/result продолжает идти через status updates.
Для длинных renders задавайте `--status-min-interval` и/или `--status-min-progress-delta`, чтобы не отправлять каждый progress event в Telegram.
Если задан `--workflow-queue-limit`, новые render requests сверх pending backlog получают busy response и не запускают workflow.
Если задан `--job-store-file` или `TIMELINE_BOT_JOB_STORE_FILE`, worker сохраняет историю queued/running/done/failed/rejected/cancelled jobs; команда `/status` показывает последние jobs текущего Telegram chat.
При включенном job store повторная доставка уже обработанного Telegram update возвращает existing queue id/job status и не запускает render второй раз.
Если задан `--recover-stale-jobs` или `TIMELINE_BOT_RECOVER_STALE_JOBS=true`, worker перед стартом помечает сохраненные queued/running jobs как failed, чтобы после рестарта они не висели в `/status` и были доступны для `/retry`.
Команда `/cancel <queueId>` отменяет pending queued job или running render job из текущего chat; done/failed/rejected jobs не отменяются.
Команда `/retry <queueId>` повторно запускает failed/cancelled job из сохраненного source payload/workflow.

**Опции:**
| Опция | Описание |
|-------|----------|
| `--update-file <path>` | Обработать один raw Telegram `Update` JSON |
| `--poll-once` | Получить и обработать один `getUpdates` batch |
| `--poll` | Запустить continuous polling loop |
| `--offset-file <path>` | Сохранять Telegram offset между рестартами |
| `--allowed-chat-ids <ids>` | Comma/space separated Telegram chat ids, которым разрешен bot |
| `--allowed-user-ids <ids>` | Comma/space separated Telegram user ids, которым разрешен bot |
| `--draft-dir <path>` | Сохранять bot conversation drafts между сообщениями и рестартами |
| `--job-store-file <path>` | Сохранять workflow job status/history для `/status` |
| `--recover-stale-jobs` | Помечать сохраненные queued/running jobs как failed перед стартом worker |
| `--status-min-interval <ms>` | Минимальный интервал между repeated rendering status messages |
| `--status-min-progress-delta <percent>` | Минимальный progress delta между rendering status messages |
| `--async-workflows` | Ставить render workflows в очередь во время continuous polling |
| `--workflow-concurrency <count>` | Максимум параллельных queued workflows |
| `--workflow-queue-limit <count>` | Максимум ожидающих queued workflows перед busy response |
| `--max-batches <count>` | Остановить polling после N batches |
| `--media-dir <path>` | Папка для скачанных Telegram/remote media |
| `--telegram-bot-token <token>` | Telegram Bot API token |
| `--rust-render` | Использовать Rust headless render adapter |

## Переменные окружения

```bash
# API ключ OpenAI для транскрибации
export OPENAI_API_KEY=sk-...

# Путь к FFmpeg (опционально)
export FFMPEG_PATH=/usr/local/bin/ffmpeg

# Bot worker runtime defaults
export TIMELINE_BOT_TELEGRAM_TOKEN=123:token
export TIMELINE_BOT_ALLOWED_CHAT_IDS=123456789,-1001234567890
export TIMELINE_BOT_ALLOWED_USER_IDS=111111111,222222222
export TIMELINE_BOT_OFFSET_FILE=.tmp/timeline-bot/offset.json
export TIMELINE_BOT_DRAFT_DIR=.tmp/timeline-bot/drafts
export TIMELINE_BOT_JOB_STORE_FILE=.tmp/timeline-bot/jobs.json
export TIMELINE_BOT_RECOVER_STALE_JOBS=true
export TIMELINE_BOT_STATUS_MIN_INTERVAL=30000
export TIMELINE_BOT_STATUS_MIN_PROGRESS_DELTA=10
export TIMELINE_BOT_ASYNC_WORKFLOWS=true
export TIMELINE_BOT_WORKFLOW_CONCURRENCY=1
export TIMELINE_BOT_WORKFLOW_QUEUE_LIMIT=20
export TIMELINE_BOT_MEDIA_DIR=.tmp/timeline-bot/media
export TIMELINE_BOT_DEFAULT_DESTINATION=telegram
export TIMELINE_BOT_RUST_RENDER=true

# Rust AI review smoke
export AI_REVIEW_RUST_SMOKE_TIMELINE=crates/target/debug/timeline
export AI_REVIEW_RUST_SMOKE_ALLOW_NETWORK=0
export AI_REVIEW_RUST_SMOKE_TELEGRAM_TOKEN=123:token
export AI_REVIEW_RUST_SMOKE_TELEGRAM_CHAT_ID=@channel
export AI_REVIEW_RUST_SMOKE_YOUTUBE_TOKEN=ya29...
```

`bot-worker` also accepts `TELEGRAM_BOT_TOKEN` as a generic fallback. Explicit CLI flags take priority over `TIMELINE_BOT_*` environment defaults.

## Примеры использования

### Batch обработка

```bash
# Получить информацию о всех видео в папке
for f in *.mp4; do
  npx ts-node src/cli/index.ts info "$f" --json >> metadata.json
done

# Транскрибировать все видео
for f in *.mp4; do
  npx ts-node src/cli/index.ts transcribe "$f" -l ru -o "${f%.mp4}.txt"
done
```

### Интеграция с другими инструментами

```bash
# Получить длительность видео
duration=$(npx ts-node src/cli/index.ts info video.mp4 --json | jq '.duration')

# Создать субтитры и встроить в видео
npx ts-node src/cli/index.ts transcribe video.mp4 --format srt -o subs.srt
ffmpeg -i video.mp4 -vf subtitles=subs.srt output.mp4
```

## Архитектура

```
src/cli/
├── index.ts              # Точка входа, регистрация команд
└── commands/
    ├── index.ts          # Реэкспорты
    ├── info.ts           # Команда info
    ├── transcribe.ts     # Команда transcribe
    └── render.ts         # Команда render
```

CLI использует [Node.js адаптеры](../adapters/node/README.md) для всех операций.

## Зависимости

- **commander** - парсинг командной строки
- **FFmpeg** - обработка медиа
- **Whisper** (опционально) - локальная транскрибация

## См. также

- [Node.js адаптеры](../adapters/node/README.md)
- [Core Ports](../core/ports/README.md)
