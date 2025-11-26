# AI Director v2 - Quick Test Guide

**Цель:** Быстрая проверка работоспособности Phase 1 и Phase 2

## ✅ Pre-flight Check

### 1. Проверка компиляции
```bash
cd src-tauri
cargo check
```

**Ожидаемый результат:** ✅ Компиляция успешна (допустимо 1 warning о `emit_analyzer_progress`)

### 2. Проверка регистрации команд
```bash
grep -r "ai_director_v2" src-tauri/src/app_builder.rs
```

**Ожидаемый результат:** Должны быть найдены 3 команды:
- `ai_director_v2_analyze_comprehensive`
- `ai_director_v2_analyze_quick`
- `ai_director_v2_analyze_batch`

### 3. Проверка инициализации State
```bash
grep -A 5 "AIDirectorV2State::new" src-tauri/src/lib.rs
```

**Ожидаемый результат:** Код инициализации с зависимостями (analysis_db, person_db, yolo_state)

## 🧪 Phase 1: Single File Analysis

### Test 1: Quick Analysis
```typescript
// В консоли браузера (DevTools)
const { invoke } = window.__TAURI__.core;

// Слушаем события
const unlisten = await window.__TAURI__.event.listen('analysis-started', (event) => {
  console.log('Analysis Started:', event.payload);
});

const unlisten2 = await window.__TAURI__.event.listen('analysis-progress', (event) => {
  console.log('Progress:', event.payload);
});

const unlisten3 = await window.__TAURI__.event.listen('analysis-completed', (event) => {
  console.log('Analysis Completed:', event.payload);
});

// Запускаем quick анализ
const result = await invoke('ai_director_v2_analyze_quick', {
  videoPath: '/path/to/test/video.mp4'
});

console.log('Result:', result);

// Отписываемся от событий
unlisten();
unlisten2();
unlisten3();
```

**Ожидаемый результат:**
- События `analysis-started`, `analysis-progress`, `analysis-completed` приходят в консоль
- Progress показывает стадии: initialization → video → completion
- Итоговый result содержит `ComprehensiveAnalysisResult`

### Test 2: Comprehensive Analysis
```typescript
const result = await invoke('ai_director_v2_analyze_comprehensive', {
  videoPath: '/path/to/test/video.mp4',
  config: {
    enable_audio_analysis: true,
    enable_video_analysis: true,
    enable_scene_detection: true
  }
});
```

**Ожидаемый результат:**
- События для всех включенных анализаторов
- Progress обновляется для каждой стадии
- Детальный результат анализа

## 🧪 Phase 2: Batch Analysis

### Test 3: Batch Analysis с событиями
```typescript
// Слушаем batch события
const batchUnlisten1 = await window.__TAURI__.event.listen('batch-analysis-started', (event) => {
  console.log('Batch Started:', event.payload);
});

const batchUnlisten2 = await window.__TAURI__.event.listen('batch-analysis-progress', (event) => {
  console.log('Batch Progress:', event.payload.progress * 100 + '%');
  console.log('Current file:', event.payload.current_file_path);
  console.log('ETA:', event.payload.estimated_time_remaining, 'seconds');
});

const batchUnlisten3 = await window.__TAURI__.event.listen('batch-analysis-completed', (event) => {
  console.log('Batch Completed:', event.payload);
  console.log('Success:', event.payload.successful_files);
  console.log('Failed:', event.payload.failed_files);
});

// Запускаем batch анализ
const results = await invoke('ai_director_v2_analyze_batch', {
  filePaths: [
    '/path/to/video1.mp4',
    '/path/to/video2.mp4',
    '/path/to/video3.mp4'
  ],
  config: {
    enable_audio_analysis: true,
    enable_video_analysis: true
  }
});

console.log('Batch Results:', results);

// Отписываемся
batchUnlisten1();
batchUnlisten2();
batchUnlisten3();
```

**Ожидаемый результат:**
- `batch-analysis-started` - показывает total_files и config_mode
- `batch-analysis-progress` - обновляется для каждого обработанного файла
  - progress: 0.33, 0.66, 1.0 (для 3 файлов)
  - current_file_path: путь к текущему файлу
  - estimated_time_remaining: оценка в секундах
- `batch-analysis-completed` - финальная статистика
  - successful_files: количество успешно обработанных
  - failed_files: количество ошибок
  - total_duration_ms: общее время
  - errors: массив ошибок (если были)
- results: массив `ComprehensiveAnalysisResult` для каждого файла

## 🧪 React Hook Test

### Test 4: Использование React Hook
```typescript
import { useAIDirectorAnalysisV2 } from '@/features/ai-director/hooks/use-ai-director-analysis-v2'

function TestComponent() {
  const {
    startBatchAnalysis,
    batchProgress,
    filesProgress
  } = useAIDirectorAnalysisV2();

  const handleBatchAnalysis = async () => {
    await startBatchAnalysis(
      ['/path/to/video1.mp4', '/path/to/video2.mp4'],
      new Set(['audio_quality', 'scene_detection'])
    );
  };

  return (
    <div>
      <button onClick={handleBatchAnalysis}>Start Batch Analysis</button>

      {batchProgress && (
        <div>
          <p>Progress: {batchProgress.progress}%</p>
          <p>Files: {batchProgress.completedFiles}/{batchProgress.totalFiles}</p>
          <p>Current: {batchProgress.currentFilePath}</p>
          <p>ETA: {batchProgress.estimatedTimeRemaining}s</p>
        </div>
      )}

      {Object.entries(filesProgress).map(([path, progress]) => (
        <div key={path}>
          <p>{path}: {progress.currentStage} - {progress.progress}%</p>
        </div>
      ))}
    </div>
  );
}
```

**Ожидаемый результат:**
- Batch progress отображается в реальном времени
- Files progress показывает детали для каждого файла
- UI обновляется без задержек

## 🐛 Error Handling Test

### Test 5: Graceful Error Handling
```typescript
// Тест с несуществующим файлом
const results = await invoke('ai_director_v2_analyze_batch', {
  filePaths: [
    '/path/to/existing-video.mp4',
    '/path/to/non-existent-video.mp4',  // ❌ Не существует
    '/path/to/another-video.mp4'
  ]
});
```

**Ожидаемый результат:**
- Batch не останавливается при ошибке одного файла
- `batch-analysis-completed` показывает:
  - `successful_files: 2`
  - `failed_files: 1`
  - `errors: ["File /path/to/non-existent-video.mp4 failed: file not found"]`
- results содержит результаты только для успешных файлов

## 📊 Performance Check

### Test 6: Время обработки
```typescript
console.time('batch-analysis');

await invoke('ai_director_v2_analyze_batch', {
  filePaths: [
    '/path/to/video1.mp4',
    '/path/to/video2.mp4',
    '/path/to/video3.mp4'
  ]
});

console.timeEnd('batch-analysis');
```

**Ожидаемый результат:**
- Sequential обработка - каждый файл обрабатывается по очереди
- ETA становится более точным после обработки первого файла
- Общее время ≈ (среднее время на файл) × (количество файлов)

## 🎯 Success Criteria

### Phase 1 ✅
- [x] Single file analysis с событиями работает
- [x] Quick и comprehensive режимы доступны
- [x] События приходят в правильном порядке
- [x] Progress обновляется корректно

### Phase 2 ✅
- [x] Batch analysis обрабатывает несколько файлов
- [x] Batch события отправляются
- [x] Progress трекинг для всего batch
- [x] ETA рассчитывается автоматически
- [x] Graceful error handling
- [x] React hook работает корректно

## 🚨 Known Issues

1. **Warning о `emit_analyzer_progress`** - метод создан для будущего использования, можно игнорировать

## 📝 Next Steps

После успешного прохождения всех тестов:
1. Переместить задачу в `/docs/08_tasks/completed/`
2. Опционально: начать Phase 3 (Parallel Processing)
3. Опционально: добавить UI компоненты для визуализации progress

---

**Создано:** 2025-11-25
**Версия:** 1.0
**Статус:** Ready for Testing
