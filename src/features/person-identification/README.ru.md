# Person Identification - Идентификация людей

[English](./README.md) | **Русский**

## Обзор
Продвинутая система обнаружения лиц, идентификации людей и отслеживания с интеграцией Timeline и ML-кластеризацией.

## Статус
- ✅ **Компоненты**: Полный UI управления людьми (список, детали, форма)
- ✅ **Хуки**: usePersonIdentification, useTimelinePersons готовы
- ✅ **Сервисы**: PersonDatabaseService с интеграцией Tauri backend
- ✅ **Тесты**: 20+ тестов успешно проходят (компоненты, хуки, сервисы)

## Структура
```
person-identification/
├── components/
│   ├── person-list.tsx          # Список людей с фильтрацией
│   ├── person-detail.tsx        # Детальная информация
│   ├── person-form.tsx          # Форма создания/редактирования
│   └── person-manager.tsx       # Главный компонент управления
├── hooks/
│   └── use-person-identification.ts  # Основной хук
├── services/
│   └── person-database-service.ts    # Сервис базы данных
├── types/
│   └── person.ts                # TypeScript типы
└── __tests__/
    ├── components/              # Тесты компонентов
    ├── hooks/                   # Тесты хуков
    └── services/                # Тесты сервисов
```

## Возможности
### ✅ Реализовано
- [x] Автоматическое обнаружение лиц через Scene Analysis Engine
- [x] Кластеризация лиц (алгоритм DBSCAN)
- [x] Управление профилями людей (CRUD)
- [x] Интеграция с Timeline с индикаторами людей
- [x] Поиск и фильтрация по имени/тегам
- [x] Статистика появлений и отслеживание
- [x] FaceNet embeddings (512D/128D)
- [x] RetinaFace обнаружение с оценкой качества
- [x] Privacy processor (размытие лиц)
- [x] Продвинутая система трекинга
- [x] Обнаружение лиц в реальном времени

### ❌ Не реализовано
- [ ] Интеграция MediaPipe (468 3D ориентиров)
- [ ] Анализ выражений лица
- [ ] Оценка возраста/пола
- [ ] Распознавание эмоций
- [ ] Функции замены лиц
- [ ] Авто-тегирование на основе контекста

## Использование
```typescript
import { PersonManager } from '@/features/person-identification'
import { usePersonIdentification, useTimelinePersons } from '@/features/person-identification'

// Базовое использование
<PersonManager />

// В компонентах
const {
  persons,
  addPerson,
  updatePerson,
  deletePerson,
  detectFaces,
  identifyPerson
} = usePersonIdentification()

// Интеграция с Timeline
const {
  getPersonsForClip,
  analyzeClipForPersons,
  confidenceThreshold
} = useTimelinePersons()
```

## Интеграция
- **Зависимости**: @/domains/ai-content-intelligence (Scene Analysis, Computer Vision)
- **Используется в**: @/features/timeline, @/features/media-studio
- **Timeline**: Индикаторы людей на клипах, панель людей
- **Backend**: Обширная интеграция команд Tauri

## Тестирование
- **Всего тестов**: 20+ тестов
- **Покрытие**: Компоненты, хуки, сервисы, интеграция с Tauri

```bash
# Запустить все тесты
bun run test src/features/person-identification

# Запустить конкретный набор тестов
bun run test src/features/person-identification/__tests__/services/person-database-service.tauri.test.ts
```

## TODO / Дорожная карта
- [ ] Интеграция 3D лицевых ориентиров MediaPipe
- [ ] Анализ выражений в реальном времени
- [ ] Улучшения продвинутого трекинга (обработка окклюзий)
- [ ] Ре-идентификация людей между сценами
- [ ] Авто-сохранение face embeddings при анализе
- [ ] Пакетное тегирование людей
- [ ] Экспорт отчетов о появлениях
- [ ] Улучшение функций приватности (выборочное размытие)
- [ ] Интеграция с экспортом проекта (анонимизация)
