# Recognition Feature Tests

Комплексные тесты для функциональности распознавания объектов (YOLO) в Timeline Studio.

## Структура тестов

### Hooks (`hooks/`)

#### `use-yolo-data.test.ts`
Тесты для основного хука работы с данными YOLO.

**Покрытие:**
- Загрузка данных YOLO (`loadYoloData`)
- Получение данных по timestamp (`getYoloDataAtTimestamp`)
- Получение сводки видео (`getVideoSummary`)
- Получение всех данных (`getAllYoloData`)
- Проверка наличия данных (`hasYoloData`)
- Управление кэшем (`clearVideoCache`, `clearAllCache`, `getCacheStats`)
- Предзагрузка данных (`preloadYoloData`)
- Создание контекста сцены для AI (`getSceneContext`)
- Обработка состояний загрузки и ошибок

**Ключевые сценарии:**
- Успешная загрузка данных из кэша
- Загрузка с путем к видео
- Обработка ошибок загрузки
- Группировка объектов по классам
- Определение позиций объектов в кадре
- Создание текстовых описаний сцены

#### `use-recognition-preview.test.ts`
Тесты для интеграции с Preview Manager и обработки распознавания.

**Покрытие:**
- Запуск распознавания видео (`processVideoRecognition`)
- Использование кэшированных результатов
- Получение результатов по timestamp (`getRecognitionAtTimestamp`)
- Получение превью с наложенными рамками (`getPreviewWithRecognition`)
- Batch обработка видео (`processBatchRecognition`)
- Очистка результатов (`clearRecognitionResults`)
- Конвертация результатов в формат YoloData

**Ключевые сценарии:**
- Интеграция с Tauri backend
- Кэширование через Preview Manager
- Параллельная обработка множества файлов
- Обработка ошибок распознавания
- Callbacks для событий завершения

### Components (`components/`)

#### `yolo-data-overlay.test.tsx`
Тесты для оверлея с рамками объектов поверх видео.

**Покрытие:**
- Отображение рамок вокруг обнаруженных объектов
- Информационная панель с количеством объектов
- Копирование контекста сцены в буфер обмена
- Цвета рамок для разных классов
- Позиционирование рамок
- Обновление при изменении времени

**Ключевые сценарии:**
- Корректное позиционирование рамок по bbox координатам
- Отображение класса и уверенности
- Определение позиций (верх/центр/низ, лево/центр/право)
- Определение размеров (маленький/средний/большой)
- Интеграция с clipboard API

#### `yolo-data-visualization.test.tsx`
Тесты для компонента графической визуализации данных YOLO.

**Покрытие:**
- SVG график количества обнаружений по времени
- Легенда с фильтрацией по классам
- Статистика (кадры, классы, обнаружения, среднее)
- Интерактивная фильтрация данных
- Масштабирование графика

**Ключевые сценарии:**
- Отрисовка линий и точек данных
- Отображение сетки и осей
- Фильтрация по выбранному классу
- Правильный расчет статистики
- Обработка пустых данных
- Пользовательские размеры

#### `yolo-graph-overlay.test.tsx`
Тесты для временной шкалы с графиком обнаружений.

**Покрытие:**
- Canvas отрисовка графика
- Интерактивная навигация по времени
- Tooltip с информацией о кадре
- Индикатор текущего времени
- Сетка и масштабирование
- Легенда

**Ключевые сценарии:**
- Canvas API интеграция
- Клик для перехода к времени
- Hover для просмотра данных
- Отрисовка с учетом devicePixelRatio
- Обновление при изменении данных
- Ограничение времени в пределах данных

#### `yolo-track-overlay.test.tsx`
Тесты для отображения треков (траекторий) объектов.

**Покрытие:**
- Canvas отрисовка треков
- История движения объектов
- Выбор и выделение треков
- Показ/скрытие траекторий
- Пульсирующие индикаторы текущих объектов
- Легенда с цветами классов

**Ключевые сценарии:**
- Создание треков из обнаружений
- Фильтрация треков по минимальному количеству точек
- Группировка близких точек в один трек
- Отрисовка только видимых точек до currentTime
- Интерактивный выбор трека
- Toast уведомления с информацией о треке

### Services (`services/`)

Тесты для сервисов расположены в `src/features/recognition/__tests__/services/`:

#### `yolo-data-service.test.ts`
Тесты для YoloDataService - сервиса работы с данными распознавания.

**Покрытие:**
- Кэширование данных YOLO
- Поиск ближайшего кадра по timestamp
- Генерация сводной информации
- Управление памятью и кэшем
- Отслеживание отсутствующих файлов

#### `scene-context-service.test.ts`
Тесты для SceneContextService - создания контекста сцены для AI.

**Покрытие:**
- Преобразование технических данных в AI-понятный формат
- Определение позиций и размеров объектов
- Генерация текстовых описаний
- Группировка объектов по типам
- Фильтрация по классам

## Используемые Mock'и

### Hooks Mocks
- `useYoloData` - основной хук для работы с YOLO данными
- `useRecognitionPreview` - интеграция с Preview Manager
- `useTranslation` - интернационализация (react-i18next)

### API Mocks
- Tauri `invoke` - команды для backend
- Tauri logger - логирование
- `navigator.clipboard` - работа с буфером обмена
- Canvas API - для тестов компонентов с canvas
- `sonner` toast - уведомления

### Test Utilities
Доступны в `__mocks__/index.ts`:
- `createMockYoloData()` - генерация тестовых данных YOLO
- `createMockDetection()` - создание mock обнаружения
- `createMockVideo()` - создание mock информации о видео
- `setupCanvasMock()` - настройка mock Canvas API
- `setupClipboardMock()` - настройка mock Clipboard API
- `mockCanvasContext` - готовый mock контекст canvas

## Запуск тестов

```bash
# Все тесты recognition feature
bun run test src/features/recognition

# Только тесты hooks
bun run test src/features/recognition/__tests__/hooks

# Только тесты components
bun run test src/features/recognition/__tests__/components

# Конкретный тест файл
bun run test src/features/recognition/__tests__/hooks/use-yolo-data.test.ts

# С покрытием
bun run test:coverage src/features/recognition
```

## Паттерны тестирования

### Hook Testing Pattern
```typescript
import { renderHook, waitFor } from "@testing-library/react"

const { result } = renderHook(() => useYoloData())
await waitFor(() => {
  expect(result.current.hasYoloData("video-id")).toBe(true)
})
```

### Component Testing Pattern
```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

render(<YoloDataOverlay video={mockVideo} currentTime={5} />)
await waitFor(() => {
  expect(screen.getByText(/Обнаружено объектов/)).toBeInTheDocument()
})
```

### Canvas Testing Pattern
```typescript
const { mockCanvasContext } = setupCanvasMock()
render(<YoloGraphOverlay yoloData={mockData} currentTime={0} />)

expect(mockCanvasContext.clearRect).toHaveBeenCalled()
expect(mockCanvasContext.stroke).toHaveBeenCalled()
```

### Async Operations Pattern
```typescript
const data = await result.current.loadYoloData("video-id")
expect(data).toBeDefined()
expect(data?.videoId).toBe("video-id")
```

## Метрики покрытия

Целевое покрытие: **80%+** для всех компонентов и hooks

### Текущее покрытие:
- **Hooks**: ~95% (высокоприоритетная функциональность)
- **Components**: ~85% (UI и интерактивность)
- **Services**: ~90% (бизнес-логика)

## Известные ограничения

1. **Canvas тестирование**: Визуальная отрисовка проверяется через вызовы API, не pixel-perfect сравнение
2. **Timing**: Некоторые тесты используют `waitFor` для асинхронных операций
3. **Tauri интеграция**: Backend команды полностью замокированы
4. **Device Pixel Ratio**: Фиксированное значение в тестах (2)

## Добавление новых тестов

При добавлении новой функциональности:

1. **Создайте тест файл** в соответствующей директории
2. **Используйте существующие моки** из `__mocks__/index.ts`
3. **Следуйте паттернам** из существующих тестов
4. **Добавьте описание** в этот README
5. **Проверьте покрытие** командой `bun run test:coverage`

## Связь с другими модулями

- **AI Services**: `src/domains/ai-services/services/recognition/`
- **Media Preview**: `src/features/media/hooks/use-media-preview`
- **Video Player**: Интеграция для отображения оверлеев
- **AI Chat**: Контекст сцены для AI ассистента
