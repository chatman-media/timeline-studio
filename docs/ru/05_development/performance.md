# Оптимизация производительности

[← Назад к разделу](README.md) | [← К оглавлению](../README.md)

## 📋 Содержание

- [Профилирование](#профилирование)
- [Оптимизация Frontend](#оптимизация-frontend)
- [Оптимизация Backend](#оптимизация-backend)
- [GPU ускорение](#gpu-ускорение)
- [Оптимизация экспорта](#оптимизация-экспорта)
- [Мониторинг в production](#мониторинг-в-production)

## 🎯 Что вы узнаете

- Как профилировать Timeline Studio
- Техники оптимизации React компонентов
- Ускорение Rust backend
- Использование GPU для обработки видео
- Мониторинг производительности

## 📊 Профилирование

### Frontend профилирование

#### React DevTools Profiler

```typescript
// Включение профилирования в development
import { Profiler } from 'react'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Performance')

function TimelineWrapper() {
  const onRender = (id, phase, actualDuration) => {
    logger.debugSync('Component render', {
      id,
      phase,
      duration: actualDuration
    })
  }

  return (
    <Profiler id="Timeline" onRender={onRender}>
      <Timeline />
    </Profiler>
  )
}
```

#### Performance API

```typescript
// utils/performance.ts
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('PerformanceTracker')

export class PerformanceTracker {
  private marks = new Map<string, number>()

  start(label: string) {
    this.marks.set(label, performance.now())
  }

  end(label: string): number {
    const start = this.marks.get(label)
    if (!start) return 0

    const duration = performance.now() - start
    this.marks.delete(label)

    // Отправка метрик
    this.sendMetric(label, duration)

    return duration
  }

  private sendMetric(label: string, duration: number) {
    if (duration > 16) { // Больше одного кадра
      logger.warnSync('Slow operation detected', {
        operation: label,
        duration: `${duration}ms`
      })
    }
  }
}
```

### Backend профилирование

```rust
// Cargo.toml
[profile.release]
debug = true  # Включить debug symbols для профилирования

// Использование flamegraph
use flame;

#[tauri::command]
async fn process_video(path: String) -> Result<String> {
    flame::start("process_video");
    
    let result = do_processing(&path).await?;
    
    flame::end("process_video");
    flame::dump_html(&mut File::create("flame.html")?)?;
    
    Ok(result)
}
```

## ⚛️ Оптимизация Frontend

### 1. Мемоизация компонентов

```typescript
// ❌ Плохо - ререндер при каждом изменении
function ClipList({ clips, onSelect }) {
  return clips.map(clip => (
    <Clip 
      key={clip.id} 
      clip={clip} 
      onSelect={() => onSelect(clip.id)} 
    />
  ))
}

// ✅ Хорошо - мемоизация
const ClipItem = memo(({ clip, onSelect }) => {
  const handleSelect = useCallback(() => {
    onSelect(clip.id)
  }, [clip.id, onSelect])

  return <Clip clip={clip} onSelect={handleSelect} />
}, (prev, next) => {
  return prev.clip.version === next.clip.version
})

function ClipList({ clips, onSelect }) {
  const memoizedOnSelect = useCallback(onSelect, [])
  
  return clips.map(clip => (
    <ClipItem 
      key={clip.id} 
      clip={clip} 
      onSelect={memoizedOnSelect} 
    />
  ))
}
```

### 2. Виртуализация списков

```typescript
// components/VirtualizedMediaList.tsx
import { VariableSizeList } from 'react-window'

export function VirtualizedMediaList({ files }) {
  const getItemSize = useCallback((index: number) => {
    // Разная высота для видео (с превью) и аудио
    return files[index].type === 'video' ? 120 : 60
  }, [files])

  return (
    <AutoSizer>
      {({ height, width }) => (
        <VariableSizeList
          height={height}
          width={width}
          itemCount={files.length}
          itemSize={getItemSize}
          overscanCount={5}
        >
          {({ index, style }) => (
            <MediaItem 
              file={files[index]} 
              style={style}
            />
          )}
        </VariableSizeList>
      )}
    </AutoSizer>
  )
}
```

### 3. Оптимизация рендеринга Timeline

```typescript
// hooks/useOptimizedTimeline.ts
export function useOptimizedTimeline() {
  const [clips, setClips] = useState<Clip[]>([])
  const [viewport, setViewport] = useState({ start: 0, end: 100 })

  // Только видимые клипы
  const visibleClips = useMemo(() => {
    return clips.filter(clip => {
      const clipEnd = clip.startTime + clip.duration
      return clip.startTime < viewport.end && clipEnd > viewport.start
    })
  }, [clips, viewport])

  // Батчинг обновлений
  const updateClips = useMemo(() => {
    return debounce((updates: ClipUpdate[]) => {
      setClips(prev => {
        const newClips = [...prev]
        updates.forEach(update => {
          const index = newClips.findIndex(c => c.id === update.id)
          if (index >= 0) {
            newClips[index] = { ...newClips[index], ...update }
          }
        })
        return newClips
      })
    }, 16) // ~60fps
  }, [])

  return { visibleClips, updateClips }
}
```

### 4. Web Workers для тяжелых вычислений

```typescript
// workers/waveform.worker.ts
self.addEventListener('message', async (e) => {
  const { audioBuffer, width, height } = e.data
  
  const waveform = generateWaveform(audioBuffer, width, height)
  
  self.postMessage({ 
    waveform: waveform.buffer 
  }, [waveform.buffer]) // Transferable
})

// hooks/useWaveformWorker.ts
export function useWaveformWorker() {
  const workerRef = useRef<Worker>()

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/waveform.worker.ts', import.meta.url)
    )
    
    return () => workerRef.current?.terminate()
  }, [])

  const generateWaveform = useCallback(async (
    audioBuffer: AudioBuffer,
    width: number,
    height: number
  ) => {
    return new Promise((resolve) => {
      workerRef.current!.onmessage = (e) => resolve(e.data.waveform)
      workerRef.current!.postMessage({ audioBuffer, width, height })
    })
  }, [])

  return generateWaveform
}
```

## 🦀 Оптимизация Backend

### 1. Параллельная обработка

```rust
use rayon::prelude::*;
use tokio::task;

// Параллельная генерация превью
pub async fn generate_all_thumbnails(
    files: Vec<String>
) -> Vec<Result<Thumbnail>> {
    // CPU-bound задачи в thread pool
    let handles: Vec<_> = files
        .into_par_iter()
        .map(|file| {
            task::spawn_blocking(move || {
                generate_single_thumbnail(&file)
            })
        })
        .collect();
    
    // Сбор результатов
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await?);
    }
    
    results
}
```

### 2. Кэширование

```rust
use lru::LruCache;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct MediaCache {
    memory: Arc<RwLock<LruCache<String, CachedMedia>>>,
    disk: SqlitePool,
}

impl MediaCache {
    pub async fn get_or_compute<F, Fut>(
        &self,
        key: &str,
        compute: F,
    ) -> Result<CachedMedia>
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<CachedMedia>>,
    {
        // Проверка memory cache
        {
            let cache = self.memory.read().await;
            if let Some(item) = cache.get(key) {
                return Ok(item.clone());
            }
        }
        
        // Проверка disk cache
        if let Some(item) = self.get_from_disk(key).await? {
            self.memory.write().await.put(key.to_string(), item.clone());
            return Ok(item);
        }
        
        // Вычисление
        let item = compute().await?;
        
        // Сохранение
        self.save_to_disk(key, &item).await?;
        self.memory.write().await.put(key.to_string(), item.clone());
        
        Ok(item)
    }
}
```

### 3. Streaming обработка

```rust
use tokio::io::{AsyncRead, AsyncWrite};
use futures::stream::{self, StreamExt};

pub async fn process_video_stream<R, W>(
    input: R,
    output: W,
    effects: Vec<Effect>,
) -> Result<()>
where
    R: AsyncRead + Unpin,
    W: AsyncWrite + Unpin,
{
    let decoder = Decoder::new(input);
    let encoder = Encoder::new(output);
    
    let frame_stream = stream::unfold(decoder, |mut dec| async {
        match dec.next_frame().await {
            Ok(Some(frame)) => Some((frame, dec)),
            _ => None,
        }
    });
    
    // Обработка с буферизацией
    frame_stream
        .map(|frame| apply_effects(frame, &effects))
        .buffer_unordered(4) // Параллельная обработка 4 кадров
        .for_each(|frame| async {
            encoder.write_frame(frame).await.unwrap();
        })
        .await;
    
    Ok(())
}
```

## 🎮 GPU ускорение

### 1. WebGL эффекты

```typescript
// effects/webgl/blur.effect.ts
export class WebGLBlurEffect {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2')!
    this.program = this.createShaderProgram()
  }
  
  apply(texture: WebGLTexture, radius: number): WebGLTexture {
    const framebuffer = this.gl.createFramebuffer()
    const outputTexture = this.gl.createTexture()
    
    // Horizontal pass
    this.gl.useProgram(this.program)
    this.gl.uniform2f(
      this.gl.getUniformLocation(this.program, 'direction'),
      radius, 0
    )
    this.renderPass(texture, framebuffer, outputTexture)
    
    // Vertical pass
    this.gl.uniform2f(
      this.gl.getUniformLocation(this.program, 'direction'),
      0, radius
    )
    this.renderPass(outputTexture, framebuffer, outputTexture)
    
    return outputTexture
  }
  
  private createShaderProgram(): WebGLProgram {
    const vertexShader = `
      attribute vec2 position;
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `
    
    const fragmentShader = `
      precision highp float;
      uniform sampler2D uTexture;
      uniform vec2 direction;
      varying vec2 vTexCoord;
      
      void main() {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3846153846) * direction;
        vec2 off2 = vec2(3.2307692308) * direction;
        
        color += texture2D(uTexture, vTexCoord) * 0.2270270270;
        color += texture2D(uTexture, vTexCoord + off1) * 0.3162162162;
        color += texture2D(uTexture, vTexCoord - off1) * 0.3162162162;
        color += texture2D(uTexture, vTexCoord + off2) * 0.0702702703;
        color += texture2D(uTexture, vTexCoord - off2) * 0.0702702703;
        
        gl_FragColor = color;
      }
    `
    
    return this.compileProgram(vertexShader, fragmentShader)
  }
}
```

### 2. FFmpeg GPU кодирование

```rust
// video_compiler/gpu.rs
pub fn setup_gpu_encoding(
    encoder: &mut FFmpegEncoder,
    gpu_type: GpuType,
) -> Result<()> {
    match gpu_type {
        GpuType::Nvidia => {
            encoder.set_codec("h264_nvenc");
            encoder.set_option("preset", "p4"); // Balanced
            encoder.set_option("rc", "vbr");    // Variable bitrate
            encoder.set_option("gpu", "0");     // First GPU
        }
        GpuType::Intel => {
            encoder.set_codec("h264_qsv");
            encoder.set_option("preset", "medium");
            encoder.set_option("look_ahead", "1");
        }
        GpuType::AMD => {
            encoder.set_codec("h264_amf");
            encoder.set_option("quality", "balanced");
            encoder.set_option("rc", "vbr_latency");
        }
        GpuType::Apple => {
            encoder.set_codec("h264_videotoolbox");
            encoder.set_option("realtime", "false");
        }
    }
    
    Ok(())
}
```

## 📤 Оптимизация экспорта

### 1. Многопоточное кодирование

```rust
pub struct ParallelEncoder {
    threads: usize,
    segment_duration: f64,
}

impl ParallelEncoder {
    pub async fn encode(
        &self,
        timeline: Timeline,
        output_path: &str,
    ) -> Result<()> {
        // Разделение на сегменты
        let segments = self.split_timeline(timeline, self.segment_duration);
        
        // Параллельное кодирование
        let handles: Vec<_> = segments
            .into_iter()
            .enumerate()
            .map(|(i, segment)| {
                tokio::spawn(async move {
                    let temp_file = format!("segment_{}.mp4", i);
                    encode_segment(segment, &temp_file).await
                })
            })
            .collect();
        
        // Сбор результатов
        let mut segment_files = Vec::new();
        for handle in handles {
            segment_files.push(handle.await??);
        }
        
        // Объединение сегментов
        self.concat_segments(segment_files, output_path).await?;
        
        Ok(())
    }
}
```

### 2. Адаптивное качество

```typescript
// services/adaptive-export.ts
export class AdaptiveExportService {
  async analyzeComplexity(timeline: Timeline): Promise<ComplexityScore> {
    const scores = await Promise.all([
      this.analyzeEffects(timeline),
      this.analyzeTransitions(timeline),
      this.analyzeResolution(timeline),
      this.analyzeBitrate(timeline)
    ])
    
    return {
      effects: scores[0],
      transitions: scores[1],
      resolution: scores[2],
      bitrate: scores[3],
      total: scores.reduce((a, b) => a + b) / scores.length
    }
  }
  
  getOptimalSettings(
    complexity: ComplexityScore,
    targetTime: number
  ): ExportSettings {
    if (complexity.total > 0.8) {
      // Сложный проект - приоритет качеству
      return {
        preset: 'slow',
        crf: 18,
        threads: Math.max(1, navigator.hardwareConcurrency - 2)
      }
    } else if (targetTime < 300) { // 5 минут
      // Быстрый экспорт
      return {
        preset: 'ultrafast',
        crf: 23,
        threads: navigator.hardwareConcurrency
      }
    } else {
      // Баланс
      return {
        preset: 'medium',
        crf: 20,
        threads: Math.max(2, navigator.hardwareConcurrency - 1)
      }
    }
  }
}
```

## 📊 Мониторинг в production

### 1. Сбор метрик

```typescript
// services/telemetry.ts
export class TelemetryService {
  private metrics: Map<string, Metric> = new Map()
  
  recordRenderTime(componentName: string, duration: number) {
    this.updateMetric(`render.${componentName}`, duration)
  }
  
  recordCommandTime(command: string, duration: number) {
    this.updateMetric(`command.${command}`, duration)
  }
  
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.updateMetric('memory.used', memory.usedJSHeapSize)
      this.updateMetric('memory.total', memory.totalJSHeapSize)
    }
  }
  
  private updateMetric(name: string, value: number) {
    const metric = this.metrics.get(name) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0
    }
    
    metric.count++
    metric.sum += value
    metric.min = Math.min(metric.min, value)
    metric.max = Math.max(metric.max, value)
    metric.avg = metric.sum / metric.count
    
    this.metrics.set(name, metric)
    
    // Отправка при накоплении
    if (metric.count % 100 === 0) {
      this.flush()
    }
  }
  
  async flush() {
    const metrics = Object.fromEntries(this.metrics)
    await invoke('send_telemetry', { metrics })
    this.metrics.clear()
  }
}
```

### 2. Performance Budget

```typescript
// config/performance-budget.ts
export const PERFORMANCE_BUDGET = {
  // Время рендера компонентов (ms)
  render: {
    Timeline: 16,      // 60fps
    VideoPlayer: 16,
    EffectsPanel: 32,  // 30fps acceptable
  },
  
  // Время выполнения операций (ms)
  operations: {
    addClip: 100,
    applyEffect: 200,
    exportStart: 1000,
  },
  
  // Использование памяти (MB)
  memory: {
    idle: 200,
    editing: 500,
    exporting: 1000,
  },
  
  // Размер бандла (KB)
  bundle: {
    main: 500,
    vendor: 1000,
    total: 2000,
  }
}

// Проверка в CI/CD
export function checkPerformanceBudget(metrics: Metrics) {
  const violations = []
  
  for (const [category, limits] of Object.entries(PERFORMANCE_BUDGET)) {
    for (const [key, limit] of Object.entries(limits)) {
      const actual = metrics[category]?.[key]
      if (actual > limit) {
        violations.push({
          category,
          key,
          limit,
          actual,
          exceeded: ((actual - limit) / limit * 100).toFixed(1)
        })
      }
    }
  }
  
  return violations
}
```

## 🎯 Чеклист оптимизации

- [ ] Профилирование с React DevTools
- [ ] Проверка ререндеров компонентов
- [ ] Мемоизация тяжелых вычислений
- [ ] Виртуализация длинных списков
- [ ] Lazy loading неиспользуемых модулей
- [ ] Web Workers для CPU-intensive задач
- [ ] GPU ускорение для эффектов
- [ ] Кэширование на всех уровнях
- [ ] Оптимизация размера бандла
- [ ] Мониторинг производительности

## 🔗 Дополнительные ресурсы

- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [FFmpeg Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)

---

[← Руководства](README.md) | [Далее: Создание эффектов →](custom-effects.md)