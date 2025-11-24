# Тестирование с реальными медиафайлами

## Обзор

Timeline Studio использует реальные медиафайлы для тестирования, чтобы обеспечить корректную работу с различными форматами и кодеками, которые встречаются в реальных проектах.

## Тестовые данные

Все тестовые медиафайлы находятся в папке `public/test-data/`:

### Видеофайлы

| Файл | Кодек | Разрешение | FPS | Аудио | Особенности |
|------|-------|------------|-----|-------|-------------|
| C0666.MP4 | HEVC | 4K (3840x2160) | 50 | PCM 48kHz 2ch | Высокий битрейт ~200 Mbps |
| C0783.MP4 | HEVC | 4K (3840x2160) | 50 | PCM 48kHz 2ch | Несжатое аудио |
| Kate.mp4 | H.264 | 4K (3840x2160) | 50 | AAC 44.1kHz 2ch | Стандартный кодек |
| water play3.mp4 | HEVC | 4K (3840x2160) | 50 | Нет | Только видео |
| проводка после лобби.mp4 | HEVC | 4K (3840x2160) | 50 | Нет | Кириллица в названии |

### Аудиофайлы

| Файл | Формат | Длительность | Частота | Каналы | Особенности |
|------|--------|--------------|---------|--------|-------------|
| DJI_02_20250402_104352.WAV | WAV PCM 24-bit | 31 мин | 48kHz | Моно | Длинный файл, 256 MB |

### Изображения

| Файл | Формат | Разрешение | Особенности |
|------|--------|------------|-------------|
| DSC07845.png | PNG | 4240x2832 | Высокое разрешение |

## E2E тесты (JavaScript/TypeScript)

### Структура

```
e2e/tests/
├── test-data.ts              # Ссылки на тестовые файлы
├── media-metadata.json       # Метаданные файлов
├── media-import-basic.spec.ts    # Базовые тесты
├── media-import-real-files.spec.ts # Тесты с реальными файлами
└── media-import-demo.spec.ts     # Демонстрационные тесты
```

### Использование

```typescript
import { TEST_FILES } from "./test-data"

// Получить видеофайл
const video = TEST_FILES.videos[0] // C0666.MP4

// Получить файл с кириллицей
const cyrillicFile = TEST_FILES.videos.find(v => 
  v.name.includes('проводка')
)

// Использовать в тесте
await selectFiles(page, [video.path])
```

### Запуск тестов

```bash
# Базовые тесты
bun run test:e2e:basic

# Тесты с реальными файлами
bun run test:e2e:real

# Демонстрационные тесты
bun run playwright test e2e/tests/media-import-demo.spec.ts
```

## Rust тесты

### Структура

```
src-tauri/src/media/
├── test_data.rs         # Автогенерированные данные о файлах
├── real_data_tests.rs   # Тесты с реальными файлами
└── test_plan.md         # План тестирования
```

### Использование

```rust
use crate::media::test_data::test_data::*;

#[tokio::test]
async fn test_4k_video() {
    let video = get_test_video();
    let path = video.get_path();
    
    // Тестируем извлечение метаданных
    let metadata = extract_metadata(&path).await.unwrap();
    
    // Проверяем свойства
    assert_eq!(video.width, Some(3840));
    assert_eq!(video.height, Some(2160));
}
```

### Специальные тестовые сценарии

1. **Высокий битрейт (200+ Mbps)**
   ```rust
   let high_bitrate = TEST_FILES.iter()
       .max_by_key(|f| f.bit_rate)
       .unwrap();
   ```

2. **Файлы с кириллицей**
   ```rust
   let cyrillic = get_file_with_cyrillic().unwrap();
   ```

3. **Длинные аудиофайлы (31 мин)**
   ```rust
   let long_audio = get_test_audio();
   assert!(long_audio.duration > 1800.0);
   ```

4. **Видео без аудио**
   ```rust
   let video_only = TEST_FILES.iter()
       .find(|f| f.has_video && !f.has_audio)
       .unwrap();
   ```

### Запуск Rust тестов

```bash
# Все тесты медиа модуля
cd src-tauri && cargo test media::

# Только тесты с реальными данными
cd src-tauri && cargo test real_data_tests

# С выводом для отладки
cd src-tauri && cargo test real_data_tests -- --nocapture
```

## Генерация тестовых данных

Скрипт `scripts/analyze-test-media.js` анализирует медиафайлы и генерирует:
- `src-tauri/src/media/test_data.rs` - Rust модуль с метаданными
- `e2e/tests/media-metadata.json` - JSON с метаданными для JS тестов

Запуск:
```bash
node scripts/analyze-test-media.js
```

## Лучшие практики

1. **Используйте реальные файлы** вместо моков где возможно
2. **Тестируйте edge cases**: большие файлы, высокий битрейт, необычные кодеки
3. **Проверяйте производительность**: замеряйте время обработки
4. **Тестируйте параллельную обработку** нескольких файлов
5. **Проверяйте обработку ошибок** с поврежденными файлами

## Добавление новых тестовых файлов

1. Добавьте файл в `public/test-data/`
2. Запустите `node scripts/analyze-test-media.js`
3. Обновите тесты для использования нового файла
4. Документируйте особенности файла

## CI/CD интеграция

Тестовые файлы должны быть доступны в CI окружении:
- Храните в Git LFS для больших файлов
- Или загружайте из внешнего хранилища
- Используйте кеширование для ускорения тестов