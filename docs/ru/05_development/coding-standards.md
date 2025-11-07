# Стандарты кодирования

[← Назад к руководству разработчика](README.md)

## 📋 Содержание

- [Общие принципы](#общие-принципы)
- [TypeScript/JavaScript](#typescriptjavascript)
- [React компоненты](#react-компоненты)
- [Rust код](#rust-код)
- [CSS и стили](#css-и-стили)
- [Тестирование](#тестирование)
- [Документация](#документация)
- [Git и коммиты](#git-и-коммиты)

## 🎯 Общие принципы

### Философия кода

1. **Читаемость важнее краткости** - код читают чаще, чем пишут
2. **Явность важнее неявности** - избегайте магических чисел и строк
3. **Композиция важнее наследования** - используйте композицию компонентов
4. **Простота важнее сложности** - KISS (Keep It Simple, Stupid)
5. **DRY (Don't Repeat Yourself)** - но не в ущерб читаемости

### Именование

```typescript
// ✅ Хорошо
const getUserById = (userId: string) => {}
const isVideoPlaying = true
const MAX_RETRY_COUNT = 3

// ❌ Плохо
const getUser = (id: string) => {}  // Неясно, какой ID
const playing = true  // Неясно, что играет
const MAX = 3  // Неясно максимум чего
```

## 📘 TypeScript/JavaScript

### Основные правила

1. **Логирование с TauriLogger**
   ```typescript
   import { createLogger } from '@/lib/tauri-logger'

   // ✅ Хорошо - структурированное логирование
   const logger = createLogger('VideoProcessor')

   logger.debugSync('Processing started', { videoId, settings })
   logger.infoSync('Frame processed', { frameNumber, timestamp })
   logger.warnSync('Low memory warning', { available: memoryMb })
   logger.errorSync('Processing failed', { error, videoId })

   // ❌ Плохо - никогда не используйте console в production коде
   console.log('Processing video:', videoId)
   console.error('Failed to process:', error)
   ```

2. **Используйте TypeScript strict mode**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

3. **Избегайте `any` типов**
   ```typescript
   // ❌ Плохо
   const processData = (data: any) => {}

   // ✅ Хорошо
   const processData = (data: MediaFile) => {}
   const processGenericData = <T>(data: T) => {}
   ```

4. **Порядок импортов**
   ```typescript
   // 1. Встроенные модули Node.js
   import { readFile } from 'fs/promises'

   // 2. Внешние зависимости
   import React, { useState } from 'react'
   import { motion } from 'framer-motion'

   // 3. Внутренние абсолютные импорты
   import { createLogger } from '@/lib/tauri-logger'
   import { useTimeline } from '@/features/timeline'
   import { Button } from '@/components/ui'

   // 4. Относительные импорты
   import { VideoPlayer } from './components/video-player'
   import type { MediaFile } from './types'

   // 5. CSS импорты
   import './styles.css'
   ```

5. **Именование файлов**
   - Компоненты: `kebab-case` (например, `video-player.tsx`)
   - Хуки: `use-` префикс (например, `use-timeline.ts`)
   - Утилиты: `kebab-case` (например, `media-utils.ts`)
   - Типы: `kebab-case` (например, `timeline-types.ts`)
   - Константы: `kebab-case` (например, `app-constants.ts`)

6. **Экспорты**
   ```typescript
   // ✅ Предпочитайте именованные экспорты
   export const VideoPlayer = () => {}
   export const useVideoPlayer = () => {}
   
   // ❌ Избегайте default экспортов (кроме страниц Next.js)
   export default VideoPlayer
   ```

### Функции и методы

```typescript
// ✅ Хорошо - ясные имена и типы
interface ProcessVideoOptions {
  quality: 'low' | 'medium' | 'high'
  format: 'mp4' | 'webm'
}

export const processVideo = async (
  file: File,
  options: ProcessVideoOptions
): Promise<ProcessedVideo> => {
  // Валидация входных данных
  if (!file || file.size === 0) {
    throw new Error('Invalid file provided')
  }
  
  // Основная логика
  const result = await processFile(file, options)
  
  return result
}

// ❌ Плохо - неясные типы и имена
export const process = async (f: any, opts: any) => {
  return await doStuff(f, opts)
}
```

### Async/Await и обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaLoader')

// ✅ Хорошо
export const loadMediaFile = async (path: string): Promise<MediaFile> => {
  try {
    const metadata = await getFileMetadata(path)
    const thumbnail = await generateThumbnail(path)

    return {
      path,
      metadata,
      thumbnail
    }
  } catch (error) {
    logger.errorSync('Failed to load media file', { path, error })
    throw new MediaLoadError(`Cannot load file: ${path}`, { cause: error })
  }
}

// ❌ Плохо - использует console и неправильную обработку ошибок
export const loadMedia = (path: string) => {
  return getFileMetadata(path)
    .then(metadata => generateThumbnail(path)
      .then(thumbnail => ({ path, metadata, thumbnail })))
    .catch(e => console.log(e))  // Никогда не используйте console в production
}
```

## ⚛️ React компоненты

### Структура компонента

```typescript
// ✅ Хорошо - четкая структура
import { FC, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'

import { useTimeline } from '@/features/timeline'
import { Button } from '@/components/ui'
import { formatTime } from '@/lib/utils'

import type { MediaFile } from './types'

interface VideoPlayerProps {
  file: MediaFile
  autoPlay?: boolean
  onTimeUpdate?: (time: number) => void
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  file,
  autoPlay = false,
  onTimeUpdate
}) => {
  // 1. Хуки
  const { isPlaying, currentTime } = useTimeline()
  const [volume, setVolume] = useState(1)
  
  // 2. Вычисляемые значения
  const formattedTime = useMemo(
    () => formatTime(currentTime),
    [currentTime]
  )
  
  // 3. Обработчики
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
  }, [])
  
  // 4. Эффекты
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime)
    }
  }, [currentTime, onTimeUpdate])
  
  // 5. Рендер
  return (
    <div className="video-player">
      <video
        src={file.path}
        autoPlay={autoPlay}
      />
      <div className="controls">
        <span>{formattedTime}</span>
        <Button onClick={handleVolumeChange}>
          Volume: {volume}
        </Button>
      </div>
    </div>
  )
}
```

### Хуки

```typescript
// ✅ Хорошо - четкий контракт и типы
interface UseMediaProcessorOptions {
  onProgress?: (progress: number) => void
  maxConcurrent?: number
}

interface UseMediaProcessorReturn {
  process: (files: File[]) => Promise<ProcessedFile[]>
  isProcessing: boolean
  progress: number
  error: Error | null
}

export const useMediaProcessor = (
  options: UseMediaProcessorOptions = {}
): UseMediaProcessorReturn => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  
  const process = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      // Логика обработки
      return processedFiles
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [options])
  
  return {
    process,
    isProcessing,
    progress,
    error
  }
}
```

### Мемоизация

```typescript
// ✅ Используйте мемоизацию для тяжелых вычислений
const MemoizedComponent = React.memo(ExpensiveComponent, (prevProps, nextProps) => {
  // Кастомная функция сравнения
  return prevProps.id === nextProps.id && 
         prevProps.version === nextProps.version
})

// ✅ useMemo для дорогих вычислений
const expensiveValue = useMemo(
  () => calculateExpensiveValue(data),
  [data]
)

// ✅ useCallback для стабильных ссылок
const handleClick = useCallback((id: string) => {
  dispatch({ type: 'SELECT', payload: id })
}, [dispatch])
```

## 🦀 Rust код

### Основные правила

1. **Следуйте Rust conventions**
   ```rust
   // Именование
   mod video_processor;  // snake_case для модулей
   struct MediaFile;     // PascalCase для типов
   const MAX_SIZE: u64;  // SCREAMING_SNAKE_CASE для констант
   fn process_video();   // snake_case для функций
   ```

2. **Обработка ошибок**
   ```rust
   use thiserror::Error;
   
   #[derive(Error, Debug)]
   pub enum VideoError {
       #[error("File not found: {0}")]
       FileNotFound(String),
       
       #[error("Invalid format: expected {expected}, got {actual}")]
       InvalidFormat { expected: String, actual: String },
       
       #[error("Processing failed")]
       ProcessingError(#[from] std::io::Error),
   }
   
   pub fn process_video(path: &str) -> Result<Video, VideoError> {
       let file = std::fs::read(path)
           .map_err(|_| VideoError::FileNotFound(path.to_string()))?;
       
       // Обработка...
       Ok(video)
   }
   ```

3. **Документация**
   ```rust
   /// Processes a video file with the given options.
   /// 
   /// # Arguments
   /// 
   /// * `path` - Path to the video file
   /// * `options` - Processing options
   /// 
   /// # Examples
   /// 
   /// ```
   /// let video = process_video("video.mp4", Default::default())?;
   /// ```
   /// 
   /// # Errors
   /// 
   /// Returns `VideoError` if:
   /// - File doesn't exist
   /// - Format is not supported
   /// - Processing fails
   pub fn process_video(path: &str, options: ProcessOptions) -> Result<Video, VideoError> {
       // Implementation
   }
   ```

4. **Безопасность и производительность**
   ```rust
   // ✅ Используйте заимствования вместо клонирования
   fn process_data(data: &[u8]) -> Result<(), Error> {
       // Работаем с заимствованием
   }
   
   // ✅ Избегайте unwrap() в production коде
   let value = some_option.ok_or_else(|| Error::MissingValue)?;
   
   // ✅ Используйте итераторы
   let sum: i32 = numbers
       .iter()
       .filter(|&&x| x > 0)
       .map(|&x| x * 2)
       .sum();
   ```

## 🎨 CSS и стили

### Tailwind CSS

```tsx
// ✅ Хорошо - используйте утилиту cn() для условных классов
import { cn } from '@/lib/utils'

<div className={cn(
  "flex items-center gap-2 p-4",
  "hover:bg-gray-100 dark:hover:bg-gray-800",
  "transition-colors duration-200",
  isActive && "bg-blue-100 dark:bg-blue-900",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />

// ❌ Плохо - сложная логика в className
<div className={`flex ${isActive ? 'bg-blue-100' : ''} ${isDisabled ? 'opacity-50' : ''}`} />
```

### CSS переменные

```css
/* ✅ Используйте CSS переменные для темизации */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 346.8 77.2% 49.8%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
}

/* Использование */
.button {
  background-color: hsl(var(--primary));
  border-radius: var(--radius);
}
```

### Компонентные стили

```typescript
// ✅ Используйте cva для вариантов компонентов
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}
```

## 🧪 Тестирование

### Структура тестов

```typescript
// ✅ Хорошо - описательные тесты
describe('VideoPlayer', () => {
  describe('playback controls', () => {
    it('should start playing when play button is clicked', () => {
      // Arrange
      const { getByRole } = render(<VideoPlayer file={mockFile} />)
      const playButton = getByRole('button', { name: /play/i })
      
      // Act
      fireEvent.click(playButton)
      
      // Assert
      expect(mockVideoElement.play).toHaveBeenCalled()
    })
    
    it('should pause when clicking on playing video', () => {
      // Test implementation
    })
  })
  
  describe('error handling', () => {
    it('should show error message when video fails to load', () => {
      // Test implementation
    })
  })
})
```

### Моки и тестовые данные

```typescript
// __tests__/test-utils.ts
export const createMockMediaFile = (overrides?: Partial<MediaFile>): MediaFile => ({
  id: 'test-id',
  path: '/test/video.mp4',
  name: 'test-video.mp4',
  size: 1024 * 1024 * 10, // 10MB
  duration: 60, // 1 minute
  ...overrides
})

// Использование в тестах
const mockFile = createMockMediaFile({ name: 'custom.mp4' })
```

## 📝 Документация

### JSDoc комментарии

```typescript
/**
 * Обрабатывает видеофайл с заданными параметрами
 * 
 * @param file - Видеофайл для обработки
 * @param options - Параметры обработки
 * @returns Промис с обработанным видео
 * 
 * @example
 * ```ts
 * const processed = await processVideo(file, {
 *   quality: 'high',
 *   format: 'mp4'
 * })
 * ```
 * 
 * @throws {VideoProcessingError} Если обработка не удалась
 */
export async function processVideo(
  file: File,
  options: ProcessOptions
): Promise<ProcessedVideo> {
  // Implementation
}
```

### README для модулей

```markdown
# Timeline Feature

Модуль управления таймлайном для Timeline Studio.

## Структура

- `components/` - React компоненты
- `hooks/` - Кастомные хуки
- `services/` - Бизнес-логика
- `types/` - TypeScript типы

## Использование

\```typescript
import { useTimeline } from '@/features/timeline'

const MyComponent = () => {
  const { clips, addClip } = useTimeline()
  // ...
}
\```

## API

### useTimeline()
Основной хук для работы с таймлайном...
```

## 🔄 Git и коммиты

### Формат коммитов

Следуем [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Формат
<type>(<scope>): <subject>

<body>

<footer>

# Примеры
feat(timeline): добавить поддержку множественного выбора клипов
fix(export): исправить ошибку при экспорте в 4K
docs(api): обновить документацию Timeline API
style(ui): выровнять отступы в компонентах
refactor(player): упростить логику воспроизведения
test(effects): добавить тесты для новых эффектов
chore(deps): обновить зависимости
```

### Типы коммитов

- `feat` - новая функциональность
- `fix` - исправление ошибок
- `docs` - изменения в документации
- `style` - форматирование кода
- `refactor` - рефакторинг без изменения функциональности
- `test` - добавление или изменение тестов
- `chore` - обновление зависимостей, конфигурации
- `perf` - улучшение производительности

### Правила веток

```bash
# Feature ветки
feature/add-video-effects
feature/timeline-improvements

# Bugfix ветки
fix/export-crash
fix/memory-leak

# Hotfix ветки (для production)
hotfix/critical-security-issue
```

## 🔍 Code Review чеклист

### Перед отправкой PR

- [ ] Код соответствует стандартам проекта
- [ ] Все тесты проходят (`bun run test`)
- [ ] Линтеры не показывают ошибок (`bun run lint`)
- [ ] Добавлена/обновлена документация
- [ ] Нет закомментированного кода
- [ ] Нет console.log/error/warn() в production коде - используйте TauriLogger
- [ ] Коммиты следуют conventional commits

### При ревью кода

- [ ] Логика понятна и корректна
- [ ] Нет очевидных проблем с производительностью
- [ ] Обработка ошибок адекватная
- [ ] Тесты покрывают основные сценарии
- [ ] Нет дублирования кода
- [ ] Типы TypeScript корректные

## 📚 Дополнительные ресурсы

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

[← Назад к руководству разработчика](README.md) | [Далее: Тестирование →](testing.md)