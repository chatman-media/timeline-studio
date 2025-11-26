# TikTok API Integration

## Обзор

Интеграция с TikTok API позволяет публиковать видео в вертикальном формате с автоматической оптимизацией, управлять хештегами и взаимодействовать с аудиторией TikTok прямо из Timeline Studio.

## Настройка

### Получение доступа к API

1. Зарегистрируйтесь в [TikTok for Developers](https://developers.tiktok.com)
2. Создайте приложение в TikTok Developer Portal
3. Получите App ID и App Secret
4. Настройте OAuth Redirect URI: `timeline-studio://oauth/tiktok`
5. Подайте заявку на Production Access для публикации видео

### Конфигурация в приложении

```typescript
// Инициализация TikTok клиента
const tiktok = await initializeTikTok({
  appId: process.env.TIKTOK_APP_ID,
  appSecret: process.env.TIKTOK_APP_SECRET,
  redirectUri: 'timeline-studio://oauth/tiktok'
})
```

## Аутентификация

### OAuth 2.0 Flow

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

// Начало OAuth процесса
const authUrl = tiktok.getAuthorizationUrl({
  scopes: [
    'user.info.basic',
    'video.upload',
    'video.publish'
  ],
  state: generateSecureState()
})

// Открытие браузера для авторизации
await openBrowser(authUrl)

// Обработка callback
tiktok.on('authenticated', async (tokens) => {
  await saveTokens('tiktok', tokens)
  const userInfo = await tiktok.getUserInfo()
  logger.infoSync(`Authenticated as: ${userInfo.displayName}`)
})
```

### Обновление токенов

```typescript
// Автоматическое обновление
tiktok.on('tokenRefreshed', async (newTokens) => {
  await saveTokens('tiktok', newTokens)
})

// Проверка срока действия
if (await tiktok.isTokenExpired()) {
  await tiktok.refreshAccessToken()
}
```

## Публикация видео

### Базовая публикация

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

// Простая публикация
const post = await tiktok.publishVideo({
  videoPath: '/path/to/video.mp4',
  caption: 'Сделано в Timeline Studio 🎬',
  privacy: 'public' // 'public' | 'friends' | 'private'
})

// Отслеживание загрузки
post.on('uploadProgress', (progress) => {
  logger.debugSync(`Загрузка: ${progress.percentage}%`)
})

// Завершение публикации
post.on('published', (video) => {
  logger.infoSync(`Опубликовано: ${video.shareUrl}`)
  logger.infoSync(`Video ID: ${video.id}`)
})
```

### Расширенная публикация

```typescript
// Публикация с дополнительными параметрами
const advancedPost = await tiktok.publishVideo({
  videoPath: '/path/to/video.mp4',
  caption: 'Профессиональное видео из Timeline Studio',
  hashtags: ['timelinestudio', 'videoediting', 'творчество'],
  mentions: ['@friend1', '@friend2'],
  privacy: 'public',
  allowComments: true,
  allowDuet: true,
  allowStitch: true,
  location: {
    id: 'location_id',
    name: 'Moscow, Russia'
  },
  music: {
    id: 'music_id', // ID трека из TikTok
    startTime: 0,
    endTime: 30
  }
})
```

### Оптимизация для TikTok

```typescript
// Автоматическая оптимизация видео
const optimizedVideo = await tiktok.optimizeVideo({
  inputPath: '/path/to/horizontal-video.mp4',
  outputPath: '/path/to/tiktok-video.mp4',
  options: {
    // Автоматическое кадрирование в 9:16
    aspectRatio: '9:16',
    resolution: '1080x1920',
    
    // Умное кадрирование с отслеживанием лиц
    smartCrop: true,
    faceTracking: true,
    
    // Ограничения TikTok
    maxDuration: 60, // секунд
    maxFileSize: 287, // MB
    
    // Качество
    bitrate: 'auto',
    frameRate: 30,
    
    // Эффекты
    effects: {
      autoEnhance: true,
      stabilization: true
    }
  }
})

// Предпросмотр оптимизации
const preview = await tiktok.generateOptimizationPreview({
  inputPath: '/path/to/video.mp4',
  timestamps: [5, 15, 25] // Ключевые моменты
})
```

## Хештеги и тренды

### Анализ трендов

```typescript
// Получение трендовых хештегов
const trendingHashtags = await tiktok.getTrendingHashtags({
  country: 'RU',
  category: 'creativity',
  limit: 20
})

// Анализ хештега
const hashtagAnalytics = await tiktok.analyzeHashtag('#timelinestudio', {
  metrics: ['views', 'videos', 'engagement']
})

// Рекомендации хештегов
const suggestedHashtags = await tiktok.suggestHashtags({
  caption: 'Монтаж видео для YouTube',
  videoContent: await analyzeVideoContent(videoPath),
  targetAudience: 'creators'
})
```

### Управление хештегами

```typescript
// Автоматическая генерация хештегов
const hashtags = await tiktok.generateHashtags({
  videoAnalysis: {
    content: 'travel',
    mood: 'energetic',
    style: 'cinematic'
  },
  language: 'ru',
  mix: {
    trending: 5,    // Трендовые
    niche: 5,       // Нишевые
    branded: 1      // Брендированные
  }
})

// Валидация хештегов
const validatedHashtags = await tiktok.validateHashtags(hashtags, {
  checkBanned: true,
  checkSpelling: true,
  maxLength: 100 // Общая длина
})
```

## Управление контентом

### Получение информации о видео

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

// Информация о видео
const videoInfo = await tiktok.getVideo(videoId)

logger.infoSync(`Просмотры: ${videoInfo.stats.viewCount}`)
logger.infoSync(`Лайки: ${videoInfo.stats.likeCount}`)
logger.infoSync(`Комментарии: ${videoInfo.stats.commentCount}`)
logger.infoSync(`Репосты: ${videoInfo.stats.shareCount}`)

// Список моих видео
const myVideos = await tiktok.listMyVideos({
  limit: 50,
  offset: 0,
  fields: ['id', 'title', 'stats', 'createTime']
})
```

### Удаление и обновление

```typescript
// Удаление видео
await tiktok.deleteVideo(videoId)

// Обновление описания (если поддерживается)
await tiktok.updateVideo(videoId, {
  caption: 'Обновленное описание',
  privacy: 'friends'
})
```

## Аналитика

### Статистика видео

```typescript
// Детальная аналитика
const analytics = await tiktok.getVideoAnalytics(videoId, {
  dateRange: {
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  },
  metrics: [
    'views',
    'likes',
    'comments',
    'shares',
    'playTime',
    'avgWatchTime',
    'finishRate'
  ],
  dimensions: ['country', 'device', 'age', 'gender']
})

// График просмотров
const viewsChart = await tiktok.getViewsTimeline(videoId, {
  period: 'day',
  last: 30
})
```

### Аналитика аккаунта

```typescript
// Статистика аккаунта
const accountStats = await tiktok.getAccountAnalytics({
  metrics: [
    'followers',
    'following',
    'totalViews',
    'totalLikes',
    'avgEngagement'
  ]
})

// Рост подписчиков
const followerGrowth = await tiktok.getFollowerGrowth({
  period: 'week',
  last: 12
})
```

## Комментарии

### Управление комментариями

```typescript
// Получение комментариев
const comments = await tiktok.getComments(videoId, {
  limit: 100,
  offset: 0,
  sort: 'time' // 'time' | 'likes'
})

// Ответ на комментарий
await tiktok.replyToComment(commentId, {
  text: 'Спасибо за просмотр! 😊'
})

// Лайк комментария
await tiktok.likeComment(commentId)

// Удаление комментария
await tiktok.deleteComment(commentId)
```

### Модерация

```typescript
// Настройки комментариев
await tiktok.setCommentSettings(videoId, {
  allowComments: true,
  filterKeywords: ['спам', 'реклама'],
  requireApproval: false
})

// Массовая модерация
await tiktok.moderateComments(videoId, {
  action: 'delete',
  filter: {
    keywords: ['spam'],
    minReports: 3
  }
})
```

## Live Streaming

### Создание трансляции

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

// Создание live stream
const liveStream = await tiktok.createLiveStream({
  title: 'Монтаж в реальном времени',
  description: 'Смотрите, как я монтирую видео в Timeline Studio',
  coverImage: '/path/to/cover.jpg',
  startTime: new Date(Date.now() + 600000), // +10 минут
  tags: ['монтаж', 'обучение', 'timelinestudio']
})

// Получение RTMP данных
logger.infoSync(`Stream URL: ${liveStream.rtmpUrl}`)
logger.infoSync(`Stream Key: ${liveStream.streamKey}`)

// Начало трансляции
await liveStream.start()

// Мониторинг
liveStream.on('viewers', (count) => {
  logger.infoSync(`Зрителей: ${count}`)
})

liveStream.on('gift', (gift) => {
  logger.infoSync(`${gift.user} подарил ${gift.name}`)
})
```

## Шаблоны и эффекты

### Использование шаблонов TikTok

```typescript
// Получение популярных шаблонов
const templates = await tiktok.getTemplates({
  category: 'transitions',
  trending: true,
  limit: 20
})

// Применение шаблона
const videoWithTemplate = await tiktok.applyTemplate({
  videoPath: '/path/to/video.mp4',
  templateId: 'template_123',
  customization: {
    text: ['Timeline Studio', '2025'],
    colors: ['#FF0000', '#00FF00'],
    music: 'auto' // Автоподбор музыки
  }
})
```

## Оптимизация производительности

### Пакетная обработка

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

// Пакетная публикация
const batchUpload = await tiktok.batchPublish([
  {
    videoPath: '/path/to/video1.mp4',
    caption: 'Видео 1',
    scheduledTime: '2025-12-01T10:00:00Z'
  },
  {
    videoPath: '/path/to/video2.mp4',
    caption: 'Видео 2',
    scheduledTime: '2025-12-02T10:00:00Z'
  }
], {
  parallel: 2,
  retryFailed: true
})

// Отслеживание прогресса
batchUpload.on('progress', (status) => {
  logger.infoSync(`Обработано: ${status.completed}/${status.total}`)
})
```

## Обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TiktokApi')

try {
  await tiktok.publishVideo(videoData)
} catch (error) {
  if (error.code === 'VIDEO_TOO_LARGE') {
    logger.errorSync('Видео превышает лимит 287MB')
    // Сжатие видео
    const compressed = await compressForTikTok(videoData)
    await tiktok.publishVideo(compressed)
  } else if (error.code === 'RATE_LIMIT') {
    logger.errorSync('Превышен лимит запросов')
    // Повтор через время
    await delay(error.retryAfter * 1000)
  } else if (error.code === 'BANNED_CONTENT') {
    logger.errorSync('Контент нарушает правила TikTok')
    showContentGuidelines()
  }
}
```

## Лимиты и рекомендации

### Технические ограничения

- **Размер видео**: максимум 287MB
- **Длительность**: 60 секунд (3 минуты для некоторых аккаунтов)
- **Формат**: MP4 (H.264)
- **Разрешение**: рекомендуется 1080x1920
- **Соотношение сторон**: 9:16
- **Частота кадров**: 30 или 60 fps

### API лимиты

- **Публикация видео**: 100 в день
- **Запросы API**: 100 в минуту
- **Комментарии**: 1000 в день
- **Batch операции**: 10 видео за раз

### Рекомендации

1. **Оптимизируйте видео** перед загрузкой
2. **Используйте вертикальный формат** (9:16)
3. **Добавляйте трендовые хештеги** для увеличения охвата
4. **Публикуйте в оптимальное время** (19:00-23:00)
5. **Используйте популярную музыку** из библиотеки TikTok
6. **Создавайте привлекательные превью** для первых секунд

---

*Последнее обновление: 31 июля 2025*
