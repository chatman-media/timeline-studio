# AI Director: Usage Examples

Практические примеры использования AI Director API в Timeline Studio.

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Comprehensive Analysis](#comprehensive-analysis)
3. [Batch Processing](#batch-processing)
4. [Custom Configuration](#custom-configuration)
5. [Error Handling](#error-handling)
6. [React Integration](#react-integration)
7. [Real-World Scenarios](#real-world-scenarios)

## Быстрый старт

### Простейший анализ

```typescript
import { invoke } from '@tauri-apps/api/core';

async function quickAnalyze(videoPath: string) {
  try {
    const result = await invoke('ai_director_analyze_quick', {
      videoPath
    });

    console.log(`✓ Analysis completed in ${result.performance_metrics.total_processing_time}ms`);
    console.log(`✓ Audio quality: ${result.audio_analysis?.ffmpeg_analysis?.quality_level}`);

    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
}

// Использование
const result = await quickAnalyze('/path/to/video.mp4');
```

### Проверка возможностей системы

```typescript
async function checkCapabilities() {
  const caps = await invoke('ai_director_get_capabilities');

  return {
    canAnalyzeAudio: caps.audioAnalysis,
    canDetectScenes: caps.sceneDetection,
    canRecognizeFaces: caps.faceRecognition,
    canTranscribe: caps.transcription,
    hasGPU: caps.gpuAcceleration
  };
}

// Использование
const capabilities = await checkCapabilities();
if (!capabilities.canAnalyzeAudio) {
  alert('Please install FFmpeg to enable audio analysis');
}
```

## Comprehensive Analysis

### Полный анализ с preset конфигурацией

```typescript
interface AnalysisOptions {
  mode: 'fast' | 'balanced' | 'quality';
  videoPath: string;
  onProgress?: (stage: string, progress: number) => void;
}

async function comprehensiveAnalysis({ mode, videoPath, onProgress }: AnalysisOptions) {
  // 1. Получить preset конфигурацию
  const config = await invoke('ai_director_get_default_config', { mode });

  // 2. Валидация конфигурации
  const validation = await invoke('ai_director_validate_config', { config });

  if (!validation.isValid) {
    throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('Config warnings:', validation.warnings);
  }

  console.log(`Estimated time: ${validation.estimatedTime}s`);
  console.log(`Estimated memory: ${validation.estimatedMemory}MB`);

  // 3. Запуск анализа
  onProgress?.('starting', 0);

  const result = await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });

  onProgress?.('completed', 100);

  // 4. Обработка результатов
  return processResults(result);
}

function processResults(result: ComprehensiveAnalysisResult) {
  const summary = {
    status: result.status,
    duration: result.performance_metrics.total_processing_time,

    // Scene analysis
    totalScenes: result.scene_analysis?.total_scenes ?? 0,
    avgSceneDuration: result.scene_analysis?.avg_scene_duration ?? 0,

    // Key moments
    totalMoments: result.moment_analysis?.total_moments ?? 0,
    avgImportance: result.moment_analysis?.avg_importance ?? 0,

    // Content
    primaryCategory: result.content_analysis?.classification.primary_category,
    mood: result.content_analysis?.mood.mood,
    overallQuality: result.content_analysis?.quality.overall ?? 0,

    // Insights
    mainSubjects: result.combined_insights.main_subjects,
    recommendations: result.editing_recommendations.length
  };

  return { result, summary };
}

// Использование
const { result, summary } = await comprehensiveAnalysis({
  mode: 'balanced',
  videoPath: '/path/to/video.mp4',
  onProgress: (stage, progress) => {
    console.log(`${stage}: ${progress}%`);
  }
});

console.log('Analysis summary:', summary);
```

### Извлечение ключевых моментов

```typescript
async function extractKeyMoments(videoPath: string) {
  const config = await invoke('ai_director_get_default_config', { mode: 'balanced' });

  // Настроить для максимума key moments
  config.enable_moment_detection = true;
  config.max_key_moments = 100;

  const result = await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });

  // Сортировать по важности
  const moments = result.combined_insights.key_moments
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 20); // Top 20

  return moments.map(moment => ({
    timestamp: moment.timestamp,
    duration: moment.duration,
    type: moment.moment_type,
    importance: moment.importance,
    reason: moment.reason,
    isAudioDriven: moment.audio_contribution > 0.6,
    isVisualDriven: moment.visual_contribution > 0.6
  }));
}

// Использование
const topMoments = await extractKeyMoments('/path/to/video.mp4');
topMoments.forEach((moment, index) => {
  console.log(`${index + 1}. ${moment.type} at ${moment.timestamp}s (${moment.importance.toFixed(2)})`);
  console.log(`   ${moment.reason}`);
});
```

## Batch Processing

### Анализ нескольких файлов

```typescript
async function analyzeBatch(filePaths: string[], mode: 'fast' | 'balanced' = 'fast') {
  const config = await invoke('ai_director_get_default_config', { mode });

  console.log(`Analyzing ${filePaths.length} files in ${mode} mode...`);

  const results = await invoke('ai_director_analyze_batch', {
    filePaths,
    config
  });

  const summary = {
    total: results.length,
    successful: results.filter(r => r.status === 'Completed').length,
    partial: results.filter(r => r.status === 'PartiallyCompleted').length,
    failed: results.filter(r => r.status === 'Failed').length,
    totalTime: results.reduce((sum, r) => sum + r.performance_metrics.total_processing_time, 0)
  };

  return { results, summary };
}

// Использование
const files = [
  '/videos/clip1.mp4',
  '/videos/clip2.mp4',
  '/videos/clip3.mp4'
];

const { results, summary } = await analyzeBatch(files, 'fast');
console.log(`✓ ${summary.successful}/${summary.total} successful`);
console.log(`Total time: ${summary.totalTime}ms`);
```

### Прогрессивная batch обработка

```typescript
async function progressiveBatchAnalysis(
  filePaths: string[],
  onFileComplete: (index: number, result: any) => void
) {
  const config = await invoke('ai_director_get_default_config', { mode: 'balanced' });

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    console.log(`[${i + 1}/${filePaths.length}] Analyzing ${filePath}...`);

    try {
      const result = await invoke('ai_director_analyze_comprehensive', {
        videoPath: filePath,
        config
      });

      onFileComplete(i, { success: true, result });
    } catch (error) {
      onFileComplete(i, { success: false, error: error.message });
    }
  }
}

// Использование
await progressiveBatchAnalysis(files, (index, data) => {
  if (data.success) {
    console.log(`✓ File ${index + 1} completed`);
    // Update UI progress
  } else {
    console.error(`✗ File ${index + 1} failed:`, data.error);
  }
});
```

## Custom Configuration

### Настройка под конкретную задачу

```typescript
// Анализ для социальных сетей (короткие клипы)
async function analyzeSocialMedia(videoPath: string) {
  const config = await invoke('ai_director_get_default_config', { mode: 'quality' });

  // Оптимизация для соцсетей
  config.enable_mood_analysis = true;
  config.enable_emotion_analysis = true;
  config.max_key_moments = 5; // Только топ 5
  config.max_processing_time = 60; // Быстро

  return await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });
}

// Анализ для YouTube (длинный контент)
async function analyzeYouTube(videoPath: string) {
  const config = await invoke('ai_director_get_default_config', { mode: 'quality' });

  config.enable_scene_detection = true;
  config.enable_moment_detection = true;
  config.max_key_moments = 50;
  config.generate_editing_recommendations = true;
  config.max_processing_time = 600; // 10 минут

  return await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });
}

// Только audio анализ (подкасты, музыка)
async function analyzeAudioOnly(videoPath: string) {
  const config: AIDirectorConfig = {
    performance_mode: 'Quality',
    enable_audio_analysis: true,
    enable_scene_detection: false,
    enable_vision_analysis: false,
    enable_moment_detection: false,
    enable_content_classification: false,
    // ... все остальные false
  };

  return await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });
}
```

## Error Handling

### Graceful degradation

```typescript
async function robustAnalysis(videoPath: string) {
  try {
    const result = await invoke('ai_director_analyze_comprehensive', {
      videoPath,
      config: await invoke('ai_director_get_default_config', { mode: 'balanced' })
    });

    // Проверяем статус
    if (result.status === 'Failed') {
      throw new Error(`Analysis failed: ${result.errors.join(', ')}`);
    }

    if (result.status === 'PartiallyCompleted') {
      console.warn('Some engines failed:', result.errors);
      console.warn(`Success rate: ${(result.performance_metrics.success_rate * 100).toFixed(1)}%`);

      // Используем доступные результаты
      return {
        partial: true,
        available: {
          audio: !!result.audio_analysis,
          scenes: !!result.scene_analysis,
          moments: !!result.moment_analysis,
          content: !!result.content_analysis
        },
        data: result
      };
    }

    // Полный успех
    return {
      partial: false,
      data: result
    };

  } catch (error) {
    console.error('Analysis error:', error);

    // Fallback: попробовать quick analysis
    console.log('Falling back to quick analysis...');
    const quickResult = await invoke('ai_director_analyze_quick', { videoPath });

    return {
      partial: true,
      fallback: true,
      data: quickResult
    };
  }
}
```

### Retry logic

```typescript
async function analyzeWithRetry(
  videoPath: string,
  maxRetries: number = 3
): Promise<ComprehensiveAnalysisResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);

      const result = await invoke('ai_director_analyze_comprehensive', {
        videoPath,
        config: await invoke('ai_director_get_default_config', {
          mode: attempt === 1 ? 'balanced' : 'fast' // Снижаем нагрузку при retry
        })
      });

      if (result.status !== 'Failed') {
        return result;
      }

      lastError = new Error(`Analysis failed: ${result.errors.join(', ')}`);

    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  throw lastError!;
}
```

## React Integration

### Custom Hook

```typescript
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface UseAIDirectorOptions {
  mode?: 'fast' | 'balanced' | 'quality';
  onProgress?: (stage: string, progress: number) => void;
}

function useAIDirector({ mode = 'balanced', onProgress }: UseAIDirectorOptions = {}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(async (videoPath: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      onProgress?.('initializing', 0);

      const config = await invoke('ai_director_get_default_config', { mode });

      onProgress?.('analyzing', 25);

      const analysisResult = await invoke('ai_director_analyze_comprehensive', {
        videoPath,
        config
      });

      onProgress?.('completed', 100);

      setResult(analysisResult);
      return analysisResult;

    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [mode, onProgress]);

  const analyzeQuick = useCallback(async (videoPath: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await invoke('ai_director_analyze_quick', { videoPath });
      setResult(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyze,
    analyzeQuick,
    isAnalyzing,
    result,
    error,
    reset: () => {
      setResult(null);
      setError(null);
    }
  };
}

// Использование в компоненте
function VideoAnalyzer({ videoPath }: { videoPath: string }) {
  const { analyze, isAnalyzing, result, error } = useAIDirector({
    mode: 'balanced',
    onProgress: (stage, progress) => {
      console.log(`${stage}: ${progress}%`);
    }
  });

  const handleAnalyze = async () => {
    try {
      await analyze(videoPath);
      console.log('Analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
      </button>

      {error && <div className="error">{error.message}</div>}

      {result && (
        <div className="results">
          <h3>Analysis Results</h3>
          <p>Status: {result.status}</p>
          <p>Scenes: {result.scene_analysis?.total_scenes ?? 0}</p>
          <p>Key Moments: {result.moment_analysis?.total_moments ?? 0}</p>
          <p>Quality: {result.combined_insights.overall_quality.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

### React Query Integration

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

function useVideoAnalysis(videoPath: string, mode: 'fast' | 'balanced' | 'quality') {
  return useQuery({
    queryKey: ['ai-director', videoPath, mode],
    queryFn: async () => {
      const config = await invoke('ai_director_get_default_config', { mode });
      return await invoke('ai_director_analyze_comprehensive', {
        videoPath,
        config
      });
    },
    enabled: !!videoPath,
    staleTime: Infinity, // Results don't change
    cacheTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

function useVideoAnalysisMutation() {
  return useMutation({
    mutationFn: async ({ videoPath, mode }: { videoPath: string; mode: string }) => {
      const config = await invoke('ai_director_get_default_config', { mode });
      return await invoke('ai_director_analyze_comprehensive', {
        videoPath,
        config
      });
    }
  });
}

// Использование
function VideoAnalysisComponent({ videoPath }: { videoPath: string }) {
  const { data, isLoading, error } = useVideoAnalysis(videoPath, 'balanced');

  if (isLoading) return <div>Analyzing video...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Analysis Complete</h3>
      {/* Render results */}
    </div>
  );
}
```

## Real-World Scenarios

### Scenario 1: Автоматический монтаж highlights

```typescript
async function createHighlightsReel(videoPath: string) {
  // 1. Анализ
  const config = await invoke('ai_director_get_default_config', { mode: 'quality' });
  config.enable_moment_detection = true;
  config.max_key_moments = 10;

  const result = await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config
  });

  // 2. Извлечь топ моменты
  const highlights = result.combined_insights.key_moments
    .filter(m => m.importance > 0.7) // Только важные
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5); // Топ 5

  // 3. Создать клипы
  const clips = highlights.map(moment => ({
    startTime: Math.max(0, moment.timestamp - 2), // 2 секунды до
    endTime: moment.timestamp + moment.duration + 2, // 2 секунды после
    type: moment.moment_type,
    importance: moment.importance
  }));

  return clips;
}
```

### Scenario 2: Content moderation

```typescript
async function moderateContent(videoPath: string) {
  const result = await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config: {
      enable_content_classification: true,
      enable_mood_analysis: true,
      enable_object_detection: true
    }
  });

  const classification = result.content_analysis?.classification;
  const mood = result.content_analysis?.mood;

  const flags = [];

  // Проверка категории
  if (classification?.categories.includes('Violence')) {
    flags.push('Contains violence');
  }

  // Проверка настроения
  if (mood?.mood === 'Aggressive' && mood.energy_level > 0.8) {
    flags.push('High aggressive content');
  }

  // Проверка объектов
  const dangerousObjects = ['weapon', 'gun', 'knife'];
  const detectedObjects = result.vision_analysis?.objects_detected ?? [];
  const foundDangerous = detectedObjects.filter(obj =>
    dangerousObjects.some(d => obj.toLowerCase().includes(d))
  );

  if (foundDangerous.length > 0) {
    flags.push(`Contains: ${foundDangerous.join(', ')}`);
  }

  return {
    safe: flags.length === 0,
    flags,
    rating: classification?.primary_category,
    mood: mood?.mood
  };
}
```

### Scenario 3: Quality control

```typescript
async function qualityCheck(videoPath: string) {
  const result = await invoke('ai_director_analyze_comprehensive', {
    videoPath,
    config: {
      enable_quality_analysis: true,
      enable_audio_analysis: true,
      enable_composition_analysis: true
    }
  });

  const quality = result.content_analysis?.quality;
  const audioQuality = result.audio_analysis?.ffmpeg_analysis?.quality_level;

  const issues = [];

  // Visual quality
  if (quality && quality.visual < 0.6) {
    issues.push({
      type: 'visual',
      severity: 'warning',
      message: 'Low visual quality detected'
    });
  }

  // Audio quality
  if (audioQuality && audioQuality < 60) {
    issues.push({
      type: 'audio',
      severity: 'warning',
      message: 'Low audio quality detected'
    });
  }

  // Composition
  if (quality && quality.composition < 0.5) {
    issues.push({
      type: 'composition',
      severity: 'info',
      message: 'Poor composition detected'
    });
  }

  return {
    overallScore: quality?.overall ?? 0,
    issues,
    recommendations: result.editing_recommendations,
    passesQC: issues.filter(i => i.severity === 'warning').length === 0
  };
}
```

## Best Practices

1. **Всегда проверяйте capabilities перед анализом**
2. **Используйте preset modes как отправную точку**
3. **Валидируйте конфигурацию перед запуском**
4. **Обрабатывайте PartiallyCompleted статус**
5. **Кэшируйте результаты анализа**
6. **Используйте quick analysis для preview**
7. **Показывайте прогресс пользователю**
8. **Graceful degradation при ошибках**

## Troubleshooting

См. [Migration Guide](/docs/ru/05_development/ai-director-unified-migration-guide.md#troubleshooting) для решения распространенных проблем.

---

**Версия**: 1.0
**Дата**: 2 ноября 2025
