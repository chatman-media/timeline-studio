# AI Director v2 - Phase 3: Parallel Processing

**Статус:** 🟡 В РАБОТЕ
**Приоритет:** Средний
**Зависимости:** Phase 2 завершён ✅
**Начато:** 2025-11-28

## 🎯 Цель Phase 3

Добавить параллельную обработку нескольких файлов одновременно для значительного ускорения batch analysis.

## 📊 Ожидаемый прирост производительности

### Текущая производительность (Phase 2)
- **Sequential processing**: файлы обрабатываются один за другим
- **Время обработки**: N файлов × среднее время на файл
- **Пример**: 3 файла по 60 сек = **180 секунд**

### Целевая производительность (Phase 3)
- **Parallel processing**: несколько файлов одновременно
- **Время обработки**: максимальное время файла × (N / количество потоков)
- **Пример**: 3 файла по 60 сек, 3 потока = **~60 секунд** (3x ускорение)

**Потенциальное ускорение:** 2-4x в зависимости от количества потоков и системы

## 🏗️ Архитектурные изменения

### 1. Batch Configuration

Добавить в `AIDirectorConfig` настройки параллелизма:

```rust
// src-tauri/src/analysis/services/ai_director.rs
pub struct AIDirectorConfig {
  // ... существующие поля

  // 🆕 Phase 3: Parallel processing
  pub max_parallel_files: Option<usize>,  // None = auto (CPU cores)
  pub enable_parallel_processing: bool,    // Default: false (backwards compatible)
}
```

### 2. Thread Pool для обработки

**Файл:** `src-tauri/src/analysis/services/ai_director_with_events.rs`

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;

impl AIDirectorWithEvents {
  /// 🆕 Phase 3: Parallel batch analysis
  pub async fn analyze_batch_parallel_with_events(
    &self,
    file_paths: Vec<String>,
    config_opt: Option<AIDirectorConfig>,
  ) -> Result<Vec<ComprehensiveAnalysisResult>> {
    let config = config_opt.unwrap_or_default();
    let batch_id = Uuid::new_v4().to_string();

    // Определяем количество параллельных задач
    let max_parallel = config.max_parallel_files
      .unwrap_or_else(|| num_cpus::get().min(4));

    // Создаем semaphore для ограничения параллелизма
    let semaphore = Arc::new(Semaphore::new(max_parallel));

    // Emit batch started
    self.emit_batch_analysis_started(&batch_id, file_paths.len(), &config);

    // Создаем задачи для каждого файла
    let tasks: Vec<_> = file_paths
      .into_iter()
      .enumerate()
      .map(|(index, file_path)| {
        let semaphore = semaphore.clone();
        let config = config.clone();
        let batch_id = batch_id.clone();
        let director = self.clone(); // Нужно сделать AIDirectorWithEvents Clone

        tokio::spawn(async move {
          // Ждем свободный слот
          let _permit = semaphore.acquire().await.unwrap();

          // Обрабатываем файл
          let result = director
            .analyze_comprehensive_with_events(&PathBuf::from(&file_path), Some(config))
            .await;

          // Emit progress
          director.emit_batch_analysis_progress(
            &batch_id,
            index + 1,
            file_paths.len(),
            // ... progress calculation
          );

          (index, file_path, result)
        })
      })
      .collect();

    // Ждем завершения всех задач
    let results = futures::future::join_all(tasks).await;

    // Собираем результаты и emit completed
    // ...
  }
}
```

### 3. Прогресс-трекинг для параллельной обработки

**Проблема:** При параллельной обработке файлы завершаются в случайном порядке.

**Решение:** Использовать atomic counter для отслеживания завершенных файлов:

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

let completed_files = Arc::new(AtomicUsize::new(0));

// В каждой задаче после завершения:
let current_completed = completed_files.fetch_add(1, Ordering::SeqCst) + 1;

self.emit_batch_analysis_progress(
  &batch_id,
  current_completed,
  total_files,
  // ...
);
```

### 4. Новая Tauri команда

**Файл:** `src-tauri/src/analysis/commands/ai_director_v2_commands.rs`

```rust
/// 🆕 Phase 3: Parallel batch analysis
#[tauri::command]
#[specta::specta]
pub async fn ai_director_v2_analyze_batch_parallel(
  file_paths: Vec<String>,
  config: Option<AIDirectorConfig>,
  state: State<'_, AIDirectorV2State>,
) -> Result<Vec<ComprehensiveAnalysisResult>, String> {
  log::info!(
    "AI Director v2 parallel batch analysis for {} files",
    file_paths.len()
  );

  if file_paths.is_empty() {
    return Err("No files provided".to_string());
  }

  match state
    .director
    .analyze_batch_parallel_with_events(file_paths, config)
    .await
  {
    Ok(results) => {
      log::info!("Parallel batch analysis completed");
      Ok(results)
    }
    Err(e) => {
      log::error!("Parallel batch analysis failed: {}", e);
      Err(format!("Batch analysis failed: {}", e))
    }
  }
}
```

## 📝 Implementation Checklist

### Backend (Rust)

- [ ] **Step 1:** Добавить `max_parallel_files` и `enable_parallel_processing` в `AIDirectorConfig`
- [ ] **Step 2:** Реализовать `analyze_batch_parallel_with_events()` с tokio tasks
- [ ] **Step 3:** Добавить atomic counter для прогресс-трекинга
- [ ] **Step 4:** Создать команду `ai_director_v2_analyze_batch_parallel`
- [ ] **Step 5:** Зарегистрировать команду в `app_builder.rs`
- [ ] **Step 6:** Добавить тесты для параллельной обработки

### Frontend (TypeScript)

- [ ] **Step 7:** Добавить опцию `enableParallelProcessing` в UI
- [ ] **Step 8:** Обновить `startBatchAnalysis` для поддержки параллелизма
- [ ] **Step 9:** Добавить индикатор параллельных задач в UI
- [ ] **Step 10:** Тестирование с разным количеством файлов

### Документация

- [ ] **Step 11:** Создать Phase 3 implementation docs
- [ ] **Step 12:** Обновить Quick Test Guide
- [ ] **Step 13:** Добавить performance benchmarks

## ⚠️ Considerations

### 1. Resource Management
- **CPU**: Ограничить `max_parallel` на основе доступных ядер
- **Memory**: Каждый файл может требовать значительной памяти
- **Disk I/O**: SSD vs HDD влияет на эффективность параллелизма

**Рекомендация:** По умолчанию `min(CPU cores, 4)` параллельных задач

### 2. Order of Results
- Параллельная обработка не гарантирует порядок результатов
- Нужно сохранять original index для восстановления порядка

### 3. Error Handling
- Ошибка в одной задаче не должна останавливать остальные
- Нужно собирать все ошибки и возвращать частичные результаты

### 4. Progress Updates
- При параллельной обработке прогресс может "прыгать"
- UI должен корректно отображать асинхронные обновления

## 🧪 Testing Strategy

### Performance Benchmarks
```rust
// Сравнение sequential vs parallel
let files = vec!["video1.mp4", "video2.mp4", "video3.mp4", "video4.mp4"];

// Sequential (Phase 2)
let start = Instant::now();
let seq_results = director.analyze_batch_with_events(files.clone(), None).await?;
let seq_duration = start.elapsed();

// Parallel (Phase 3)
let start = Instant::now();
let par_results = director.analyze_batch_parallel_with_events(files, None).await?;
let par_duration = start.elapsed();

println!("Sequential: {:?}", seq_duration);
println!("Parallel: {:?}", par_duration);
println!("Speedup: {:.2}x", seq_duration.as_secs_f64() / par_duration.as_secs_f64());
```

### Edge Cases
1. **Single file:** Параллелизм не должен добавлять overhead
2. **Many files (100+):** Semaphore должен ограничивать параллелизм
3. **Mixed file sizes:** Большие файлы не должны блокировать маленькие
4. **System under load:** Адаптивное снижение параллелизма

## 📊 Success Metrics

- [ ] **Speedup:** 2x+ ускорение для 4+ файлов
- [ ] **Stability:** Нет memory leaks при долгой работе
- [ ] **Compatibility:** Sequential режим работает как раньше
- [ ] **UX:** Прогресс обновляется плавно без "прыжков"

## 🚀 Alternative: Smart Scheduling

Вместо простого параллелизма можно реализовать умное планирование:

```rust
// Сортировка файлов по размеру (большие первыми)
files.sort_by_key(|f| std::fs::metadata(f).unwrap().len());
files.reverse();

// Начинаем с больших файлов, чтобы избежать ожидания в конце
```

## 🔗 Dependencies

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
futures = "0.3"
num_cpus = "1.16"  # 🆕 Для определения CPU cores
```

## 💡 Future Enhancements (Phase 4+)

- **Adaptive parallelism:** Динамическая подстройка на основе загрузки системы
- **Priority queue:** Приоритизация важных файлов
- **Streaming results:** Отдача результатов по мере готовности
- **Distributed processing:** Обработка на нескольких машинах

---

**Создано:** 2025-11-25
**Автор:** AI Architecture Team
**Статус:** 📋 Planning
**Приоритет:** Low (Optional Performance Enhancement)
