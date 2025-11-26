# Camera Capture

**English** | [Русский](./README.ru.md)

## Overview

The Camera Capture module provides video recording functionality from camera and screen with device selection, quality settings, and real-time preview. Uses Web APIs for media capture without backend dependencies.

## Status

- ✅ **Components**: Complete UI with modal, preview, settings, and controls
- ✅ **Hooks**: Camera stream, device management, recording, screen capture
- ✅ **Services**: Web API based (MediaDevices, MediaRecorder, Screen Capture API)
- ✅ **Tests**: 68 tests passing, 95.39% component coverage, 72.9% hooks coverage

## Structure

```
camera-capture/
├── components/
│   ├── camera-capture-modal.tsx       # Main modal window
│   ├── camera-preview.tsx             # Video preview component
│   ├── camera-settings.tsx            # Settings panel
│   ├── recording-controls.tsx         # Recording control buttons
│   └── camera-permission-request.tsx  # Permission request UI
├── hooks/
│   ├── use-camera-stream.ts           # Video stream management
│   ├── use-devices.ts                 # Device enumeration
│   ├── use-recording.ts               # Recording logic
│   ├── use-screen-capture.ts          # Screen recording
│   └── camera-capture-hooks.ts        # Additional hooks
└── __tests__/                         # Test files
```

## Features

### ✅ Implemented

- [x] **Device Selection**: Choose camera and microphone from available devices
- [x] **Permissions**: Request and manage camera/microphone access
- [x] **Quality Settings**: Select resolution and FPS based on device capabilities
- [x] **Video Recording**: Record in WebM format with real-time preview
- [x] **Screen Recording**: Capture screen, window, or browser tab
- [x] **UI/UX**: Complete interface with preview and settings
- [x] **Localization**: Support for 15 languages
- [x] **Mode Switch**: Toggle between camera and screen capture

### ❌ Not Implemented

- [ ] Save recording to media library
- [ ] Real-time filters and effects
- [ ] Advanced settings (bitrate, codecs, formats)
- [ ] Pause/resume recording functionality
- [ ] Recording time limits

## Usage

### Main Component

```typescript
import { CameraCaptureModal } from '@/features/camera-capture'

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <CameraCaptureModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

### Hooks

#### useDevices - Device Management

```typescript
const {
  videoDevices,      // List of cameras
  audioDevices,      // List of microphones
  selectedVideoId,   // Selected camera ID
  selectedAudioId,   // Selected microphone ID
  setSelectedVideoId,
  setSelectedAudioId,
  refreshDevices     // Refresh device list
} = useDevices()
```

#### useCameraStream - Video Stream Management

```typescript
const {
  stream,           // MediaStream
  isLoading,        // Stream loading
  error,            // Error
  startStream,      // Start stream
  stopStream        // Stop stream
} = useCameraStream({
  videoDeviceId,
  audioDeviceId,
  constraints       // MediaStreamConstraints
})
```

#### useRecording - Video Recording

```typescript
const {
  isRecording,      // Recording in progress
  isPaused,         // Paused
  recordingTime,    // Recording time in seconds
  startRecording,   // Start recording
  stopRecording,    // Stop and get Blob
  pauseRecording,   // Pause
  resumeRecording   // Resume
} = useRecording(mediaStream)
```

#### useScreenCapture - Screen Recording

```typescript
const {
  screenStream,       // Screen MediaStream
  isScreenSharing,    // Screen recording in progress
  error,              // Error
  startScreenCapture, // Start screen capture
  stopScreenCapture,  // Stop screen capture
  getSourceInfo       // Get source information
} = useScreenCapture()
```

## Integration

- **Depends on**:
  - Web APIs: `navigator.mediaDevices`, `MediaRecorder`, Screen Capture API
  - `@/features/top-bar` - Camera button integration
  - `@/i18n` - Localization

- **Used by**:
  - `@/features/top-bar` - Camera capture button
  - `@/features/media-studio` - Main interface

## Testing

- **Total tests**: 68
- **Component coverage**: 95.39%
- **Hooks coverage**: 72.9%
- **Execution time**: ~1.4 seconds

### Test Suites

**use-screen-capture.test.ts**:
- ✓ Initialize with default values
- ✓ Start/stop screen capture
- ✓ Handle permission denied and user cancellation
- ✓ Handle ended event from video track
- ✓ Get source info and accept custom constraints

**use-devices.test.ts**:
- ✓ Initialize and enumerate devices
- ✓ Handle empty device labels
- ✓ Set selected devices
- ✓ Handle errors

**use-recording.test.ts**:
- ✓ Initialize with default values
- ✓ Set and start countdown
- ✓ Recording time formatting

**use-camera-stream.test.ts**:
- ✓ Initialize camera and handle errors
- ✓ Try fallback constraints
- ✓ Stop tracks when device is disabled

**camera-capture-hooks.test.ts**:
- ✓ Camera permissions (pending, granted, denied, error)
- ✓ Device capabilities and resolutions
- ✓ Handle unsupported getCapabilities

**Component tests**:
- ✓ Settings, controls, preview, modal, permission request
- ✓ Screen recording mode switching
- ✓ Disable controls when recording

Run tests:
```bash
bun test src/features/camera-capture
```

## E2E Tests

**Location**: `e2e/tauri/features/camera-capture/`

**Status**: ⏳ Planned (0 tests implemented)

### Planned
- ⏳ Open camera capture modal
- ⏳ Request camera/microphone permissions
- ⏳ Display camera and microphone lists
- ⏳ Select devices
- ⏳ Start video stream and preview
- ⏳ Start/stop recording
- ⏳ Switch to screen capture mode
- ⏳ Save recorded video
- ⏳ Error handling (no camera, denied permissions)

## TODO / Roadmap

- [ ] Implement saving recordings to media library via Tauri
- [ ] Add pause/resume recording functionality
- [ ] Implement real-time filters and effects
- [ ] Add advanced settings (bitrate, codec selection)
- [ ] Implement recording time limits and warnings
- [ ] Add E2E tests for camera and screen capture
- [ ] Support additional video formats beyond WebM
- [ ] Add audio level visualization
- [ ] Implement picture-in-picture mode

## Technical Notes

- Recording format: WebM (VP8/VP9)
- Requires modern browsers with MediaRecorder API
- HTTPS or localhost required for camera access
- Permissions requested on first use
- macOS permissions configured in `src-tauri/Info.plist`
- CSP policy includes `mediastream:` for Web APIs

## License

Part of Timeline Studio - see root project license.
