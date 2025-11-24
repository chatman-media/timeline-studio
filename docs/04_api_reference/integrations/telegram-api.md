# Telegram API Integration

## Обзор

Интеграция с Telegram API позволяет отправлять видео в каналы и чаты, создавать ботов для автоматизации публикаций, оптимизировать видео под требования Telegram и взаимодействовать с аудиторией через мессенджер.

## Настройка

### Создание бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Выберите имя и username для бота
4. Получите API токен
5. Настройте команды бота через `/setcommands`

### Конфигурация в приложении

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

// Инициализация Telegram клиента
const telegram = await initializeTelegram({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  // Для MTProto API (опционально)
  apiId: process.env.TELEGRAM_API_ID,
  apiHash: process.env.TELEGRAM_API_HASH
})

// Проверка подключения
const bot = await telegram.getMe()
logger.infoSync(`Bot connected: @${bot.username}`)
```

## Bot API

### Отправка видео

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

// Простая отправка видео
const message = await telegram.sendVideo({
  chatId: '@channel_username', // или chat_id
  video: '/path/to/video.mp4',
  caption: 'Видео создано в Timeline Studio 🎬',
  parseMode: 'HTML', // 'HTML' | 'Markdown' | 'MarkdownV2'
  disableNotification: false
})

// Отправка с дополнительными параметрами
const advancedMessage = await telegram.sendVideo({
  chatId: '@channel_username',
  video: '/path/to/video.mp4',
  caption: '<b>Новое видео!</b>\n\nСоздано в Timeline Studio',
  parseMode: 'HTML',
  duration: 120, // секунды
  width: 1920,
  height: 1080,
  thumb: '/path/to/thumbnail.jpg',
  supportsStreaming: true,
  protectContent: true, // Запрет пересылки
  replyMarkup: {
    inline_keyboard: [[
      { text: '👍 Нравится', callback_data: 'like' },
      { text: '💬 Комментарии', url: 'https://t.me/channel/123' }
    ]]
  }
})

// Отслеживание прогресса загрузки
const upload = telegram.uploadVideo({
  chatId: '@channel',
  videoPath: '/path/to/large-video.mp4',
  onProgress: (progress) => {
    logger.debugSync(`Загружено: ${progress.percentage}%`)
  }
})
```

### Оптимизация видео для Telegram

```typescript
// Автоматическая оптимизация
const optimized = await telegram.optimizeVideo({
  inputPath: '/path/to/original.mp4',
  outputPath: '/path/to/telegram-video.mp4',
  options: {
    // Лимиты Telegram
    maxFileSize: 50, // MB
    maxDuration: 1200, // 20 минут
    
    // Качество
    targetBitrate: 'auto', // Автоподбор для размера
    resolution: '1280x720', // Оптимальное для мобильных
    frameRate: 30,
    
    // Кодеки
    videoCodec: 'h264',
    audioCodec: 'aac',
    
    // Дополнительно
    compress: true,
    preserveQuality: 0.85, // 0-1
    fastStart: true // Для streaming
  }
})

// Разделение длинного видео
const parts = await telegram.splitVideo({
  inputPath: '/path/to/long-video.mp4',
  partDuration: 600, // 10 минут на часть
  overlap: 5, // Перекрытие в секундах
  addPartNumbers: true
})
```

## Работа с каналами

### Публикация в канал

```typescript
// Публикация с медиа группой
const mediaGroup = await telegram.sendMediaGroup({
  chatId: '@channel_username',
  media: [
    {
      type: 'video',
      media: '/path/to/intro.mp4',
      caption: '1️⃣ Вступление',
      parseMode: 'HTML'
    },
    {
      type: 'video', 
      media: '/path/to/main.mp4',
      caption: '2️⃣ Основная часть'
    },
    {
      type: 'photo',
      media: '/path/to/poster.jpg',
      caption: '📸 Постер'
    }
  ]
})

// Планирование публикации
const scheduled = await telegram.scheduleVideo({
  chatId: '@channel',
  video: '/path/to/video.mp4',
  caption: 'Запланированное видео',
  scheduleDate: new Date(Date.now() + 3600000) // +1 час
})
```

### Управление каналом

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

// Получение информации о канале
const channel = await telegram.getChat('@channel_username')
logger.infoSync(`Подписчиков: ${channel.memberCount}`)
logger.infoSync(`Описание: ${channel.description}`)

// Статистика просмотров
const stats = await telegram.getChatStatistics('@channel')
logger.infoSync(`Просмотры за день: ${stats.viewsPerDay}`)
logger.infoSync(`Рост подписчиков: ${stats.growthRate}`)

// Закрепление сообщения
await telegram.pinChatMessage({
  chatId: '@channel',
  messageId: message.messageId,
  disableNotification: true
})
```

## Inline режим

### Создание inline результатов

```typescript
// Обработка inline запросов
telegram.on('inline_query', async (query) => {
  const videos = await searchVideos(query.query)
  
  const results = videos.map(video => ({
    type: 'video',
    id: video.id,
    videoUrl: video.url,
    mimeType: 'video/mp4',
    thumbUrl: video.thumbnail,
    title: video.title,
    description: video.description,
    caption: `🎬 ${video.title}\n\nСоздано в Timeline Studio`,
    parseMode: 'HTML',
    replyMarkup: {
      inline_keyboard: [[
        { text: 'Открыть в Timeline Studio', url: video.editUrl }
      ]]
    }
  }))
  
  await telegram.answerInlineQuery({
    inlineQueryId: query.id,
    results: results,
    cacheTime: 300, // 5 минут
    isPersonal: false
  })
})
```

## Webhook и обновления

### Настройка webhook

```typescript
// Установка webhook
await telegram.setWebhook({
  url: 'https://yourdomain.com/telegram/webhook',
  certificate: '/path/to/cert.pem', // Для самоподписанных
  allowedUpdates: [
    'message',
    'callback_query', 
    'inline_query',
    'channel_post'
  ],
  dropPendingUpdates: true
})

// Обработка webhook
app.post('/telegram/webhook', async (req, res) => {
  const update = req.body
  
  if (update.message) {
    await handleMessage(update.message)
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
  
  res.sendStatus(200)
})
```

### Long Polling

```typescript
// Получение обновлений через polling
const startPolling = async () => {
  let offset = 0
  
  while (true) {
    const updates = await telegram.getUpdates({
      offset: offset,
      limit: 100,
      timeout: 30,
      allowedUpdates: ['message', 'callback_query']
    })
    
    for (const update of updates) {
      offset = update.updateId + 1
      await processUpdate(update)
    }
  }
}

// Обработка команд
telegram.onCommand('start', async (message) => {
  await telegram.sendMessage({
    chatId: message.chat.id,
    text: 'Добро пожаловать в Timeline Studio Bot! 🎬'
  })
})

telegram.onCommand('upload', async (message) => {
  // Логика загрузки видео
})
```

## Кнопки и взаимодействие

### Inline клавиатура

```typescript
// Создание интерактивного меню
await telegram.sendMessage({
  chatId: userId,
  text: 'Выберите действие:',
  replyMarkup: {
    inline_keyboard: [
      [
        { text: '📤 Загрузить видео', callback_data: 'upload' },
        { text: '📊 Статистика', callback_data: 'stats' }
      ],
      [
        { text: '⚙️ Настройки', callback_data: 'settings' },
        { text: '❓ Помощь', callback_data: 'help' }
      ],
      [
        { text: '🌐 Открыть Timeline Studio', url: 'https://timeline.studio' }
      ]
    ]
  }
})

// Обработка нажатий
telegram.on('callback_query', async (query) => {
  switch (query.data) {
    case 'upload':
      await showUploadMenu(query)
      break
    case 'stats':
      await showStatistics(query)
      break
    case 'settings':
      await showSettings(query)
      break
  }
  
  // Подтверждение получения
  await telegram.answerCallbackQuery({
    callbackQueryId: query.id,
    text: 'Обработка...',
    showAlert: false
  })
})
```

### Reply клавиатура

```typescript
// Кастомная клавиатура
await telegram.sendMessage({
  chatId: userId,
  text: 'Выберите формат экспорта:',
  replyMarkup: {
    keyboard: [
      ['MP4 (H.264)', 'MP4 (H.265)'],
      ['WebM', 'MOV'],
      ['🔙 Назад']
    ],
    resizeKeyboard: true,
    oneTimeKeyboard: true,
    selective: true
  }
})

// Удаление клавиатуры
await telegram.sendMessage({
  chatId: userId,
  text: 'Готово!',
  replyMarkup: {
    removeKeyboard: true
  }
})
```

## Работа с файлами

### Получение видео от пользователя

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

// Обработка входящего видео
telegram.on('video', async (message) => {
  const video = message.video
  
  logger.infoSync(`Получено видео: ${video.fileName}`)
  logger.infoSync(`Размер: ${video.fileSize} bytes`)
  logger.infoSync(`Длительность: ${video.duration}s`)
  
  // Скачивание файла
  const file = await telegram.getFile(video.fileId)
  const url = `https://api.telegram.org/file/bot${botToken}/${file.filePath}`
  
  const localPath = await downloadFile(url, `/tmp/${video.fileId}.mp4`)
  
  // Обработка видео
  const processed = await processVideo(localPath)
  
  // Отправка обработанного видео
  await telegram.sendVideo({
    chatId: message.chat.id,
    video: processed.path,
    caption: 'Видео обработано! ✨',
    replyToMessageId: message.messageId
  })
})
```

### Работа с большими файлами

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

// Загрузка по частям для больших файлов
const uploadLargeVideo = async (chatId, videoPath) => {
  const stats = await fs.stat(videoPath)
  
  if (stats.size > 50 * 1024 * 1024) { // > 50MB
    // Сжатие перед отправкой
    const compressed = await compressForTelegram(videoPath)
    
    return await telegram.sendVideo({
      chatId: chatId,
      video: compressed,
      supportsStreaming: true
    })
  } else {
    // Прямая отправка
    return await telegram.sendVideo({
      chatId: chatId,
      video: videoPath
    })
  }
}

// Multipart загрузка через MTProto
const uploadViaMTProto = async (chatId, videoPath) => {
  const client = await telegram.getMTProtoClient()
  
  const result = await client.sendFile(chatId, {
    file: videoPath,
    caption: 'Большой файл загружен через MTProto',
    progressCallback: (progress) => {
      logger.debugSync(`Прогресс: ${progress.percentage}%`)
    }
  })
  
  return result
}
```

## Платежи и монетизация

### Настройка платежей

```typescript
// Отправка счета
const invoice = await telegram.sendInvoice({
  chatId: userId,
  title: 'Timeline Studio Pro',
  description: 'Полный доступ к функциям на 1 месяц',
  payload: 'timeline_studio_pro_1month',
  providerToken: process.env.PAYMENT_PROVIDER_TOKEN,
  currency: 'RUB',
  prices: [
    { label: 'Подписка Pro', amount: 99900 } // в копейках
  ],
  photoUrl: 'https://timeline.studio/pro-banner.jpg',
  photoSize: 512,
  photoWidth: 512,
  photoHeight: 512,
  needName: true,
  needEmail: true,
  sendEmailToProvider: true,
  isFlexible: false
})

// Обработка платежей
telegram.on('pre_checkout_query', async (query) => {
  // Проверка платежа
  await telegram.answerPreCheckoutQuery({
    preCheckoutQueryId: query.id,
    ok: true
  })
})

telegram.on('successful_payment', async (message) => {
  const payment = message.successfulPayment
  
  // Активация подписки
  await activateSubscription(message.from.id, payment.invoicePayload)
  
  await telegram.sendMessage({
    chatId: message.chat.id,
    text: '✅ Спасибо за покупку! Ваша подписка активирована.'
  })
})
```

## Аналитика и статистика

### Отслеживание активности

```typescript
// Сбор аналитики
const analytics = {
  async trackEvent(userId, event, data) {
    await database.saveEvent({
      userId,
      event,
      data,
      timestamp: Date.now()
    })
  },
  
  async getUserStats(userId) {
    return await database.getUserStatistics(userId)
  },
  
  async getChannelStats(channelId) {
    const stats = await telegram.getChatStatistics(channelId)
    return {
      members: stats.memberCount,
      viewsPerPost: stats.averagePostReach,
      engagement: stats.engagementRate,
      growth: stats.growthGraph
    }
  }
}

// Использование
telegram.on('message', async (message) => {
  await analytics.trackEvent(message.from.id, 'message_sent', {
    type: message.video ? 'video' : 'text',
    chat: message.chat.type
  })
})
```

## Обработка ошибок

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('TelegramApi')

try {
  await telegram.sendVideo(videoData)
} catch (error) {
  if (error.code === 400) {
    if (error.description.includes('FILE_TOO_BIG')) {
      logger.errorSync('Файл превышает лимит 50MB')
      // Сжатие и повторная отправка
      const compressed = await compressVideo(videoData)
      await telegram.sendVideo(compressed)
    } else if (error.description.includes('VIDEO_FORMAT_UNSUPPORTED')) {
      logger.errorSync('Неподдерживаемый формат видео')
      // Конвертация в MP4
      const converted = await convertToMP4(videoData)
      await telegram.sendVideo(converted)
    }
  } else if (error.code === 429) {
    logger.errorSync('Превышен лимит запросов')
    const retryAfter = error.parameters.retry_after || 60
    await delay(retryAfter * 1000)
  } else if (error.code === 403) {
    logger.errorSync('Бот заблокирован пользователем или удален из канала')
  }
}
```

## Лимиты и рекомендации

### Технические ограничения

- **Размер файла**: максимум 50MB через Bot API, 2GB через MTProto
- **Длительность видео**: до 60 минут
- **Разрешение**: рекомендуется до 1280x720 для мобильных
- **Формат**: MP4 (H.264/AAC) для лучшей совместимости
- **Битрейт**: рекомендуется 1-2 Mbps

### API лимиты

- **Сообщения**: 30 сообщений в секунду
- **Группировка**: до 10 медиа в одной группе
- **Bulk операции**: 50 участников за раз
- **Inline результаты**: до 50 за запрос

### Рекомендации

1. **Оптимизируйте видео** под мобильные устройства
2. **Используйте сжатие** для больших файлов
3. **Добавляйте превью** для лучшего UX
4. **Используйте кнопки** для интерактивности
5. **Кэшируйте файлы** через file_id
6. **Настройте webhook** для production

---

*Последнее обновление: 31 июля 2025*