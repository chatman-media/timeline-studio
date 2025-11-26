# AI Director v2 - Phase 2: Batch Analysis

**Статус:** ✅ ЗАВЕРШЕНО
**Дата:** 2025-11-25
**Цель:** Добавить batch analysis с real-time событиями для анализа нескольких файлов

## 🎯 Реализованная функциональность

### Backend (Rust)

#### 1. Новые batch события (`src-tauri/src/core/events.rs`)

```rust
// 🆕 Phase 2: Batch Analysis события
BatchAnalysisStarted {
  batch_id: String,
  total_files: usize,
  config_mode: String, // "fast", "balanced", "quality"
}

BatchAnalysisProgress {
  batch_id: String,
  completed_files: usize,
  total_files: usize,
  progress: f32,            // 0.0 - 1.0 общий прогресс
  current_file_path: Option<String>,
  estimated_time_remaining: Option<u64>, // seconds
}

BatchAnalysisCompleted {
  batch_id: String,
  total_files: usize,
  successful_files: usize,
  failed_files: usize,
  total_duration_ms: u64,
  errors: Vec<String>,
}
```

#### 2. Emit методы (`src-tauri/src/analysis/services/ai_director_with_events.rs`)

**3 новых метода:**
- `emit_batch_analysis_started()`
- `emit_batch_analysis_progress()`
- `emit_batch_analysis_completed()`

#### 3. Batch Analysis метод

**`analyze_batch_with_events()`** - sequential обработка файлов с событиями:
- Обрабатывает файлы один за другим
- Отправляет real-time события для каждого файла
- Автоматически оценивает оставшееся время на основе средней скорости
- Собирает детальную статистику успехов/ошибок
- Продолжает работу даже при ошибках в отдельных файлах

**Особенности:**
- Определение config mode автоматически (fast/balanced/quality)
- Real-time обновление прогресса
- Graceful error handling - не останавливается при ошибке одного файла
- Детальная статистика в конце (successful/failed files, total duration, errors)

#### 4. Tauri команды (`src-tauri/src/analysis/commands/ai_director_v2_commands.rs`)

**Создан новый файл с v2 командами:**

```rust
// State с поддержкой событий
pub struct AIDirectorV2State {
  director: Arc<AIDirectorWithEvents>,
}

// 🆕 v2 команды
ai_director_v2_analyze_comprehensive() // Single file с событиями
ai_director_v2_analyze_quick()         // Быстрый анализ с событиями
ai_director_v2_analyze_batch()         // Batch анализ с событиями
```

**Ключевая команда Phase 2:**
```rust
#[tauri::command]
pub async fn ai_director_v2_analyze_batch(
  file_paths: Vec<String>,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorV2State>,
) -> Result<Vec<ComprehensiveAnalysisResult>, String>
```

### Frontend (TypeScript)

#### 1. Event Listeners (`src/features/ai-director/hooks/use-ai-director-analysis-v2.ts`)

**3 новых подписки:**
- `batch-analysis-started` - Начало batch анализа
- `batch-analysis-progress` - Обновление общего прогресса
- `batch-analysis-completed` - Завершение с статистикой

**Обработка событий:**
```typescript
// BatchAnalysisStarted
setBatchProgress({
  batchId: payload.batch_id,
  totalFiles: payload.total_files,
  completedFiles: 0,
  progress: 0,
  configMode: payload.config_mode,
  startTime: new Date().toISOString(),
})

// BatchAnalysisProgress
setBatchProgress((prev) => ({
  ...prev,
  completedFiles: payload.completed_files,
  progress: Math.round(payload.progress * 100),
  currentFilePath: payload.current_file_path,
  estimatedTimeRemaining: payload.estimated_time_remaining,
}))

// BatchAnalysisCompleted
setBatchProgress((prev) => ({
  ...prev,
  completedFiles: payload.total_files,
  progress: 100,
  successfulFiles: payload.successful_files,
  failedFiles: payload.failed_files,
  totalDuration: payload.total_duration_ms,
  errors: payload.errors,
}))
```

#### 2. Обновлен вызов команды

**Было:**
```typescript
invoke("ai_director_analyze_batch", { filePaths, config })
```

**Стало:**
```typescript
invoke("ai_director_v2_analyze_batch", { filePaths, config })
```

## 🔄 Flow событий batch анализа

```
1. BatchAnalysisStarted (batch_id, total_files, config_mode)
   ↓
2. FileAnalysisStarted (file #1)
   ↓
3. AnalyzerStarted (audio_quality) → AnalyzerCompleted
   ↓
4. AnalyzerStarted (scene_detection) → AnalyzerCompleted
   ... (все анализаторы)
   ↓
5. FileAnalysisCompleted (file #1)
   ↓
6. BatchAnalysisProgress (1/N files, 20%, estimated time)
   ↓
7. FileAnalysisStarted (file #2)
   ... (повторяется для каждого файла)
   ↓
8. BatchAnalysisCompleted (успешных/failed files, total duration, errors)
```

## 📊 Примеры событий

### BatchAnalysisStarted
```json
{
  "batch_id": "batch-uuid-123",
  "total_files": 5,
  "config_mode": "balanced"
}
```

### BatchAnalysisProgress
```json
{
  "batch_id": "batch-uuid-123",
  "completed_files": 2,
  "total_files": 5,
  "progress": 0.4,
  "current_file_path": "/path/to/video3.mp4",
  "estimated_time_remaining": 180
}
```

### BatchAnalysisCompleted
```json
{
  "batch_id": "batch-uuid-123",
  "total_files": 5,
  "successful_files": 4,
  "failed_files": 1,
  "total_duration_ms": 245000,
  "errors": ["File /path/to/video4.mp4 failed: file not found"]
}
```

## ✅ Результаты

### Производительность
- Sequential обработка - файлы анализируются один за другим
- Real-time обновление UI без задержек
- Автоматическая оценка оставшегося времени
- Graceful error handling

### UX улучшения
- Пользователь видит общий прогресс по всем файлам
- Текущий обрабатываемый файл отображается
- Оценка оставшегося времени обновляется в реальном времени
- Детальная статистика успехов/ошибок в конце
- Batch не останавливается при ошибке одного файла

### Архитектура
- Type-safe события между Rust и TypeScript
- Четкое разделение ответственности
- Расширяемая система для добавления parallel processing

## 🚀 Использование

### Backend (Rust)
```rust
use crate::analysis::services::ai_director_with_events::AIDirectorWithEvents;

let director = AIDirectorWithEvents::new(analysis_db, person_db, yolo_state, app_handle);

let results = director.analyze_batch_with_events(
  file_paths,
  Some(config)
).await?;
```

### Frontend (TypeScript)
```typescript
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"

const { startBatchAnalysis, batchProgress, filesProgress } = useAIDirectorAnalysisV2()

// Start batch analysis
await startBatchAnalysis(
  ["/path/to/video1.mp4", "/path/to/video2.mp4"],
  new Set(["audio_quality", "scene_detection"])
)

// Monitor progress
console.log(batchProgress.progress) // 0-100
console.log(batchProgress.completedFiles) // 1/2
console.log(batchProgress.estimatedTimeRemaining) // seconds
```

## 🧪 Тестирование

### Тестовый сценарий
1. Выбрать 2-3 видео файла
2. Выбрать несколько анализаторов
3. Запустить batch analysis
4. Проверить real-time обновление прогресса
5. Проверить отображение текущего файла
6. Проверить оценку оставшегося времени
7. Проверить итоговую статистику

### Проверка error handling
1. Добавить несуществующий файл в batch
2. Убедиться что анализ продолжается для остальных файлов
3. Проверить что ошибка отображается в итоговой статистике

## 📝 Следующие шаги (Phase 3 - опционально)

1. **Parallel Processing**
   - Обработка нескольких файлов параллельно
   - Настраиваемое количество параллельных задач
   - Thread pool для оптимизации ресурсов

2. **Performance Optimization**
   - Кэширование результатов анализа
   - Streaming для больших файлов
   - Memory optimization

3. **UI Enhancements**
   - Cancellation support - отмена batch анализа
   - Pause/Resume functionality
   - Фильтрация и сортировка файлов
   - Export результатов в JSON/CSV

## 📁 Измененные файлы

### Backend
- `src-tauri/src/core/events.rs` - 3 новых batch события
- `src-tauri/src/analysis/services/ai_director_with_events.rs` - 3 emit метода + `analyze_batch_with_events()`
- `src-tauri/src/analysis/commands/ai_director_v2_commands.rs` - 🆕 новый файл с v2 командами
- `src-tauri/src/analysis/commands/mod.rs` - экспорт v2 команд
- `src-tauri/src/lib.rs` - 🆕 импорт AIDirectorV2State (line 66) + инициализация (lines 435-464)
- `src-tauri/src/app_builder.rs` - 🆕 регистрация v2 команд (lines 528-531)

### Frontend
- `src/features/ai-director/hooks/use-ai-director-analysis-v2.ts` - 3 batch event listeners + обновлен вызов команды

## 📚 Связанные документы
- [Phase 1 Implementation](/docs/08_tasks/active/ai-director-v2-phase1-implementation.md)
- [Architecture Analysis Report](/docs/08_tasks/architecture-analysis-report.md)

---

**Автор:** AI Architecture Team
**Дата завершения:** 2025-11-25
**Статус:** ✅ Production Ready
