# Performance Optimization

[← Back to section](README.md) | [← To contents](../README.md)

## 📋 Contents

- [Profiling](#profiling)
- [Frontend Optimization](#frontend-optimization)
- [Backend Optimization](#backend-optimization)
- [GPU Acceleration](#gpu-acceleration)
- [Export Optimization](#export-optimization)
- [Production Monitoring](#production-monitoring)

## 🎯 What You'll Learn

- How to profile Timeline Studio
- React component optimization techniques
- Rust backend acceleration
- Using GPU for video processing
- Performance monitoring

## 📊 Profiling

### Frontend Profiling

#### React DevTools Profiler

```typescript
// Enable profiling in development
import { Profiler } from 'react'

function TimelineWrapper() {
  const onRender = (id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`)
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
    
    // Send metrics
    this.sendMetric(label, duration)
    
    return duration
  }

  private sendMetric(label: string, duration: number) {
    if (duration > 16) { // More than one frame
      console.warn(`Slow operation: ${label} took ${duration}ms`)
    }
  }
}
```

### Backend Profiling

```rust
// Cargo.toml
[profile.release]
debug = true  // Enable debug symbols for profiling

// Using flamegraph
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

## ⚛️ Frontend Optimization

### 1. Component Memoization

```typescript
// ❌ Bad - rerenders on every change
function ClipList({ clips, onSelect }) {
  return clips.map(clip => (
    <Clip 
      key={clip.id} 
      clip={clip} 
      onSelect={() => onSelect(clip.id)} 
    />
  ))
}

// ✅ Good - memoization
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

### 2. List Virtualization

```typescript
// components/VirtualizedMediaList.tsx
import { VariableSizeList } from 'react-window'

export function VirtualizedMediaList({ files }) {
  const getItemSize = useCallback((index: number) => {
    // Different height for video (with preview) and audio
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

### 3. Timeline Rendering Optimization

```typescript
// hooks/useOptimizedTimeline.ts
export function useOptimizedTimeline() {
  const [clips, setClips] = useState<Clip[]>([])
  const [viewport, setViewport] = useState({ start: 0, end: 100 })

  // Only visible clips
  const visibleClips = useMemo(() => {
    return clips.filter(clip => {
      const clipEnd = clip.startTime + clip.duration
      return clip.startTime < viewport.end && clipEnd > viewport.start
    })
  }, [clips, viewport])

  // Batched updates
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

### 4. Web Workers for Heavy Computations

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

## 🦀 Backend Optimization

### 1. Parallel Processing

```rust
use rayon::prelude::*;
use tokio::task;

// Parallel thumbnail generation
pub async fn generate_all_thumbnails(
    files: Vec<String>
) -> Vec<Result<Thumbnail>> {
    // CPU-bound tasks in thread pool
    let handles: Vec<_> = files
        .into_par_iter()
        .map(|file| {
            task::spawn_blocking(move || {
                generate_single_thumbnail(&file)
            })
        })
        .collect();
    
    // Collect results
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await?);
    }
    
    results
}
```

### 2. Caching

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
        // Check memory cache
        {
            let cache = self.memory.read().await;
            if let Some(item) = cache.get(key) {
                return Ok(item.clone());
            }
        }
        
        // Check disk cache
        if let Some(item) = self.get_from_disk(key).await? {
            self.memory.write().await.put(key.to_string(), item.clone());
            return Ok(item);
        }
        
        // Compute
        let item = compute().await?;
        
        // Save
        self.save_to_disk(key, &item).await?;
        self.memory.write().await.put(key.to_string(), item.clone());
        
        Ok(item)
    }
}
```

### 3. Streaming Processing

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
    
    // Processing with buffering
    frame_stream
        .map(|frame| apply_effects(frame, &effects))
        .buffer_unordered(4) // Parallel processing of 4 frames
        .for_each(|frame| async {
            encoder.write_frame(frame).await.unwrap();
        })
        .await;
    
    Ok(())
}
```

## 🎮 GPU Acceleration

### 1. WebGL Effects

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

### 2. FFmpeg GPU Encoding

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

## 📤 Export Optimization

### 1. Multi-threaded Encoding

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
        // Split into segments
        let segments = self.split_timeline(timeline, self.segment_duration);
        
        // Parallel encoding
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
        
        // Collect results
        let mut segment_files = Vec::new();
        for handle in handles {
            segment_files.push(handle.await??);
        }
        
        // Concatenate segments
        self.concat_segments(segment_files, output_path).await?;
        
        Ok(())
    }
}
```

### 2. Adaptive Quality

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
      // Complex project - prioritize quality
      return {
        preset: 'slow',
        crf: 18,
        threads: Math.max(1, navigator.hardwareConcurrency - 2)
      }
    } else if (targetTime < 300) { // 5 minutes
      // Fast export
      return {
        preset: 'ultrafast',
        crf: 23,
        threads: navigator.hardwareConcurrency
      }
    } else {
      // Balance
      return {
        preset: 'medium',
        crf: 20,
        threads: Math.max(2, navigator.hardwareConcurrency - 1)
      }
    }
  }
}
```

## 📊 Production Monitoring

### 1. Metrics Collection

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
    
    // Send when accumulated
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
  // Component render time (ms)
  render: {
    Timeline: 16,      // 60fps
    VideoPlayer: 16,
    EffectsPanel: 32,  // 30fps acceptable
  },
  
  // Operation execution time (ms)
  operations: {
    addClip: 100,
    applyEffect: 200,
    exportStart: 1000,
  },
  
  // Memory usage (MB)
  memory: {
    idle: 200,
    editing: 500,
    exporting: 1000,
  },
  
  // Bundle size (KB)
  bundle: {
    main: 500,
    vendor: 1000,
    total: 2000,
  }
}

// Check in CI/CD
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

## 🎯 Optimization Checklist

- [ ] Profiling with React DevTools
- [ ] Check component rerenders
- [ ] Memoize heavy computations
- [ ] Virtualize long lists
- [ ] Lazy load unused modules
- [ ] Web Workers for CPU-intensive tasks
- [ ] GPU acceleration for effects
- [ ] Caching at all levels
- [ ] Bundle size optimization
- [ ] Performance monitoring

## 🔗 Additional Resources

- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [FFmpeg Encoding Guide](https://trac.ffmpeg.org/wiki/Encode/H.264)

---

[← Guides](README.md) | [Next: Creating Effects →](custom-effects.md)