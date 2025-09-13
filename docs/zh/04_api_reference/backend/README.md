# Backend API (Tauri Commands)

## 📋 Contents

This section contains documentation for Tauri commands - the main way of interaction between Frontend and Backend in Timeline Studio.

### 📁 File System
- **filesystem-commands.md** - File system operation commands
- **project-commands.md** - Project management
- **media-import-commands.md** - Media file import

### 🎬 Video Processing
- **ffmpeg-commands.md** - FFmpeg operations and video processing
- **frame-extraction-commands.md** - Frame extraction from video
- **rendering-commands.md** - Video rendering and compilation
- **gpu-commands.md** - GPU acceleration and optimization

### 🤖 AI Processing
- **recognition-commands.md** - YOLO object and face recognition
- **whisper-commands.md** - Audio transcription with Whisper
- **ai-processing-commands.md** - General AI operations

### 🔧 System Commands
- **system-info-commands.md** - System and hardware information
- **performance-commands.md** - Performance monitoring
- **plugin-commands.md** - Plugin management

## 🔌 Usage

### Calling Commands from Frontend

```typescript
import { invoke } from '@tauri-apps/api/core'

// Simple call
const result = await invoke('command_name', { 
  arg1: 'value1',
  arg2: 'value2' 
})

// With error handling
try {
  const data = await invoke('process_video', {
    inputPath: '/path/to/video.mp4',
    outputPath: '/path/to/output.mp4',
    settings: {
      codec: 'h264',
      bitrate: 5000
    }
  })
  console.log('Success:', data)
} catch (error) {
  console.error('Command failed:', error)
}
```

### Command Typing

```typescript
// types/commands.ts
export interface BackendCommands {
  // File system
  read_file: {
    args: { path: string }
    returns: string
  }
  
  // Video processing
  extract_frame: {
    args: { 
      videoPath: string
      timestamp: number 
    }
    returns: Uint8Array
  }
  
  // AI
  recognize_objects: {
    args: { imagePath: string }
    returns: Recognition[]
  }
}

// Type-safe wrapper
export async function invokeCommand<K extends keyof BackendCommands>(
  command: K,
  args: BackendCommands[K]['args']
): Promise<BackendCommands[K]['returns']> {
  return invoke(command, args)
}
```

## 📊 Performance

- All commands are asynchronous
- Support for cancelling long operations
- Streaming for large data
- Batch processing for optimization

## 🔒 Security

- Validation of all input data
- File path sanitization
- Limited access to system resources
- Encryption of sensitive data

## 🔗 Related Sections

- [Frontend API](../) - Client-side API
- [Backend Architecture](../../03_architecture/backend/) - Architectural documentation
- [Examples](../examples/) - Usage examples

---

*Last updated: July 31, 2025*