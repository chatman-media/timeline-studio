# Backend API (Tauri Commands)

## 📋 Содержание

Этот раздел содержит документацию по Tauri командам - основному способу взаимодействия между Frontend и Backend в Timeline Studio.

### 📁 Файловая система
- **filesystem-commands.md** - Команды работы с файловой системой
- **project-commands.md** - Управление проектами
- **media-import-commands.md** - Импорт медиафайлов

### 🎬 Обработка видео
- **ffmpeg-commands.md** - FFmpeg операции и обработка видео
- **frame-extraction-commands.md** - Извлечение кадров из видео
- **rendering-commands.md** - Рендеринг и компиляция видео
- **gpu-commands.md** - GPU ускорение и оптимизация

### 🤖 AI обработка
- **recognition-commands.md** - YOLO распознавание объектов и лиц
- **whisper-commands.md** - Транскрипция аудио с Whisper
- **ai-processing-commands.md** - Общие AI операции

### 🔧 Системные команды
- **system-info-commands.md** - Информация о системе и оборудовании
- **performance-commands.md** - Мониторинг производительности
- **plugin-commands.md** - Управление плагинами

## 🔌 Использование

### Вызов команды из Frontend

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('Readme')

import { invoke } from '@tauri-apps/api/core'

// Простой вызов
const result = await invoke('command_name', { 
  arg1: 'value1',
  arg2: 'value2' 
})

// С обработкой ошибок
try {
  const data = await invoke('process_video', {
    inputPath: '/path/to/video.mp4',
    outputPath: '/path/to/output.mp4',
    settings: {
      codec: 'h264',
      bitrate: 5000
    }
  })
  logger.infoSync('Success:', data)
} catch (error) {
  logger.errorSync('Command failed:', error)
}
```

### Типизация команд

```typescript
// types/commands.ts
export interface BackendCommands {
  // Файловая система
  read_file: {
    args: { path: string }
    returns: string
  }
  
  // Обработка видео
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

// Типобезопасный wrapper
export async function invokeCommand<K extends keyof BackendCommands>(
  command: K,
  args: BackendCommands[K]['args']
): Promise<BackendCommands[K]['returns']> {
  return invoke(command, args)
}
```

## 📊 Производительность

- Все команды асинхронные
- Поддержка отмены длительных операций
- Streaming для больших данных
- Батч-обработка для оптимизации

## 🔒 Безопасность

- Валидация всех входных данных
- Санитизация путей к файлам
- Ограничение доступа к системным ресурсам
- Шифрование чувствительных данных

## 🔗 Связанные разделы

- [Frontend API](../) - Клиентская часть API
- [Архитектура Backend](../../03_architecture/backend/) - Архитектурная документация
- [Примеры](../examples/) - Примеры использования

---

*Последнее обновление: 31 июля 2025*