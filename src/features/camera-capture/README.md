# Camera Capture Module

Модуль для захвата видео с камеры с поддержкой выбора устройств, настройки качества и записи.

## API (Backend Commands)

This module is frontend-only and does not use Tauri backend commands. It uses Web APIs:
- `navigator.mediaDevices` - Camera and microphone access
- `MediaRecorder` - Video recording
- `Screen Capture API` - Screen recording

## 🎥 Возможности

### ✅ Реализовано
- **Выбор устройств** - Выбор камеры и микрофона из доступных
- **Разрешения** - Запрос и управление разрешениями на доступ к камере/микрофону
- **Настройки качества** - Выбор разрешения и FPS с учетом возможностей устройства
- **Запись видео** - Запись в формате WebM с превью в реальном времени
- **Запись экрана** - Захват экрана, окна или вкладки браузера
- **UI/UX** - Полноценный интерфейс с превью и настройками
- **Локализация** - Поддержка 15 языков

### ⏳ В разработке
- **Сохранение записи** - Интеграция с медиатекой приложения
- **Фильтры и эффекты** - Применение эффектов в реальном времени
- **Расширенные настройки** - Битрейт, кодеки, форматы

## 📁 Структура модуля

```
camera-capture/
├── components/
│   ├── camera-capture-modal.tsx    # Главное модальное окно
│   ├── camera-preview.tsx          # Компонент превью видео
│   ├── camera-settings.tsx         # Панель настроек
│   ├── recording-controls.tsx      # Кнопки управления записью
│   └── camera-permission-request.tsx # Запрос разрешений
├── hooks/
│   ├── use-camera-stream.ts        # Управление видеопотоком
│   ├── use-devices.ts              # Работа с устройствами
│   ├── use-recording.ts            # Логика записи
│   ├── use-screen-capture.ts       # Запись экрана
│   └── camera-capture-hooks.ts     # Дополнительные хуки
├── __tests__/                      # Тесты
└── index.ts                        # Экспорт
```

## 🔧 Использование

### Основной компонент

```tsx
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

### Хуки

#### useDevices - Управление устройствами
```tsx
const {
  videoDevices,      // Список камер
  audioDevices,      // Список микрофонов
  selectedVideoId,   // ID выбранной камеры
  selectedAudioId,   // ID выбранного микрофона
  setSelectedVideoId,
  setSelectedAudioId,
  refreshDevices     // Обновить список устройств
} = useDevices()
```

#### useCameraStream - Управление видеопотоком
```tsx
const {
  stream,           // MediaStream
  isLoading,        // Загрузка потока
  error,            // Ошибка
  startStream,      // Запустить поток
  stopStream        // Остановить поток
} = useCameraStream({ 
  videoDeviceId, 
  audioDeviceId,
  constraints       // MediaStreamConstraints
})
```

#### useRecording - Запись видео
```tsx
const {
  isRecording,      // Идет запись
  isPaused,         // Пауза
  recordingTime,    // Время записи в секундах
  startRecording,   // Начать запись
  stopRecording,    // Остановить и получить Blob
  pauseRecording,   // Пауза
  resumeRecording   // Продолжить
} = useRecording(mediaStream)
```

#### useScreenCapture - Запись экрана
```tsx
const {
  screenStream,       // MediaStream экрана
  isScreenSharing,    // Идет запись экрана
  error,              // Ошибка
  startScreenCapture, // Начать запись экрана
  stopScreenCapture,  // Остановить запись
  getSourceInfo       // Получить информацию об источнике
} = useScreenCapture()
```

## 🎨 Компоненты

### CameraPreview
Отображает видеопоток с камеры
```tsx
<CameraPreview 
  stream={mediaStream}
  isRecording={true}
  recordingTime={45}
/>
```

### CameraSettings
Панель настроек камеры
```tsx
<CameraSettings
  videoDevices={devices}
  audioDevices={audioDevices}
  selectedVideoId={videoId}
  selectedAudioId={audioId}
  onVideoChange={setVideoId}
  onAudioChange={setAudioId}
  capabilities={capabilities}
/>
```

### RecordingControls
Кнопки управления записью
```tsx
<RecordingControls
  isRecording={isRecording}
  isPaused={isPaused}
  canStart={!!stream}
  onStart={startRecording}
  onStop={stopRecording}
  onPause={pauseRecording}
  onResume={resumeRecording}
/>
```

## 🔌 Интеграция

Модуль интегрирован в TopBar через кнопку с иконкой камеры:
```tsx
// src/features/top-bar/components/top-bar.tsx
<Button onClick={() => setIsCameraCaptureOpen(true)}>
  <Camera className="h-4 w-4" />
</Button>
```

## 🌐 Локализация

Все тексты локализованы через i18n:
```json
{
  "cameraCapture": {
    "title": "Запись с камеры",
    "selectCamera": "Выберите камеру",
    "selectMicrophone": "Выберите микрофон",
    "startRecording": "Начать запись",
    "stopRecording": "Остановить",
    ...
  }
}
```

## 🧪 Тестирование

### Покрытие тестами
- **Компоненты**: 95.39% покрытие
- **Хуки**: 72.9% покрытие
- **Общее количество тестов**: 68 тестов
- **Время выполнения**: ~1.4 секунд

### Test Behavior (from test suites)

#### use-screen-capture.test.ts
- ✓ Should initialize with default values
- ✓ Should start screen capture successfully
- ✓ Should handle permission denied error
- ✓ Should handle user cancellation
- ✓ Should stop screen capture
- ✓ Should handle ended event from video track
- ✓ Should get source info
- ✓ Should accept custom constraints

#### use-devices.test.ts
- ✓ Should initialize with empty devices
- ✓ Should get devices when getDevices is called
- ✓ Should handle empty device labels
- ✓ Should set selected device
- ✓ Should set selected audio device
- ✓ Should handle error when enumerateDevices fails

#### use-recording.test.ts
- ✓ Should initialize with default values
- ✓ Should set countdown
- ✓ Should start countdown
- ✓ Should have stopRecording method
- ✓ Should have recordingTime property
- ✓ Should format recording time correctly

#### use-camera-stream.test.ts
- ✓ Should initialize with isDeviceReady false
- ✓ Should initialize camera and set isDeviceReady to true
- ✓ Should handle error when getUserMedia fails
- ✓ Should try fallback constraints when initial getUserMedia fails
- ✓ Should stop tracks when setIsDeviceReady is set to false

#### camera-capture-hooks.test.ts
**useCameraPermissions:**
- ✓ Should initialize with pending status
- ✓ Should set status to granted when permissions are granted
- ✓ Should set status to denied when permissions are denied
- ✓ Should set status to error when device not found

**useDeviceCapabilities:**
- ✓ Should initialize with empty resolutions and loading false
- ✓ Should get device capabilities and set resolutions
- ✓ Should use common resolutions when getCapabilities is not supported
- ✓ Should handle errors when getting device capabilities

#### camera-settings.test.tsx
- ✓ Renders all settings correctly
- ✓ Calls onDeviceChange when device select changes
- ✓ Calls onAudioDeviceChange when audio device select changes
- ✓ Calls onResolutionChange when resolution select changes
- ✓ Calls onFrameRateChange when frame rate select changes
- ✓ Calls onCountdownChange when countdown input changes
- ✓ Disables controls when isRecording is true
- ✓ Shows loading state when isLoadingCapabilities is true

#### camera-capture-modal-screen.test.tsx (Screen Recording)
- ✓ Should render mode switch buttons
- ✓ Should switch to screen mode when Screen button is clicked
- ✓ Should show screen settings when in screen mode
- ✓ Should hide camera settings when in screen mode
- ✓ Should stop screen capture when switching back to camera
- ✓ Should show error message if screen capture fails
- ✓ Should disable mode switch buttons when recording

#### camera-permission-request.test.tsx
- ✓ Renders pending state
- ✓ Renders denied state with retry button
- ✓ Renders denied state with empty error message
- ✓ Renders error state with custom error message
- ✓ Renders granted state
- ✓ Handles unknown permission status

#### recording-controls.test.tsx
- ✓ Renders start recording button when not recording
- ✓ Renders stop recording button when recording
- ✓ Disables start button when device is not ready
- ✓ Calls onStartRecording when start button is clicked
- ✓ Calls onStopRecording when stop button is clicked
- ✓ Formats recording time correctly

#### camera-capture-modal.test.tsx
- ✓ Renders all components correctly
- ✓ Renders with correct layout

#### camera-preview.test.tsx
- ✓ Renders loading state when device is not ready
- ✓ Renders video element when device is ready
- ✓ Shows countdown when showCountdown is true and countdown > 0
- ✓ Does not show countdown when showCountdown is false
- ✓ Does not show countdown when countdown is 0
- ✓ Sets correct video attributes

```bash
# Запустить тесты модуля
bun test src/features/camera-capture

# С покрытием
bun test:coverage src/features/camera-capture
```

## 📝 Примечания

- Запись происходит в формате WebM (VP8/VP9)
- Поддерживаются только современные браузеры с MediaRecorder API
- Для работы требуется HTTPS или localhost
- Разрешения запрашиваются при первом использовании

## 🎭 E2E Tests / E2E Тесты

**Расположение:** `e2e/tauri/features/camera-capture/`

### Чеклист тестов

| Тест | Приоритет | Статус | Файл |
|------|-----------|--------|------|
| Открытие модального окна Camera Capture | 🔴 High | ⏳ Planned | - |
| Запрос разрешений камеры/микрофона | 🔴 High | ⏳ Planned | - |
| Отображение списка камер | 🔴 High | ⏳ Planned | - |
| Отображение списка микрофонов | 🔴 High | ⏳ Planned | - |
| Выбор устройства камеры | 🔴 High | ⏳ Planned | - |
| Выбор устройства микрофона | 🔴 High | ⏳ Planned | - |
| Запуск видеопотока (startStream) | 🔴 High | ⏳ Planned | - |
| Отображение превью камеры | 🔴 High | ⏳ Planned | - |
| Начало записи видео | 🔴 High | ⏳ Planned | - |
| Остановка записи видео | 🔴 High | ⏳ Planned | - |
| Пауза/возобновление записи | 🟡 Medium | ⏳ Planned | - |
| Отображение таймера записи | 🟡 Medium | ⏳ Planned | - |
| Countdown перед записью | 🟢 Low | ⏳ Planned | - |
| Смена разрешения видео | 🟡 Medium | ⏳ Planned | - |
| Смена FPS | 🟡 Medium | ⏳ Planned | - |
| Переключение на запись экрана | 🔴 High | ⏳ Planned | - |
| Запуск screen capture | 🔴 High | ⏳ Planned | - |
| Выбор источника (окно/вкладка/экран) | 🔴 High | ⏳ Planned | - |
| Остановка screen capture | 🔴 High | ⏳ Planned | - |
| Сохранение записанного видео | 🔴 High | ⏳ Planned | - |
| Интеграция с медиатекой | 🟡 Medium | ⏳ Planned | - |
| Error handling (нет камеры) | 🟡 Medium | ⏳ Planned | - |
| Error handling (отказ в разрешениях) | 🔴 High | ⏳ Planned | - |
| Закрытие модального окна | 🟡 Medium | ⏳ Planned | - |
| Остановка потоков при закрытии | 🔴 High | ⏳ Planned | - |

### Примечания
- Camera Capture не использует прямые Tauri команды
- Использует Web APIs: MediaDevices, MediaRecorder, Screen Capture API
- Важно тестировать работу с разрешениями (camera/microphone)
- Требуется проверка сохранения записи через Tauri файловую систему
- Тесты должны покрывать оба режима: камера и запись экрана