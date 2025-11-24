# Media Management Domain - Полная документация

Этот домен отвечает за управление медиафайлами в Timeline Studio через event-driven архитектуру с синхронизацией с Rust backend.

## 📚 Документация

### 1. [FIXES-AND-TODOS.md](./FIXES-AND-TODOS.md) - Исправления и TODO ⚠️
**НАЧНИ ОТСЮДА** если хочешь понять текущие проблемы и что нужно исправить.

**Темы**:
- ✅ Исправление критической проблемы с отображением файлов в Browser
- 📋 17 TODO из кодовой базы (с приоритетами)
- 🔍 Обнаруженные несостыковки типов и форматов
- 🎯 Рекомендации по приоритизации
- 📝 Чек-лист для разработчиков

**Для кого**: Разработчики, которые хотят понять текущее состояние и проблемы

---

### 2. [README.md](./README.md) - Уведомления при импорте
Руководство по использованию системы уведомлений при импорте медиафайлов.

**Темы**:
- Автоматические уведомления через Provider
- Callback'и для дополнительной логики
- Прямое использование XState machine
- Интеграция с i18n и аналитикой
- Тестирование уведомлений

**Для кого**: Разработчики, которые хотят добавить уведомления при импорте

---

### 2. [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md) - Быстрый старт
Краткое руководство для быстрого понимания MediaPool.

**Темы**:
- Что такое MediaPool (в 5 минут)
- Command → Event цикл
- Структура данных (Backend vs Frontend)
- Откуда берется ID
- Жизненный цикл файла
- Типичные ошибки

**Для кого**: Новые разработчики, нужно быстро понять концепцию

---

### 3. [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md) - Подробная архитектура
Детальное описание архитектуры MediaPool и event-driven паттерна.

**Темы**:
- Структура данных (MediaInfo, MediaData)
- Event-Driven архитектура (полный поток)
- Ключевые компоненты (Provider, Event Handlers, AppCommands)
- Последовательность импорта файла (7 шагов)
- Поиск медиафайлов
- Иммутабельность и best practices
- FAQ

**Для кого**: Разработчики, которые хотят глубоко понять систему

---

### 4. [MEDIAPOOL-DIAGRAMS.md](./MEDIAPOOL-DIAGRAMS.md) - Визуальные диаграммы
Схемы и диаграммы для визуального понимания.

**Темы**:
- Структура MediaPool (ASCII art)
- Архитектура компонентов
- Поток данных (Data Flow)
- Конвертация типов (Rust ↔ TypeScript)
- Command-Event паттерн
- Иммутабельность (примеры)
- Жизненный цикл проекта
- Отладка и troubleshooting

**Для кого**: Визуалы, кто лучше понимает схемы

---

## 🚀 Быстрый старт

### Хочу добавить уведомления при импорте
→ Читай [README.md](./README.md)

```tsx
<MediaManagementProvider enableNotifications={true}>
  <YourApp />
</MediaManagementProvider>
```

### Хочу понять, что такое MediaPool
→ Читай [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md)

```typescript
// MediaPool = Map<UUID, MediaInfo>
mediaPool: Map<string, MediaInfo>

// Ключ = UUID от Backend
// Значение = MediaInfo (путь, тип, метаданные)
```

### Хочу импортировать файлы
→ Читай [README.md](./README.md) или [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md)

```typescript
const { importFiles } = useMediaImport()
await importFiles(files, { copyToProject: true })
```

### Хочу понять архитектуру
→ Читай [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md)

```
Command → Backend → Event → Frontend
```

### Хочу увидеть схемы
→ Читай [MEDIAPOOL-DIAGRAMS.md](./MEDIAPOOL-DIAGRAMS.md)

---

## 📖 Порядок чтения

### Для новичков:
1. [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md) - Быстрое понимание
2. [MEDIAPOOL-DIAGRAMS.md](./MEDIAPOOL-DIAGRAMS.md) - Визуальное представление
3. [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md) - Глубокое погружение
4. [README.md](./README.md) - Практическое применение

### Для практиков:
1. [README.md](./README.md) - Как использовать уведомления
2. [MEDIAPOOL-QUICK-GUIDE.md](./MEDIAPOOL-QUICK-GUIDE.md) - Основы MediaPool
3. [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md) - Когда нужны детали

### Для архитекторов:
1. [MEDIAPOOL-ARCHITECTURE.md](./MEDIAPOOL-ARCHITECTURE.md) - Полная архитектура
2. [MEDIAPOOL-DIAGRAMS.md](./MEDIAPOOL-DIAGRAMS.md) - Схемы и паттерны
3. [README.md](./README.md) - Примеры реализации

---

## 🗂️ Структура домена

```
src/domains/media-management/
├── hooks/
│   ├── use-media-import.ts          # Hook для импорта
│   ├── use-media-management.ts       # Главный hook
│   ├── use-media-metadata.ts         # Hook для метаданных
│   └── use-file-operations.ts        # Hook для операций
│
├── machines/
│   ├── media-import-machine.ts       # XState машина импорта
│   └── backend-event-handlers.ts     # Обработка backend событий
│
├── providers/
│   └── media-management-provider.tsx # React Provider
│
├── services/
│   └── media-metadata-service.ts     # Сервис метаданных
│
├── types/
│   └── index.ts                      # Типы домена
│
└── __tests__/                        # Тесты
    ├── hooks/
    ├── machines/
    └── services/
```

---

## 🔑 Ключевые концепции

### 1. MediaPool
```typescript
Map<string, MediaInfo>
```
- **Ключ**: UUID от backend
- **Значение**: MediaInfo (frontend representation)
- **Хранит**: Все медиафайлы проекта

### 2. Event-Driven архитектура
```
Frontend Command → Backend → Backend Event → Frontend Update
```
- **Backend** = Source of Truth
- **Команды** отправляются в backend
- **События** приходят от backend
- **Frontend** только отображает

### 3. Иммутабельность
```typescript
// ✅ Правильно
const updated = new Map(mediaPool)
updated.set(id, info)
setMediaPool(updated)

// ❌ Неправильно
mediaPool.set(id, info)
setMediaPool(mediaPool)
```

### 4. Command-Event паттерн
```typescript
// Команда: "Сделай это"
await backendSync.executeCommand(
  AppCommands.addMedia(path, type)
)

// Событие: "Это произошло"
backendSync.onEvent((event) => {
  if (event.type === "MediaAdded") {
    // Update state
  }
})
```

---

## 💡 Примеры использования

### Импорт файлов с уведомлениями
```typescript
import { MediaManagementProvider } from "@/domains/media-management"

<MediaManagementProvider 
  enableNotifications={true}
  importCallbacks={{
    onImportStart: (count) => console.log(`Importing ${count} files`),
    onImportComplete: (count) => console.log(`Done: ${count} files`),
  }}
>
  <App />
</MediaManagementProvider>
```

### Получить список всех файлов
```typescript
const { mediaPool } = useMediaManagement()
const files = Array.from(mediaPool.values())
const videos = files.filter(f => f.type === "Video")
```

### Найти файл по пути
```typescript
const { getMediaInfo } = useMediaManagement()
const info = await getMediaInfo("/path/to/file.mp4")
```

---

## 🐛 Отладка

### Логировать события
```typescript
backendSync.onEvent((event) => {
  if (event.type.startsWith("Media")) {
    console.log("📦", event.type, event.payload)
  }
})
```

### Проверить состояние
```typescript
console.log("📦 Pool size:", mediaPool.size)
console.log("📦 Files:", Array.from(mediaPool.entries()))
```

### Сравнить с backend
```typescript
const backendState = await backendSync.getState()
const frontendIds = Array.from(mediaPool.keys())
const backendIds = Object.keys(backendState.media_pool)

const missing = backendIds.filter(id => !frontendIds.includes(id))
console.log("Missing:", missing)
```

---

## ❓ FAQ

### Почему Map, а не массив?
Map обеспечивает O(1) доступ по ID. Массив требует O(n) поиск.

### Зачем UUID от backend?
- Стабильный ID при перемещении файла
- Уникальность гарантируется backend
- Undo/Redo работает с ID

### Можно ли модифицировать mediaPool напрямую?
❌ Нет! Всегда через команды → backend → события.

### Как синхронизировать между вкладками?
Backend отправляет события всем подключенным frontend'ам.

### Что если событие не пришло?
Значит команда не выполнилась (ошибка). Backend гарантирует события после успешных команд.

---

## 📝 Checklist для разработчиков

### При добавлении новой функции:

- [ ] Определить команду (если изменяет state)
- [ ] Добавить обработчик команды в backend
- [ ] Определить событие для результата
- [ ] Добавить обработчик события в `backend-event-handlers.ts`
- [ ] Обновить типы в `types/index.ts`
- [ ] Добавить метод в Provider (если нужно)
- [ ] Создать/обновить hook (если нужно)
- [ ] Написать тесты
- [ ] Обновить документацию

### При работе с mediaPool:

- [ ] Не мутировать напрямую
- [ ] Использовать иммутабельные обновления
- [ ] Отправлять команды через backendSync
- [ ] Обрабатывать события в event handlers
- [ ] Логировать важные операции
- [ ] Проверять синхронизацию с backend

---

## 🔗 Связанные домены

- **Project Management** - управление проектами
- **System Integration** - системные уведомления
- **Media Features** - UI компоненты для медиа

---

## 📚 Дополнительные ресурсы

- [XState Documentation](https://xstate.js.org/)
- [Tauri Events](https://tauri.app/v1/guides/features/events/)
- [React Context](https://react.dev/reference/react/useContext)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

## 📞 Контакты

Вопросы по Media Management домену:
- Посмотри документацию выше
- Проверь примеры в `__tests__/`
- Изучи event handlers в `machines/backend-event-handlers.ts`
- Используй logger для отладки

---

**Создано**: November 2024
**Последнее обновление**: November 2024
**Версия**: 1.0.0
