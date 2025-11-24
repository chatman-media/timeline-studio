# Справочник API: Система персистентности медиа и структура проекта

## Обзор

Этот документ описывает систему персистентности медиа и структуру проекта Timeline Studio. Включает все API для работы с сохранением и восстановлением медиафайлов в проектах.

## Основные типы

### SavedMediaFile

```typescript
interface SavedMediaFile {
  id: string; // Уникальный идентификатор файла
  originalPath: string; // Оригинальный путь к файлу
  relativePath?: string; // Относительный путь, если внутри директории проекта
  name: string; // Имя файла
  size: number; // Размер файла в байтах
  lastModified: number; // Временная метка последнего изменения
  isVideo: boolean; // Флаги типа файла
  isAudio: boolean;
  isImage: boolean;
  metadata: SavedMediaMetadata; // Метаданные файла
  status: FileStatus; // Текущий статус файла
  lastChecked: number; // Временная метка последней проверки
}
```

### SavedMusicFile

```typescript
interface SavedMusicFile extends SavedMediaFile {
  musicMetadata: MusicMetadata; // Дополнительные метаданные для музыки
}

interface MusicMetadata {
  artist?: string;
  album?: string;
  title?: string;
  genre?: string;
  year?: number;
  track?: number;
}
```

### ProjectFile

```typescript
interface ProjectFile {
  settings: ProjectSettings;
  mediaPool: ProjectMediaPool;
  workspaceSettings: WorkspaceSettings;
  favoriteFiles: ProjectFavorites;
  meta: ProjectMeta;
}

interface ProjectMediaPool {
  mediaFiles: SavedMediaFile[];
  musicFiles: SavedMusicFile[];
  lastUpdated: number;
  version: string;
}
```

## Основные сервисы

### ProjectFileService

Статический сервис для операций с файлами проекта.

#### Методы

```typescript
class ProjectFileService {
  // Загрузить проект из файла
  static async loadProject(projectPath: string): Promise<ProjectFile>;

  // Сохранить проект в файл
  static async saveProject(
    projectPath: string,
    projectData: ProjectFile,
  ): Promise<void>;

  // Создать новую структуру проекта
  static createNewProject(name: string): ProjectFile;

  // Обновить медиатеку в проекте
  static updateMediaLibrary(
    project: ProjectFile,
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
  ): ProjectFile;

  // Обновить состояние браузера в проекте
  static updateBrowserState(
    project: ProjectFile, 
    workspaceSettings: WorkspaceSettings
  ): ProjectFile;

  // Обновить избранные файлы в проекте
  static updateProjectFavorites(
    project: ProjectFile, 
    favorites: ProjectFavorites
  ): ProjectFile;

  // Получить статистику проекта
  static getProjectStats(project: ProjectFile): {
    totalMediaFiles: number;
    totalMusicFiles: number;
    totalSize: number;
    lastModified: number;
  };

  // Проверить наличие несохраненных изменений
  static hasUnsavedChanges(
    project: ProjectFile,
    currentMediaFiles: SavedMediaFile[],
    currentMusicFiles: SavedMusicFile[],
  ): boolean;

  // Мигрировать проект к новой версии
  static migrateProject(project: ProjectFile): ProjectFile;
}
```

#### Пример использования

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaApi')

// Загрузить проект
const projectData = await ProjectFileService.loadProject(
  "/path/to/project.tls",
);

// Создать новый проект
const newProject = ProjectFileService.createNewProject("Мой проект");

// Обновить медиатеку
const updatedProject = ProjectFileService.updateMediaLibrary(
  project,
  mediaFiles,
  musicFiles,
);

// Обновить настройки рабочего пространства
const projectWithWorkspace = ProjectFileService.updateBrowserState(
  updatedProject,
  workspaceSettings,
);

// Проверить наличие несохраненных изменений
const hasChanges = ProjectFileService.hasUnsavedChanges(
  project,
  currentMediaFiles,
  currentMusicFiles,
);

// Сохранить проект
await ProjectFileService.saveProject("/path/to/project.tls", projectWithWorkspace);

// Получить статистику проекта
const stats = ProjectFileService.getProjectStats(project);
logger.infoSync(`Всего файлов: ${stats.totalMediaFiles + stats.totalMusicFiles}`);
```

### MediaRestorationService

Статический сервис для восстановления медиафайлов.

#### Методы

```typescript
class MediaRestorationService {
  // Восстановить все медиафайлы проекта
  static async restoreProjectMedia(
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
  ): Promise<ProjectRestorationResult>;

  // Восстановить один файл
  static async restoreFile(
    savedFile: SavedMediaFile,
    projectDir: string,
  ): Promise<FileRestorationResult>;

  // Запросить у пользователя поиск отсутствующего файла
  static async promptUserToFindFile(
    savedFile: SavedMediaFile,
  ): Promise<string | null>;

  // Обработать отсутствующие файлы с участием пользователя
  static async handleMissingFiles(
    missingFiles: SavedMediaFile[],
    onProgress?: (current: number, total: number, fileName: string) => void,
  ): Promise<{
    found: Array<{
      original: SavedMediaFile;
      newPath: string;
      restoredFile: MediaFile;
    }>;
    stillMissing: SavedMediaFile[];
    userCancelled: SavedMediaFile[];
  }>;

  // Сгенерировать отчет о восстановлении
  static generateRestorationReport(result: ProjectRestorationResult): string;
}
```

#### Пример использования

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaApi')

// Восстановить медиа проекта
const result = await MediaRestorationService.restoreProjectMedia(
  mediaFiles,
  musicFiles,
  projectPath,
);

// Обработать отсутствующие файлы
if (result.missingFiles.length > 0) {
  const userResult = await MediaRestorationService.handleMissingFiles(
    result.missingFiles,
    (current, total, fileName) => {
      logger.infoSync(`Обработка ${current}/${total}: ${fileName}`);
    },
  );
}

// Сгенерировать отчет
const report = MediaRestorationService.generateRestorationReport(result);
logger.infoSync(report);
```

## Утилитарные функции

### saved-media-utils.ts

#### Генерация ID файла

```typescript
function generateFileId(filePath: string, metadata: any): string;
```

Генерирует уникальный ID файла на основе пути, размера и времени изменения.

#### Операции с файловой системой

```typescript
// Проверить существование файла
async function fileExists(filePath: string): Promise<boolean>;

// Получить статистику файла
async function getFileStats(filePath: string): Promise<{
  size: number;
  lastModified: number;
} | null>;

// Валидировать целостность файла
async function validateFileIntegrity(
  filePath: string,
  saved: SavedMediaFile,
): Promise<{
  isValid: boolean;
  confidence: number;
  issues: string[];
}>;

// Получить абсолютный путь для файла
async function getAbsolutePath(path: string): Promise<string | null>;
```

#### Утилиты для работы с путями

```typescript
// Вычислить относительный путь от проекта к файлу
async function calculateRelativePath(
  filePath: string,
  projectPath: string | null,
): Promise<string | undefined>;

// Сгенерировать альтернативные пути поиска
async function generateAlternativePaths(
  originalPath: string,
  projectDir: string,
): Promise<string[]>;

// Поиск файлов по имени в директории
async function searchFilesByName(
  directory: string,
  filename: string,
  maxDepth?: number,
): Promise<string[]>;

// Получить расширения файлов для диалога поиска
function getExtensionsForFile(savedFile: SavedMediaFile): string[];
```

#### Преобразование типов

```typescript
// Преобразовать MediaFile в SavedMediaFile
async function convertToSavedMediaFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMediaFile>;

// Преобразовать MediaFile в SavedMusicFile
async function convertToSavedMusicFile(
  file: MediaFile,
  projectPath?: string,
): Promise<SavedMusicFile>;

// Преобразовать SavedMediaFile обратно в MediaFile
function convertFromSavedMediaFile(saved: SavedMediaFile): MediaFile;
```

## React хуки

### useMediaRestoration

Хук для управления процессом восстановления медиа.

#### Интерфейс

```typescript
interface RestorationState {
  isRestoring: boolean;
  progress: number;
  currentFile?: string;
  phase: "scanning" | "restoring" | "user_input" | "completed" | "error";
  error?: string;
}

function useMediaRestoration(): {
  // Состояние
  state: RestorationState;
  restorationResult: ProjectRestorationResult | null;
  showMissingFilesDialog: boolean;

  // Основные функции
  restoreProjectMedia: (
    mediaFiles: SavedMediaFile[],
    musicFiles: SavedMusicFile[],
    projectPath: string,
    options?: {
      autoResolve?: boolean;
      showDialog?: boolean;
    },
  ) => Promise<{
    restoredMedia: MediaFile[];
    restoredMusic: MediaFile[];
    needsUserInput: boolean;
    result: ProjectRestorationResult;
  }>;

  handleMissingFilesResolution: (
    resolved: Array<{
      file: SavedMediaFile;
      newPath?: string;
      action: "found" | "remove";
    }>,
  ) => Promise<{
    foundFiles: MediaFile[];
    removedFiles: SavedMediaFile[];
  }>;

  cancelMissingFilesDialog: () => void;
  resetRestoration: () => void;

  // Геттеры
  getRestorationStats: () => ProjectRestorationResult["stats"] | null;
  getMissingFiles: () => SavedMediaFile[];
  getRelocatedFiles: () => Array<{ original: SavedMediaFile; newPath: string }>;
  getRestorationReport: () => string | null;

  // Утилиты
  isRestoring: boolean;
  progress: number;
  currentPhase: RestorationState["phase"];
  error?: string;
};
```

#### Пример использования

```typescript
function ProjectManager() {
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    showMissingFilesDialog,
    getMissingFiles,
    isRestoring,
    progress
  } = useMediaRestoration()

  const handleOpenProject = async (projectPath: string) => {
    const projectData = await ProjectFileService.loadProject(projectPath)

    if (projectData.mediaLibrary) {
      const result = await restoreProjectMedia(
        projectData.mediaLibrary.mediaFiles,
        projectData.mediaLibrary.musicFiles,
        projectPath,
        { showDialog: true }
      )

      // Обработать восстановленные файлы...
    }
  }

  return (
    <div>
      {isRestoring && <ProgressBar progress={progress} />}

      <MissingFilesDialog
        open={showMissingFilesDialog}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </div>
  )
}
```

## UI компоненты

### MissingFilesDialog

Компонент диалога для обработки отсутствующих файлов.

#### Пропсы

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

#### Возможности

- Отображает список отсутствующих файлов
- Позволяет найти файл в новом расположении
- Возможность удалить файл из проекта
- Пропуск файла без изменений
- Массовые операции (пропустить все, применить все)

#### Использование

```typescript
<MissingFilesDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  missingFiles={missingFiles}
  onResolve={(resolved) => {
    // Обработать решение пользователя
    resolved.forEach(({ file, newPath, action }) => {
      if (action === 'found' && newPath) {
        // Файл найден в новом расположении
        updateFileLocation(file.id, newPath)
      } else if (action === 'remove') {
        // Удалить файл из проекта
        removeFileFromProject(file.id)
      }
    })
  }}
/>
```

## Паттерны интеграции

### Интеграция с хуком импорта

```typescript
// В useMediaImport
const saveFilesToProject = useCallback(
  async (files: MediaFile[]) => {
    if (!currentProject.path || files.length === 0) return;

    const savedFiles = await Promise.all(
      files.map((file) => convertToSavedMediaFile(file, currentProject.path)),
    );

    // Обновить состояние проекта
    setProjectDirty(true);
  },
  [currentProject.path, setProjectDirty],
);

// Вызвать после успешного импорта
await saveFilesToProject(processedFiles);
```

### Интеграция с провайдером проекта

```typescript
// В AppSettingsProvider
const openProject = async (path: string) => {
  const projectData = await ProjectFileService.loadProject(path);

  // Восстановить медиафайлы
  if (projectData.mediaPool) {
    const restorationResult = await restoreProjectMedia(
      projectData.mediaPool.mediaFiles || [],
      projectData.mediaPool.musicFiles || [],
      path,
      { showDialog: true },
    );

    // Обновить медиа провайдеры восстановленными файлами
    updateMediaFiles(restorationResult.restoredMedia);
    updateMusicFiles(restorationResult.restoredMusic);
  }

  return { path, name, projectData };
};
```

### Полный пример использования с хуком

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaApi')

function ProjectManager() {
  const {
    restoreProjectMedia,
    handleMissingFilesResolution,
    showMissingFilesDialog,
    getMissingFiles,
    isRestoring,
    progress,
    error
  } = useMediaRestoration()

  const handleOpenProject = async (projectPath: string) => {
    try {
      const projectData = await ProjectFileService.loadProject(projectPath)

      if (projectData.mediaPool) {
        const result = await restoreProjectMedia(
          projectData.mediaPool.mediaFiles,
          projectData.mediaPool.musicFiles,
          projectPath,
          { showDialog: true }
        )

        // Обработать восстановленные файлы
        logger.infoSync(`Восстановлено: ${result.restoredMedia.length + result.restoredMusic.length} файлов`)
      }
    } catch (error) {
      logger.errorSync('Ошибка при открытии проекта:', error)
    }
  }

  return (
    <div>
      {isRestoring && (
        <div>
          <p>Восстановление файлов... {Math.round(progress)}%</p>
          {error && <p className="error">Ошибка: {error}</p>}
        </div>
      )}

      <MissingFilesDialog
        open={showMissingFilesDialog}
        onOpenChange={() => {}}
        missingFiles={getMissingFiles()}
        onResolve={handleMissingFilesResolution}
      />
    </div>
  )
}
```

## Обработка ошибок

### Паттерны обработки ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaApi')

// Обработка ошибок загрузки проекта
try {
  const projectData = await ProjectFileService.loadProject(path);
} catch (error) {
  logger.errorSync("Ошибка загрузки проекта:", error);
  // Показать пользователю сообщение об ошибке
  showErrorNotification(`Не удалось загрузить проект: ${String(error)}`);
}

// Обработка ошибок восстановления медиа
try {
  const result = await restoreProjectMedia(mediaFiles, musicFiles, projectPath);
} catch (error) {
  logger.errorSync("Ошибка восстановления медиа:", error);
  // Обновить состояние хука с ошибкой
  setState(prev => ({ ...prev, phase: "error", error: String(error) }));
}

// Обработка ошибок валидации проекта
try {
  await ProjectFileService.saveProject(path, projectData);
} catch (error) {
  if (String(error).includes("Invalid project structure")) {
    logger.errorSync("Структура проекта повреждена:", error);
  } else if (String(error).includes("Unsupported project version")) {
    logger.errorSync("Неподдерживаемая версия проекта:", error);
  } else {
    logger.errorSync("Неожиданная ошибка сохранения:", error);
  }
}
```

## Соображения производительности

### Последовательная обработка файлов

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('MediaApi')

// MediaRestorationService обрабатывает файлы последовательно
// для избежания блокировки UI и лучшего контроля ошибок
for (const savedFile of allFiles) {
  try {
    const result = await MediaRestorationService.restoreFile(savedFile, projectDir)
    // Обработка результата...
  } catch (error) {
    logger.errorSync(`Ошибка при восстановлении файла ${savedFile.name}:`, error)
    missingFiles.push(savedFile)
  }
}
```

### Оптимизация проверок файлов

```typescript
// Утилиты сначала проверяют существование файла перед валидацией
const originalExists = await fileExists(savedFile.originalPath)

if (originalExists) {
  const validation = await validateFileIntegrity(savedFile.originalPath, savedFile)
  // Только если файл существует, проверяем его целостность
}
```

### Кэширование метаданных

```typescript
// Проект кэширует метаданные файлов для быстрого доступа
interface ProjectMediaPool {
  mediaFiles: SavedMediaFile[]; // Содержат кэшированные метаданные
  musicFiles: SavedMusicFile[];
  lastUpdated: number; // Отслеживаем время последнего обновления
  version: string;
}
```

## Тестирование

### Тестируемые компоненты

Система медиа персистентности полностью покрыта тестами:

- **ProjectFileService** - загрузка, сохранение, валидация проектов
- **MediaRestorationService** - восстановление медиафайлов
- **useMediaRestoration** - хук для управления восстановлением
- **MissingFilesDialog** - UI компонент для обработки отсутствующих файлов
- **saved-media-utils** - утилиты для работы с медиафайлами

### Примеры тестов восстановления файлов

```typescript
describe("MediaRestorationService", () => {
  it("должен восстановить файл из оригинального пути", async () => {
    mockFileExists.mockResolvedValue(true);
    mockValidateFileIntegrity.mockResolvedValue({
      isValid: true,
      confidence: 1.0,
      issues: [],
    });

    const result = await MediaRestorationService.restoreFile(
      savedFile,
      projectDir,
    );

    expect(result.status).toBe("found");
    expect(result.restoredFile).toBeDefined();
  });

  it("должен найти файл по относительному пути", async () => {
    mockFileExists.mockResolvedValueOnce(false); // Оригинальный путь
    mockFileExists.mockResolvedValueOnce(true); // Относительный путь

    const result = await MediaRestorationService.restoreFile(
      savedFileWithRelative,
      projectDir,
    );

    expect(result.status).toBe("relocated");
    expect(result.newPath).toBe("/project/dir/media/video.mp4");
  });

  it("должен обрабатывать поврежденные файлы", async () => {
    mockFileExists.mockResolvedValue(true);
    mockValidateFileIntegrity.mockResolvedValue({
      isValid: false,
      confidence: 0.3,
      issues: ["File size mismatch"],
    });

    const result = await MediaRestorationService.restoreFile(savedFile, projectDir);

    expect(result.status).toBe("corrupted");
  });
});
```

### Примеры тестов сервиса проектов

```typescript
describe("ProjectFileService", () => {
  it("должен загружать проект из файла", async () => {
    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(mockProjectFile));

    const project = await ProjectFileService.loadProject(mockProjectPath);

    expect(project).toEqual(mockProjectFile);
    expect(readTextFile).toHaveBeenCalledWith(mockProjectPath);
  });

  it("должен валидировать структуру проекта", async () => {
    const invalidProject = { ...mockProjectFile };
    delete invalidProject.settings;

    vi.mocked(readTextFile).mockResolvedValue(JSON.stringify(invalidProject));

    await expect(ProjectFileService.loadProject(mockProjectPath)).rejects.toThrow(
      "Invalid project structure: missing settings",
    );
  });

  it("должен определять несохраненные изменения", () => {
    const hasChanges = ProjectFileService.hasUnsavedChanges(
      mockProjectFile,
      [...mockProjectFile.mediaPool.mediaFiles, newMediaFile],
      mockProjectFile.mediaPool.musicFiles,
    );

    expect(hasChanges).toBe(true);
  });
});
```

### Тестирование хука восстановления

```typescript
describe("useMediaRestoration", () => {
  it("должен восстанавливать медиафайлы проекта", async () => {
    mockRestoreProjectMedia.mockResolvedValue(mockRestorationResult);

    const { result } = renderHook(() => useMediaRestoration());

    await act(async () => {
      await result.current.restoreProjectMedia(
        mockMediaFiles,
        mockMusicFiles,
        "/project/path.tls"
      );
    });

    expect(result.current.state.isRestoring).toBe(false);
    expect(result.current.state.phase).toBe("completed");
    expect(mockRestoreProjectMedia).toHaveBeenCalled();
  });
});
```

