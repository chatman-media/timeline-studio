# Person Identification - Модуль распознавания и идентификации персон

> ✅ **Модуль полностью реализован и интегрирован в Timeline Studio**

## 📋 Обзор

Person Identification - это продвинутый модуль для распознавания лиц, идентификации персон и отслеживания их появления на протяжении всего видео. Модуль интегрирован с Timeline и предоставляет полный набор инструментов для работы с персонами в видеопроектах.

## API (Backend Commands)

Модуль использует обширную интеграцию с Tauri backend для обнаружения лиц, трекинга и операций с базой данных:

### Команды базы данных персон

| Команда | Параметры | Описание |
|---------|------------|-------------|
| `init_person_database` | - | Инициализировать базу данных персон Tauri |
| `create_person` | `{ name, tags, notes }` | Создать новый профиль персоны |
| `delete_person` | `{ personId }` | Удалить персону из базы данных |
| `add_face_embedding` | `{ personId, embedding, quality }` | Добавить эмбеддинг лица к персоне |
| `add_person_appearance` | `{ personId, clipId, startTime, endTime, confidence }` | Записать появление персоны |
| `add_person_thumbnail` | `{ personId, imageData }` | Добавить миниатюру |
| `set_similarity_threshold` | `{ threshold }` | Установить порог схожести для сопоставления |

### Команды расширенного трекинга

| Команда | Параметры | Описание |
|---------|------------|-------------|
| `init_advanced_tracking` | `{ config }` | Инициализировать систему расширенного трекинга |
| `start_person_tracking` | `{ videoPath, personIds }` | Запустить трекинг персон в видео |
| `stop_person_tracking` | - | Остановить процесс трекинга |
| `assign_person_to_track` | `{ trackId, personId }` | Назначить персону на трек |
| `merge_tracks` | `{ sourceTrackId, targetTrackId }` | Объединить два трека |
| `update_tracking_config` | `{ config }` | Обновить конфигурацию трекинга |
| `cleanup_tracking` | - | Очистить ресурсы трекинга |

### Команды обнаружения лиц

| Команда | Параметры | Описание |
|---------|------------|-------------|
| `init_yolo_processor` | `{ modelPath }` | Инициализировать YOLO детектор лиц |
| `init_facenet_processor` | `{ modelPath }` | Инициализировать FaceNet эмбеддер |
| `start_realtime_face_detection` | `{ config }` | Запустить обнаружение лиц в реальном времени |
| `stop_realtime_face_detection` | - | Остановить обнаружение в реальном времени |
| `update_face_detection_config` | `{ config }` | Обновить настройки обнаружения |
| `cleanup_face_detection` | - | Очистить ресурсы обнаружения |

### Команды кластеризации

| Команда | Параметры | Описание |
|---------|------------|-------------|
| `init_clustering_engine` | `{ params: { eps, min_samples } }` | Инициализировать движок кластеризации |
| `cluster_faces` | `{ embeddings, params }` | Кластеризовать эмбеддинги лиц |
| `find_nearest_cluster` | `{ embedding, clusters }` | Найти ближайший кластер для эмбеддинга |
| `auto_cluster_video_faces` | `{ fileId, embeddings, metadata }` | Автоматически кластеризовать лица в видео |
| `get_aligned_face` | `{ imageData, landmarks, outputSize }` | Получить выровненное лицо с оценкой качества |
| `blur_faces_in_image` | `{ imagePath, outputPath, autoDetect }` | Размыть лица для приватности |

Подробные примеры использования см. в секции [Tauri Backend Commands](#tauri-backend-commands) ниже.

## ✅ Реализованные возможности

### 🎯 Основная функциональность:
- ✅ **Автоматическое обнаружение лиц** - детекция лиц в видео с помощью Scene Analysis Engine
- ✅ **Идентификация персон** - сопоставление обнаруженных лиц с известными персонами
- ✅ **Кластеризация лиц** - автоматическая группировка лиц с помощью алгоритма DBSCAN
- ✅ **Управление профилями персон** - создание, редактирование и удаление персон
- ✅ **Timeline интеграция** - отображение персон на клипах Timeline
- ✅ **Поиск и фильтрация** - быстрый поиск персон по имени и тегам
- ✅ **Статистика появлений** - подсчет появлений персон в проекте

### 🏗️ Архитектура

```
src/features/person-identification/
├── components/                  # React компоненты
│   ├── person-list.tsx         # ✅ Список персон с фильтрацией
│   ├── person-detail.tsx       # ✅ Детальная информация о персоне
│   ├── person-form.tsx         # ✅ Форма создания/редактирования
│   ├── person-manager.tsx      # ✅ Главный компонент управления
│   └── index.ts               # ✅ Barrel exports
├── hooks/                      # React hooks
│   ├── use-person-identification.ts # ✅ Главный hook для работы с персонами
│   └── index.ts               # ✅ Barrel exports
├── services/                   # Бизнес-логика
│   └── person-database-service.ts # ✅ Сервис для работы с IndexedDB
├── types/                      # TypeScript типы
│   └── person.ts              # ✅ Полные типы для персон
├── index.ts                   # ✅ Главный export модуля
└── README.md                  # ✅ Документация
```

### 🔗 Timeline интеграция

```
src/features/timeline/
├── components/
│   ├── person-indicators/      # ✅ Индикаторы персон на клипах
│   │   ├── person-indicator.tsx
│   │   └── index.ts
│   ├── persons-panel/          # ✅ Панель персон в Timeline
│   │   ├── persons-panel.tsx
│   │   └── index.ts
│   └── track-controls-panel.tsx # ✅ Обновлен с панелью персон
├── hooks/
│   ├── use-timeline-persons.ts # ✅ Hook для Timeline интеграции
│   └── index.ts               # ✅ Обновлен с новыми exports
```

## 🎨 Пользовательский интерфейс

### PersonManager - Главный компонент
- ✅ Список всех персон с фото и статистикой
- ✅ Поиск персон по имени и описанию
- ✅ Фильтрация по тегам
- ✅ Создание новых персон
- ✅ Редактирование существующих
- ✅ Удаление персон

### PersonIndicator - Индикаторы на Timeline
- ✅ Маленькие аватары персон на видео клипах
- ✅ Индикаторы уверенности (зеленый/желтый/красный)
- ✅ Компактный режим для узких клипов
- ✅ Tooltip с детальной информацией
- ✅ Клик для открытия деталей персоны

### PersonsPanel - Панель в Timeline
- ✅ Интегрирована в левую панель Timeline
- ✅ Список обнаруженных персон
- ✅ Настройки анализа (порог уверенности, автообнаружение)
- ✅ Статистика появлений
- ✅ Фильтрация и поиск

## 💾 Структуры данных

### PersonProfile - Профиль персоны
```typescript
interface PersonProfile {
  id: string                    // ✅ Уникальный идентификатор
  name?: string                 // ✅ Имя персоны (опционально)
  isVerified: boolean          // ✅ Подтверждена ли идентичность
  
  // Биометрические данные
  faceEmbeddings: FaceEmbedding[]     // ✅ Face embeddings для распознавания
  averageEmbedding?: Float32Array     // ✅ Усредненный вектор
  
  // Статистика появлений
  appearances: PersonAppearance[]      // ✅ Все появления в видео
  totalScreenTime: number             // ✅ Общее время в кадре
  firstSeen: Timecode                 // ✅ Первое появление
  lastSeen: Timecode                  // ✅ Последнее появление
  
  // Метаданные
  tags: string[]                      // ✅ Теги для категоризации
  notes?: string                      // ✅ Заметки о персоне
  thumbnails: PersonThumbnail[]       // ✅ Миниатюры лица
  
  // Настройки приватности
  privacy: PersonPrivacySettings      // ✅ Настройки конфиденциальности
  
  // Системные поля
  createdAt: string                   // ✅ Дата создания
  updatedAt: string                   // ✅ Дата обновления
}
```

### TimelinePersonAppearance - Появление в Timeline
```typescript
interface TimelinePersonAppearance {
  id: string            // ✅ Уникальный ID появления
  personId: string      // ✅ ID персоны
  clipId: string        // ✅ ID клипа Timeline
  startTime: number     // ✅ Время начала (секунды)
  endTime: number       // ✅ Время окончания (секунды)
  confidence: number    // ✅ Уверенность идентификации
  boundingBox?: BoundingBox  // ✅ Область лица
  thumbnailPath?: string     // ✅ Путь к миниатюре
  detectedAt: Date      // ✅ Время обнаружения
}
```

## 🔧 API и хуки

### usePersonIdentification - Главный hook
```typescript
const {
  // Состояние
  persons,           // ✅ Все персоны
  isLoading,         // ✅ Статус загрузки
  error,            // ✅ Ошибки
  
  // Методы управления
  addPerson,         // ✅ Добавить персону
  updatePerson,      // ✅ Обновить персону
  deletePerson,      // ✅ Удалить персону
  searchPersons,     // ✅ Поиск персон
  
  // Методы работы с лицами
  detectFaces,       // ✅ Обнаружение лиц
  identifyPerson,    // ✅ Идентификация по лицу
  createPersonFromFace, // ✅ Создание персоны из лица
  
  // Статистика
  getStatistics,     // ✅ Получение статистики
} = usePersonIdentification()
```

### useTimelinePersons - Timeline интеграция
```typescript
const {
  // Состояние
  state,                    // ✅ Состояние анализа
  persons,                  // ✅ Все персоны
  
  // Методы для клипов
  getPersonsForClip,        // ✅ Персоны в конкретном клипе
  getAppearancesForClip,    // ✅ Появления в клипе
  
  // Анализ
  analyzeClipForPersons,    // ✅ Анализ клипа
  analyzeTimelineForPersons, // ✅ Анализ всего Timeline
  
  // Настройки
  enablePersonDetection,    // ✅ Включить автообнаружение
  confidenceThreshold,      // ✅ Порог уверенности
} = useTimelinePersons()
```

## 🎯 Интеграция с AI Content Intelligence

Person Identification полностью интегрирован с AI Content Intelligence Suite:

- ✅ **Scene Analysis Engine** - базовое обнаружение лиц
- ✅ **Computer Vision Service** - расширенная обработка
- ✅ **AI Intelligence Orchestrator** - координация анализа
- ✅ **Unified AI Service** - единый API

## 🚀 Использование

### Базовое использование
```typescript
import { PersonManager } from '@/features/person-identification'

// В компоненте
<PersonManager />
```

### В Timeline
```typescript
import { PersonIndicator } from '@/features/timeline/components/person-indicators'
import { useTimelinePersons } from '@/features/timeline/hooks'

const { getPersonsForClip, getAppearancesForClip } = useTimelinePersons()

<PersonIndicator
  persons={getPersonsForClip(clip.id)}
  appearances={getAppearancesForClip(clip.id)}
  clipId={clip.id}
  onClick={(personId) => showPersonDetail(personId)}
/>
```

## ⚙️ Настройки

### Настройки обнаружения
- ✅ **Порог уверенности** - минимальная уверенность для идентификации (по умолчанию 70%)
- ✅ **Автообнаружение** - автоматический анализ новых клипов
- ✅ **Интервал анализа** - как часто анализировать кадры

### Настройки приватности
- ✅ **Размытие лиц** - автоматическое размытие для приватности
- ✅ **Скрытие из поиска** - исключение из результатов поиска
- ✅ **Анонимизация** - полное удаление личных данных

## 📊 Статистика и метрики

- ✅ **Общее количество персон** в проекте
- ✅ **Количество обнаруженных лиц** 
- ✅ **Общее количество появлений**
- ✅ **Среднее количество лиц на персону**
- ✅ **Средняя уверенность идентификации**

## 🔄 Автоматизация

- ✅ **Автоматическое обнаружение** новых персон в добавляемых клипах
- ✅ **Фоновый анализ** без блокировки интерфейса
- ✅ **Кэширование результатов** для повышения производительности
- ✅ **Прогресс анализа** с визуальными индикаторами

## 🎭 Возможности персонализации

- ✅ **Теги персон** - категоризация и группировка
- ✅ **Заметки** - дополнительная информация о персонах
- ✅ **Миниатюры** - множественные фото персоны
- ✅ **Верификация** - подтверждение правильности идентификации

## 🚀 Продвинутые возможности (В разработке)

### Интеграция кластеризации лиц
- ✅ **DBSCAN алгоритм** - кластеризация на основе плотности для автоматической группировки лиц
- ✅ **Интеграция кластеризации** - бесшовная интеграция с PersonDatabase
- ✅ **Метрики качества кластеров** - оценки уверенности и статистика покрытия
- ✅ **Определение главных героев** - автоматическое определение по частоте появления

### Интеграция ML Backend
- ✅ **FaceNet эмбеддинги** - 512D и 128D векторы лиц для высокой точности
- ✅ **RetinaFace детекция** - продвинутая детекция лиц с 5-точечными landmarks и **реальной оценкой качества лица**
- ✅ **MediaPipe анализ** - 468 3D facial landmarks и анализ выражений
- ✅ **YOLO интеграция** - детекция объектов и лиц в реальном времени с **автовыбором процессора**
- ✅ **Privacy Processor** - 6 типов размытия лиц для анонимизации с **реальной детекцией лиц**
- ✅ **Оценка качества лица** - комплексная 4-факторная оценка (размер, четкость, landmarks, освещение)

### Tauri команды для кластеризации
```typescript
// Инициализация движка кластеризации
await invoke('init_clustering_engine', { params: { eps: 0.5, min_samples: 3 } })

// Кластеризация лиц
const result = await invoke('cluster_faces', { 
  embeddings: faceEmbeddings,
  params: { eps: 0.5, min_samples: 3, metric: 'cosine' }
})

// Поиск ближайшего кластера
const nearest = await invoke('find_nearest_cluster', {
  embedding: newFaceEmbedding,
  clusters: existingClusters
})

// Автоматическая кластеризация лиц в видео
await invoke('auto_cluster_video_faces', {
  fileId: 'video-123',
  embeddings: videoEmbeddings,
  metadata: faceMetadata,
  saveResults: true
})

// RetinaFace с оценкой качества
const result = await invoke('get_aligned_face', {
  imageData: base64Image,
  landmarks: facialLandmarks,
  outputSize: 112
})
// Возвращает: { aligned_image: string, size: number, quality_score: number }

// Размытие лиц с автообнаружением
await invoke('blur_faces_in_image', {
  imagePath: '/path/to/image.jpg', 
  outputPath: '/path/to/blurred.jpg',
  autoDetect: true, // Использует первый доступный YOLO процессор
  faceBoxes: null
})
```

## 🛡️ Безопасность и приватность

- ✅ **Локальное хранение** - все данные остаются на устройстве пользователя
- ✅ **Шифрование** - безопасное хранение биометрических данных
- ✅ **GDPR готовность** - соответствие требованиям защиты данных
- ✅ **Право на удаление** - полное удаление данных персоны

---

**Статус**: ✅ **Полностью реализован и готов к использованию**

Модуль Person Identification полностью интегрирован в Timeline Studio и предоставляет комплексное решение для работы с персонами в видеопроектах. Все основные функции реализованы и протестированы.