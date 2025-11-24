# 🔗 AI Analysis Integration Plan - Интеграция с существующей архитектурой

## Обзор интеграции

Этот план описывает как интегрировать новую систему AI Analysis & Collaborative Editing с существующей архитектурой Timeline Studio, максимально используя уже разработанные компоненты.

## 🏗️ Архитектурная интеграция

### Существующие фундаменты (используем как есть)

#### ✅ Person Recognition System
**Уже есть полная система:**
- 🗄️ SQLite база персон (`person_database.rs`)
- 🧠 YOLO v11 + FaceNet модели
- 🎯 Детекция лиц, эмоций, кластеризация
- 🖥️ UI компоненты (`/src/features/person-identification/`)

**Что добавляем:**
- Расширяем схему БД для временных меток появлений
- Добавляем связи персон с проектами анализа
- Интегрируем с collaborative editing

#### ✅ Smart Montage Planner
**Уже есть:**
- 🎬 Audio/Video анализ (`/src-tauri/src/montage_planner/`)
- 🎵 Beat detection, tempo, качество
- 🎭 Emotion detection
- 📊 Quality analyzer
- 🔍 Moment detector

**Что добавляем:**
- Персистентное хранение результатов
- Связывание с персонами и объектами
- Timeline интеграция результатов

#### ✅ AI Services Architecture
**Уже есть:**
- 🤖 AI Orchestrator (`ai-orchestrator-machine.ts`)
- 🧠 Multiple AI providers (Claude, OpenAI, Ollama)
- 🛠️ 97 AI tools для timeline operations
- 📡 Event-driven координация

**Что добавляем:**
- Context-aware AI chat
- Analysis results formatting для AI
- Collaborative editing coordination

## 📋 Детальный план интеграции

### Phase 1: Database Schema Extension (1-2 недели)

#### 1.1 Расширение Person Database
```sql
-- Добавляем к существующей схеме person_database.rs

-- Проекты анализа
CREATE TABLE analysis_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL, -- 'analyzing', 'completed', 'error'
    config TEXT NOT NULL -- JSON конфигурация
);

-- Связь персон с проектами
CREATE TABLE project_persons (
    project_id TEXT REFERENCES analysis_projects(id),
    person_id TEXT REFERENCES persons(id),
    total_screen_time REAL,
    importance TEXT, -- 'main', 'secondary', 'background'
    first_appearance REAL,
    last_appearance REAL,
    PRIMARY KEY (project_id, person_id)
);

-- Временные появления персон (расширяем существующую person_appearances)
ALTER TABLE person_appearances ADD COLUMN project_id TEXT REFERENCES analysis_projects(id);
ALTER TABLE person_appearances ADD COLUMN scene_id TEXT;
ALTER TABLE person_appearances ADD COLUMN emotion_timeline TEXT; -- JSON
ALTER TABLE person_appearances ADD COLUMN quality_score REAL;
```

#### 1.2 Новые таблицы анализа
```sql
-- Сцены
CREATE TABLE analysis_scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES analysis_projects(id),
    file_path TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    duration REAL NOT NULL,
    scene_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    quality_score REAL,
    motion_level REAL,
    brightness REAL,
    dominant_colors TEXT, -- JSON array
    description TEXT,
    tags TEXT -- JSON array
);

-- Ключевые моменты
CREATE TABLE key_moments (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES analysis_projects(id),
    scene_id TEXT REFERENCES analysis_scenes(id),
    timestamp REAL NOT NULL,
    duration REAL NOT NULL,
    moment_type TEXT NOT NULL,
    score REAL NOT NULL,
    emotion_score REAL,
    motion_score REAL,
    audio_score REAL,
    visual_score REAL,
    description TEXT,
    involved_persons TEXT, -- JSON array of person IDs
    tags TEXT -- JSON array
);

-- Планы монтажа (для collaborative editing)
CREATE TABLE montage_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES analysis_projects(id),
    name TEXT NOT NULL,
    total_duration REAL,
    style TEXT,
    created_by TEXT, -- 'ai', 'user', 'collaborative'
    created_at TEXT,
    version INTEGER DEFAULT 1,
    ai_reasoning TEXT,
    confidence REAL,
    plan_data TEXT NOT NULL -- JSON структура плана
);
```

**Файлы для создания:**
- `src-tauri/src/analysis/database/schema.rs` 
- `src-tauri/src/analysis/database/migrations.rs`
- `src-tauri/src/analysis/models/` (расширяем существующие)

### Phase 2: Analysis Engine Integration (2-3 недели)

#### 2.1 Интеграция с существующим Montage Planner
```rust
// src-tauri/src/analysis/services/enhanced_analyzer.rs
use crate::montage_planner::services::{
    audio_analyzer::AudioAnalyzer,
    video_processor::VideoProcessor,
    emotion_detector::EmotionDetector,
    quality_analyzer::QualityAnalyzer,
    moment_detector::MomentDetector
};
use crate::recognition::person_database::PersonDatabase;

pub struct EnhancedAnalyzer {
    // Используем существующие компоненты
    audio_analyzer: AudioAnalyzer,
    video_processor: VideoProcessor,
    emotion_detector: EmotionDetector,
    quality_analyzer: QualityAnalyzer,
    moment_detector: MomentDetector,
    person_db: PersonDatabase,
    
    // Новые компоненты
    scene_detector: SceneDetector,
    project_db: ProjectDatabase,
}

impl EnhancedAnalyzer {
    pub async fn analyze_project(&self, files: Vec<MediaFile>) -> Result<AnalysisProject> {
        let project = self.create_project().await?;
        
        for file in files {
            // Используем существующий анализ
            let video_analysis = self.video_processor.analyze(&file).await?;
            let audio_analysis = self.audio_analyzer.analyze(&file).await?;
            let emotions = self.emotion_detector.detect(&file).await?;
            let quality = self.quality_analyzer.analyze(&file).await?;
            let moments = self.moment_detector.find_moments(&file).await?;
            
            // Интегрируем с персонами
            let persons = self.person_db.find_persons_in_file(&file).await?;
            
            // Новая функциональность - детекция сцен
            let scenes = self.scene_detector.detect_scenes(&file, &video_analysis).await?;
            
            // Сохраняем все в БД
            self.save_analysis_results(project.id, file, video_analysis, 
                                     audio_analysis, emotions, quality, 
                                     moments, persons, scenes).await?;
        }
        
        Ok(project)
    }
}
```

#### 2.2 Расширение Tauri Commands
```rust
// src-tauri/src/commands/analysis_commands.rs
use crate::analysis::services::enhanced_analyzer::EnhancedAnalyzer;

#[tauri::command]
pub async fn start_project_analysis(
    files: Vec<String>,
    config: AnalysisConfig,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let analyzer = EnhancedAnalyzer::new(&state).await?;
    let project = analyzer.analyze_project(files, config).await?;
    Ok(project.id)
}

#[tauri::command]
pub async fn get_analysis_progress(
    project_id: String,
    state: tauri::State<'_, AppState>
) -> Result<AnalysisProgress, String> {
    // Интегрируется с существующей EventBus системой
    let progress = state.get_analysis_progress(&project_id).await?;
    Ok(progress)
}

#[tauri::command]
pub async fn get_project_summary(
    project_id: String,
    state: tauri::State<'_, AppState>
) -> Result<ProjectSummary, String> {
    let db = ProjectDatabase::new(&state).await?;
    let summary = db.get_project_summary(&project_id).await?;
    Ok(summary)
}

#[tauri::command]
pub async fn search_analysis_data(
    project_id: String,
    query: AnalysisQuery,
    state: tauri::State<'_, AppState>
) -> Result<SearchResults, String> {
    let db = ProjectDatabase::new(&state).await?;
    let results = db.search(&project_id, &query).await?;
    Ok(results)
}
```

### Phase 3: UI Integration (2-3 недели)

#### 3.1 Расширение AI Services Domain
```typescript
// src/domains/ai-services/services/analysis-context-service.ts
import { PersonDatabaseService } from '@/features/person-identification/services/person-database-service'
import { MontagePlannerService } from './montage-planning/montage-planner-service'

export class AnalysisContextService {
  constructor(
    private personDb: PersonDatabaseService,
    private montagePlanner: MontagePlannerService,
    private projectDb: ProjectDatabaseService // новый
  ) {}

  async loadProjectContext(projectId: string): Promise<AIChatContext> {
    // Используем существующие сервисы
    const persons = await this.personDb.getProjectPersons(projectId)
    const montageData = await this.montagePlanner.getAnalysisResults(projectId)
    
    // Новые данные
    const scenes = await this.projectDb.getScenes(projectId)
    const moments = await this.projectDb.getKeyMoments(projectId)
    
    return {
      project: await this.projectDb.getProject(projectId),
      persons: persons.map(p => this.formatPersonForAI(p)),
      scenes: scenes.map(s => this.formatSceneForAI(s)),
      moments: moments.map(m => this.formatMomentForAI(m)),
      montageData: this.formatMontageDataForAI(montageData)
    }
  }

  private formatPersonForAI(person: PersonProfile): string {
    return `Персона "${person.name || person.alias || 'Неизвестный'}":
- Время на экране: ${person.totalScreenTime}с
- Появления: ${person.totalAppearances} раз
- Основные эмоции: ${person.dominantEmotions.join(', ')}
- Важность: ${person.character}
- Файлы: ${person.files.length} видео`
  }
}
```

#### 3.2 Enhanced AI Chat Integration
```typescript
// src/features/ai-chat/services/analysis-aware-chat-provider.tsx
import { AnalysisContextService } from '@/domains/ai-services/services/analysis-context-service'

export const AnalysisAwareChatProvider = ({ children }: { children: ReactNode }) => {
  const [analysisContext, setAnalysisContext] = useState<AIChatContext | null>(null)
  const contextService = useMemo(() => new AnalysisContextService(), [])

  const sendMessageWithContext = async (message: string) => {
    if (!analysisContext) {
      throw new Error('Сначала загрузите проект для анализа')
    }

    // Формируем расширенный prompt с контекстом
    const contextPrompt = `
Контекст проекта: ${analysisContext.project.name}
Персоны в проекте: ${analysisContext.persons.length}
${analysisContext.persons.slice(0, 5).join('\n')}

Ключевые моменты:
${analysisContext.moments.slice(0, 10).map(m => 
  `- ${m.timestamp}с: ${m.description} (оценка: ${m.score})`
).join('\n')}

Пользователь спрашивает: ${message}
`

    // Используем существующую AI систему
    return await aiProvider.sendMessage(contextPrompt)
  }

  return (
    <AIChatContext.Provider value={{
      analysisContext,
      loadProject: async (projectId: string) => {
        const context = await contextService.loadProjectContext(projectId)
        setAnalysisContext(context)
      },
      sendMessage: sendMessageWithContext
    }}>
      {children}
    </AIChatContext.Provider>
  )
}
```

#### 3.3 Timeline Integration
```typescript
// src/features/timeline/components/analysis-integration/analysis-timeline-layer.tsx
import { usePersonIdentification } from '@/features/person-identification/hooks/use-person-identification'

export const AnalysisTimelineLayer = ({ projectId }: { projectId: string }) => {
  const { persons } = usePersonIdentification() // Используем существующий хук
  const { scenes, moments } = useAnalysisData(projectId) // Новый хук

  return (
    <div className="analysis-timeline-layer">
      {/* Слой персон - используем существующие компоненты */}
      <PersonsLayer persons={persons} />
      
      {/* Новые слои */}
      <ScenesLayer scenes={scenes} />
      <KeyMomentsLayer moments={moments} />
      <QualityLayer scenes={scenes} />
    </div>
  )
}
```

### Phase 4: XState Machines Integration (1-2 недели)

#### 4.1 Analysis Project Machine
```typescript
// src/features/ai-analysis/services/analysis-project-machine.ts
import { setup } from 'xstate'
import { aiOrchestratorMachine } from '@/domains/ai-services/machines/ai-orchestrator-machine'

export const analysisProjectMachine = setup({
  types: {} as {
    context: AnalysisProjectContext
    events: AnalysisProjectEvent
  },
  actors: {
    // Используем существующий AI Orchestrator
    aiOrchestrator: aiOrchestratorMachine,
    
    // Интегрируемся с существующими сервисами
    personAnalysis: fromPromise(async ({ input }: { input: { files: string[] } }) => {
      const personService = new PersonDatabaseService()
      return await personService.analyzeFiles(input.files)
    }),
    
    montageAnalysis: fromPromise(async ({ input }: { input: { files: string[] } }) => {
      const montageService = new MontagePlannerService()
      return await montageService.analyzeFiles(input.files)
    })
  }
}).createMachine({
  id: 'analysisProject',
  initial: 'idle',
  context: {
    projectId: null,
    files: [],
    progress: 0,
    results: null
  },
  states: {
    idle: {
      on: {
        START_ANALYSIS: {
          target: 'analyzing',
          actions: 'setFiles'
        }
      }
    },
    analyzing: {
      type: 'parallel',
      states: {
        personAnalysis: {
          invoke: {
            src: 'personAnalysis',
            input: ({ context }) => ({ files: context.files }),
            onDone: {
              actions: 'setPersonResults'
            }
          }
        },
        montageAnalysis: {
          invoke: {
            src: 'montageAnalysis',
            input: ({ context }) => ({ files: context.files }),
            onDone: {
              actions: 'setMontageResults'
            }
          }
        },
        aiOrchestration: {
          invoke: {
            src: 'aiOrchestrator',
            input: ({ context }) => ({ 
              task: 'comprehensive_analysis',
              files: context.files 
            })
          }
        }
      },
      onDone: {
        target: 'completed',
        actions: 'combineResults'
      }
    },
    completed: {
      on: {
        START_COLLABORATIVE_EDITING: {
          target: 'collaborativeEditing'
        }
      }
    },
    collaborativeEditing: {
      // Здесь будет интеграция с collaborative editor
    }
  }
})
```

### Phase 5: Collaborative Editor Integration (2-3 недели)

#### 5.1 Montage Plan Generator
```typescript
// src/domains/ai-services/services/montage-planning/ai-montage-generator.ts
import { MontagePlannerService } from './montage-planner-service'
import { AnalysisContextService } from '../analysis-context-service'

export class AIMontageGenerator {
  constructor(
    private montagePlanner: MontagePlannerService, // Существующий
    private contextService: AnalysisContextService,
    private aiProvider: IAIProvider
  ) {}

  async generateInitialPlan(projectId: string, preferences: UserPreferences): Promise<MontagePlan> {
    // Загружаем контекст анализа
    const context = await this.contextService.loadProjectContext(projectId)
    
    // Используем существующий montage planner для базового анализа
    const baseAnalysis = await this.montagePlanner.generatePlan({
      files: context.project.mediaFiles,
      style: preferences.style,
      duration: preferences.duration
    })

    // Обогащаем AI рассуждениями
    const aiPrompt = this.buildMontagePrompt(context, preferences, baseAnalysis)
    const aiSuggestions = await this.aiProvider.sendMessage(aiPrompt)

    // Комбинируем техническую оптимизацию с AI творчеством
    return this.combinePlans(baseAnalysis, aiSuggestions, context)
  }

  private buildMontagePrompt(context: AIChatContext, preferences: UserPreferences, baseAnalysis: any): string {
    return `
Создай план монтажа для проекта "${context.project.name}".

ДОСТУПНЫЕ МАТЕРИАЛЫ:
${context.scenes.map(s => `Сцена ${s.id}: ${s.startTime}-${s.endTime}с, тип: ${s.type}, качество: ${s.quality}`).join('\n')}

ПЕРСОНЫ:
${context.persons.join('\n')}

КЛЮЧЕВЫЕ МОМЕНТЫ:
${context.moments.map(m => `${m.timestamp}с: ${m.description} (важность: ${m.score})`).join('\n')}

ТЕХНИЧЕСКАЯ РЕКОМЕНДАЦИЯ:
${JSON.stringify(baseAnalysis, null, 2)}

ПОЛЬЗОВАТЕЛЬСКИЕ ПРЕДПОЧТЕНИЯ:
- Стиль: ${preferences.style}
- Длительность: ${preferences.duration}с
- Музыка: ${preferences.includeMusic ? 'да' : 'нет'}
- Фокус на: ${preferences.focusOn.join(', ')}

Создай детальный план монтажа объясняя каждое решение.`
  }
}
```

## 🔄 Миграционная стратегия

### Этап 1: Backwards Compatibility
- Все существующие API остаются работать
- Новые функции добавляются как расширения
- Person identification работает без изменений
- Smart montage planner продолжает работать независимо

### Этап 2: Gradual Enhancement  
- Добавляем новые таблицы БД через миграции
- Расширяем существующие Tauri commands
- Создаем новые React хуки как обертки над существующими
- Интегрируем через event bus

### Этап 3: Full Integration
- Новый Analysis Dashboard использует все существующие компоненты
- AI Chat получает полный контекст
- Collaborative Editor координирует все сервисы
- Timeline показывает объединенные результаты

## 📊 Преимущества такой интеграции

### ✅ Используем существующие наработки:
- **850+ строк** кода person identification
- **Полная ML инфраструктура** с ONNX Runtime
- **97 AI tools** уже готовы к использованию
- **Event-driven архитектура** для координации
- **Professional-grade person database** с SQLite

### ✅ Минимизируем риски:
- Существующий функционал не ломается
- Поэтапное внедрение новых возможностей
- Возможность откатиться на предыдущую версию
- Переиспользование протестированного кода

### ✅ Ускоряем разработку:
- Не нужно переписывать person detection
- UI компоненты уже существуют
- Database schema уже оптимизирована
- XState patterns уже отработаны

## 🚀 Timeline выполнения

**Week 1-2**: Database schema extension + migrations  
**Week 3-4**: Analysis engine integration с existing services  
**Week 5-6**: UI integration через existing components  
**Week 7-8**: XState machines coordination  
**Week 9-12**: Collaborative editor с AI integration  

**Итого: 3 месяца** вместо 6 месяцев с нуля благодаря переиспользованию существующего кода!