# AI Director 2.0 - Концепция

## Обзор

AI Director 2.0 - это переработанная система интеллектуального монтажа, которая позволяет пользователю через общение с AI получить готовый смонтированный ролик из исходного материала.

## Ключевые возможности

### 1. Детальный прогресс анализа
- Визуализация процесса анализа в реальном времени
- Прогресс по каждому файлу отдельно
- Статусы для каждого этапа анализа
- Live-обновления по каждому анализатору

### 2. Гибкий выбор анализаторов
Вместо preset-режимов (fast/balanced/quality), пользователь сам выбирает нужные движки через чекбоксы:

**Категории анализаторов:**

#### Видео анализ
- [ ] **Scene Detection** - Определение сцен и переходов
- [ ] **Object Detection** - Распознавание объектов (YOLO)
- [ ] **Face Detection** - Детекция лиц
- [ ] **Motion Analysis** - Анализ движения
- [ ] **Composition Analysis** - Оценка композиции кадра

#### Аудио анализ
- [ ] **Audio Quality** - Оценка качества звука
- [ ] **Speech Recognition** - Распознавание речи (Whisper)
- [ ] **Music Detection** - Детекция музыки
- [ ] **Sound Events** - Определение звуковых событий
- [ ] **Silence Detection** - Детекция тишины

#### Контент анализ
- [ ] **Mood Analysis** - Определение настроения
- [ ] **Content Classification** - Классификация контента
- [ ] **Quality Assessment** - Общая оценка качества
- [ ] **Moment Detection** - Поиск ключевых моментов
- [ ] **Vision Language Model** - Описание контента (LLaVA/GPT-4V)

### 3. Интегрированный AI Чат

**Цель:** Получить готовый смонтированный ролик через диалог с AI

**Возможности чата:**
- Запросы на создание монтажа ("сделай динамичный ролик на 2 минуты")
- Уточнение параметров ("добавь музыку в фоне")
- Редактирование результата ("убери скучные моменты")
- Предложения AI по улучшению
- История диалога с контекстом

**Примеры диалогов:**

```
User: Проанализируй эти видео и создай динамичный ролик на 2 минуты
AI: Анализирую 5 видео файлов. Использую Scene Detection, Moment Detection и Audio Analysis...
[Прогресс анализа...]
AI: Анализ завершен! Нашел 45 сцен, 23 ключевых момента. Создаю динамичный монтаж...
AI: Готово! Создал 2-минутный ролик из 12 лучших моментов. Хотите добавить переходы?

User: Да, добавь плавные переходы и фоновую музыку
AI: Добавляю Cross Dissolve переходы и подбираю музыку в стиле upbeat...
AI: Готово! Хотите предпросмотр?
```

### 4. Визуализация процесса

**Панель файлов** (левая часть)
```
┌─ Анализируемые файлы ─────────────┐
│ ✓ video1.mp4    [████████] 100%   │
│   ├─ Scenes     [████████] 100%   │
│   ├─ Audio      [████████] 100%   │
│   └─ VLM        [████████] 100%   │
│                                    │
│ ⟳ video2.mp4    [████░░░░]  60%   │
│   ├─ Scenes     [████████] 100%   │
│   ├─ Audio      [███░░░░░]  40%   │
│   └─ VLM        [░░░░░░░░]   0%   │
│                                    │
│ ○ video3.mp4    [░░░░░░░░]   0%   │
│   └─ Pending...                   │
└────────────────────────────────────┘
```

**Детализированный прогресс:**
- Иконка статуса (✓ done, ⟳ processing, ○ pending, ✗ error)
- Прогресс-бар для файла
- Подробности по каждому анализатору
- Время обработки
- Найденные данные (кол-во сцен, моментов и т.д.)

## Архитектура компонентов

### Структура нового AI Director Modal

```
┌──────────────────────────────────────────────────────────────┐
│                     AI Director 2.0                          │
├─────────────────┬────────────────────────┬───────────────────┤
│ Выбор файлов    │   Прогресс анализа     │   AI Чат          │
│ (25% ширины)    │   (50% ширины)         │   (25% ширины)    │
├─────────────────┼────────────────────────┼───────────────────┤
│ □ video1.mp4    │ ┌─ video1.mp4─────┐   │ 💬 User:          │
│ ☑ video2.mp4    │ │ ✓ Scenes   100%  │   │ "Сделай ролик"   │
│ □ video3.mp4    │ │ ✓ Audio    100%  │   │                   │
│                 │ │ ⟳ VLM       60%  │   │ 🤖 AI:            │
│ [Выбрать все]   │ └──────────────────┘   │ "Анализирую..."   │
│                 │                        │                   │
│ ─ Анализаторы ─ │ ┌─ video2.mp4─────┐   │ [Ввести запрос]   │
│                 │ │ ○ Pending...     │   │                   │
│ Video:          │ └──────────────────┘   │ Быстрые команды:  │
│ ☑ Scenes        │                        │ • Создать монтаж  │
│ ☑ Objects       │ Общий прогресс:        │ • Найти моменты   │
│ □ Faces         │ [████░░░░] 65%         │ • Добавить музыку │
│ □ Motion        │                        │                   │
│                 │ Обработано: 2/3 files  │                   │
│ Audio:          │ Время: 45s / ~70s      │                   │
│ ☑ Quality       │                        │                   │
│ ☑ Speech        │ [Отменить анализ]      │                   │
│ □ Music         │                        │                   │
│                 │                        │                   │
│ Content:        │                        │                   │
│ ☑ Mood          │                        │                   │
│ ☑ Moments       │                        │                   │
│ ☑ VLM (LLaVA)   │                        │                   │
│                 │                        │                   │
│ [Начать анализ] │                        │                   │
└─────────────────┴────────────────────────┴───────────────────┘
│              После анализа - Результаты                      │
├──────────────────────────────────────────────────────────────┤
│ AI: Создал монтаж из 12 сцен, длительность 2:15             │
│ [▶ Предпросмотр] [📥 Добавить на Timeline] [✏ Редактировать] │
│                                                              │
│ ┌─ Timeline Preview ────────────────────────────────────────┐│
│ │ [Clip 1][Transition][Clip 2][Transition]...[Clip 12]     ││
│ │ 0:00              0:30             1:00            2:15   ││
│ └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

## Технические детали

### 1. Типы данных

```typescript
// Статус файла в анализе
interface FileAnalysisStatus {
  fileId: string
  filePath: string
  status: 'pending' | 'analyzing' | 'completed' | 'error'
  progress: number // 0-100
  analyzers: AnalyzerProgress[]
  startTime?: string
  endTime?: string
  error?: string
}

// Прогресс отдельного анализатора
interface AnalyzerProgress {
  type: AnalyzerType
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details?: string
  result?: any
}

type AnalyzerType =
  | 'scene_detection'
  | 'object_detection'
  | 'face_detection'
  | 'motion_analysis'
  | 'composition_analysis'
  | 'audio_quality'
  | 'speech_recognition'
  | 'music_detection'
  | 'sound_events'
  | 'silence_detection'
  | 'mood_analysis'
  | 'content_classification'
  | 'quality_assessment'
  | 'moment_detection'
  | 'vlm_analysis'

// Конфигурация анализа
interface AnalysisConfig {
  enabledAnalyzers: Set<AnalyzerType>
  // Параметры для каждого анализатора
  analyzerSettings?: Record<AnalyzerType, any>
}

// AI Chat сообщение
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: {
    type: 'analysis_result' | 'montage_preview' | 'timeline'
    data: any
  }[]
}

// Результат монтажа
interface MontageResult {
  id: string
  clips: MontageClip[]
  totalDuration: number
  transitions: Transition[]
  audioTracks: AudioTrack[]
  metadata: {
    createdBy: 'ai'
    prompt: string
    analyzedFiles: string[]
  }
}

interface MontageClip {
  sourceFile: string
  startTime: number
  endTime: number
  duration: number
  reason: string // Почему этот момент выбран
  importance: number
}
```

### 2. События и обновления

**Real-time обновления через Tauri события:**

```rust
// Backend события
pub enum AnalysisEvent {
    // Глобальные события
    AnalysisStarted { total_files: usize },
    AnalysisCompleted { results: Vec<FileResult> },

    // События по файлам
    FileStarted { file_id: String, file_path: String },
    FileProgress { file_id: String, progress: f32 },
    FileCompleted { file_id: String, result: FileResult },
    FileError { file_id: String, error: String },

    // События по анализаторам
    AnalyzerStarted { file_id: String, analyzer: AnalyzerType },
    AnalyzerProgress { file_id: String, analyzer: AnalyzerType, progress: f32, details: Option<String> },
    AnalyzerCompleted { file_id: String, analyzer: AnalyzerType, result: AnalyzerResult },
    AnalyzerError { file_id: String, analyzer: AnalyzerType, error: String },
}
```

**Frontend подписка:**

```typescript
// В компоненте подписываемся на события
useEffect(() => {
  const unlisten = listen<AnalysisEvent>('ai-director-analysis', (event) => {
    const { type, data } = event.payload

    switch (type) {
      case 'FileProgress':
        updateFileProgress(data.file_id, data.progress)
        break
      case 'AnalyzerProgress':
        updateAnalyzerProgress(data.file_id, data.analyzer, data.progress, data.details)
        break
      // ... другие события
    }
  })

  return () => unlisten()
}, [])
```

### 3. AI Chat интеграция

**Workflow:**

1. **Пользователь вводит запрос** → "Создай динамичный ролик на 2 минуты"

2. **AI парсит запрос:**
   - Длительность: 2 минуты
   - Стиль: динамичный
   - Действие: создать монтаж

3. **AI использует результаты анализа:**
   - Моменты с высокой важностью
   - Сцены с хорошей композицией
   - Фрагменты без тишины
   - Объекты и лица (для разнообразия)

4. **AI создает план монтажа:**
   ```json
   {
     "style": "dynamic",
     "target_duration": 120,
     "clips": [
       { "file": "video1.mp4", "start": 10.5, "end": 15.2, "reason": "High action, good composition" },
       { "file": "video2.mp4", "start": 5.0, "end": 8.5, "reason": "Key moment, speech detected" }
     ],
     "transitions": ["cross_dissolve", "wipe"],
     "music": { "style": "upbeat", "volume": 0.3 }
   }
   ```

5. **AI показывает предпросмотр** и спрашивает feedback

6. **Пользователь уточняет** → AI корректирует

7. **Финальный результат** → добавляется на timeline

**Интеграция с существующими AI сервисами:**

```typescript
// Используем существующий chat-machine
import { useChatMachine } from '@/features/ai-chat'

// В AI Director компоненте
const { sendMessage, messages, isProcessing } = useChatMachine()

// Отправка запроса с контекстом анализа
const handleChatMessage = async (userMessage: string) => {
  await sendMessage(userMessage, {
    context: {
      type: 'ai_director',
      analysisResults: currentAnalysisResults,
      availableFiles: selectedFiles,
      capabilities: ['create_montage', 'find_moments', 'add_music']
    }
  })
}
```

## Преимущества новой архитектуры

### 1. Прозрачность процесса
- Пользователь видит, что именно происходит
- Можно отследить, на каком этапе файл
- Понятно, какие анализаторы работают

### 2. Гибкость
- Выбор только нужных анализаторов
- Экономия времени (не запускать всё подряд)
- Возможность экспериментов

### 3. Интерактивность
- Диалог с AI вместо настройки параметров
- Естественный язык вместо UI форм
- Итеративное улучшение результата

### 4. Автоматизация
- От анализа до готового монтажа
- AI понимает намерения пользователя
- Минимум ручной работы

## Roadmap реализации

### Phase 1: Детальный прогресс анализа
- [ ] Рефакторинг событий анализа (добавить события по файлам)
- [ ] Компонент FileAnalysisProgress
- [ ] Компонент AnalyzerProgressItem
- [ ] State management для прогресса по файлам
- [ ] Тесты

### Phase 2: Гибкий выбор анализаторов
- [ ] Компонент AnalyzerCheckboxGroup
- [ ] Логика включения/выключения анализаторов
- [ ] Обновление конфига анализа
- [ ] Сохранение preset'ов (избранные комбинации)
- [ ] Тесты

### Phase 3: AI Chat интеграция
- [ ] Компонент AIDirectorChat
- [ ] Интеграция с chat-machine
- [ ] Система промптов для AI Director
- [ ] Контекстное понимание результатов анализа
- [ ] Тесты

### Phase 4: Создание монтажа
- [ ] AI Montage Planner (логика создания монтажа)
- [ ] Генерация timeline из AI плана
- [ ] Preview компонент
- [ ] Интеграция с основным timeline
- [ ] Тесты

### Phase 5: Refinement
- [ ] Улучшение UI/UX
- [ ] Оптимизация производительности
- [ ] Добавление preset'ов и шаблонов
- [ ] Документация
- [ ] E2E тесты

## Примеры использования

### Use Case 1: Быстрый highlights ролик
```
1. Пользователь выбирает 5 видео с футбольного матча
2. Включает анализаторы: Scene Detection, Moment Detection, Audio Analysis
3. Пишет в чат: "Найди 10 лучших моментов матча и создай highlights на 1 минуту"
4. AI анализирует, находит голы, опасные моменты, реакции болельщиков
5. AI создает динамичный монтаж с быстрыми переходами
6. Пользователь уточняет: "Добавь комментарии диктора"
7. AI вставляет аудио моменты с голосом комментатора
8. Результат добавляется на timeline
```

### Use Case 2: Обучающее видео
```
1. Пользователь загружает записи уроков
2. Включает: Speech Recognition, Scene Detection, Quality Assessment
3. Чат: "Убери паузы и технические моменты, оставь только объяснения"
4. AI удаляет тишину, технические проблемы, оставляет чистую речь
5. Чат: "Добавь титры с ключевыми моментами"
6. AI распознает речь, создает субтитры, выделяет важные термины
7. Готовое обучающее видео
```

### Use Case 3: Vlog монтаж
```
1. 10 клипов с поездки
2. Анализаторы: VLM, Mood Analysis, Face Detection, Music Detection
3. Чат: "Создай 3-минутный vlog в позитивном стиле"
4. AI:
   - Находит моменты с улыбками (Face + Mood)
   - Описывает локации через VLM
   - Подбирает фрагменты с музыкой
   - Создает последовательность с нарастанием энергии
5. Пользователь: "Сделай начало медленнее, а финал более динамичным"
6. AI корректирует темп монтажа
7. Результат готов
```

## Технические вызовы

### 1. Performance
- Анализ нескольких файлов одновременно может быть ресурсоемким
- **Решение:** Параллельная обработка с ограничением (max 2-3 файла одновременно)

### 2. State Management
- Сложное состояние с множеством файлов и анализаторов
- **Решение:** XState machine с hierarchical states

### 3. Real-time обновления
- Частые события могут перегрузить UI
- **Решение:** Debouncing, throttling, batching обновлений

### 4. AI Context Size
- Большие результаты анализа могут не влезть в контекст
- **Решение:** Суммаризация, выборочная передача данных

### 5. Preview Generation
- Предпросмотр монтажа без фактического рендеринга
- **Решение:** Virtual timeline, proxy clips

## Заключение

AI Director 2.0 - это трансформация процесса монтажа из ручного выбора и расстановки клипов в диалог с AI ассистентом, который понимает ваши намерения и создает готовый результат. Благодаря детальной визуализации процесса и гибкому выбору анализаторов, пользователь получает полный контроль при минимальных усилиях.
