# Утилиты для тестирования Tauri аудио компонентов

Этот набор утилит предназначен для тестирования аудио компонентов в Tauri приложении с использованием Vitest и React Testing Library.

## Основные возможности

### 🎵 Мокирование аудио данных

- Создание реалистичных MP3 данных для тестирования
- Мокирование Tauri API для чтения файлов
- Поддержка различных форматов аудио

### 🔊 Web Audio API моки

- Полная имитация AudioContext
- Мокирование MediaRecorder
- Поддержка аудио визуализации

### 🎮 Симуляция аудио событий

- Загрузка, воспроизведение, пауза
- Обработка ошибок
- Управление временем воспроизведения

## Использование

### Базовая настройка

```typescript
import { setupAudioTestEnvironment } from "@/test/utils/tauri-audio-test-utils";

describe("AudioComponent", () => {
  let testEnv: ReturnType<typeof setupAudioTestEnvironment>;

  beforeEach(() => {
    testEnv = setupAudioTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  // Ваши тесты здесь
});
```

### Создание тестовых данных

```typescript
import {
  createMockAudioFile,
  createMockAudioData,
} from "@/test/utils/tauri-audio-test-utils";

// Создание мок аудио файла
const audioFile = createMockAudioFile({
  name: "test-song.mp3",
  path: "/music/test-song.mp3",
  duration: 180,
});

// Создание мок аудио данных
const audioData = createMockAudioData(1024);
```

### Симуляция аудио событий

```typescript
import {
  simulateAudioLoad,
  simulateAudioPlay,
  simulateAudioPause,
  simulateAudioEnd,
  simulateAudioError,
} from "@/test/utils/tauri-audio-test-utils";

// Симуляция загрузки
await simulateAudioLoad(audioElement);

// Симуляция воспроизведения
await simulateAudioPlay(audioElement);

// Симуляция паузы
await simulateAudioPause(audioElement);

// Симуляция окончания
await simulateAudioEnd(audioElement);

// Симуляция ошибки
await simulateAudioError(audioElement, 4); // MEDIA_ELEMENT_ERROR
```

## API Reference

### setupAudioTestEnvironment()

Создает полную среду для тестирования аудио компонентов.

**Возвращает:**

```typescript
{
  webAudio: {
    AudioContext: MockedFunction,
    MediaRecorder: MockedFunction,
  },
  tauri: {
    readFile: MockedFunction,
    convertFileSrc: MockedFunction,
  },
  url: {
    createObjectURL: MockedFunction,
    revokeObjectURL: MockedFunction,
  },
  cleanup: () => void,
}
```

### createMockAudioFile(options?)

Создает мок объект аудио файла.

**Параметры:**

- `name?: string` - Имя файла (по умолчанию: "test-audio.mp3")
- `path?: string` - Путь к файлу (по умолчанию: "/path/to/test-audio.mp3")
- `duration?: number` - Длительность в секундах (по умолчанию: 180)
- `size?: number` - Размер файла в байтах (по умолчанию: 3MB)

### createMockAudioData(size?)

Создает реалистичные аудио данные в формате Uint8Array.

**Параметры:**

- `size?: number` - Размер данных в байтах (по умолчанию: 1024)

### createAudioElementMock()

Создает мок для HTMLAudioElement с полным набором методов и свойств.

### waitForAudioContextInit(delay?)

Ждет инициализации аудио контекста (имитирует setTimeout в компоненте).

**Параметры:**

- `delay?: number` - Задержка в миллисекундах (по умолчанию: 150)

## Примеры тестов

### Тестирование загрузки аудио

```typescript
it("should load audio file and create blob URL", async () => {
  render(<AudioPreview file={audioFile} />);

  await waitFor(() => {
    expect(testEnv.url.createObjectURL).toHaveBeenCalled();
  });

  const audioElement = document.querySelector("audio");
  expect(audioElement).not.toBeNull();
});
```

### Тестирование воспроизведения

```typescript
it("should play audio on click", async () => {
  const { container } = render(<AudioPreview file={audioFile} />);

  const audioElement = container.querySelector("audio") as HTMLAudioElement;
  const mockAudio = createAudioElementMock();

  audioElement.play = mockAudio.play;

  const containerDiv = container.firstChild as HTMLElement;
  fireEvent.click(containerDiv);

  expect(mockAudio.play).toHaveBeenCalled();
});
```

### Тестирование обработки ошибок

```typescript
it("should handle audio loading error", async () => {
  testEnv.tauri.readFile.mockRejectedValueOnce(new Error("File not found"));

  render(<AudioPreview file={audioFile} />);

  await waitFor(() => {
    expect(testEnv.tauri.convertFileSrc).toHaveBeenCalledWith(audioFile.path);
  });
});
```

## Интеграция с Context7

Утилиты совместимы с Context7 MCP и могут использоваться для тестирования компонентов, которые взаимодействуют с внешними API или сервисами.

### Мокирование внешних сервисов

```typescript
// Мокирование Context7 API
vi.mock("@context7/api", () => ({
  analyzeAudio: vi.fn().mockResolvedValue({
    duration: 180,
    format: "mp3",
    bitrate: 320,
  }),
}));
```

## Лучшие практики

1. **Всегда очищайте моки** после каждого теста с помощью `testEnv.cleanup()`
2. **Используйте waitFor** для асинхронных операций
3. **Мокайте только необходимые части** API для конкретного теста
4. **Тестируйте как успешные сценарии, так и ошибки**
5. **Проверяйте очистку ресурсов** при размонтировании компонентов

## Устранение неполадок

### Проблема: "AudioContext is not defined"

**Решение:** Убедитесь, что вы используете `setupAudioTestEnvironment()` в beforeEach

### Проблема: "MediaRecorder.isTypeSupported is not a function"

**Решение:** Моки в setup.ts уже включают этот метод

### Проблема: Тесты не ждут асинхронные операции

**Решение:** Используйте `waitFor` и `waitForAudioContextInit`

## Совместимость

- ✅ Vitest
- ✅ React Testing Library
- ✅ Tauri v2
- ✅ Web Audio API
- ✅ Context7 MCP
- ✅ TypeScript
