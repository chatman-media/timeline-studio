# Voice Recording

**English** | [Русский](./README.ru.md)

## Overview
Voice recording module providing microphone recording functionality with device selection, permission management, countdown timer, and multiple audio format support.

## Status
- ✅ **Components**: Fully implemented
- ✅ **Hooks**: Fully implemented
- ✅ **Tests**: Excellent coverage (88.29% components, 72.53% hooks)
- ✅ **Total tests**: 89 tests passing
- ✅ **Tauri Integration**: Fully integrated for file operations

## Structure
```
voice-recording/
├── components/
│   ├── audio-permission-request.tsx
│   └── voice-recording-modal.tsx
├── hooks/
│   ├── use-audio-devices.ts
│   ├── use-audio-permissions.ts
│   └── use-voice-recording.ts
├── types/
│   ├── tauri.ts
│   └── index.ts
├── __tests__/
│   ├── components/
│   └── hooks/
└── __mocks__/
```

## Features
### ✅ Implemented
- [x] MediaDevices API support check
- [x] Audio device selection from available devices
- [x] Audio format selection (WebM, MP3, WAV, OGG, M4A)
- [x] Configurable countdown (0-10 sec)
- [x] Visual recording time indicator
- [x] Recording progress bar (up to 5 minutes)
- [x] Automatic save to project directory
- [x] Integration with ResourcesProvider
- [x] Permission status display
- [x] Access error handling
- [x] Device list refresh
- [x] Automatic resource cleanup

### ❌ Not Implemented
- [ ] Recording quality settings
- [ ] Audio level visualization
- [ ] Noise reduction
- [ ] Automatic gain control
- [ ] E2E tests

## Usage
```typescript
import { VoiceRecordModal, useVoiceRecording } from '@/features/voice-recording'

function RecordButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  } = useVoiceRecording()

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Record Voice
      </Button>
      <VoiceRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
```

## Integration
- **Depends on**: @/features/modals, @/features/resources, @tauri-apps/api
- **Used by**: Media recording workflows

## Testing
- **Total tests**: 89 tests (all passing)
- **Component coverage**: 88.29% (AudioPermissionRequest: 100%, VoiceRecordingModal: 88.89%)
- **Hook coverage**: 72.53% (useVoiceRecording: 58.6%, useAudioPermissions: 85.84%, useAudioDevices: 100%)

```bash
bun run test src/features/voice-recording
```

## TODO / Roadmap
- [ ] Recording quality settings (bitrate, sample rate)
- [ ] Audio level visualization during recording
- [ ] Noise reduction feature
- [ ] Automatic gain control
- [ ] Memory leak checks
- [ ] Cleanup function optimization
- [ ] E2E tests (planned in `e2e/tauri/features/voice-recording/`)
