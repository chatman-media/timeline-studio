# Тестирование с реальными медиафайлами

## Обзор

Тестирование Timeline Studio с реальными медиафайлами включает E2E тесты, интеграционные тесты и ручное тестирование с различными форматами видео, аудио и изображений.

## Структура тестовых медиафайлов

### Организация файлов

```
test-media/
├── video/                    # Видеофайлы
│   ├── small/               # Малые файлы (<10MB)
│   │   ├── sample-1080p.mp4     # H.264, 1920x1080, 30fps
│   │   ├── sample-720p.webm     # VP9, 1280x720, 24fps
│   │   └── sample-4k.mov        # H.265, 3840x2160, 60fps
│   ├── medium/              # Средние файлы (10-100MB)
│   │   ├── documentary.mp4      # Длинное видео (30+ мин)
│   │   └── presentation.mov     # Слайды с переходами
│   └── large/               # Большие файлы (100MB+)
│       ├── feature-film.mkv     # Полнометражный фильм
│       └── raw-footage.avi      # Несжатое видео
├── audio/                   # Аудиофайлы
│   ├── music/
│   │   ├── background.mp3       # Фоновая музыка
│   │   ├── classical.flac       # Высокое качество
│   │   └── electronic.ogg       # Электронная музыка
│   ├── voice/
│   │   ├── narration.wav        # Голосовое сопровождение
│   │   └── dialogue.aac         # Диалоги
│   └── effects/
│       ├── transition.mp3       # Звуки переходов
│       └── ambient.m4a          # Эмбиент
├── images/                  # Изображения
│   ├── photos/
│   │   ├── landscape.jpg        # Пейзажи
│   │   ├── portrait.png         # Портреты
│   │   └── macro.tiff           # Макросъемка
│   ├── graphics/
│   │   ├── logo.svg             # Векторная графика
│   │   ├── overlay.png          # Наложения с прозрачностью
│   │   └── texture.jpg          # Текстуры
│   └── sequences/
│       ├── frame001.jpg         # Последовательность кадров
│       ├── frame002.jpg
│       └── ...
└── corrupt/                 # Поврежденные файлы
    ├── broken-header.mp4        # Битый заголовок
    ├── missing-audio.avi        # Отсутствует аудиодорожка
    └── truncated.mov            # Обрезанный файл
```

### Форматы и кодеки для тестирования

#### Видео форматы
- **MP4** (H.264/AVC, H.265/HEVC)
- **AVI** (DivX, Xvid)
- **MOV** (ProRes, H.264)
- **MKV** (H.264, VP9, AV1)
- **WebM** (VP8, VP9, AV1)
- **FLV** (H.263, VP6)

#### Аудио форматы
- **MP3** (различные битрейты)
- **WAV** (PCM, различные частоты дискретизации)
- **FLAC** (lossless)
- **AAC** (LC, HE-AAC)
- **OGG Vorbis**
- **M4A** (AAC в контейнере MP4)

#### Изображения
- **JPEG** (различные уровни сжатия)
- **PNG** (с прозрачностью и без)
- **TIFF** (несжатые и сжатые)
- **BMP** (Windows Bitmap)
- **WebP** (современный формат)
- **SVG** (векторная графика)

## E2E тесты с реальными медиафайлами

### Настройка тестового окружения

```typescript
// e2e/fixtures/media-fixtures.ts
import { Page } from '@playwright/test';
import path from 'path';

export class MediaFixtures {
  constructor(private page: Page) {}

  static readonly TEST_MEDIA_PATH = path.join(__dirname, '../test-media');
  
  static readonly SAMPLE_FILES = {
    video: {
      small: 'video/small/sample-1080p.mp4',
      medium: 'video/medium/documentary.mp4',
      large: 'video/large/feature-film.mkv'
    },
    audio: {
      music: 'audio/music/background.mp3',
      voice: 'audio/voice/narration.wav'
    },
    image: {
      photo: 'images/photos/landscape.jpg',
      graphic: 'images/graphics/logo.svg'
    },
    corrupt: {
      video: 'corrupt/broken-header.mp4',
      audio: 'corrupt/missing-audio.avi'
    }
  };

  async importMediaFile(relativePath: string): Promise<void> {
    const fullPath = path.join(MediaFixtures.TEST_MEDIA_PATH, relativePath);
    
    // Используем file input для импорта
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(fullPath);
    
    // Ждем завершения импорта
    await this.page.waitForSelector('[data-testid="import-complete"]');
  }

  async importMultipleFiles(relativePaths: string[]): Promise<void> {
    const fullPaths = relativePaths.map(p => 
      path.join(MediaFixtures.TEST_MEDIA_PATH, p)
    );
    
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(fullPaths);
    
    await this.page.waitForSelector('[data-testid="import-complete"]');
  }

  async getImportedMediaCount(): Promise<number> {
    const mediaItems = this.page.locator('[data-testid="media-item"]');
    return await mediaItems.count();
  }
}
```

### Тесты импорта медиа

```typescript
// e2e/tests/media-import-real.spec.ts
import { test, expect } from '../fixtures/test-base';
import { MediaFixtures } from '../fixtures/media-fixtures';

test.describe('Real Media Import', () => {
  let mediaFixtures: MediaFixtures;

  test.beforeEach(async ({ page }) => {
    mediaFixtures = new MediaFixtures(page);
    await page.goto('/');
  });

  test('should import various video formats', async ({ page }) => {
    // MP4
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.video.small);
    await expect(page.locator('[data-testid="media-item"][data-format="mp4"]')).toBeVisible();

    // WebM
    await mediaFixtures.importMediaFile('video/small/sample-720p.webm');
    await expect(page.locator('[data-testid="media-item"][data-format="webm"]')).toBeVisible();

    // MOV
    await mediaFixtures.importMediaFile('video/small/sample-4k.mov');
    await expect(page.locator('[data-testid="media-item"][data-format="mov"]')).toBeVisible();
  });

  test('should handle large video files', async ({ page }) => {
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.video.large);
    
    // Проверяем индикатор загрузки
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    
    // Ждем завершения импорта большого файла (до 30 секунд)
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible({ timeout: 30000 });
    
    // Проверяем, что файл появился в браузере
    const mediaCount = await mediaFixtures.getImportedMediaCount();
    expect(mediaCount).toBeGreaterThan(0);
  });

  test('should import audio files with metadata', async ({ page }) => {
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.audio.music);
    
    // Проверяем отображение метаданных
    const audioItem = page.locator('[data-testid="media-item"][data-type="audio"]').first();
    await expect(audioItem.locator('[data-testid="duration"]')).toBeVisible();
    await expect(audioItem.locator('[data-testid="bitrate"]')).toBeVisible();
  });

  test('should handle corrupt files gracefully', async ({ page }) => {
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.corrupt.video);
    
    // Проверяем сообщение об ошибке
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Поврежденный файл');
  });

  test('should batch import multiple files', async ({ page }) => {
    const filesToImport = [
      MediaFixtures.SAMPLE_FILES.video.small,
      MediaFixtures.SAMPLE_FILES.audio.music,
      MediaFixtures.SAMPLE_FILES.image.photo
    ];

    await mediaFixtures.importMultipleFiles(filesToImport);
    
    const mediaCount = await mediaFixtures.getImportedMediaCount();
    expect(mediaCount).toBe(3);
  });
});
```

### Тесты воспроизведения

```typescript
// e2e/tests/video-playback-real.spec.ts
import { test, expect } from '../fixtures/test-base';
import { MediaFixtures } from '../fixtures/media-fixtures';

test.describe('Real Video Playback', () => {
  let mediaFixtures: MediaFixtures;

  test.beforeEach(async ({ page }) => {
    mediaFixtures = new MediaFixtures(page);
    await page.goto('/');
    
    // Импортируем тестовое видео
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.video.small);
  });

  test('should play video with correct dimensions', async ({ page }) => {
    // Добавляем видео на таймлайн
    await page.click('[data-testid="add-to-timeline"]');
    
    // Запускаем воспроизведение
    await page.click('[data-testid="play-button"]');
    
    // Проверяем, что видео воспроизводится
    const videoElement = page.locator('video');
    await expect(videoElement).toHaveAttribute('data-playing', 'true');
    
    // Проверяем размеры видео
    const dimensions = await videoElement.evaluate((video: HTMLVideoElement) => ({
      width: video.videoWidth,
      height: video.videoHeight
    }));
    
    expect(dimensions.width).toBe(1920);
    expect(dimensions.height).toBe(1080);
  });

  test('should seek to specific time position', async ({ page }) => {
    await page.click('[data-testid="add-to-timeline"]');
    
    // Перемещаем ползунок времени
    const seekBar = page.locator('[data-testid="seek-bar"]');
    await seekBar.click({ position: { x: 100, y: 10 } });
    
    // Проверяем текущее время
    const currentTime = await page.locator('[data-testid="current-time"]').textContent();
    expect(currentTime).not.toBe('00:00:00');
  });

  test('should handle multiple video formats in timeline', async ({ page }) => {
    // Импортируем разные форматы
    await mediaFixtures.importMediaFile('video/small/sample-720p.webm');
    await mediaFixtures.importMediaFile('video/small/sample-4k.mov');
    
    // Добавляем все на таймлайн
    const mediaItems = page.locator('[data-testid="media-item"]');
    const count = await mediaItems.count();
    
    for (let i = 0; i < count; i++) {
      await mediaItems.nth(i).locator('[data-testid="add-to-timeline"]').click();
    }
    
    // Проверяем, что все треки созданы
    const tracks = page.locator('[data-testid="timeline-track"]');
    expect(await tracks.count()).toBe(count);
  });
});
```

### Тесты производительности

```typescript
// e2e/tests/performance-real.spec.ts
import { test, expect } from '../fixtures/test-base';
import { MediaFixtures } from '../fixtures/media-fixtures';

test.describe('Performance with Real Media', () => {
  test('should handle large file import within reasonable time', async ({ page }) => {
    const mediaFixtures = new MediaFixtures(page);
    await page.goto('/');
    
    const startTime = Date.now();
    
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.video.medium);
    
    const endTime = Date.now();
    const importTime = endTime - startTime;
    
    // Импорт среднего файла не должен занимать больше 10 секунд
    expect(importTime).toBeLessThan(10000);
  });

  test('should maintain UI responsiveness during heavy operations', async ({ page }) => {
    const mediaFixtures = new MediaFixtures(page);
    await page.goto('/');
    
    // Запускаем тяжелую операцию
    await mediaFixtures.importMediaFile(MediaFixtures.SAMPLE_FILES.video.large);
    
    // Проверяем, что UI остается отзывчивым
    const button = page.locator('[data-testid="cancel-import"]');
    await expect(button).toBeEnabled();
    
    // Проверяем, что можно взаимодействовать с другими элементами
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();
  });
});
```

## Настройка тестовых данных

### Скрипт подготовки медиафайлов

```bash
#!/bin/bash
# scripts/setup-test-media.sh

# Создаем директории
mkdir -p test-media/{video/{small,medium,large},audio/{music,voice,effects},images/{photos,graphics,sequences},corrupt}

# Генерируем тестовые видео с помощью FFmpeg
ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -c:v libx264 test-media/video/small/sample-1080p.mp4
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=24 -c:v libvpx-vp9 test-media/video/small/sample-720p.webm
ffmpeg -f lavfi -i testsrc=duration=3:size=3840x2160:rate=60 -c:v libx265 test-media/video/small/sample-4k.mov

# Генерируем тестовые аудио
ffmpeg -f lavfi -i sine=frequency=440:duration=30 test-media/audio/music/background.mp3
ffmpeg -f lavfi -i sine=frequency=220:duration=15 -c:a pcm_s16le test-media/audio/voice/narration.wav

# Создаем тестовые изображения
convert -size 1920x1080 xc:blue test-media/images/photos/landscape.jpg
convert -size 800x600 xc:red test-media/images/graphics/overlay.png

# Создаем поврежденные файлы для тестирования
echo "Broken header" > test-media/corrupt/broken-header.mp4
```

### Git LFS для больших файлов

```bash
# .gitattributes
test-media/**/*.mp4 filter=lfs diff=lfs merge=lfs -text
test-media/**/*.mov filter=lfs diff=lfs merge=lfs -text
test-media/**/*.mkv filter=lfs diff=lfs merge=lfs -text
test-media/**/*.avi filter=lfs diff=lfs merge=lfs -text
test-media/**/*.wav filter=lfs diff=lfs merge=lfs -text
test-media/**/*.flac filter=lfs diff=lfs merge=lfs -text
```

## Автоматизация в CI/CD

### GitHub Actions для тестов с медиафайлами

```yaml
# .github/workflows/e2e-real-media.yml
name: E2E Tests with Real Media

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-real-media:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        lfs: true  # Загружаем файлы из Git LFS
    
    - name: Setup test media
      run: |
        chmod +x scripts/setup-test-media.sh
        ./scripts/setup-test-media.sh
    
    - name: Install dependencies
      run: bun install
    
    - name: Install Playwright
      run: bun run playwright:install
    
    - name: Run E2E tests with real media
      run: bun run test:e2e:real-media
      env:
        TEST_MEDIA_PATH: ./test-media
    
    - name: Upload test results
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: e2e-real-media-results
        path: |
          playwright-report/
          test-results/
```

## Мониторинг и метрики

### Сбор метрик производительности

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TestingRealMediaNew')

// e2e/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  startTimer(operation: string): void {
    this.metrics.set(`${operation}_start`, performance.now());
  }

  endTimer(operation: string): number {
    const startTime = this.metrics.get(`${operation}_start`);
    if (!startTime) throw new Error(`Timer for ${operation} not started`);
    
    const duration = performance.now() - startTime;
    this.metrics.set(`${operation}_duration`, duration);
    return duration;
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  logMetrics(): void {
    logger.infoSync('Performance Metrics:', this.getMetrics());
  }
}
```

## Лучшие практики

### 1. Управление размером файлов
- Используйте малые файлы для быстрых тестов
- Большие файлы только для специфических тестов производительности
- Храните файлы в Git LFS

### 2. Изоляция тестов
- Каждый тест должен работать с собственным набором файлов
- Очищайте импортированные медиа между тестами
- Используйте временные директории

### 3. Обработка ошибок
- Тестируйте поведение с поврежденными файлами
- Проверяйте graceful degradation
- Включайте тесты timeout'ов

### 4. Кроссплатформенность
- Тестируйте на разных ОС
- Учитывайте различия в кодеках
- Проверяйте пути к файлам

### 5. Мониторинг ресурсов
- Следите за потреблением памяти
- Контролируйте использование CPU
- Мониторьте дисковое пространство

## Заключение

Тестирование с реальными медиафайлами критически важно для обеспечения качества Timeline Studio. Правильно организованные E2E тесты с реальными данными помогают выявить проблемы, которые не видны в unit-тестах, и гарантируют корректную работу с различными форматами медиа.