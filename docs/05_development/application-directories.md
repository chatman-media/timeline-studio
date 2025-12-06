# Директории приложения Timeline Studio

## Обзор

Timeline Studio автоматически создает и управляет структурой директорий для хранения пользовательских данных и ресурсов приложения.

При первом запуске создаются следующие директории:

### Расположение базовой директории
- **macOS**: `~/Movies/Timeline Studio`
- **Windows**: `~/Videos/Timeline Studio`
- **Linux**: `~/Videos/Timeline Studio`

### Структура директорий
```
Timeline Studio/
├── Media/                  # Пользовательские медиафайлы и ресурсы
│   ├── Videos/            # Видеофайлы
│   ├── Images/            # Изображения
│   ├── Music/             # Аудио/музыкальные файлы
│   ├── Effects/           # Пользовательские видеоэффекты
│   ├── Transitions/       # Пользовательские переходы
│   ├── Filters/           # Пользовательские фильтры
│   ├── StyleTemplates/    # Шаблоны стилей
│   ├── Subtitles/         # Файлы субтитров
│   └── Templates/         # Шаблоны разметки
├── Projects/              # Сохраненные файлы проектов
├── Snapshot/              # Скриншоты и захваты кадров
├── Cinematic/             # Кинематографические пресеты и LUT
├── Output/                # Рендеренные/экспортированные видео
├── Render/                # Временные файлы рендера
├── Recognition/           # Данные ИИ-распознавания (YOLO и др.)
├── Backup/                # Резервные копии проектов
├── MediaProxy/            # Прокси-медиа для производительности
├── Caches/                # Кеши приложения
│   ├── Previews/          # Кеш превью видео
│   ├── Renders/           # Кеш рендера
│   ├── Frames/            # Кеш извлечения кадров
│   └── Temp/              # Временные файлы
├── Recorded/              # Записи экрана/камеры
├── Audio/                 # Аудиозаписи и обработка
├── Cloud Project/         # Проекты облачной синхронизации
├── Upload/                # Файлы, ожидающие загрузки
└── Chats/                 # Сессии и история ИИ-чата
```

### Автоматическое сканирование и загрузка ресурсов

При запуске приложения Timeline Studio автоматически сканирует следующие директории и загружает найденные файлы:

#### Сканируемые директории:
- **Media/Videos/** - Видеофайлы (.mp4, .avi, .mov, .mkv, .webm и др.)
- **Media/Images/** - Изображения (.jpg, .png, .gif, .svg, .webp и др.)
- **Media/Music/** - Музыкальные файлы (.mp3, .wav, .ogg, .m4a, .flac и др.)
- **Media/Effects/** - JSON файлы с описаниями эффектов
- **Media/Transitions/** - JSON файлы с описаниями переходов
- **Media/Filters/** - JSON файлы с описаниями фильтров
- **Media/StyleTemplates/** - JSON файлы стилистических шаблонов
- **Media/Subtitles/** - JSON файлы стилей субтитров

#### Особенности автозагрузки:
1. **Медиафайлы** (видео, изображения, музыка):
   - Определяются по расширению файла
   - Автоматически добавляются в соответствующие разделы браузера
   - Метаданные (размер, продолжительность) извлекаются позже

2. **JSON ресурсы** (эффекты, фильтры, переходы и т.д.):
   - Проходят валидацию перед загрузкой
   - Невалидные файлы игнорируются
   - Автоматически добавляются в систему управления ресурсами

#### Оптимизация производительности:
- **Кеширование результатов** - результаты сканирования кешируются на 15 минут
- **Пакетная обработка** - файлы обрабатываются пакетами по 10 штук
- **Параллельное сканирование** - все директории сканируются одновременно

#### Использование в коде:
```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ApplicationDirectories')

import { useAutoLoadUserData } from '@/features/media-studio/services';

// В компоненте React
function MyComponent() {
  const { isLoading, loadedData, error, reload } = useAutoLoadUserData();
  
  if (isLoading) return <div>Загрузка ресурсов...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  
  logger.infoSync('Загруженные медиафайлы:', loadedData.media);
  logger.infoSync('Загруженные эффекты:', loadedData.effects);
}
```

### Доступ к директориям в коде

**Rust (Бэкенд):**
```rust
use timeline_studio::app_directories_service::AppDirectoriesService;

// Получить базовую директорию
let base_dir = AppDirectoriesService::get_base_directory().await?;

// Получить специфическую директорию
let projects_dir = AppDirectoriesService::get_projects_directory().await?;
```

**TypeScript (Фронтенд):**
```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('ApplicationDirectories')

import { appDirectoriesService } from '@/domains/project-management/services';

// Получить все директории
const directories = await appDirectoriesService.getAppDirectories();
logger.infoSync(directories.projects_dir);
logger.infoSync(directories.media_dir);
```

## Примечания по использованию

### Автоматическое создание
Все директории создаются автоматически при первом запуске приложения. Если директория удалена, она будет восстановлена при следующем запуске.

### Безопасность
- Регулярно создавайте резервные копии папки `Projects/`
- Папка `Backup/` содержит автоматические резервные копии
- Кеши можно безопасно удалять - они будут созданы заново

### Очистка дискового пространства
Для освобождения места можно удалить:
- `Caches/` - будет создан заново
- `Render/` - временные файлы рендера
- `Output/` - экспортированные видео (если есть копии)
- `MediaProxy/` - прокси-файлы (будут созданы заново при необходимости)