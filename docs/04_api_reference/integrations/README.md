# Интеграции

## 📋 Содержание

Документация по интеграциям Timeline Studio с внешними сервисами и платформами.

### 🌐 Социальные сети

- [**youtube-api.md**](youtube-api.md) - Интеграция с YouTube API
  - Загрузка видео
  - Управление плейлистами
  - Аналитика и комментарии

- [**tiktok-api.md**](tiktok-api.md) - Интеграция с TikTok API
  - Публикация видео
  - Оптимизация для вертикального формата
  - Хештеги и описания

- [**vimeo-api.md**](vimeo-api.md) - Интеграция с Vimeo API
  - Загрузка в высоком качестве
  - Приватность и настройки
  - Встраивание видео

- [**telegram-api.md**](telegram-api.md) - Интеграция с Telegram API
  - Отправка видео в каналы
  - Сжатие для Telegram
  - Боты и автоматизация

### 🤖 AI сервисы

- [**claude-api.md**](claude-api.md) - Интеграция с Claude API (Anthropic)
  - Конфигурация API
  - Потоковые ответы
  - Контекст и история

- [**openai-api.md**](openai-api.md) - Интеграция с OpenAI API
  - GPT-4 интеграция
  - DALL-E для генерации изображений
  - Whisper для транскрипции

- [**anthropic-api.md**](anthropic-api.md) - Расширенная интеграция с Anthropic
  - Claude 3 модели
  - Безопасность и модерация
  - Оптимизация токенов

## 🔑 Общие принципы

### Аутентификация

Все интеграции используют безопасное хранение ключей через Tauri:

```typescript
// Сохранение API ключа
await saveApiKey('youtube', {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: 'refresh-token'
})

// Получение ключа
const credentials = await getApiKey('youtube')
```

### OAuth 2.0

Для социальных сетей используется OAuth 2.0 flow:

```typescript
// Инициализация OAuth
const auth = await initializeOAuth('youtube', {
  redirectUri: 'timeline-studio://oauth/callback',
  scopes: ['upload', 'manage']
})

// Получение токена
const token = await auth.getAccessToken()
```

### Обработка ошибок

Стандартизированная обработка ошибок для всех интеграций:

```typescript
try {
  await uploadToYouTube(video, metadata)
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Превышен лимит запросов
  } else if (error.code === 'AUTH_FAILED') {
    // Ошибка аутентификации
  } else if (error.code === 'NETWORK_ERROR') {
    // Сетевая ошибка
  }
}
```

## 📊 Лимиты и квоты

Каждая интеграция имеет свои ограничения:

| Сервис | Лимит запросов | Размер файла | Другие ограничения |
|--------|---------------|--------------|-------------------|
| YouTube | 10,000 units/day | 128GB | 12 часов видео |
| TikTok | 100 req/min | 287MB | 60 секунд |
| Vimeo | Зависит от плана | 25GB | Без ограничений |
| Telegram | 30 msg/sec | 50MB | 20 минут |
| Claude | 1000 req/day | - | 100k токенов |
| OpenAI | Зависит от плана | - | 128k токенов |

## 🔗 Связанные разделы

- [Export API](../export-api.md) - API экспорта видео
- [AI Chat API](../ai-chat-api.md) - AI интеграции в чате
- [Social Media API](../social-media-api.md) - Общий API для соцсетей

---

*Последнее обновление: 31 июля 2025*