# AI Director v3 - Modern UI Implementation

**Дата:** 2025-11-25
**Статус:** 📋 Планирование
**Приоритет:** Высокий
**Зависимости:** AI Director v2 Backend (Phase 1 + Phase 2)

---

## 🎯 Цель

Создать новый, современный и чистый UI для AI Director v2 с фокусом на:
- **Minimalist Design** - чистый, понятный интерфейс
- **Real-time Updates** - live прогресс через события
- **Media Pool Integration** - работа с файлами из медиапула проекта
- **Batch Processing** - удобное отображение прогресса нескольких файлов

## 📦 Текущая проблема

Существующий UI (`AIAnalysisDashboardV2`) имеет проблемы:
- Перегружен вкладками и панелями
- Не оптимизирован для batch analysis
- Сложная навигация
- Не использует v2 hook с batch событиями

## 🎨 Новый дизайн: Minimalist Card Layout

### Главный экран (с файлами в процессе)

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 AI Director v3                            [⚙️ Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📁 Selected Files (3)                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅ video1.mp4                                         │  │
│  │    Audio Quality ✓  Scene Detection ✓                │  │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%          2m 15s         │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 🔄 video2.mp4                                         │  │
│  │    Audio Quality: 45% ⏳  Scene Detection: Pending    │  │
│  │    ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  45%          1m 30s         │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ⏸️ video3.mp4                                         │  │
│  │    Pending analysis...                                │  │
│  │    ░░░░░░░░░░░░░░░░░░░░   0%          ~2m 00s        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  📊 Overall Progress                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  48% Complete (2/3 files)              ETA: 3m 45s   │  │
│  │  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░                │  │
│  │                                                        │  │
│  │  ✅ Completed: 1    🔄 Analyzing: 1    ⏸ Pending: 1  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚡ Active Analyzers: Audio Quality • Scene Detection        │
│                                                               │
│                   [Cancel Analysis]   [Pause]                │
└─────────────────────────────────────────────────────────────┘
```

### Empty State (до начала анализа)

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 AI Director v3                            [⚙️ Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                        🎬                                     │
│                   ┌─────────┐                                │
│                   │  Ready  │                                │
│                   │   to    │                                │
│                   │ analyze │                                │
│                   └─────────┘                                │
│                                                               │
│                                                               │
│            [📁 Select Files from Media Pool]                 │
│                                                               │
│  ───────────────────────────────────────────────────────     │
│                                                               │
│  💡 Quick Tips:                                               │
│  • Select multiple files from media pool for batch analysis   │
│  • Configure analyzers in Settings                           │
│  • Results are auto-saved after each file                    │
│                                                               │
│  ⚡ Current Settings:                                         │
│  Mode: Balanced  |  Analyzers: Audio Quality, Scene Detect   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Settings Panel (выдвижная панель справа)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                       [✕ Close] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎯 Analysis Mode                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ○ Quick         - Fast, basic analysis (~30s/file)  │  │
│  │  ● Balanced      - Recommended (~60s/file)           │  │
│  │  ○ Comprehensive - Deep analysis (~120s/file)        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚡ Analyzers                                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ☑ Audio Quality        [i]                          │  │
│  │     ├─ Volume levels                                  │  │
│  │     ├─ Background noise                               │  │
│  │     └─ Audio clarity                                  │  │
│  │                                                        │  │
│  │  ☑ Scene Detection      [i]                          │  │
│  │     ├─ Shot boundaries                                │  │
│  │     ├─ Scene changes                                  │  │
│  │     └─ Visual analysis                                │  │
│  │                                                        │  │
│  │  ☐ Moment Detection     [i]                          │  │
│  │  ☐ Face Recognition     [i]                          │  │
│  │  ☐ Object Detection     [i]                          │  │
│  │  ☐ Speech Recognition   [i]                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  📦 Presets                                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [Quick Check]  [Full Analysis]  [Custom ▾]          │  │
│  │                                                        │  │
│  │  💾 Save current as preset...                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  💾 Output                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ☑ Auto-save after each file                          │  │
│  │  ☑ Export JSON report                                 │  │
│  │  ☐ Export CSV summary                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│                        [Reset to Defaults]  [Apply]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Архитектура компонентов

### Структура файлов

```
src/features/ai-director/components/v3/
├── ai-director-v3-dashboard.tsx         # Главный компонент
├── file-analysis-card.tsx               # Карточка отдельного файла
├── overall-progress-card.tsx            # Общий прогресс batch
├── settings-panel.tsx                   # Панель настроек (drawer)
├── analyzer-selector.tsx                # Выбор анализаторов
├── mode-selector.tsx                    # Quick/Balanced/Comprehensive
├── preset-manager.tsx                   # Управление пресетами
├── empty-state.tsx                      # Empty state
└── media-pool-selector.tsx              # Выбор файлов из медиапула
```

### Интеграция с существующими системами

**Используем:**
- `useAIDirectorAnalysisV2` - хук с batch событиями (уже есть)
- `useBrowser` - для доступа к выбранным файлам медиапула
- `useMediaManagement` - для получения путей к файлам
- `useAnalyzerPresets` - для управления пресетами (уже есть)

**Новые компоненты:**
- `AIDirectorV3Dashboard` - новый главный компонент
- `FileAnalysisCard` - карточка файла с прогрессом
- `OverallProgressCard` - общий прогресс
- `SettingsPanel` - drawer с настройками

---

## 📝 Детальное описание компонентов

### 1. AIDirectorV3Dashboard (главный компонент)

**Файл:** `src/features/ai-director/components/v3/ai-director-v3-dashboard.tsx`

**Обязанности:**
- Управление состоянием анализа
- Получение выбранных файлов из медиапула
- Запуск batch analysis
- Отображение общего прогресса
- Управление settings panel

**Props:**
```typescript
interface AIDirectorV3DashboardProps {
  // Опционально: можно передать файлы извне
  initialFiles?: string[]
}
```

**State:**
```typescript
const [settingsOpen, setSettingsOpen] = useState(false)
const [selectedAnalyzers, setSelectedAnalyzers] = useState<Set<AnalyzerType>>(...)
const [analysisMode, setAnalysisMode] = useState<'quick' | 'balanced' | 'comprehensive'>('balanced')
```

**Hooks:**
```typescript
const { browserState } = useBrowser()
const { mediaPool } = useMediaManagement()
const {
  isAnalyzing,
  filesProgress,
  batchProgress,
  startBatchAnalysis,
  cancelAnalysis
} = useAIDirectorAnalysisV2()
```

**Логика получения файлов:**
```typescript
// Получаем выбранные файлы из медиапула (вкладка "media")
const selectedFilePaths = useMemo(() => {
  const mediaTabSelectedFiles = browserState?.selected_files?.media || []

  const paths: string[] = []
  mediaTabSelectedFiles.forEach((fileId) => {
    const mediaFile = mediaPool.get(fileId)
    if (mediaFile) {
      paths.push(mediaFile.path)
    }
  })

  return paths
}, [browserState, mediaPool])
```

**Запуск анализа:**
```typescript
const handleStartAnalysis = async () => {
  if (selectedFilePaths.length === 0) {
    // Show notification: "No files selected"
    return
  }

  await startBatchAnalysis(selectedFilePaths, selectedAnalyzers)
}
```

---

### 2. FileAnalysisCard

**Файл:** `src/features/ai-director/components/v3/file-analysis-card.tsx`

**Обязанности:**
- Отображение прогресса одного файла
- Детали анализаторов (какие запущены, какие завершены)
- Прогресс-бар с процентами
- ETA для файла

**Props:**
```typescript
interface FileAnalysisCardProps {
  file: {
    filePath: string
    fileName: string
    status: 'pending' | 'analyzing' | 'completed' | 'error'
    progress: number  // 0-100
    currentAnalyzer?: string
    completedAnalyzers: string[]
    eta?: number  // seconds
    error?: string
  }
  analyzers: Set<AnalyzerType>  // Активные анализаторы
}
```

**UI элементы:**
- Иконка статуса (✅ 🔄 ⏸️ ❌)
- Имя файла
- Список анализаторов с индикацией (✓ ⏳ ⏸️)
- Прогресс-бар
- Процент выполнения
- ETA

---

### 3. OverallProgressCard

**Файл:** `src/features/ai-director/components/v3/overall-progress-card.tsx`

**Обязанности:**
- Общий прогресс batch анализа
- Статистика (завершено/в процессе/pending)
- Общий ETA
- Кнопки управления (Cancel/Pause)

**Props:**
```typescript
interface OverallProgressCardProps {
  batchProgress: {
    progress: number  // 0-100
    completedFiles: number
    totalFiles: number
    estimatedTimeRemaining?: number  // seconds
  }
  filesProgress: Array<FileProgressInfo>
  onCancel: () => void
  onPause?: () => void  // Phase 3 optional
}
```

**UI элементы:**
- Общий процент (48%)
- Прогресс-бар
- Счетчики файлов (✅ Completed: 1  🔄 Analyzing: 1  ⏸ Pending: 1)
- ETA
- Кнопки Cancel/Pause

---

### 4. SettingsPanel

**Файл:** `src/features/ai-director/components/v3/settings-panel.tsx`

**Обязанности:**
- Drawer/Sheet с настройками
- Выбор режима анализа (Quick/Balanced/Comprehensive)
- Выбор анализаторов (checkboxes)
- Управление пресетами
- Output настройки

**Props:**
```typescript
interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  // Current settings
  analysisMode: 'quick' | 'balanced' | 'comprehensive'
  selectedAnalyzers: Set<AnalyzerType>

  // Callbacks
  onModeChange: (mode: 'quick' | 'balanced' | 'comprehensive') => void
  onAnalyzersChange: (analyzers: Set<AnalyzerType>) => void
}
```

**Используем:**
- `Sheet` component от shadcn/ui для drawer
- `RadioGroup` для выбора режима
- `Checkbox` для анализаторов
- `useAnalyzerPresets` hook для пресетов

---

### 5. MediaPoolSelector

**Файл:** `src/features/ai-director/components/v3/media-pool-selector.tsx`

**Обязанности:**
- Кнопка для открытия медиапула
- Отображение количества выбранных файлов
- Интеграция с Browser

**Props:**
```typescript
interface MediaPoolSelectorProps {
  selectedCount: number
  onOpenMediaPool: () => void
}
```

**UI:**
```tsx
<Button onClick={onOpenMediaPool} variant="outline" size="lg">
  <Folder className="mr-2 h-5 w-5" />
  Select Files from Media Pool
  {selectedCount > 0 && (
    <Badge className="ml-2">{selectedCount} selected</Badge>
  )}
</Button>
```

---

### 6. EmptyState

**Файл:** `src/features/ai-director/components/v3/empty-state.tsx`

**Обязанности:**
- Отображение до начала анализа
- Подсказки для пользователя
- Текущие настройки

**Props:**
```typescript
interface EmptyStateProps {
  onSelectFiles: () => void
  currentSettings: {
    mode: string
    analyzers: string[]
  }
}
```

---

## 🔄 Event Flow (интеграция с v2 backend)

### 1. Начало анализа

```typescript
// User clicks "Select Files from Media Pool"
// → Opens Browser modal
// → User selects files in media tab
// → Closes Browser modal

// User clicks "Start Analysis"
handleStartAnalysis() {
  const selectedFiles = getSelectedFilesFromMediaPool()
  await startBatchAnalysis(selectedFiles, selectedAnalyzers)
}
```

### 2. Real-time события

**Backend отправляет события через Tauri:**
```
batch-analysis-started → Обновляем batchProgress
batch-analysis-progress → Обновляем прогресс файлов и общий прогресс
analysis-started → Файл начал анализ
analyzer-started → Анализатор начал работу
analyzer-completed → Анализатор завершен
analysis-completed → Файл завершен
batch-analysis-completed → Весь batch завершен
```

**Frontend (useAIDirectorAnalysisV2) автоматически обрабатывает:**
```typescript
// Hook уже подписан на события и обновляет state:
const {
  batchProgress,      // { progress: 48, completedFiles: 2, ... }
  filesProgress,      // Map<filePath, FileProgress>
  isAnalyzing         // true/false
} = useAIDirectorAnalysisV2()
```

**Компоненты реагируют на изменения:**
```typescript
// FileAnalysisCard получает обновления через props
<FileAnalysisCard
  file={filesProgress.get(filePath)}
  analyzers={selectedAnalyzers}
/>

// OverallProgressCard отображает общий прогресс
<OverallProgressCard
  batchProgress={batchProgress}
  filesProgress={Array.from(filesProgress.values())}
/>
```

---

## 📦 Интеграция с Media Pool

### Получение выбранных файлов

**Через useBrowser:**
```typescript
const { browserState } = useBrowser()
const selectedFileIds = browserState?.selected_files?.media || []
```

**Конвертация в пути:**
```typescript
const { mediaPool } = useMediaManagement()

const selectedFilePaths = selectedFileIds
  .map(fileId => mediaPool.get(fileId))
  .filter(Boolean)
  .map(file => file.path)
```

### Workflow пользователя

1. **User opens AI Director v3 modal**
2. **Empty state показывает "Select Files from Media Pool"**
3. **User clicks button** → открывается Browser modal
4. **User selects files** в вкладке "media"
5. **User closes Browser** → возвращается в AI Director v3
6. **Dashboard показывает выбранные файлы** (3 selected)
7. **User clicks "Start Analysis"**
8. **Batch analysis начинается** → real-time обновления

---

## 🎯 План реализации

### Phase 1: Core Components (День 1)

- [ ] **Step 1:** Создать структуру папки `v3/`
- [ ] **Step 2:** Создать `AIDirectorV3Dashboard` (основа)
- [ ] **Step 3:** Создать `EmptyState` компонент
- [ ] **Step 4:** Создать `MediaPoolSelector` компонент
- [ ] **Step 5:** Интегрировать с `useBrowser` и `useMediaManagement`
- [ ] **Step 6:** Тестировать получение файлов из медиапула

### Phase 2: Progress Display (День 2)

- [ ] **Step 7:** Создать `FileAnalysisCard` компонент
- [ ] **Step 8:** Создать `OverallProgressCard` компонент
- [ ] **Step 9:** Интегрировать с `useAIDirectorAnalysisV2` hook
- [ ] **Step 10:** Добавить real-time обновления
- [ ] **Step 11:** Тестировать отображение прогресса

### Phase 3: Settings Panel (День 3)

- [ ] **Step 12:** Создать `SettingsPanel` (Sheet/Drawer)
- [ ] **Step 13:** Создать `ModeSelector` (Quick/Balanced/Comprehensive)
- [ ] **Step 14:** Создать `AnalyzerSelector` (checkboxes)
- [ ] **Step 15:** Создать `PresetManager`
- [ ] **Step 16:** Интегрировать с `useAnalyzerPresets`
- [ ] **Step 17:** Добавить сохранение настроек

### Phase 4: UI Polish (День 4)

- [ ] **Step 18:** Добавить анимации (framer-motion)
- [ ] **Step 19:** Добавить тостеры для уведомлений
- [ ] **Step 20:** Улучшить типографику и spacing
- [ ] **Step 21:** Добавить tooltips для анализаторов
- [ ] **Step 22:** Responsive design (mobile/tablet)

### Phase 5: Testing & Integration (День 5)

- [ ] **Step 23:** Unit тесты для компонентов
- [ ] **Step 24:** Integration тесты
- [ ] **Step 25:** E2E тесты (Playwright)
- [ ] **Step 26:** Обновить modal wrapper для использования v3
- [ ] **Step 27:** Документация

---

## 🧪 Testing Strategy

### Unit Tests

**FileAnalysisCard:**
```typescript
describe('FileAnalysisCard', () => {
  it('shows pending state correctly', () => {
    render(<FileAnalysisCard file={mockPendingFile} analyzers={mockAnalyzers} />)
    expect(screen.getByText('Pending analysis...')).toBeInTheDocument()
  })

  it('shows analyzing state with progress', () => {
    render(<FileAnalysisCard file={mockAnalyzingFile} analyzers={mockAnalyzers} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('shows completed state', () => {
    render(<FileAnalysisCard file={mockCompletedFile} analyzers={mockAnalyzers} />)
    expect(screen.getByText('✅')).toBeInTheDocument()
  })
})
```

**OverallProgressCard:**
```typescript
describe('OverallProgressCard', () => {
  it('calculates overall progress correctly', () => {
    render(<OverallProgressCard batchProgress={mockBatchProgress} />)
    expect(screen.getByText('48% Complete (2/3 files)')).toBeInTheDocument()
  })
})
```

### Integration Tests

**Full workflow:**
```typescript
describe('AIDirectorV3Dashboard Integration', () => {
  it('completes full analysis workflow', async () => {
    // 1. Render dashboard
    render(<AIDirectorV3Dashboard />)

    // 2. Mock file selection from media pool
    mockMediaPoolSelection(['video1.mp4', 'video2.mp4'])

    // 3. Click start analysis
    fireEvent.click(screen.getByText('Start Analysis'))

    // 4. Mock events from backend
    emitMockEvent('batch-analysis-started', {...})
    emitMockEvent('batch-analysis-progress', {...})

    // 5. Verify progress updates
    await waitFor(() => {
      expect(screen.getByText('48%')).toBeInTheDocument()
    })
  })
})
```

---

## 🎨 Styling & Design System

### Colors

```typescript
// Progress states
const STATUS_COLORS = {
  pending: 'text-gray-400',
  analyzing: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500',
}

// Progress bars
const PROGRESS_BAR_COLORS = {
  pending: 'bg-gray-200',
  analyzing: 'bg-blue-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
}
```

### Animations

```typescript
// Card entrance
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Progress bar fill
const progressVariants = {
  initial: { width: 0 },
  animate: { width: `${progress}%` },
}
```

### Components from shadcn/ui

- `Button`
- `Card`, `CardContent`, `CardHeader`
- `Progress` (прогресс-бар)
- `Sheet` (для settings panel)
- `Badge` (для счетчиков)
- `Checkbox` (для анализаторов)
- `RadioGroup` (для режимов)
- `Separator`
- `ScrollArea`

---

## 📱 Responsive Design

### Breakpoints

- **Desktop (lg+):** Full layout, settings в drawer справа
- **Tablet (md):** Компактный layout, settings в modal
- **Mobile (sm):** Stack layout, settings в full-screen modal

---

## 🔗 References

- **Backend Events:** `/docs/08_tasks/active/ai-director-v2-complete-summary.md`
- **React Hook:** `src/features/ai-director/hooks/use-ai-director-analysis-v2.ts`
- **Media Pool:** `src/domains/media-management/`
- **Browser State:** `src/domains/browser/`
- **Analyzer Presets:** `src/features/ai-director/hooks/use-analyzer-presets.ts`

---

## ✅ Definition of Done

- [ ] Все компоненты созданы и работают
- [ ] Интеграция с медиапулом функционирует
- [ ] Real-time события обновляют UI
- [ ] Settings panel полностью функциональна
- [ ] Unit тесты покрывают >80% кода
- [ ] Integration тесты проходят
- [ ] UI соответствует дизайну
- [ ] Responsive на всех размерах экрана
- [ ] Документация обновлена
- [ ] Существующий modal wrapper обновлен для использования v3

---

**Создано:** 2025-11-25
**Автор:** AI Architecture Team
**Версия:** 1.0
**Статус:** 📋 Ready to implement
