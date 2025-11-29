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

## Переменные окружения

```bash
# API ключ OpenAI для транскрибации
export OPENAI_API_KEY=sk-...

# Путь к FFmpeg (опционально)
export FFMPEG_PATH=/usr/local/bin/ffmpeg
```

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
