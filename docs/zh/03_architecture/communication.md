# Frontend-Backend Communication

## 📋 Contents

- [Communication Overview](#communication-overview)
- [Tauri IPC](#tauri-ipc)
- [Commands](#commands)
- [Events](#events)
- [File Handling](#file-handling)
- [Streaming](#streaming)
- [Error Handling](#error-handling)

## 🔄 Communication Overview

Timeline Studio uses Tauri IPC (Inter-Process Communication) for secure interaction between frontend (React) and backend (Rust).

```
┌─────────────────┐         IPC          ┌─────────────────┐
│                 │ ◄─────────────────► │                 │
│  Frontend       │      Commands        │  Backend        │
│  (React)        │ ◄─────────────────► │  (Rust)         │
│                 │       Events         │                 │
└─────────────────┘                     └─────────────────┘
```

## 🔌 Tauri IPC

### IPC Architecture

```typescript
// Frontend: Tauri API
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

// Backend: Tauri Commands
#[tauri::command]
async fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Processed: {}", param))
}
```

### Type Safety

```typescript
// types/commands.ts
export interface MediaCommands {
  get_media_metadata: {
    args: { path: string }
    returns: MediaMetadata
  }
  scan_media_folder: {
    args: { folder: string; recursive: boolean }
    returns: MediaFile[]
  }
  generate_thumbnail: {
    args: { videoPath: string; timestamp: number }
    returns: string // base64 image
  }
}

// Type-safe wrapper
export async function invokeCommand<
  K extends keyof MediaCommands
>(
  command: K,
  args: MediaCommands[K]['args']
): Promise<MediaCommands[K]['returns']> {
  return invoke(command, args)
}
```

## 📨 Commands

### Defining Commands in Rust

```rust
// commands/media.rs
use tauri::State;
use crate::media::{MediaMetadata, MediaScanner};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanOptions {
    pub folder: String,
    pub recursive: bool,
    pub extensions: Vec<String>,
}

#[tauri::command]
pub async fn scan_media_folder(
    options: ScanOptions,
    state: State<'_, AppState>,
) -> Result<Vec<MediaFile>, String> {
    let scanner = MediaScanner::new();
    
    // Path validation
    let path = PathBuf::from(&options.folder);
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }
    
    // Scan with progress
    let (tx, mut rx) = mpsc::channel(100);
    let window = state.window.clone();
    
    // Send progress events
    tokio::spawn(async move {
        while let Some(progress) = rx.recv().await {
            window.emit("scan-progress", progress).ok();
        }
    });
    
    let files = scanner
        .scan_with_progress(path, options, tx)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(files)
}
```

### Using Commands in React

```typescript
// hooks/useMediaScanner.ts
import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface ScanProgress {
  current: number
  total: number
  currentFile: string
}

export function useMediaScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [files, setFiles] = useState<MediaFile[]>([])

  const scanFolder = useCallback(async (folder: string) => {
    setIsScanning(true)
    setProgress(null)
    
    // Subscribe to progress events
    const unlisten = await listen<ScanProgress>('scan-progress', (event) => {
      setProgress(event.payload)
    })
    
    try {
      const result = await invoke<MediaFile[]>('scan_media_folder', {
        options: {
          folder,
          recursive: true,
          extensions: ['mp4', 'mov', 'avi', 'mkv']
        }
      })
      
      setFiles(result)
      return result
    } catch (error) {
      console.error('Scan failed:', error)
      throw error
    } finally {
      setIsScanning(false)
      unlisten()
    }
  }, [])

  return {
    scanFolder,
    isScanning,
    progress,
    files
  }
}
```

## 📢 Events

### Sending Events from Rust

```rust
// Event types
#[derive(Clone, Serialize)]
#[serde(tag = "type")]
pub enum AppEvent {
    ExportProgress {
        progress: f32,
        eta: Option<u32>,
        stage: String,
    },
    MediaProcessed {
        file_id: String,
        thumbnail: String,
        metadata: MediaMetadata,
    },
    ErrorOccurred {
        error: String,
        recoverable: bool,
    },
}

// Sending events
impl AppState {
    pub fn emit_event(&self, event: AppEvent) -> Result<()> {
        self.window.emit("app-event", event)?;
        Ok(())
    }
}

// Usage in video export
pub async fn export_video(
    settings: ExportSettings,
    state: State<'_, AppState>,
) -> Result<String> {
    let mut encoder = VideoEncoder::new(settings);
    
    // Subscribe to FFmpeg progress
    encoder.on_progress(move |progress| {
        state.emit_event(AppEvent::ExportProgress {
            progress: progress.percent,
            eta: progress.eta_seconds,
            stage: progress.stage.to_string(),
        }).ok();
    });
    
    let output = encoder.encode().await?;
    Ok(output)
}
```

### Handling Events in React

```typescript
// hooks/useAppEvents.ts
export function useAppEvents() {
  useEffect(() => {
    const unlistenPromise = listen<AppEvent>('app-event', (event) => {
      switch (event.payload.type) {
        case 'ExportProgress':
          handleExportProgress(event.payload)
          break
        case 'MediaProcessed':
          handleMediaProcessed(event.payload)
          break
        case 'ErrorOccurred':
          handleError(event.payload)
          break
      }
    })

    return () => {
      unlistenPromise.then(unlisten => unlisten())
    }
  }, [])
}

// components/ExportDialog.tsx
export function ExportDialog() {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [eta, setEta] = useState<number | null>(null)

  useEffect(() => {
    const unlisten = listen<ExportProgress>('app-event', (event) => {
      if (event.payload.type === 'ExportProgress') {
        setProgress(event.payload.progress)
        setStage(event.payload.stage)
        setEta(event.payload.eta || null)
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  return (
    <Dialog>
      <Progress value={progress} />
      <p>{stage}</p>
      {eta && <p>ETA: {formatTime(eta)}</p>}
    </Dialog>
  )
}
```

## 📁 File Handling

### File Transfer via Asset Protocol

```rust
// Register asset protocol in Tauri
fn main() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("media", |_app, request| {
            let path = request.uri().path();
            let file_path = percent_decode_str(path)
                .decode_utf8_lossy()
                .to_string();
            
            // Safe path validation
            let file_path = PathBuf::from(file_path);
            if !file_path.exists() {
                return ResponseBuilder::new()
                    .status(404)
                    .body(Vec::new());
            }
            
            // Read file
            match std::fs::read(&file_path) {
                Ok(content) => {
                    let mime_type = get_mime_type(&file_path);
                    ResponseBuilder::new()
                        .header("Content-Type", mime_type)
                        .body(content)
                }
                Err(_) => ResponseBuilder::new()
                    .status(500)
                    .body(Vec::new())
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Usage in React

```typescript
// utils/media.ts
export function getMediaUrl(filePath: string): string {
  // Convert path for asset protocol
  const encoded = encodeURIComponent(filePath)
  return `media://localhost/${encoded}`
}

// components/VideoPlayer.tsx
export function VideoPlayer({ file }: { file: MediaFile }) {
  const videoUrl = getMediaUrl(file.path)
  
  return (
    <video 
      src={videoUrl}
      controls
      onError={(e) => {
        console.error('Video load error:', e)
        // Fallback to another loading method
      }}
    />
  )
}
```

## 🌊 Streaming

### Streaming Large Data

```rust
// Stream scan results
#[tauri::command]
async fn scan_large_folder(
    folder: String,
    window: Window,
) -> Result<(), String> {
    let scanner = MediaScanner::new();
    let mut stream = scanner.scan_stream(&folder).await?;
    
    let mut batch = Vec::new();
    let mut batch_id = 0;
    
    while let Some(file) = stream.next().await {
        batch.push(file);
        
        // Send batches of 100 files
        if batch.len() >= 100 {
            window.emit("scan-batch", ScanBatch {
                id: batch_id,
                files: std::mem::take(&mut batch),
                is_last: false,
            })?;
            batch_id += 1;
        }
    }
    
    // Send last batch
    if !batch.is_empty() {
        window.emit("scan-batch", ScanBatch {
            id: batch_id,
            files: batch,
            is_last: true,
        })?;
    }
    
    Ok(())
}
```

### Handling Streams in React

```typescript
// hooks/useStreamingData.ts
export function useStreamingData<T>() {
  const [data, setData] = useState<T[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const unlisten = listen<ScanBatch>('scan-batch', (event) => {
      setData(prev => [...prev, ...event.payload.files])
      
      if (event.payload.is_last) {
        setIsComplete(true)
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  return { data, isComplete }
}
```

## ❌ Error Handling

### Structured Errors

```rust
// error.rs
#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
    pub recoverable: bool,
}

impl From<ffmpeg::Error> for AppError {
    fn from(err: ffmpeg::Error) -> Self {
        Self {
            code: "FFMPEG_ERROR".to_string(),
            message: err.to_string(),
            details: None,
            recoverable: false,
        }
    }
}

// Usage in commands
#[tauri::command]
async fn risky_operation() -> Result<String, AppError> {
    do_something()
        .map_err(|e| AppError {
            code: "OPERATION_FAILED".to_string(),
            message: e.to_string(),
            details: Some("Check logs for details".to_string()),
            recoverable: true,
        })
}
```

### Error Handling in React

```typescript
// utils/error-handler.ts
export class CommandError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: string,
    public recoverable: boolean = false
  ) {
    super(message)
  }
}

export async function invokeWithErrorHandling<T>(
  command: string,
  args?: any
): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error: any) {
    throw new CommandError(
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred',
      error.details,
      error.recoverable || false
    )
  }
}

// Usage
try {
  const result = await invokeWithErrorHandling('risky_operation')
} catch (error) {
  if (error instanceof CommandError && error.recoverable) {
    // Show dialog with retry option
  } else {
    // Show critical error
  }
}
```

## 🔒 Communication Security

1. **Data Validation** - all data is validated on backend
2. **Command Restriction** - only explicitly allowed commands are accessible
3. **Path Sanitization** - all file paths are verified
4. **Rate Limiting** - command call frequency limitations

---

*For more details, see the [Backend Architecture](BACKEND/OVERVIEW.md) and [Data Flow](DATA_FLOW.md) documentation.*