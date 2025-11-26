---
title: Timeline Studio 3.0.0 - Революционный переход на Event-Driven архитектуру
date: 2025-11-18
author: Команда Timeline
slug: release-3-0-0
excerpt: Масштабный релиз 3.0 с полностью переработанной event-driven архитектурой, Ollama Vision Models для бесплатного AI-анализа и secure storage для API ключей. Новая эра Timeline Studio!
category: Релиз
readTime: 8 мин чтения
---

# Timeline Studio 3.0.0 - Революционный переход на Event-Driven архитектуру

Представляем Timeline Studio 3.0.0 — революционный релиз, который полностью переосмысливает архитектуру приложения. Это самое масштабное обновление в истории проекта с фундаментальными изменениями в подходе к управлению состоянием и данными.

## 🚨 BREAKING CHANGES

### Event-Driven Architecture

Полный переход на событийно-ориентированную архитектуру:

**Было:** Fetch состояния после каждого события
```typescript
// Старый подход
await executeCommand('add_media', params)
await fetchState() // Загружаем всё состояние заново
```

**Стало:** Инкрементальные обновления через события
```typescript
// Новый подход
await executeCommand('add_media', params)
// Событие MediaAdded содержит только изменения
// Провайдеры автоматически обновляют локальное состояние
```

**Преимущества:**
- ⚡ **В 10-50 раз быстрее** - нет полной загрузки состояния
- 🔄 **Реактивность** - UI обновляется мгновенно
- 📉 **Меньше трафика** - передаются только изменения
- 🎯 **Точечные обновления** - каждый провайдер слушает только свои события

### Ollama Vision Models по умолчанию

AI Director теперь использует локальные vision модели:

**Новые настройки по умолчанию:**
- `ai_provider: Ollama` (вместо None)
- `ai_model: moondream2` (легкая vision модель)
- `enable_vision_language_model: true`

**Зачем это нужно:**
- ✅ **Бесплатный анализ** видео (0 затрат на API)
- ✅ **Локальная обработка** (100% приватность)
- ✅ **Определение эмоций** через vision AI
- ✅ **Offline работа** - не нужен интернет

**Требования:**
```bash
# Установите Ollama
brew install ollama  # macOS
# или скачайте с ollama.ai

# Скачайте vision модель
ollama pull moondream2

# Альтернативы:
ollama pull llama3.2-vision
ollama pull llava
```

### Миграция MediaAdapter

MediaAdapter больше не читает из `projectState`:

**Было:**
```typescript
const files = projectState.imported_media
```

**Стало:**
```typescript
const { mediaPool } = useMediaManagement()
const files = mediaPool
```

**Преимущества:**
- 🎯 Прямой доступ к media данным
- 📡 Автоматическая синхронизация через события
- 🔌 Независимость от глобального состояния

## 🎨 Главные возможности

### 🤖 Multimodal AI поддержка

Полная интеграция vision моделей:

- **Анализ видео кадров** - понимание содержимого
- **Определение эмоций** на лицах
- **Распознавание объектов** и сцен
- **Описание действий** в видео
- **Автоматическая категоризация** контента

### 🔐 Secure Storage для API ключей

Безопасное хранение конфиденциальных данных:

- **Шифрование** API ключей в системном keychain
- **Интеграция с OS** - Windows Credential Manager, macOS Keychain, Linux Secret Service
- **Безопасный импорт** из .env файлов
- **Автоматическая миграция** старых ключей

### 📦 MediaManagement Provider

Новый централизованный провайдер для медиа:

```typescript
<MediaManagementProvider>
  {/* Автоматическая синхронизация медиа */}
  {/* Обработка событий MediaAdded/Removed/Updated */}
  {/* Кэширование и оптимизация */}
</MediaManagementProvider>
```

### 🎬 Улучшения AI Director

- **Множественный выбор** видео для анализа
- **Автоматическое отображение** последнего анализа
- **Кнопка рефреша** для сброса состояния
- **Прогресс-бар** с real-time обновлениями
- **Выбор видео из медиапула**

### 🔄 Proxy File Generation

Генерация прокси-файлов для плавного редактирования:

- **FFmpeg интеграция** для транскодирования
- **Автоматическое создание** легких версий 4K/8K видео
- **Настраиваемое качество** прокси
- **Фоновая обработка** без блокировки UI

### 🎯 Effects & Filters улучшения

Переработанная система эффектов:

- **GPU-ускорение** для реал-тайм превью
- **Новые эффекты** и фильтры
- **Улучшенная производительность**
- **Профили для разных GPU**

## 🐛 Исправления

### Критические

- **Бесконечный цикл AudioContext** в Browser
- **Race condition** в AI Director событиях
- **Undefined в favorites** event listeners
- **Specta BigInt** экспорт для u64 типов

### TypeScript

- Исправлены **131 ошибка** типов
- Обновлены импорты в features и domains
- Улучшена типизация AI tools

### Тесты

- Исправлены **падающие frontend тесты**
- Исправлены **video_compiler тесты**
- Удалён **зависающий тест** language state
- Исправлен **flaky тест** в use-user-settings

## 📊 Статистика релиза

- **360+ коммитов**
- **100+ файлов** изменено
- **10,000+ строк** кода добавлено
- **15+ новых фич**
- **131 TypeScript ошибка** исправлено
- **Все тесты** проходят

## 🎯 Для разработчиков

### API Changes

```typescript
// Новый API для событий
import { useBackendSync } from '@/domains/backend-sync'

function Component() {
  const { listenToEvent } = useBackendSync()

  useEffect(() => {
    return listenToEvent('MediaAdded', (data) => {
      // Обработка события
    })
  }, [])
}
```

### Миграционный гайд

1. **Обновите провайдеры** - добавьте MediaManagementProvider
2. **Замените fetchState** на event listeners
3. **Обновите зависимости** - используйте новые хуки
4. **Тестируйте события** - убедитесь в правильной обработке

## 📦 Установка

```bash
# Обновление через встроенный updater
# или скачайте с GitHub Releases

# Для Ollama (рекомендуется):
brew install ollama
ollama pull moondream2
```

## 🎓 Ресурсы

- [Документация Event-Driven архитектуры](https://github.com/chatman-media/timeline-studio/docs)
- [Гайд по Ollama Vision](https://github.com/chatman-media/timeline-studio/docs/ollama)
- [Миграционный гайд 2.x → 3.0](https://github.com/chatman-media/timeline-studio/docs/migration-3.0)

## 🙏 Благодарности

Огромная благодарность всем контрибьюторам и пользователям за тестирование бета-версий! Ваши отзывы помогли сделать Timeline Studio 3.0 стабильным и производительным.

Это начало новой эры Timeline Studio. Event-driven архитектура закладывает фундамент для ещё более мощных фич в будущем!

---

**Загрузите Timeline Studio 3.0.0:** [GitHub Releases](https://github.com/chatman-media/timeline-studio/releases/tag/v3.0.0)
