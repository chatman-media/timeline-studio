# Сохранение и восстановление медиафайлов в проектах

**Статус**: ✅ Реализовано (17 июня 2025)

## Обзор

Система сохранения и восстановления медиафайлов позволяет Timeline Studio сохранять ссылки на импортированные медиафайлы в файлах проектов (.tls) и автоматически восстанавливать их при открытии проекта. Это обеспечивает сохранение состояния медиабиблиотеки между сессиями работы.

## Архитектура

### Основные компоненты

1. **Типы данных** (`src/types/saved-media.ts`)

   - `SavedMediaFile` - структура для сохранения медиафайлов
   - `SavedMusicFile` - расширение для музыкальных файлов с метаданными
   - `ProjectMediaLibrary` - медиабиблиотека проекта
   - `ProjectFile` - полная структура файла проекта

2. **Утилиты** (`src/lib/saved-media-utils.ts`)

   - Конвертация между типами MediaFile и SavedMediaFile
   - Генерация уникальных ID файлов
   - Валидация целостности файлов
   - Работа с относительными путями

3. **Сервисы**

   - `ProjectFileService` - загрузка/сохранение проектов
   - `MediaRestorationService` - восстановление медиафайлов

4. **UI компоненты**
   - `MissingFilesDialog` - диалог для обработки отсутствующих файлов
   - `useMediaRestoration` - хук для управления восстановлением

## Процесс сохранения медиафайлов

### 1. Импорт медиафайлов

При импорте медиафайлов через `useMediaImport` или `useMusicImport`:

```typescript
// Автоматическое сохранение при импорте
const saveFilesToProject = async (files: MediaFile[]) => {
  if (!currentProject.path || files.length === 0) return;

  // Конвертируем MediaFile в SavedMediaFile
  const savedFiles = await Promise.all(
    files.map((file) => convertToSavedMediaFile(file, currentProject.path)),
  );

  // Отмечаем проект как измененный
  setProjectDirty(true);
};
```

### 2. Структура сохраненного файла

```typescript
interface SavedMediaFile {
  id: string; // Уникальный ID файла
  originalPath: string; // Оригинальный путь к файлу
  relativePath?: string; // Относительный путь (если в поддиректории проекта)
  name: string; // Имя файла
  size: number; // Размер файла
  lastModified: number; // Время последней модификации
  isVideo: boolean; // Тип файла
  isAudio: boolean;
  isImage: boolean;
  metadata: {
    // Метаданные файла
    duration?: number;
    startTime?: number;
    createdAt?: string;
    probeData?: FfprobeData;
  };
  status: FileStatus; // Статус файла
  lastChecked: number; // Время последней проверки
}
```

### 3. Сохранение в проект

При сохранении проекта через `ProjectFileService.saveProject()`:

```typescript
const projectData: ProjectFile = {
  settings: {
    /* настройки проекта */
  },
  mediaLibrary: {
    mediaFiles: savedMediaFiles, // Сохраненные медиафайлы
    musicFiles: savedMusicFiles, // Сохраненные музыкальные файлы
    lastUpdated: Date.now(),
    version: "1.0.0",
  },
  browserState: {
    /* состояние браузера */
  },
  projectFavorites: {
    /* избранные файлы */
  },
  meta: {
    /* метаданные проекта */
  },
};
```

## Процесс восстановления медиафайлов

### 1. Открытие проекта

При открытии проекта через `AppSettingsProvider.openProject()`:

```typescript
// Загружаем содержимое проекта
const projectData = await ProjectFileService.loadProject(path);

// Восстанавливаем медиафайлы
if (projectData.mediaLibrary) {
  const restorationResult = await restoreProjectMedia(
    projectData.mediaLibrary.mediaFiles || [],
    projectData.mediaLibrary.musicFiles || [],
    path,
    { showDialog: true },
  );
}
```

### 2. Алгоритм восстановления

Для каждого сохраненного файла выполняется многоуровневый поиск:

#### Этап 1: Проверка по оригинальному пути

```typescript
const originalExists = await fileExists(savedFile.originalPath);
if (originalExists) {
  const validation = await validateFileIntegrity(
    savedFile.originalPath,
    savedFile,
  );
  if (validation.isValid) {
    // Файл найден и валиден
    return { status: "found", restoredFile };
  }
}
```

#### Этап 2: Проверка по относительному пути

```typescript
if (savedFile.relativePath) {
  const relativePath = await join(projectDir, savedFile.relativePath);
  const relativeExists = await fileExists(relativePath);
  if (relativeExists && validation.isValid) {
    // Файл найден по относительному пути
    return { status: "relocated", restoredFile, newPath: relativePath };
  }
}
```

#### Этап 3: Поиск в альтернативных местах

```typescript
const alternativePaths = [
  await join(projectDir, fileName), // В корне проекта
  await join(projectDir, "media", fileName), // В папке media
  await join(projectDir, "assets", fileName), // В папке assets
  await join(projectDir, "files", fileName), // В папке files
];

// Дополнительно используем системный поиск для глубокого поиска
const foundPaths = await searchFilesByName(projectDir, fileName, 3); // Максимум 3 уровня
alternativePaths.push(...foundPaths);

for (const altPath of alternativePaths) {
  if ((await fileExists(altPath)) && validation.isValid) {
    return { status: "relocated", restoredFile, newPath: altPath };
  }
}
```

#### Этап 4: Пользовательский выбор

Если файл не найден автоматически, показывается диалог `MissingFilesDialog`.

### 3. Валидация целостности файлов

```typescript
const validateFileIntegrity = async (
  filePath: string,
  saved: SavedMediaFile,
) => {
  const issues: string[] = [];
  let confidence = 1.0;

  // Проверяем размер файла
  if (stats.size !== saved.size) {
    issues.push(`File size mismatch`);
    confidence -= 0.3;
  }

  // Проверяем время модификации (с погрешностью 1 секунда)
  if (Math.abs(stats.lastModified - saved.lastModified) > 1000) {
    issues.push(`Modification date mismatch`);
    confidence -= 0.2;
  }

  // Проверяем имя файла
  if (currentName !== saved.name) {
    issues.push(`Filename mismatch`);
    confidence -= 0.1;
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    issues,
  };
};
```

## Диалог обработки отсутствующих файлов

### Функциональность

`MissingFilesDialog` предоставляет пользователю следующие возможности:

1. **Найти файл** - открыть диалог выбора файла
2. **Удалить из проекта** - удалить ссылку на файл
3. **Пропустить** - оставить файл как отсутствующий

### Интерфейс

```typescript
interface MissingFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFiles: SavedMediaFile[];
  onResolve: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => void;
}
```

### Состояния файлов

- **Pending** (⚠️) - ожидает действия пользователя
- **Found** (✅) - файл найден пользователем
- **Remove** (🗑️) - файл будет удален из проекта
- **Skip** (❌) - файл пропущен

## Генерация уникальных ID

Каждый медиафайл получает уникальный ID на основе:

```typescript
const generateFileId = (filePath: string, metadata: any): string => {
  const data = `${filePath}:${metadata.size || 0}:${metadata.lastModified || Date.now()}`;
  const hash = btoa(data)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 24);
  return hash || `fallback_${Date.now()}`;
};
```

Это обеспечивает:

- Уникальность ID для разных файлов
- Стабильность ID для одного файла
- Детекцию изменений файла

## Относительные пути

Для файлов, находящихся в поддиректориях проекта, сохраняются относительные пути:

```typescript
const calculateRelativePath = async (filePath: string, projectPath: string) => {
  const projectDir = await dirname(projectPath);

  if (filePath.startsWith(projectDir)) {
    // Убираем путь к директории проекта
    const relativePath = filePath
      .substring(projectDir.length)
      .replace(/^[/\\]/, "");
    return relativePath || undefined;
  }

  return undefined;
};
```

Это позволяет:

- Переносить проекты между компьютерами
- Сохранять структуру файлов проекта
- Автоматически находить файлы при изменении расположения проекта

## Обработка ошибок

### Graceful Degradation

Система спроектирована так, чтобы ошибки не прерывали работу:

1. **Ошибки загрузки проекта** - проект открывается без медиафайлов
2. **Ошибки восстановления** - показываются предупреждения, но проект работает
3. **Отсутствующие файлы** - предлагается диалог для решения проблемы

### Логирование

Все операции логируются для отладки:

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaProjectPersistence')

logger.infoSync("Начинаем восстановление медиафайлов...");
logger.infoSync("Медиафайлы восстановлены:", restorationResult.stats);
logger.warnSync("Файл не найден:", savedFile.originalPath);
logger.errorSync("Ошибка при восстановлении:", error);
```

## Производительность

### Оптимизации

1. **Batch операции** - файлы обрабатываются группами
2. **Кэширование** - результаты проверок кэшируются
3. **Ленивая загрузка** - метаданные загружаются по требованию
4. **Прогрессивное восстановление** - UI не блокируется

### Ограничения

- Максимум 1000 файлов в проекте (рекомендация)
- Таймаут 30 секунд на операцию восстановления
- Размер файла проекта до 10 МБ

## Миграция и совместимость

### Версионирование

Проекты имеют версию формата:

```typescript
meta: {
  version: "1.0.0",
  createdAt: Date.now(),
  lastModified: Date.now(),
  originalPlatform: "darwin" | "win32" | "linux"
}
```

### Миграция

При открытии проектов старых версий выполняется автоматическая миграция:

```typescript
const migrateProject = (project: ProjectFile): ProjectFile => {
  // Логика миграции между версиями
  return project;
};
```

## Тестирование

Система покрыта unit-тестами:

- `saved-media-utils.test.ts` - тестирование утилит
- Моки для Tauri API
- Тестирование ошибочных сценариев
- Валидация типов данных

## Безопасность

### Валидация данных

Все загружаемые данные проходят валидацию:

```typescript
const validateProjectStructure = (project: any): void => {
  if (!project || typeof project !== "object") {
    throw new Error("Invalid project structure");
  }

  if (!project.settings || !project.meta) {
    throw new Error("Missing required fields");
  }

  // Дополнительные проверки...
};
```

### Ограничения доступа

- Файлы проектов доступны только для чтения/записи
- Медиафайлы проверяются на существование перед доступом
- Пути к файлам санитизируются

## Будущие улучшения

1. **Автоматическое обновление путей** - при перемещении файлов
2. **Облачная синхронизация** - сохранение проектов в облаке
3. **Умный поиск** - поиск файлов по содержимому
4. **Предпросмотр** - миниатюры в диалоге восстановления
5. **Batch операции** - массовое перемещение файлов

## Итоги реализации

Функциональность полностью реализована и включает:

✅ **Сохранение медиафайлов** - все импортированные файлы сохраняются в структуре `MediaPool`
✅ **Восстановление при загрузке** - автоматическое восстановление файлов при открытии проекта
✅ **Обработка отсутствующих файлов** - диалог `MissingFilesDialog` для решения проблем
✅ **Умный поиск файлов** - многоуровневый алгоритм поиска перемещенных файлов
✅ **Относительные пути** - поддержка переносимости проектов
✅ **Валидация целостности** - проверка размера, даты модификации и имени файла
✅ **Новый формат проекта v2** - использование структуры `MediaPool` с метаданными
✅ **Миграция старых проектов** - автоматическая конвертация из старого формата

Система успешно работает в production и обеспечивает надежное сохранение состояния медиабиблиотеки между сессиями работы.
