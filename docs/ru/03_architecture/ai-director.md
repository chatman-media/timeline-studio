# 🎬 AI Director Mode — Автоматический монтаж с Unified Audio Analysis

## Концепция

AI Director Mode — это революционный режим Timeline Studio, который использует unified audio analysis system для создания автоматических черновиков монтажа из исходного материала. Система анализирует материал с максимальной f64 precision и генерирует профессиональные монтажные решения.

## 🏗️ Архитектура

### Агенты системы

1. **Content Analysis Agent**
   - Unified Audio Analysis с f64 precision
   - Whisper integration для транскрипции речи
   - Видео анализ через ONNX + FFmpeg frame integration
   - Emotion recognition и scene detection

2. **Montage Planning Agent**
   - Использует результаты unified audio analysis
   - Интеграция с Montage Planner
   - Создание монтажных планов на основе аудио данных
   - Ритм-анализ с f64 точностью

3. **Timeline Assembly Agent**
   - Применение планов к timeline
   - Автоматическая синхронизация клипов
   - Создание transitions и effects
   - Экспорт готового проекта

### Workflow Pipeline

```
[Исходный материал]
   │
   ▼
[Unified Audio Analysis]
   │ f64 precision анализ
   │ Whisper транскрипция
   │ FFmpeg + ONNX интеграция
   ▼
[Content Intelligence]
   │ Scene detection
   │ Emotion analysis
   │ Character tracking
   ▼
[Montage Planning]
   │ Rhythmic analysis
   │ Story structure
   │ Best moments detection
   ▼
[Timeline Assembly]
   │ Automatic editing
   │ Transitions & effects
   │ Audio synchronization
   ▼
[Preview & Refinement]
   │ User feedback loop
   │ Alternative variants
   │ Manual adjustments
   ▼
[Final Export]
```

## 🎯 Возможности

### Автоматический анализ

**Unified Audio Analysis:**
- f64 precision обработка для максимальной точности
- Comprehensive error handling для стабильности
- Whisper integration для качественной транскрипции
- Performance modes (Fast/Balanced/Quality)

**Видео анализ:**
- YOLO v11 object detection
- Face recognition и emotion analysis
- Scene change detection
- Motion analysis

**Интеллектуальное планирование:**
- Story structure analysis
- Best moments detection с scoring
- Rhythmic montage planning
- Platform-specific optimization

### Автоматический монтаж

**Timeline Generation:**
- Автоматическая сборка клипов
- Intelligent cut points на основе audio analysis
- Transitions selection по контексту
- Music synchronization

**Audio Processing:**
- Unified audio system integration
- Automatic level adjustment
- Background noise reduction
- Voice enhancement

**Visual Enhancement:**
- Color grading suggestions
- Automatic stabilization
- Text overlay generation
- Logo placement

## 🔧 Конфигурация

### Workflow Templates

Система поддерживает готовые шаблоны для различных типов контента:

#### TikTok Auto-Cut
```json
{
  "workflow_id": "tiktok_autocut",
  "target_duration": 60,
  "aspect_ratio": "9:16",
  "audio_analysis": {
    "precision": "f64",
    "whisper_enabled": true,
    "performance_mode": "balanced"
  },
  "montage_rules": {
    "hook_duration": 3,
    "max_scene_length": 12,
    "rhythm_sync": true
  }
}
```

#### Highlight Reel
```json
{
  "workflow_id": "highlight_reel",
  "target_duration": 300,
  "aspect_ratio": "16:9",
  "audio_analysis": {
    "precision": "f64",
    "emotion_detection": true,
    "moment_scoring": true
  },
  "selection_criteria": {
    "emotion_threshold": 0.7,
    "action_threshold": 0.8,
    "dialogue_importance": 0.6
  }
}
```

#### Documentary Rough Cut
```json
{
  "workflow_id": "documentary_roughcut",
  "target_duration": "variable",
  "audio_analysis": {
    "precision": "f64",
    "whisper_enabled": true,
    "speaker_separation": true
  },
  "story_structure": {
    "acts": 3,
    "narrative_flow": true,
    "interview_priority": true
  }
}
```

## 🎨 UI компоненты

### Director Dashboard
- Real-time progress monitoring
- Agent status indicators
- Performance metrics
- Error handling display

### Storyboard View
- Visual scene breakdown
- Emotion timeline
- Character appearance tracking
- Audio waveform overlay

### Timeline Preview
- Generated rough cut preview
- Interactive editing capabilities
- Alternative suggestions
- Manual override controls

### Feedback Loop
- Accept/Reject decisions
- Alternative generation
- Custom parameter adjustment
- Export options

## 🚀 Интеграция с codebase

### Unified Audio Analysis Integration

```rust
// Использование unified audio system в AI Director
use crate::analysis::services::UnifiedAudioAnalyzer;
use crate::analysis::types::{AudioFloat, UnifiedAudioConfig};

pub struct AIDirectorEngine {
    audio_analyzer: UnifiedAudioAnalyzer,
    // ...
}

impl AIDirectorEngine {
    pub async fn analyze_content(&self, file_path: &str) -> Result<ContentAnalysis> {
        // Используем f64 precision для максимальной точности
        let config = UnifiedAudioConfig {
            performance_mode: PerformanceMode::Quality,
            enable_whisper: true,
            enable_montage_integration: true,
        };
        
        let audio_analysis = self.audio_analyzer
            .analyze_unified(file_path, Some(config))
            .await?;
            
        // Интеграция с видео анализом
        let video_analysis = self.analyze_video(file_path).await?;
        
        Ok(ContentAnalysis {
            audio: audio_analysis,
            video: video_analysis,
            unified_metrics: self.calculate_unified_metrics(&audio_analysis, &video_analysis),
        })
    }
}
```

### Tauri Commands

```rust
#[tauri::command]
pub async fn ai_director_start_analysis(
    file_path: String,
    workflow_template: String,
) -> Result<String> {
    // Запуск AI Director анализа с unified audio system
}

#[tauri::command]
pub async fn ai_director_get_progress() -> Result<String> {
    // Получение прогресса анализа
}

#[tauri::command]
pub async fn ai_director_generate_timeline(
    analysis_id: String,
    user_preferences: String,
) -> Result<String> {
    // Генерация timeline на основе анализа
}
```

### Frontend Integration

```typescript
// React компонент для AI Director Mode
export const AIDirectorPanel = () => {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [generatedTimeline, setGeneratedTimeline] = useState(null);
  
  const startAIDirector = async (files: File[], template: WorkflowTemplate) => {
    // Запуск AI Director с unified audio analysis
    await invoke('ai_director_start_analysis', {
      filePath: files[0].path,
      workflowTemplate: JSON.stringify(template)
    });
  };
  
  return (
    <div className="ai-director-panel">
      <WorkflowSelector onSelect={startAIDirector} />
      <ProgressMonitor progress={analysisProgress} />
      <StoryboardView timeline={generatedTimeline} />
      <TimelinePreview />
      <FeedbackControls />
    </div>
  );
};
```

## 📈 Roadmap

### Phase 1: Core Functionality
- ✅ Unified Audio Analysis integration
- ✅ Basic workflow templates
- ✅ Timeline generation
- ✅ Preview system

### Phase 2: Advanced Features
- 🔄 Visual node-graph editor
- 🔄 Custom workflow creation
- 🔄 Multiple alternative generations
- 🔄 Real-time collaboration

### Phase 3: AI Enhancement
- 📋 Style transfer learning
- 📋 Audience prediction
- 📋 Automatic A/B testing
- 📋 Performance optimization

---

AI Director Mode представляет собой revolutionary approach к видеомонтажу, где unified audio analysis system обеспечивает максимальную точность и качество автоматического анализа, а интеллектуальные алгоритмы создают профессиональные монтажные решения.