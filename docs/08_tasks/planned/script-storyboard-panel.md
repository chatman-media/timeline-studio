# Добавление панели Script (Сценарий/Раскадровка)

**Дата:** 2025-12-31
**Статус:** Планирование
**Приоритет:** Высокий 🔴
**Сложность:** Средняя
**Время:** 5-7 дней

---

## Проблема

Сейчас в процессе монтажа отсутствует критический этап между **анализом** (Analysis) и **редактированием** (Timeline) - это **планирование монтажа** (составление сценария/раскадровки).

### Текущий workflow:
```
1. ANALYSIS → анализ контента
2. ❌ [ЧТО-ТО ОТСУТСТВУЕТ] ❌
3. TIMELINE → ручное редактирование
4. AUDIO MIXER → микширование
```

### Правильный workflow:
```
1. ANALYSIS → анализ исходников (AI Director)
2. SCRIPT → создание плана монтажа ⬅️ ДОБАВИТЬ!
3. TIMELINE → применение плана + доработка
4. AUDIO MIXER → финальное аудио
```

---

## Решение

Добавить вкладку **"Script"** (Сценарий) между Analysis и Timeline в `TimelineWorkspaceTabs`.

**Новая структура вкладок:**
1. **Analysis** (BarChart3) - анализ контента AI Director
2. **Script** (Wand2/Film/Clapperboard) - планирование монтажа ⬅️ НОВОЕ
3. **Timeline** (Layers) - редактирование на таймлайне
4. **Audio Mixer** (Sliders) - аудиомикширование

---

## Концепция панели Script

### Функциональность

**Script (Сценарий/Раскадровка)** - это визуальный редактор плана монтажа, который:
- Показывает результаты анализа AI Director в удобном виде
- Позволяет создать последовательность сцен (storyboard)
- Настраивает стиль монтажа, переходы, музыку
- Генерирует план через AI или вручную (drag & drop)
- Применяет готовый план на Timeline одной кнопкой

---

## UI Structure (3-колоночный layout)

### 1. Левая панель - Библиотека фрагментов (30%)

```
┌─────────────────────────────────────┐
│ 📚 Фрагменты из анализа             │
├─────────────────────────────────────┤
│ Фильтры:                            │
│ • По качеству (⭐⭐⭐⭐⭐)          │
│ • По эмоциям (happy/exciting/calm)  │
│ • По контенту (faces/action/nature) │
│ • По длительности (0-5s, 5-15s...)  │
├─────────────────────────────────────┤
│                                     │
│ [Сцена 1] 0:00-0:15 ⭐⭐⭐⭐        │
│ [превью кадра]                      │
│ 👤 2 лица • 🎬 Говорящий           │
│ 📊 Quality: 85%                     │
│                                     │
│ [Сцена 2] 0:15-0:45 ⭐⭐⭐⭐⭐      │
│ [превью кадра]                      │
│ 🏃 Action • 🎯 High energy         │
│ 📊 Quality: 92%                     │
│                                     │
│ [Сцена 3] 0:45-1:20 ⭐⭐⭐          │
│ [превью кадра]                      │
│ 🌅 Nature • 😌 Calm                │
│ 📊 Quality: 78%                     │
│                                     │
│ ... (scroll, drag & drop →)         │
└─────────────────────────────────────┘
```

**Компоненты:**
- `FragmentLibrary` - основной компонент
- `FragmentCard` - карточка фрагмента с превью
- `FragmentFilters` - фильтры
- Drag source для drag & drop в plan

---

### 2. Центральная панель - Раскадровка (50%)

```
┌─────────────────────────────────────────────────────────┐
│ 🎬 План монтажа: "Динамичный ролик 2 минуты"            │
├─────────────────────────────────────────────────────────┤
│ Общая длительность: 2:03                                │
│ Стиль: Dynamic Action                                   │
│ Качество плана: ★★★★☆ (87/100)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Режим отображения: [Timeline] [Cards] [Grid]           │
│                                                         │
│ === Cards View (по умолчанию) ===                      │
│ Вертикальный список карточек (как Trello):             │
│                                                         │
│ ┌────────────────────────────────┐                     │
│ │ 1. Интро (0:00-0:10)           │ [▲] [▼] [×]        │
│ │ ┌──────────────────────────┐  │                     │
│ │ │   [превью кадра]         │  │                     │
│ │ └──────────────────────────┘  │                     │
│ │ Сцена #1 • ⭐⭐⭐⭐            │                     │
│ │ Переход: CUT                   │                     │
│ │ 📝 "Энергичное начало"         │                     │
│ │ 🎵 Music: Intro.mp3            │                     │
│ └────────────────────────────────┘                     │
│                                                         │
│ ┌────────────────────────────────┐                     │
│ │ 2. Основное (0:10-0:35)        │ [▲] [▼] [×]        │
│ │ ┌──────────────────────────┐  │                     │
│ │ │   [превью кадра]         │  │                     │
│ │ └──────────────────────────┘  │                     │
│ │ Сцена #2 • ⭐⭐⭐⭐⭐          │                     │
│ │ Переход: FADE                  │                     │
│ │ 📝 "Динамичное действие"       │                     │
│ │ 🎵 Синхрон с музыкой           │                     │
│ └────────────────────────────────┘                     │
│                                                         │
│ [+ Добавить сцену]                                      │
│                                                         │
│ === Timeline View (опционально) ===                    │
│ Горизонтальная timeline с карточками:                  │
│ ┌──────┐  ┌────────┐  ┌──────┐  ┌────────┐           │
│ │Scene1│→ │ Scene2 │→ │Scene5│→ │ Scene7 │           │
│ │ 0-10s│  │ 10-25s │  │25-40s│  │ 40-60s │           │
│ └──────┘  └────────┘  └──────┘  └────────┘           │
│   CUT      FADE        CUT       DISSOLVE              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Компоненты:**
- `StoryboardEditor` - основной редактор
- `SceneCard` - карточка сцены в плане
- `SceneTimeline` - timeline view (опционально)
- Drag & drop зоны для реорганизации
- Inline редактирование (trim, transitions, notes)

**Возможности:**
- ✅ Drag & drop сцен из библиотеки
- ✅ Изменение порядка (перетаскивание)
- ✅ Trim начала/конца сцены
- ✅ Выбор типа перехода (CUT, FADE, DISSOLVE...)
- ✅ Добавление заметок к сцене
- ✅ Привязка музыки/звука
- ✅ Удаление сцен

---

### 3. Правая панель - Настройки и AI (20%)

```
┌─────────────────────────────────────┐
│ ⚙️ Настройки плана                  │
├─────────────────────────────────────┤
│ Название плана:                     │
│ [Динамичный ролик 2 мин_____]      │
│                                     │
│ Целевая длительность:               │
│ [●────────] 2:00 мин                │
│ Range: 1:30 - 3:00                  │
│                                     │
│ Стиль монтажа:                      │
│ ○ Dynamic Action                    │
│ ● Cinematic Drama                   │
│ ○ Music Video                       │
│ ○ Documentary                       │
│ ○ Social Media                      │
│ ○ Corporate                         │
│                                     │
│ Приоритеты:                         │
│ ☑ Качество видео                   │
│ ☑ Эмоциональная вовлечённость      │
│ ☑ Синхрон с музыкой                │
│ ☐ Наличие лиц                      │
│ ☐ Динамичные сцены                 │
│                                     │
│ Темп монтажа:                       │
│ Медленный [──●────] Быстрый        │
│                                     │
│ Переходы:                           │
│ Простые [────●──] Сложные          │
│                                     │
├─────────────────────────────────────┤
│ 🤖 AI Ассистент                     │
├─────────────────────────────────────┤
│ [🎬 Создать план]                   │
│ "AI создаст план на основе анализа" │
│                                     │
│ [✨ Оптимизировать]                 │
│ "Улучшить текущий план"            │
│                                     │
│ [💡 Рекомендации]                   │
│ "Показать советы по улучшению"     │
│                                     │
│ [🔄 Вариации]                       │
│ "Создать альтернативные планы"     │
│                                     │
├─────────────────────────────────────┤
│ 📊 Статистика плана                 │
├─────────────────────────────────────┤
│ Сцен: 8                             │
│ Переходов: 7                        │
│ Длительность: 2:03                  │
│ Качество: ★★★★☆ (87%)              │
│ Вовлечённость: ★★★★★ (94%)         │
│                                     │
├─────────────────────────────────────┤
│ ✅ Готово к применению              │
│ [Предпросмотр]  [Применить]         │
└─────────────────────────────────────┘
```

**Компоненты:**
- `PlanSettings` - настройки плана
- `AIAssistant` - AI кнопки и промты
- `PlanStats` - статистика
- `ApplyControls` - кнопки применения

---

## Технические детали

### Файловая структура

```
src/features/timeline/components/
├── script-view/                      # НОВАЯ ПАПКА
│   ├── script-view.tsx              # Главный компонент (3-колоночный layout)
│   │
│   ├── fragment-library/            # Левая панель
│   │   ├── fragment-library.tsx    # Библиотека фрагментов
│   │   ├── fragment-card.tsx       # Карточка фрагмента
│   │   ├── fragment-filters.tsx    # Фильтры
│   │   └── use-fragment-library.ts # Hook для данных
│   │
│   ├── storyboard-editor/          # Центральная панель
│   │   ├── storyboard-editor.tsx   # Редактор раскадровки
│   │   ├── scene-card.tsx          # Карточка сцены
│   │   ├── scene-timeline.tsx      # Timeline view
│   │   ├── scene-editor.tsx        # Inline редактор сцены
│   │   ├── transition-selector.tsx # Выбор перехода
│   │   └── use-storyboard.ts       # State management
│   │
│   ├── plan-settings/              # Правая панель
│   │   ├── plan-settings.tsx       # Настройки плана
│   │   ├── ai-assistant.tsx        # AI кнопки
│   │   ├── plan-stats.tsx          # Статистика
│   │   ├── apply-controls.tsx      # Кнопки применения
│   │   └── use-plan-generator.ts   # AI generation
│   │
│   └── index.ts                    # Exports

src/features/timeline/components/
├── timeline-workspace-tabs.tsx     # ОБНОВИТЬ: добавить "script"
└── timeline.tsx                    # ОБНОВИТЬ: добавить ScriptView

src/features/timeline/types/
└── script.ts                       # НОВОЕ: типы для Script
```

### Типы

```typescript
// src/features/timeline/types/script.ts

export interface ScriptPlan {
  id: string
  name: string
  targetDuration: number
  style: MontageStyle
  scenes: ScriptScene[]
  settings: PlanSettings
  stats: PlanStats
  createdAt: Date
  updatedAt: Date
}

export interface ScriptScene {
  id: string
  order: number
  fragmentId: string
  startTime: number
  endTime: number
  duration: number
  transition: TransitionType
  notes?: string
  musicTrack?: string
  effects?: string[]
}

export interface PlanSettings {
  prioritizeQuality: boolean
  prioritizeEngagement: boolean
  syncWithMusic: boolean
  includeFaces: boolean
  includeDynamic: boolean
  paceLevel: number // 0-100 (slow to fast)
  transitionComplexity: number // 0-100 (simple to complex)
}

export interface PlanStats {
  totalScenes: number
  totalTransitions: number
  totalDuration: number
  qualityScore: number // 0-100
  engagementScore: number // 0-100
  coherenceScore: number // 0-100
}

export type TransitionType =
  | 'CUT'
  | 'FADE'
  | 'DISSOLVE'
  | 'WIPE'
  | 'SLIDE'
  | 'ZOOM'

export type MontageStyle =
  | 'dynamic-action'
  | 'cinematic-drama'
  | 'music-video'
  | 'documentary'
  | 'social-media'
  | 'corporate'
```

---

## Интеграция с существующим кодом

### 1. Обновить TimelineWorkspaceTabs

```typescript
// src/features/timeline/components/timeline-workspace-tabs.tsx

export type WorkspaceView = "timeline" | "audio-mixer" | "analysis" | "script" // + script

export function TimelineWorkspaceTabs({ activeView, onViewChange }: TimelineWorkspaceTabsProps) {
  return (
    <div className="flex h-10 items-center border-b bg-background px-1">
      <div className="flex gap-1">
        {/* Analysis */}
        <Button variant={activeView === "analysis" ? "secondary" : "ghost"} ...>
          <BarChart3 /> Analysis
        </Button>

        {/* Script - НОВОЕ */}
        <Button variant={activeView === "script" ? "secondary" : "ghost"} ...>
          <Clapperboard /> Script
        </Button>

        {/* Timeline */}
        <Button variant={activeView === "timeline" ? "secondary" : "ghost"} ...>
          <Layers /> Timeline
        </Button>

        {/* Audio Mixer */}
        <Button variant={activeView === "audio-mixer" ? "secondary" : "ghost"} ...>
          <Sliders /> Audio Mixer
        </Button>
      </div>
    </div>
  )
}
```

### 2. Обновить Timeline

```typescript
// src/features/timeline/components/timeline.tsx

import { ScriptView } from "./script-view"

export function Timeline({ className, style }: TimelineProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>("analysis")

  return (
    <div className="flex h-full flex-col">
      <TimelineWorkspaceTabs activeView={activeView} onViewChange={setActiveView} />

      {/* Render active view */}
      {activeView === "analysis" && <AnalysisView />}
      {activeView === "script" && <ScriptView />}  {/* НОВОЕ */}
      {activeView === "timeline" && <VirtualizedTimelineContent />}
      {activeView === "audio-mixer" && <AudioMixerView />}
    </div>
  )
}
```

### 3. Переиспользование данных AI Director

```typescript
// src/features/timeline/components/script-view/fragment-library/use-fragment-library.ts

import { useTimelineAnalysis } from "@/features/timeline/hooks/state/use-timeline-analysis"

export function useFragmentLibrary() {
  // Получаем результаты анализа из AI Director
  const { files, getFileById } = useTimelineAnalysis()

  // Конвертируем в фрагменты для библиотеки
  const fragments = useMemo(() => {
    return files
      .filter(f => f.status === 'completed' && f.result)
      .flatMap(file => {
        const analysis = file.result
        // Конвертируем сцены из анализа в фрагменты
        return analysis.scenes?.map(scene => ({
          id: `${file.id}-scene-${scene.id}`,
          fileId: file.id,
          startTime: scene.startTime,
          endTime: scene.endTime,
          duration: scene.duration,
          thumbnail: scene.thumbnail,
          qualityScore: scene.quality,
          tags: scene.tags,
          emotions: scene.emotions,
          objects: scene.objects,
        })) || []
      })
  }, [files])

  return { fragments }
}
```

---

## План реализации

### Фаза 1: UI структура (2 дня)
- [ ] Создать `ScriptView` с 3-колоночным layout (ResizablePanelGroup)
- [ ] Добавить вкладку "Script" в `TimelineWorkspaceTabs`
- [ ] Обновить `Timeline.tsx` для рендера `ScriptView`
- [ ] Создать базовые типы в `script.ts`

### Фаза 2: Левая панель - Библиотека (1 день)
- [ ] `FragmentLibrary` - список фрагментов
- [ ] `FragmentCard` - карточка с превью
- [ ] `FragmentFilters` - фильтры
- [ ] `useFragmentLibrary` - интеграция с AI Director
- [ ] Drag source для перетаскивания

### Фаза 3: Центральная панель - Раскадровка (2 дня)
- [ ] `StoryboardEditor` - редактор с drag & drop
- [ ] `SceneCard` - карточка сцены в плане
- [ ] `SceneEditor` - inline редактор (trim, notes, transitions)
- [ ] `TransitionSelector` - выбор переходов
- [ ] `useStoryboard` - state management (возможно XState)
- [ ] Сохранение/загрузка планов

### Фаза 4: Правая панель - Настройки (1 день)
- [ ] `PlanSettings` - настройки плана
- [ ] `AIAssistant` - кнопки AI генерации
- [ ] `PlanStats` - статистика плана
- [ ] `ApplyControls` - применение к Timeline
- [ ] `usePlanGenerator` - AI генерация через Montage Planner backend

### Фаза 5: Применение к Timeline (1 день)
- [ ] Конвертация `ScriptPlan` → Timeline clips
- [ ] Создание клипов на соответствующих треках
- [ ] Применение переходов
- [ ] Применение музыки/звука
- [ ] Уведомление о завершении

### Фаза 6: Тестирование и доработка (1 день)
- [ ] Unit тесты для компонентов
- [ ] Integration тесты для workflow
- [ ] E2E тест: Analysis → Script → Timeline
- [ ] Оптимизация производительности
- [ ] Документация

**Итого: ~7 дней**

---

## Интеграция с Montage Planner backend

Script панель может переиспользовать существующий Montage Planner backend:

```typescript
// src/features/timeline/components/script-view/plan-settings/use-plan-generator.ts

import { generateMontagePlan } from "@/domains/ai-services/tauri/montage-planner-commands"

export function usePlanGenerator() {
  const generatePlan = async (settings: PlanSettings) => {
    // Получаем анализ из AI Director
    const analysis = getLatestAnalysis()

    // Вызываем Rust backend для генерации плана
    const plan = await generateMontagePlan({
      scenes: analysis.scenes,
      moments: analysis.moments,
      audio: analysis.audio,
      settings: {
        style: settings.style,
        target_duration: settings.targetDuration,
        prioritize_quality: settings.prioritizeQuality,
        sync_with_audio: settings.syncWithMusic,
      }
    })

    // Конвертируем в ScriptPlan
    return convertToScriptPlan(plan)
  }

  return { generatePlan }
}
```

---

## Преимущества

### Для пользователя
1. ✅ **Визуальное планирование** - видно план до применения
2. ✅ **Быстрая итерация** - можно экспериментировать без изменения Timeline
3. ✅ **AI помощь** - автогенерация планов на основе анализа
4. ✅ **Гибкость** - ручное редактирование или AI
5. ✅ **Повторное использование** - сохранение и загрузка планов

### Для разработки
1. ✅ **Переиспользование** - данные из AI Director, backend из Montage Planner
2. ✅ **Модульность** - отдельная вкладка, не влияет на Timeline
3. ✅ **Расширяемость** - легко добавлять новые функции
4. ✅ **Тестируемость** - изолированные компоненты

---

## Альтернативные варианты названия

1. **Script** - сценарий (текущий выбор)
2. **Storyboard** - раскадровка
3. **Plan** - план монтажа
4. **Sequence** - последовательность
5. **Blueprint** - чертёж

**Рекомендация:** "Script" или "Storyboard" (более киношные термины)

---

## Вопросы для обсуждения

1. ✅ Какое название лучше: Script, Storyboard или Plan?
2. Какой режим отображения по умолчанию: Cards или Timeline?
3. Сколько стилей монтажа поддерживать изначально?
4. Нужна ли возможность экспорта плана в JSON/PDF?
5. Показывать ли preview видео при наведении на фрагмент?

---

## Зависимости

### Требуются до начала работы:
- ✅ AI Director с анализом работает
- ✅ Montage Planner backend функционирует
- ✅ Timeline может принимать clips программно

### Опциональные зависимости:
- Интеграция с AI Chat для промтов (из montage-planner-integration-concept.md)
- Сохранение планов в project файлы

---

## Связанные документы

- `docs/08_tasks/planned/montage-planner-integration-concept.md` - AI Chat интеграция
- `docs/08_tasks/planned/montage-planner-refactoring.md` - Рефакторинг типов
- `docs/03_architecture/ai-director-architecture.md` - Архитектура AI Director

---

**Автор:** Claude Sonnet 4.5
**Дата:** 2025-12-31
