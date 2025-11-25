# AI Director v2 - Frontend Integration Plan

**Цель:** Связать AI Director v2 (batch analysis с events) с существующей модалкой анализа

## 📋 Текущая ситуация

### Что уже есть:

1. ✅ **Backend v2** - полностью реализован (Phase 1 + Phase 2)
   - 3 Tauri команды: `ai_director_v2_analyze_*`
   - 13 событий (10 single file + 3 batch)

2. ✅ **React Hook v2** - уже создан!
   - `src/features/ai-director/hooks/use-ai-director-analysis-v2.ts`
   - Поддержка batch analysis
   - Event listeners для всех событий

3. ✅ **UI Components** - существующие компоненты:
   - `ai-director-modal.tsx` - модалка (wrapper вокруг dashboard)
   - `AIAnalysisDashboardV2` - dashboard с прогрессом
   - `ai-director-progress.tsx` - компонент прогресса
   - `file-analysis-progress.tsx` - прогресс файлов

### Проблема:

**Существующие компоненты используют старый хук `useAIDirectorAnalysis` (v1), а нам нужен v2 с batch support!**

---

## 🎯 План интеграции

### Вариант 1: Обновить существующие компоненты (РЕКОМЕНДУЕТСЯ)

**Плюсы:**
- Минимальные изменения
- Сохраняет существующую структуру
- Backwards compatible

**Шаги:**

#### 1. Обновить `ai-director-progress.tsx` для v2

```tsx
// Было:
import { useAIDirectorAnalysis } from "../hooks/use-ai-director-analysis"

// Стало:
import { useAIDirectorAnalysisV2 } from "../hooks/use-ai-director-analysis-v2"
```

**Изменения:**
- Заменить хук v1 → v2
- Добавить отображение batch progress
- Добавить список файлов с индивидуальным прогрессом

#### 2. Обновить `AIAnalysisDashboardV2`

Проверить использование хука и добавить:
- Batch mode toggle (single file / batch)
- File selector для batch mode
- Batch progress visualization

#### 3. Создать новые компоненты для batch UI

**Новый компонент:** `batch-analysis-progress.tsx`
```tsx
import { useAIDirectorAnalysisV2 } from "../hooks/use-ai-director-analysis-v2"

export function BatchAnalysisProgress() {
  const { batchProgress, filesProgress } = useAIDirectorAnalysisV2()

  return (
    <div>
      {/* Общий прогресс batch */}
      <BatchProgressBar progress={batchProgress} />

      {/* Список файлов с прогрессом */}
      {Object.entries(filesProgress).map(([path, progress]) => (
        <FileProgressItem key={path} path={path} progress={progress} />
      ))}
    </div>
  )
}
```

---

### Вариант 2: Создать отдельный Dashboard v3 (ОПЦИОНАЛЬНО)

**Плюсы:**
- Не ломает существующий функционал
- Можно экспериментировать

**Минусы:**
- Дублирование кода
- Больше поддержки

**Не рекомендуется**, лучше обновить v2.

---

## 🔧 Детальный план обновления

### Step 1: Обновить `ai-director-progress.tsx`

**Файл:** `src/features/ai-director/components/ai-director-progress.tsx`

<details>
<summary>Код изменений</summary>

```tsx
import { useAIDirectorAnalysisV2 } from "../hooks/use-ai-director-analysis-v2"

export function AIDirectorProgress({ showOnlyWhenActive = false }: AIDirectorProgressProps) {
  const {
    // Single file
    isAnalyzing,
    currentProgress,
    progressPercentage,
    currentStage,
    estimatedTimeRemaining,

    // Batch (NEW!)
    batchProgress,
    filesProgress,

    // Errors
    analysisError,
  } = useAIDirectorAnalysisV2()

  // Определяем режим: single или batch
  const isBatchMode = batchProgress !== null

  return (
    <div className="ai-director-progress">
      {/* Существующий UI для single file */}
      {!isBatchMode && (
        // ... существующий код ...
      )}

      {/* Новый UI для batch */}
      {isBatchMode && (
        <BatchProgressView
          batchProgress={batchProgress}
          filesProgress={filesProgress}
        />
      )}
    </div>
  )
}
```

</details>

### Step 2: Создать `batch-progress-view.tsx`

**Файл:** `src/features/ai-director/components/batch-progress-view.tsx` (NEW)

<details>
<summary>Код компонента</summary>

```tsx
import type { BatchProgress, FileProgress } from "../hooks/use-ai-director-analysis-v2"

interface BatchProgressViewProps {
  batchProgress: BatchProgress
  filesProgress: Map<string, FileProgress>
}

export function BatchProgressView({ batchProgress, filesProgress }: BatchProgressViewProps) {
  return (
    <div className="batch-progress">
      {/* Общий прогресс */}
      <div className="batch-overview">
        <h3>Batch Analysis</h3>
        <div className="progress-stats">
          <span>{batchProgress.completedFiles} / {batchProgress.totalFiles} files</span>
          <span>{batchProgress.progress}%</span>
          {batchProgress.estimatedTimeRemaining && (
            <span>ETA: {formatTime(batchProgress.estimatedTimeRemaining)}s</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${batchProgress.progress}%` }}
          />
        </div>
      </div>

      {/* Список файлов */}
      <div className="files-list">
        <h4>Files ({filesProgress.size})</h4>
        {Array.from(filesProgress.entries()).map(([path, progress]) => (
          <FileProgressItem
            key={path}
            filePath={path}
            progress={progress}
            isCurrent={path === batchProgress.currentFilePath}
          />
        ))}
      </div>

      {/* Errors summary */}
      {batchProgress.errors && batchProgress.errors.length > 0 && (
        <div className="errors-summary">
          <h4>Errors ({batchProgress.errors.length})</h4>
          {batchProgress.errors.map((error, i) => (
            <div key={i} className="error-item">{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

</details>

### Step 3: Создать `file-progress-item.tsx`

**Файл:** `src/features/ai-director/components/file-progress-item.tsx` (NEW)

<details>
<summary>Код компонента</summary>

```tsx
import type { FileProgress } from "../hooks/use-ai-director-analysis-v2"

interface FileProgressItemProps {
  filePath: string
  progress: FileProgress
  isCurrent: boolean
}

export function FileProgressItem({ filePath, progress, isCurrent }: FileProgressItemProps) {
  const fileName = filePath.split('/').pop() || filePath

  const getStatusIcon = () => {
    if (progress.progress === 100) return "✅"
    if (isCurrent) return "⏳"
    return "⏸️"
  }

  const getStatusColor = () => {
    if (progress.progress === 100) return "text-green-600"
    if (isCurrent) return "text-blue-600"
    return "text-gray-400"
  }

  return (
    <div className={`file-progress-item ${isCurrent ? 'current' : ''}`}>
      <div className="file-info">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="file-name" title={filePath}>{fileName}</span>
      </div>

      <div className="progress-info">
        <span className={`stage ${getStatusColor()}`}>
          {progress.currentStage}
        </span>
        <span className="percentage">{progress.progress}%</span>
      </div>

      {/* Mini progress bar */}
      <div className="mini-progress-bar">
        <div
          className="fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
    </div>
  )
}
```

</details>

### Step 4: Обновить `AIAnalysisDashboardV2`

**Файл:** `src/features/analysis-dashboard/components/ai-analysis-dashboard-v2.tsx`

Нужно:
1. Добавить mode selector (Single / Batch)
2. Добавить file picker для batch mode
3. Использовать `useAIDirectorAnalysisV2`

**Минимальные изменения:**

```tsx
import { useState } from 'react'
import { useAIDirectorAnalysisV2 } from '@/features/ai-director/hooks/use-ai-director-analysis-v2'

export function AIAnalysisDashboardV2() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const {
    startAnalysis,
    startBatchAnalysis,
    batchProgress,
    filesProgress
  } = useAIDirectorAnalysisV2()

  const handleStart = async () => {
    if (mode === 'single') {
      // Existing single file logic
      await startAnalysis(selectedFiles[0])
    } else {
      // NEW: Batch logic
      await startBatchAnalysis(selectedFiles, new Set(['audio_quality', 'scene_detection']))
    }
  }

  return (
    <div>
      {/* Mode selector */}
      <ModeTabs mode={mode} onChange={setMode} />

      {/* File picker */}
      <FilePicker
        multiple={mode === 'batch'}
        selected={selectedFiles}
        onChange={setSelectedFiles}
      />

      {/* Start button */}
      <button onClick={handleStart}>
        {mode === 'single' ? 'Analyze File' : 'Analyze Batch'}
      </button>

      {/* Progress display */}
      {mode === 'batch' && batchProgress ? (
        <BatchProgressView
          batchProgress={batchProgress}
          filesProgress={filesProgress}
        />
      ) : (
        <AIDirectorProgress /> // Existing component
      )}
    </div>
  )
}
```

---

## 📝 Checklist

### Phase 1: Базовая интеграция
- [ ] Обновить `ai-director-progress.tsx` для использования v2 хука
- [ ] Создать `batch-progress-view.tsx` для batch UI
- [ ] Создать `file-progress-item.tsx` для отображения файлов
- [ ] Обновить `AIAnalysisDashboardV2` для поддержки batch mode
- [ ] Добавить file picker с multi-select
- [ ] Добавить mode toggle (single/batch)

### Phase 2: Улучшения UI
- [ ] Добавить анимации для прогресс-баров
- [ ] Добавить сортировку/фильтрацию файлов
- [ ] Добавить возможность удалить файл из batch
- [ ] Показать детали каждого анализатора
- [ ] Добавить ETA для каждого файла

### Phase 3: Advanced Features (Optional)
- [ ] Cancellation support - остановить batch
- [ ] Pause/Resume - приостановить/возобновить
- [ ] Export результатов в JSON/CSV
- [ ] History - просмотр прошлых анализов

---

## 🎨 UI/UX Рекомендации

### Batch Progress Layout

```
┌─────────────────────────────────────────────────┐
│  AI Director - Batch Analysis                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Overall Progress: 2/3 files (66%)             │
│  ████████████████░░░░░░░░░                      │
│  ETA: 45s remaining                             │
│                                                 │
├─────────────────────────────────────────────────┤
│  Files:                                         │
│                                                 │
│  ✅ video1.mp4    [Complete]           100%    │
│  ⏳ video2.mp4    [Audio Analysis]      45%    │
│  ⏸️ video3.mp4    [Pending]              0%    │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Cancel Batch]                   [View Results]│
└─────────────────────────────────────────────────┘
```

### Single File Progress Layout (Existing)

```
┌─────────────────────────────────────────────────┐
│  AI Director Analysis                           │
├─────────────────────────────────────────────────┤
│  Status: Analyzing... ●                         │
│                                                 │
│  Audio Analysis                          45%    │
│  ███████████░░░░░░░░░░░░░░░░░░░░░░░░             │
│                                                 │
│  ETA: 1m 30s remaining                          │
│                                                 │
│  Stages:                                        │
│  ① → ② → ③ → ④ → ⑤                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Порядок реализации

### Day 1: Базовые компоненты
1. Создать `batch-progress-view.tsx`
2. Создать `file-progress-item.tsx`
3. Обновить `ai-director-progress.tsx`

### Day 2: Интеграция с Dashboard
4. Обновить `AIAnalysisDashboardV2`
5. Добавить file picker
6. Добавить mode toggle

### Day 3: Тестирование
7. Протестировать single file mode
8. Протестировать batch mode
9. Проверить edge cases (errors, cancellation)

---

## 💡 Альтернатива: Минимальная интеграция

Если нужно быстро протестировать, можно:

1. **Временный тестовый компонент:**

```tsx
// src/features/ai-director/components/batch-test.tsx
import { useAIDirectorAnalysisV2 } from "../hooks/use-ai-director-analysis-v2"

export function BatchTest() {
  const { startBatchAnalysis, batchProgress } = useAIDirectorAnalysisV2()

  return (
    <div>
      <button onClick={() => startBatchAnalysis(
        ["/video1.mp4", "/video2.mp4"],
        new Set(["audio_quality"])
      )}>
        Test Batch
      </button>

      {batchProgress && (
        <pre>{JSON.stringify(batchProgress, null, 2)}</pre>
      )}
    </div>
  )
}
```

2. **Добавить в модалку временно:**

```tsx
// ai-director-modal.tsx
export function AIDirectorModal() {
  return (
    <div>
      <BatchTest /> {/* Для тестирования */}
      <AIAnalysisDashboardV2 />
    </div>
  )
}
```

---

**Создано:** 2025-11-25
**Автор:** AI Architecture Team
**Рекомендация:** Начать с Варианта 1 (обновление существующих компонентов)
