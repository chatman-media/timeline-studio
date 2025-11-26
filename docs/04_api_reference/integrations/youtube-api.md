# YouTube API Integration

## Обзор

YouTube API интеграция позволяет загружать видео, управлять плейлистами, получать аналитику и работать с комментариями прямо из Timeline Studio.

## Настройка

### Получение API ключей

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите YouTube Data API v3
4. Создайте OAuth 2.0 credentials
5. Добавьте `timeline-studio://oauth/callback` в разрешенные URI

### Конфигурация в приложении

```typescript
// Инициализация YouTube клиента
const youtube = await initializeYouTube({
  clientId: process.env.YOUTUBE_CLIENT_ID,
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  redirectUri: 'timeline-studio://oauth/callback'
})
```

## Аутентификация

### OAuth 2.0 Flow

```typescript
// Начало OAuth процесса
const authUrl = youtube.getAuthorizationUrl({
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtubepartner'
  ]
})

// Открытие браузера для авторизации
await openBrowser(authUrl)

// Обработка callback
youtube.on('authenticated', (tokens) => {
  saveTokens(tokens)
})
```

### Обновление токенов

```typescript
// Автоматическое обновление токенов
youtube.on('tokenRefreshed', (newTokens) => {
  saveTokens(newTokens)
})

// Ручное обновление
const refreshedTokens = await youtube.refreshAccessToken()
```

## Загрузка видео

### Базовая загрузка

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('YoutubeApi')

// Простая загрузка
const upload = await youtube.uploadVideo({
  videoPath: '/path/to/video.mp4',
  metadata: {
    title: 'My Amazing Video',
    description: 'Created with Timeline Studio',
    tags: ['timeline-studio', 'video-editing'],
    categoryId: '22', // People & Blogs
    privacyStatus: 'private' // 'private' | 'unlisted' | 'public'
  }
})

// Отслеживание прогресса
upload.on('progress', (progress) => {
  logger.debugSync(`Upload progress: ${progress.percentage}%`)
  logger.debugSync(`Bytes sent: ${progress.bytesUploaded}/${progress.totalBytes}`)
})

// Завершение загрузки
upload.on('complete', (video) => {
  logger.infoSync(`Video uploaded: https://youtube.com/watch?v=${video.id}`)
})
```

### Расширенные настройки

```typescript
// Загрузка с дополнительными параметрами
const advancedUpload = await youtube.uploadVideo({
  videoPath: '/path/to/video.mp4',
  thumbnailPath: '/path/to/thumbnail.jpg',
  metadata: {
    title: 'Professional Video',
    description: longDescription,
    tags: tags,
    categoryId: '28', // Science & Technology
    privacyStatus: 'unlisted',
    embeddable: true,
    license: 'youtube', // 'youtube' | 'creativeCommon'
    publicStatsViewable: true,
    publishAt: '2025-12-25T10:00:00Z', // Scheduled
    recordingDetails: {
      recordingDate: '2025-12-20T15:30:00Z',
      location: {
        latitude: 37.42,
        longitude: -122.08,
        altitude: 0
      }
    }
  },
  options: {
    chunkSize: 10 * 1024 * 1024, // 10MB chunks
    autoRetry: true,
    maxRetries: 5,
    notifySubscribers: false
  }
})
```

### Resumable загрузка

```typescript
// Создание resumable сессии
const session = await youtube.createResumableUpload({
  videoSize: videoFile.size,
  metadata: videoMetadata
})

// Загрузка с возможностью возобновления
const resumableUpload = await youtube.resumeUpload(session, {
  startByte: lastUploadedByte,
  onProgress: updateProgressBar
})

// Обработка прерываний
resumableUpload.on('interrupted', async (error) => {
  // Сохранение прогресса
  await saveUploadProgress(session.id, resumableUpload.bytesUploaded)
  
  // Попытка возобновления
  setTimeout(() => {
    resumableUpload.resume()
  }, 5000)
})
```

## Управление видео

### Обновление метаданных

```typescript
// Обновление информации о видео
await youtube.updateVideo(videoId, {
  snippet: {
    title: 'Updated Title',
    description: 'New description',
    tags: ['new', 'tags'],
    categoryId: '24'
  },
  status: {
    privacyStatus: 'public',
    embeddable: true,
    publicStatsViewable: true
  }
})

// Установка миниатюры
await youtube.setThumbnail(videoId, {
  imagePath: '/path/to/new-thumbnail.jpg'
})
```

### Получение информации

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('YoutubeApi')

// Получение деталей видео
const video = await youtube.getVideo(videoId, {
  parts: ['snippet', 'statistics', 'status', 'contentDetails']
})

logger.infoSync(`Views: ${video.statistics.viewCount}`)
logger.infoSync(`Likes: ${video.statistics.likeCount}`)
logger.infoSync(`Duration: ${video.contentDetails.duration}`)

// Получение списка видео
const myVideos = await youtube.listVideos({
  mine: true,
  maxResults: 50,
  order: 'date',
  parts: ['snippet', 'statistics']
})
```

## Плейлисты

### Создание плейлиста

```typescript
// Создание нового плейлиста
const playlist = await youtube.createPlaylist({
  title: 'Timeline Studio Showcase',
  description: 'Videos created with Timeline Studio',
  privacyStatus: 'public',
  tags: ['timeline-studio', 'showcase']
})

// Добавление видео в плейлист
await youtube.addToPlaylist({
  playlistId: playlist.id,
  videoId: video.id,
  position: 0 // Позиция в плейлисте
})
```

### Управление плейлистами

```typescript
// Получение плейлистов
const playlists = await youtube.listPlaylists({
  mine: true,
  maxResults: 50
})

// Обновление плейлиста
await youtube.updatePlaylist(playlistId, {
  title: 'New Title',
  description: 'Updated description',
  privacyStatus: 'private'
})

// Удаление видео из плейлиста
await youtube.removeFromPlaylist(playlistItemId)
```

## Комментарии

### Получение комментариев

```typescript
// Получение комментариев к видео
const comments = await youtube.getComments(videoId, {
  maxResults: 100,
  order: 'relevance', // 'time' | 'relevance'
  textFormat: 'plainText' // 'html' | 'plainText'
})

// Получение ответов на комментарий
const replies = await youtube.getCommentReplies(commentId)
```

### Управление комментариями

```typescript
// Ответ на комментарий
await youtube.replyToComment(commentId, {
  text: 'Thanks for watching! Created with Timeline Studio.'
})

// Модерация комментариев
await youtube.moderateComment(commentId, {
  moderationStatus: 'heldForReview' // 'published' | 'heldForReview' | 'rejected'
})

// Установка настроек комментариев
await youtube.setCommentSettings(videoId, {
  allowComments: true,
  moderationMode: 'automatic' // 'automatic' | 'manual'
})
```

## Аналитика

### YouTube Analytics API

```typescript
// Получение аналитики канала
const analytics = await youtube.getAnalytics({
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  metrics: ['views', 'likes', 'shares', 'estimatedMinutesWatched'],
  dimensions: ['day']
})

// Аналитика конкретного видео
const videoAnalytics = await youtube.getVideoAnalytics(videoId, {
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  metrics: [
    'views',
    'likes',
    'dislikes',
    'comments',
    'shares',
    'estimatedMinutesWatched',
    'averageViewDuration',
    'subscribersGained'
  ]
})

// Демографические данные
const demographics = await youtube.getDemographics(videoId, {
  dimensions: ['ageGroup', 'gender']
})
```

### Отчеты

```typescript
// Генерация отчета
const report = await youtube.generateReport({
  videoIds: [video1Id, video2Id],
  dateRange: 'last30Days',
  metrics: ['all'],
  format: 'csv'
})

// Экспорт отчета
await youtube.exportReport(report, '/path/to/report.csv')
```

## Live Streaming

### Создание трансляции

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('YoutubeApi')

// Создание live stream
const broadcast = await youtube.createBroadcast({
  title: 'Live from Timeline Studio',
  description: 'Live streaming test',
  scheduledStartTime: new Date(Date.now() + 3600000), // +1 час
  privacyStatus: 'unlisted',
  enableDvr: true,
  enableContentEncryption: false,
  enableEmbed: true,
  recordFromStart: true,
  startWithSlate: false
})

// Создание stream
const stream = await youtube.createStream({
  title: 'Timeline Studio Stream',
  resolution: '1080p',
  frameRate: '30fps',
  ingestionType: 'rtmp'
})

// Связывание broadcast и stream
await youtube.bindBroadcastToStream(broadcast.id, stream.id)

// Получение RTMP URL
logger.infoSync(`Stream URL: ${stream.cdn.ingestionInfo.ingestionAddress}`)
logger.infoSync(`Stream Key: ${stream.cdn.ingestionInfo.streamName}`)
```

### Управление трансляцией

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('YoutubeApi')

// Начало трансляции
await youtube.transitionBroadcast(broadcast.id, 'live')

// Пауза трансляции
await youtube.transitionBroadcast(broadcast.id, 'pause')

// Завершение трансляции
await youtube.transitionBroadcast(broadcast.id, 'complete')

// Мониторинг состояния
const status = await youtube.getBroadcastStatus(broadcast.id)
logger.infoSync(`Status: ${status.lifeCycleStatus}`)
logger.infoSync(`Health: ${status.healthStatus.status}`)
```

## Обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('YoutubeApi')

try {
  await youtube.uploadVideo(videoData)
} catch (error) {
  if (error.code === 'quotaExceeded') {
    logger.errorSync('API quota exceeded')
    showQuotaWarning()
  } else if (error.code === 'videoNotFound') {
    logger.errorSync('Video not found')
  } else if (error.code === 'forbidden') {
    logger.errorSync('Access forbidden')
    refreshAuthentication()
  } else if (error.code === 'uploadFailed') {
    logger.errorSync('Upload failed:', error.message)
    // Попытка возобновления
    attemptResume(error.uploadUrl)
  }
}
```

## Лимиты и рекомендации

### API квоты

- **Дневной лимит**: 10,000 units
- **Загрузка видео**: 1600 units
- **Обновление метаданных**: 50 units
- **Чтение данных**: 1 unit

### Рекомендации

1. **Кэшируйте данные** для уменьшения запросов
2. **Используйте batch запросы** где возможно
3. **Реализуйте exponential backoff** для повторных попыток
4. **Мониторьте использование квоты** через API
5. **Используйте webhooks** для получения обновлений

---

*Последнее обновление: 31 июля 2025*
