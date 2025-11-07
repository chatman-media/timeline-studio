# AI Content Intelligence Components

React компоненты для UI модуля AI Content Intelligence.

## 📁 Структура

```
components/
├── unified-dashboard/           # Главная панель управления AI
│   ├── index.ts                # Экспорты компонентов
│   ├── unified-dashboard.tsx   # Основной компонент дашборда
│   ├── action-panel.tsx        # Панель действий
│   ├── analysis-results.tsx    # Результаты анализа
│   ├── dashboard-header.tsx    # Заголовок дашборда
│   ├── pipeline-status.tsx     # Статус pipeline
│   └── __tests__/             # Тесты компонентов
├── generation-wizard/           # Мастер генерации контента
│   ├── index.ts
│   ├── generation-wizard.tsx   # Пошаговый мастер генерации скриптов
│   └── __tests__/
├── analysis-viewer/            # Просмотр результатов анализа
│   ├── index.ts
│   ├── analysis-viewer.tsx    # Компонент просмотра анализа
│   └── __tests__/
├── preview-grid/               # Сетка превью контента
│   ├── index.ts
│   ├── preview-grid.tsx       # Гибкая сетка превью
│   └── __tests__/
└── README.md
```

## 🎨 Компоненты

### UnifiedDashboard

Главный компонент для управления всеми AI функциями.

```tsx
import { UnifiedDashboard } from '@/features/ai-content-intelligence/components/unified-dashboard'

<UnifiedDashboard 
  className="h-full"
  mediaFiles={selectedFiles}
  onFileUpload={(files) => handleFileUpload(files)}
  onAnalysisComplete={(analysis) => handleAnalysisComplete(analysis)}
  onProcessingComplete={(content) => handleProcessingComplete(content)}
  onError={(error) => logger.errorSync(error)}
/>
```

**Props:**
- `className?: string` - CSS классы
- `mediaFiles?: MediaFileInfo[]` - Массив медиафайлов для анализа
- `onFileUpload?: (files: File[]) => void` - Обработчик загрузки файлов
- `onAnalysisComplete?: (analysis: UnifiedContentAnalysis) => void` - Завершение анализа
- `onProcessingComplete?: (content: IntelligentContent) => void` - Завершение обработки
- `onError?: (error: Error) => void` - Обработчик ошибок

**Возможности:**
- Пять вкладок: Overview, Analysis, Processing, Results, Settings
- Управление AI анализом через хук useAIIntelligence
- Интеграция с AIIntelligenceOrchestrator из shared сервисов
- Отображение результатов анализа с прогрессом
- Контроль pipeline: пауза, возобновление, отмена

### ActionPanel (экспортируется из unified-dashboard)

Панель с кнопками управления процессом анализа.

```tsx
import { ActionPanel } from '@/features/ai-content-intelligence/components/unified-dashboard'

<ActionPanel
  isProcessing={isProcessing}
  isPaused={isPaused}
  hasFiles={selectedFiles.length > 0}
  onAnalyze={handleAnalyze}
  onProcess={handleProcessProject}
  onPause={pausePipeline}
  onResume={resumePipeline}
  onCancel={cancelPipeline}
/>
```

**Props:**
- `isProcessing: boolean` - Идет ли обработка
- `isPaused?: boolean` - Находится ли процесс на паузе
- `hasFiles: boolean` - Есть ли выбранные файлы
- `onAnalyze: () => void` - Запуск анализа
- `onProcess: () => void` - Запуск полной обработки
- `onPause: () => void` - Пауза
- `onResume: () => void` - Продолжение
- `onCancel: () => void` - Отмена

### GenerationWizard

Мастер генерации скриптов с пошаговым интерфейсом.

```tsx
import { GenerationWizard } from '@/features/ai-content-intelligence/components/generation-wizard'

<GenerationWizard
  className="h-full"
  analysis={contentAnalysis}
  onGenerate={(script) => handleGeneratedScript(script)}
  onCancel={() => setShowWizard(false)}
  onClose={() => setShowWizard(false)}
/>
```

**Props:**
- `className?: string` - CSS классы
- `analysis?: UnifiedContentAnalysis | null` - Результаты анализа контента
- `onGenerate?: (script: GeneratedScript) => void` - Обработчик сгенерированного скрипта
- `onCancel?: () => void` - Обработчик отмены
- `onClose?: () => void` - Обработчик закрытия

**Шаги мастера:**
1. **template** - Выбор шаблона скрипта (кинематографический, документальный, соцсети, коммерческий, влог)
2. **style** - Настройка стиля и жанра, эмоционального тона
3. **narrative** - Структура повествования (трёхактная, линейная, эпизодическая и т.д.)
4. **characters** - Настройка персонажей и диалогов
5. **audio** - Настройка озвучки и длительности
6. **review** - Проверка всех параметров
7. **generating** - Процесс генерации с прогрессом

### AnalysisViewer

Компонент для детального отображения результатов AI анализа.

```tsx
import { AnalysisViewer } from '@/features/ai-content-intelligence/components/analysis-viewer'

<AnalysisViewer
  analysis={contentAnalysis}
  className="h-full"
  onSceneSelect={(sceneId) => handleSceneSelect(sceneId)}
  onMomentSelect={(momentId) => handleMomentSelect(momentId)}
/>
```

**Props:**
- `analysis: UnifiedContentAnalysis | null` - Результаты анализа
- `className?: string` - CSS классы
- `onSceneSelect?: (sceneId: string) => void` - Выбор сцены
- `onMomentSelect?: (momentId: string) => void` - Выбор ключевого момента

**Вкладки компонента:**
- **Обзор** - Общая информация: классификация, жанры, эмоциональный тон, целевая аудитория
- **Сцены** - Список сцен с качеством, объектами, длительностью
- **Моменты** - Ключевые моменты с описанием и оценкой
- **Инсайты** - Основные моменты, рекомендации, предупреждения
- **Технические данные** - Разрешение, кодеки, битрейт, метрики качества

### PreviewGrid

Универсальная сетка превью контента с фильтрацией и пагинацией.

```tsx
import { PreviewGrid } from '@/features/ai-content-intelligence/components/preview-grid'

<PreviewGrid
  analysis={contentAnalysis}
  className="h-full"
  viewMode="grid"
  itemsPerPage={12}
  enableSelection={true}
  enableFiltering={true}
  onItemSelect={(item) => handleItemSelect(item)}
  onItemPlay={(item) => handleItemPlay(item)}
  onItemDownload={(item) => handleItemDownload(item)}
  onSelectionChange={(selectedItems) => handleSelectionChange(selectedItems)}
/>
```

**Props:**
- `analysis: UnifiedContentAnalysis | null` - Результаты анализа для отображения
- `className?: string` - CSS классы
- `viewMode?: "grid" | "list"` - Режим отображения (по умолчанию "grid")
- `itemsPerPage?: number` - Количество элементов на странице (по умолчанию 12)
- `enableSelection?: boolean` - Включить мультивыбор
- `enableFiltering?: boolean` - Включить фильтрацию
- `onItemSelect?: (item: PreviewItem) => void` - Выбор элемента
- `onItemPlay?: (item: PreviewItem) => void` - Воспроизведение
- `onItemDownload?: (item: PreviewItem) => void` - Скачивание
- `onItemStar?: (item: PreviewItem) => void` - Добавление в избранное
- `onItemShare?: (item: PreviewItem) => void` - Поделиться
- `onSelectionChange?: (selectedItems: PreviewItem[]) => void` - Изменение выбора

**Возможности:**
- Автоматическое преобразование сцен, моментов и highlights в превью
- Фильтрация по типу (все, сцены, моменты, основное)
- Поиск по названию, описанию и тегам
- Сортировка по времени, оценке, длительности
- Переключение между режимами сетки и списка
- Пагинация для больших наборов данных
- Действия над элементами: play, download, star, share

## 🏗️ Архитектура и интеграция

### Использование Shared Services
Компоненты используют сервисы из shared архитектуры:
- **AIIntelligenceOrchestrator** - координация AI процессов
- **ContentClassifier** - классификация контента из `/src/shared/services/ai/analysis/content/`
- **ObjectTracker** - трекинг объектов из `/src/shared/services/ai/analysis/vision/`
- **ONNXRuntimeService** - ML инференс из `/src/shared/services/ai/analysis/vision/`

### Хуки для интеграции
- **useAIIntelligence** - главный хук для работы с AI функциями
- **useContentPipeline** - управление pipeline обработки контента
- **useAIIntelligenceContext** - доступ к контексту AI Intelligence

### Совместимость с новой архитектурой
- Все компоненты используют типы из `shared/types`
- Интеграция через DI Container для сервисов
- Поддержка прогресса и отмены операций
- Обработка ошибок на всех уровнях

## 🎯 Использование

### Полная интеграция с AI Intelligence Provider

```tsx
import { useState } from 'react'
import { AIIntelligenceProvider } from '@/features/ai-content-intelligence/services/ai-intelligence-provider'
import { UnifiedDashboard } from '@/features/ai-content-intelligence/components/unified-dashboard'

function App() {
  const [showAIDashboard, setShowAIDashboard] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFileInfo[]>([])
  
  const handleFileUpload = (files: File[]) => {
    // Преобразование File в MediaFileInfo
    const mediaFileInfos = files.map(file => ({
      path: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      format: file.type.split('/')[1],
      duration: 0, // Будет определено после загрузки
    }))
    setMediaFiles(mediaFileInfos)
  }
  
  return (
    <AIIntelligenceProvider>
      <Button onClick={() => setShowAIDashboard(true)}>
        Open AI Intelligence
      </Button>
      
      {showAIDashboard && (
        <UnifiedDashboard
          mediaFiles={mediaFiles}
          onFileUpload={handleFileUpload}
          onAnalysisComplete={(analysis) => {
            logger.debugSync('Analysis completed:', analysis)
          }}
          onProcessingComplete={(content) => {
            logger.debugSync('Processing completed:', content)
          }}
          onError={(error) => {
            logger.errorSync('AI Error:', error)
          }}
        />
      )}
    </AIIntelligenceProvider>
  )
}
```

### Использование отдельных компонентов

```tsx
// Только анализ результатов
<AnalysisViewer 
  analysis={analysisData}
  onSceneSelect={(sceneId) => jumpToScene(sceneId)}
/>

// Только генерация скриптов
<GenerationWizard
  analysis={analysisData}
  onGenerate={(script) => saveScript(script)}
/>

// Только превью контента
<PreviewGrid
  analysis={analysisData}
  viewMode="grid"
  enableSelection={true}
  onSelectionChange={(items) => updateSelection(items)}
/>
```

## 🔧 Конфигурация

### Настройка AI конфигурации

```tsx
import { createDefaultAIConfig } from '@/features/ai-content-intelligence/shared/utils/config'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

const aiConfig = createDefaultAIConfig({
  features: {
    sceneAnalysis: true,
    scriptGeneration: true,
    multiPlatform: true,
    contentClassification: true,
    qualityEnhancement: true,
    autoSuggestions: false,
  },
  platforms: ['youtube', 'instagram', 'tiktok'],
})
```

### Кастомизация компонентов

Все компоненты используют Tailwind CSS и поддерживают className prop:

```tsx
<UnifiedDashboard 
  className="bg-dark-900 text-white rounded-xl shadow-2xl"
/>

<AnalysisViewer
  className="max-h-[600px] overflow-auto"
/>

<PreviewGrid
  className="grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
/>
```

## 📱 Адаптивность

Компоненты автоматически адаптируются под размер экрана:
- **Desktop**: Полный функционал с боковыми панелями
- **Tablet**: Вкладки вместо боковых панелей
- **Mobile**: Упрощенный интерфейс с вертикальной прокруткой

## ⚡ Оптимизация производительности

- **Виртуализация списков** в PreviewGrid для больших наборов данных
- **Ленивая загрузка** компонентов анализа
- **Мемоизация** результатов фильтрации и сортировки
- **Дебаунс** поисковых запросов
- **Прогрессивная загрузка** изображений превью