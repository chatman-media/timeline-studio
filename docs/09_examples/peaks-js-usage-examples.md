# Peaks.js Usage Examples

Примеры использования peaks.js в Timeline Studio

---

## 1. Базовое использование в компоненте

```typescript
import { AudioWaveform } from '@/domains/media-management'

export function BasicWaveform() {
  return (
    <AudioWaveform
      audioUrl="/assets/audio/sample.mp3"
      showControls={true}
      onReady={(peaks) => {
        console.log('Waveform ready!', peaks)
      }}
    />
  )
}
```

---

## 2. Компактная версия для таймлайна

```typescript
import { AudioWaveformCompact } from '@/domains/media-management'

export function TimelineAudioTrack({ clip }: Props) {
  return (
    <div className="audio-track-item">
      <AudioWaveformCompact
        audioUrl={clip.sourceFile}
        height={60}
        waveformColor="#3b82f6"
      />
    </div>
  )
}
```

---

## 3. Использование hook для кастомной UI

```typescript
import { usePeaksWaveform } from '@/domains/media-management'

export function CustomWaveformUI({ audioUrl }: Props) {
  const {
    peaks,
    overviewRef,
    zoomviewRef,
    isLoading,
    isReady,
    play,
    pause,
    seek,
    addSegment,
  } = usePeaksWaveform({
    audioUrl,
    zoomLevels: [512, 1024, 2048, 4096],
  })

  const handleAddRegion = () => {
    const currentTime = peaks?.player.getCurrentTime() ?? 0
    addSegment({
      startTime: currentTime,
      endTime: currentTime + 5,
      labelText: 'New Region',
      color: '#ff0000',
      editable: true,
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="custom-waveform">
      <div ref={overviewRef} style={{ height: '100px' }} />
      <div ref={zoomviewRef} style={{ height: '200px' }} />

      {isReady && (
        <div className="controls">
          <button onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
          <button onClick={handleAddRegion}>Add Region</button>
          <button onClick={() => seek(0)}>Reset</button>
        </div>
      )}
    </div>
  )
}
```

---

## 4. Синхронизация с timeline playhead

```typescript
import { usePeaksWaveform } from '@/domains/media-management'
import { useTimelinePlayback } from '@/features/timeline'

export function SyncedWaveform({ audioUrl }: Props) {
  const { currentTime, isPlaying } = useTimelinePlayback()

  const { peaks, overviewRef, isReady } = usePeaksWaveform({
    audioUrl,
  })

  // Синхронизация с timeline
  useEffect(() => {
    if (!peaks || !isReady) return

    peaks.player.seek(currentTime)

    if (isPlaying) {
      peaks.player.play()
    } else {
      peaks.player.pause()
    }
  }, [peaks, isReady, currentTime, isPlaying])

  return <div ref={overviewRef} style={{ height: '60px' }} />
}
```

---

## 5. Работа с маркерами (points)

```typescript
import { usePeaksWaveform, type PeaksPoint } from '@/domains/media-management'

export function WaveformWithMarkers({ audioUrl, markers }: Props) {
  const { peaks, overviewRef, addPoint } = usePeaksWaveform({ audioUrl })

  useEffect(() => {
    if (!peaks) return

    // Добавляем маркеры из props
    markers.forEach((marker) => {
      addPoint({
        time: marker.time,
        labelText: marker.label,
        color: marker.color,
        editable: false,
        data: { id: marker.id },
      })
    })
  }, [peaks, markers, addPoint])

  const handleAddMarker = () => {
    const currentTime = peaks?.player.getCurrentTime() ?? 0
    addPoint({
      time: currentTime,
      labelText: `Marker ${Date.now()}`,
      color: '#ff0000',
      editable: true,
    })
  }

  return (
    <div>
      <div ref={overviewRef} style={{ height: '100px' }} />
      <button onClick={handleAddMarker}>Add Marker</button>
    </div>
  )
}
```

---

## 6. Работа с сегментами (regions)

```typescript
import { usePeaksWaveform, type PeaksSegment } from '@/domains/media-management'

export function WaveformWithRegions({ audioUrl }: Props) {
  const { peaks, overviewRef, addSegment, clearSegments } = usePeaksWaveform({
    audioUrl,
  })

  const handleAddIntroRegion = () => {
    addSegment({
      startTime: 0,
      endTime: 5,
      labelText: 'Intro',
      color: '#00ff00',
      editable: true,
    })
  }

  const handleAddOutroRegion = () => {
    const duration = peaks?.player.getDuration() ?? 0
    addSegment({
      startTime: duration - 10,
      endTime: duration,
      labelText: 'Outro',
      color: '#ff0000',
      editable: true,
    })
  }

  return (
    <div>
      <div ref={overviewRef} style={{ height: '100px' }} />
      <div className="controls">
        <button onClick={handleAddIntroRegion}>Add Intro</button>
        <button onClick={handleAddOutroRegion}>Add Outro</button>
        <button onClick={clearSegments}>Clear All</button>
      </div>
    </div>
  )
}
```

---

## 7. Обработка событий peaks.js

```typescript
import { usePeaksWaveform } from '@/domains/media-management'

export function EventHandlingWaveform({ audioUrl }: Props) {
  const { peaks, overviewRef } = usePeaksWaveform({
    audioUrl,
    onReady: (peaksInstance) => {
      // Подписываемся на события
      peaksInstance.on('player.play', () => {
        console.log('Playing!')
      })

      peaksInstance.on('player.pause', () => {
        console.log('Paused!')
      })

      peaksInstance.on('player.seeked', (time) => {
        console.log('Seeked to:', time)
      })

      peaksInstance.on('segments.add', (segment) => {
        console.log('Segment added:', segment)
      })

      peaksInstance.on('points.add', (point) => {
        console.log('Point added:', point)
      })

      peaksInstance.on('zoom.update', (zoom) => {
        console.log('Zoom level:', zoom)
      })
    },
  })

  return <div ref={overviewRef} style={{ height: '100px' }} />
}
```

---

## 8. Zoom controls

```typescript
import { usePeaksWaveform } from '@/domains/media-management'

export function ZoomableWaveform({ audioUrl }: Props) {
  const { peaks, overviewRef, zoomviewRef, isReady } = usePeaksWaveform({
    audioUrl,
    zoomLevels: [256, 512, 1024, 2048, 4096],
  })

  const handleZoomIn = () => {
    peaks?.zoom.zoomIn()
  }

  const handleZoomOut = () => {
    peaks?.zoom.zoomOut()
  }

  const handleSetZoom = (level: number) => {
    peaks?.zoom.setZoom(level)
  }

  return (
    <div>
      <div ref={overviewRef} style={{ height: '80px' }} />
      <div ref={zoomviewRef} style={{ height: '200px' }} />

      {isReady && (
        <div className="zoom-controls">
          <button onClick={handleZoomOut}>-</button>
          <button onClick={() => handleSetZoom(512)}>512</button>
          <button onClick={() => handleSetZoom(1024)}>1024</button>
          <button onClick={() => handleSetZoom(2048)}>2048</button>
          <button onClick={handleZoomIn}>+</button>
        </div>
      )}
    </div>
  )
}
```

---

## 9. Multi-track waveform

```typescript
import { AudioWaveformCompact } from '@/domains/media-management'

interface Track {
  id: string
  audioUrl: string
  name: string
  color: string
}

export function MultiTrackWaveform({ tracks }: { tracks: Track[] }) {
  return (
    <div className="multi-track">
      {tracks.map((track) => (
        <div key={track.id} className="track-row">
          <div className="track-label">{track.name}</div>
          <div className="track-waveform">
            <AudioWaveformCompact
              audioUrl={track.audioUrl}
              height={50}
              waveformColor={track.color}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 10. Error handling

```typescript
import { AudioWaveform } from '@/domains/media-management'
import { useState } from 'react'

export function RobustWaveform({ audioUrl }: Props) {
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleError = (err: Error) => {
    console.error('Waveform error:', err)
    setError(err)

    // Auto-retry up to 3 times
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1)
        setError(null)
      }, 2000)
    }
  }

  const handleRetry = () => {
    setError(null)
    setRetryCount(0)
  }

  if (error && retryCount >= 3) {
    return (
      <div className="error-state">
        <p>Failed to load waveform after 3 attempts</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    )
  }

  return (
    <AudioWaveform
      key={retryCount} // Force remount on retry
      audioUrl={audioUrl}
      onError={handleError}
    />
  )
}
```

---

## 11. Темизация и кастомизация

```typescript
import { AudioWaveform } from '@/domains/media-management'
import { useTheme } from 'next-themes'

export function ThemedWaveform({ audioUrl }: Props) {
  const { theme } = useTheme()

  const waveformColor = theme === 'dark' ? '#60a5fa' : '#3b82f6'
  const playedColor = theme === 'dark' ? '#2563eb' : '#1e40af'

  return (
    <AudioWaveform
      audioUrl={audioUrl}
      waveformColor={waveformColor}
      playedWaveformColor={playedColor}
      className="rounded-lg border-2"
    />
  )
}
```

---

## 12. Производительность для больших файлов

```typescript
import { usePeaksWaveform } from '@/domains/media-management'
import { invoke } from '@tauri-apps/api/core'

export function OptimizedWaveform({ audioUrl }: Props) {
  const [dataUri, setDataUri] = useState<string | undefined>()

  // Предварительная генерация waveform данных через backend
  useEffect(() => {
    const generateData = async () => {
      try {
        const jsonPath = await invoke<string>('generate_waveform_data_json', {
          audioPath: audioUrl,
          outputPath: `/tmp/waveform-${Date.now()}.json`,
          pixelsPerSecond: 20,
          bits: 8,
        })

        setDataUri(jsonPath)
      } catch (error) {
        console.error('Failed to generate waveform data:', error)
      }
    }

    generateData()
  }, [audioUrl])

  const { overviewRef } = usePeaksWaveform({
    audioUrl,
    dataUri, // Используем предварительно сгенерированные данные
    useWebAudio: !dataUri, // Fallback к Web Audio API
  })

  return <div ref={overviewRef} style={{ height: '100px' }} />
}
```

---

## Дополнительные советы

### Performance
- Используйте `dataUri` с предварительно сгенерированными данными для больших файлов
- Web Audio API подходит для файлов < 5 минут
- Для длинных файлов используйте backend генерацию

### Accessibility
- Добавьте `aria-label` для контейнеров
- Предоставьте keyboard shortcuts для навигации
- Используйте семантический HTML

### UX
- Показывайте loading state
- Обрабатывайте ошибки gracefully
- Добавьте tooltips для контролов
- Синхронизируйте с timeline playhead

### Optimization
- Ленивая загрузка для off-screen waveforms
- Debounce zoom/scroll events
- Используйте React.memo для предотвращения лишних ре-рендеров
