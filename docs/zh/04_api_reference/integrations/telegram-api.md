# Telegram API Integration

## Overview

Telegram API integration allows you to send videos to channels and chats, create bots for publication automation, optimize videos for Telegram requirements, and interact with audience through the messenger.

## Setup

### Creating a Bot

1. Open [@BotFather](https://t.me/botfather) in Telegram
2. Send `/newbot` command
3. Choose name and username for your bot
4. Get API token
5. Configure bot commands via `/setcommands`

### In-app Configuration

```typescript
// Initialize Telegram client
const telegram = await initializeTelegram({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  // For MTProto API (optional)
  apiId: process.env.TELEGRAM_API_ID,
  apiHash: process.env.TELEGRAM_API_HASH
})

// Check connection
const bot = await telegram.getMe()
console.log(`Bot connected: @${bot.username}`)
```

## Bot API

### Sending Videos

```typescript
// Simple video send
const message = await telegram.sendVideo({
  chatId: '@channel_username', // or chat_id
  video: '/path/to/video.mp4',
  caption: 'Video created with Timeline Studio 🎬',
  parseMode: 'HTML', // 'HTML' | 'Markdown' | 'MarkdownV2'
  disableNotification: false
})

// Send with additional parameters
const advancedMessage = await telegram.sendVideo({
  chatId: '@channel_username',
  video: '/path/to/video.mp4',
  caption: '<b>New video!</b>\n\nCreated with Timeline Studio',
  parseMode: 'HTML',
  duration: 120, // seconds
  width: 1920,
  height: 1080,
  thumb: '/path/to/thumbnail.jpg',
  supportsStreaming: true,
  protectContent: true, // Disable forwarding
  replyMarkup: {
    inline_keyboard: [[
      { text: '👍 Like', callback_data: 'like' },
      { text: '💬 Comments', url: 'https://t.me/channel/123' }
    ]]
  }
})

// Track upload progress
const upload = telegram.uploadVideo({
  chatId: '@channel',
  videoPath: '/path/to/large-video.mp4',
  onProgress: (progress) => {
    console.log(`Uploaded: ${progress.percentage}%`)
  }
})
```

### Video Optimization for Telegram

```typescript
// Automatic optimization
const optimized = await telegram.optimizeVideo({
  inputPath: '/path/to/original.mp4',
  outputPath: '/path/to/telegram-video.mp4',
  options: {
    // Telegram limits
    maxFileSize: 50, // MB
    maxDuration: 1200, // 20 minutes
    
    // Quality
    targetBitrate: 'auto', // Auto-select for size
    resolution: '1280x720', // Optimal for mobile
    frameRate: 30,
    
    // Codecs
    videoCodec: 'h264',
    audioCodec: 'aac',
    
    // Additional
    compress: true,
    preserveQuality: 0.85, // 0-1
    fastStart: true // For streaming
  }
})

// Split long video
const parts = await telegram.splitVideo({
  inputPath: '/path/to/long-video.mp4',
  partDuration: 600, // 10 minutes per part
  overlap: 5, // Overlap in seconds
  addPartNumbers: true
})
```

## Working with Channels

### Publishing to Channel

```typescript
// Publish with media group
const mediaGroup = await telegram.sendMediaGroup({
  chatId: '@channel_username',
  media: [
    {
      type: 'video',
      media: '/path/to/intro.mp4',
      caption: '1️⃣ Introduction',
      parseMode: 'HTML'
    },
    {
      type: 'video', 
      media: '/path/to/main.mp4',
      caption: '2️⃣ Main part'
    },
    {
      type: 'photo',
      media: '/path/to/poster.jpg',
      caption: '📸 Poster'
    }
  ]
})

// Schedule publication
const scheduled = await telegram.scheduleVideo({
  chatId: '@channel',
  video: '/path/to/video.mp4',
  caption: 'Scheduled video',
  scheduleDate: new Date(Date.now() + 3600000) // +1 hour
})
```

### Channel Management

```typescript
// Get channel information
const channel = await telegram.getChat('@channel_username')
console.log(`Subscribers: ${channel.memberCount}`)
console.log(`Description: ${channel.description}`)

// View statistics
const stats = await telegram.getChatStatistics('@channel')
console.log(`Views per day: ${stats.viewsPerDay}`)
console.log(`Growth rate: ${stats.growthRate}`)

// Pin message
await telegram.pinChatMessage({
  chatId: '@channel',
  messageId: message.messageId,
  disableNotification: true
})
```

## Inline Mode

### Creating Inline Results

```typescript
// Handle inline queries
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
    caption: `🎬 ${video.title}\n\nCreated with Timeline Studio`,
    parseMode: 'HTML',
    replyMarkup: {
      inline_keyboard: [[
        { text: 'Open in Timeline Studio', url: video.editUrl }
      ]]
    }
  }))
  
  await telegram.answerInlineQuery({
    inlineQueryId: query.id,
    results: results,
    cacheTime: 300, // 5 minutes
    isPersonal: false
  })
})
```

## Webhook and Updates

### Webhook Setup

```typescript
// Set webhook
await telegram.setWebhook({
  url: 'https://yourdomain.com/telegram/webhook',
  certificate: '/path/to/cert.pem', // For self-signed
  allowedUpdates: [
    'message',
    'callback_query', 
    'inline_query',
    'channel_post'
  ],
  dropPendingUpdates: true
})

// Handle webhook
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
// Get updates via polling
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

// Handle commands
telegram.onCommand('start', async (message) => {
  await telegram.sendMessage({
    chatId: message.chat.id,
    text: 'Welcome to Timeline Studio Bot! 🎬'
  })
})

telegram.onCommand('upload', async (message) => {
  // Upload logic
})
```

## Buttons and Interaction

### Inline Keyboard

```typescript
// Create interactive menu
await telegram.sendMessage({
  chatId: userId,
  text: 'Choose action:',
  replyMarkup: {
    inline_keyboard: [
      [
        { text: '📤 Upload video', callback_data: 'upload' },
        { text: '📊 Statistics', callback_data: 'stats' }
      ],
      [
        { text: '⚙️ Settings', callback_data: 'settings' },
        { text: '❓ Help', callback_data: 'help' }
      ],
      [
        { text: '🌐 Open Timeline Studio', url: 'https://timeline.studio' }
      ]
    ]
  }
})

// Handle button clicks
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
  
  // Acknowledge receipt
  await telegram.answerCallbackQuery({
    callbackQueryId: query.id,
    text: 'Processing...',
    showAlert: false
  })
})
```

### Reply Keyboard

```typescript
// Custom keyboard
await telegram.sendMessage({
  chatId: userId,
  text: 'Choose export format:',
  replyMarkup: {
    keyboard: [
      ['MP4 (H.264)', 'MP4 (H.265)'],
      ['WebM', 'MOV'],
      ['🔙 Back']
    ],
    resizeKeyboard: true,
    oneTimeKeyboard: true,
    selective: true
  }
})

// Remove keyboard
await telegram.sendMessage({
  chatId: userId,
  text: 'Done!',
  replyMarkup: {
    removeKeyboard: true
  }
})
```

## File Handling

### Receiving Videos from Users

```typescript
// Handle incoming video
telegram.on('video', async (message) => {
  const video = message.video
  
  console.log(`Received video: ${video.fileName}`)
  console.log(`Size: ${video.fileSize} bytes`)
  console.log(`Duration: ${video.duration}s`)
  
  // Download file
  const file = await telegram.getFile(video.fileId)
  const url = `https://api.telegram.org/file/bot${botToken}/${file.filePath}`
  
  const localPath = await downloadFile(url, `/tmp/${video.fileId}.mp4`)
  
  // Process video
  const processed = await processVideo(localPath)
  
  // Send processed video
  await telegram.sendVideo({
    chatId: message.chat.id,
    video: processed.path,
    caption: 'Video processed! ✨',
    replyToMessageId: message.messageId
  })
})
```

### Working with Large Files

```typescript
// Chunked upload for large files
const uploadLargeVideo = async (chatId, videoPath) => {
  const stats = await fs.stat(videoPath)
  
  if (stats.size > 50 * 1024 * 1024) { // > 50MB
    // Compress before sending
    const compressed = await compressForTelegram(videoPath)
    
    return await telegram.sendVideo({
      chatId: chatId,
      video: compressed,
      supportsStreaming: true
    })
  } else {
    // Direct send
    return await telegram.sendVideo({
      chatId: chatId,
      video: videoPath
    })
  }
}

// Multipart upload via MTProto
const uploadViaMTProto = async (chatId, videoPath) => {
  const client = await telegram.getMTProtoClient()
  
  const result = await client.sendFile(chatId, {
    file: videoPath,
    caption: 'Large file uploaded via MTProto',
    progressCallback: (progress) => {
      console.log(`Progress: ${progress.percentage}%`)
    }
  })
  
  return result
}
```

## Payments and Monetization

### Payment Setup

```typescript
// Send invoice
const invoice = await telegram.sendInvoice({
  chatId: userId,
  title: 'Timeline Studio Pro',
  description: 'Full access to features for 1 month',
  payload: 'timeline_studio_pro_1month',
  providerToken: process.env.PAYMENT_PROVIDER_TOKEN,
  currency: 'USD',
  prices: [
    { label: 'Pro Subscription', amount: 999 } // in cents
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

// Handle payments
telegram.on('pre_checkout_query', async (query) => {
  // Verify payment
  await telegram.answerPreCheckoutQuery({
    preCheckoutQueryId: query.id,
    ok: true
  })
})

telegram.on('successful_payment', async (message) => {
  const payment = message.successfulPayment
  
  // Activate subscription
  await activateSubscription(message.from.id, payment.invoicePayload)
  
  await telegram.sendMessage({
    chatId: message.chat.id,
    text: '✅ Thank you for your purchase! Your subscription is activated.'
  })
})
```

## Analytics and Statistics

### Activity Tracking

```typescript
// Collect analytics
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

// Usage
telegram.on('message', async (message) => {
  await analytics.trackEvent(message.from.id, 'message_sent', {
    type: message.video ? 'video' : 'text',
    chat: message.chat.type
  })
})
```

## Error Handling

```typescript
try {
  await telegram.sendVideo(videoData)
} catch (error) {
  if (error.code === 400) {
    if (error.description.includes('FILE_TOO_BIG')) {
      console.error('File exceeds 50MB limit')
      // Compress and retry
      const compressed = await compressVideo(videoData)
      await telegram.sendVideo(compressed)
    } else if (error.description.includes('VIDEO_FORMAT_UNSUPPORTED')) {
      console.error('Unsupported video format')
      // Convert to MP4
      const converted = await convertToMP4(videoData)
      await telegram.sendVideo(converted)
    }
  } else if (error.code === 429) {
    console.error('Rate limit exceeded')
    const retryAfter = error.parameters.retry_after || 60
    await delay(retryAfter * 1000)
  } else if (error.code === 403) {
    console.error('Bot blocked by user or removed from channel')
  }
}
```

## Limits and Recommendations

### Technical Limits

- **File size**: maximum 50MB via Bot API, 2GB via MTProto
- **Video duration**: up to 60 minutes
- **Resolution**: recommended up to 1280x720 for mobile
- **Format**: MP4 (H.264/AAC) for best compatibility
- **Bitrate**: recommended 1-2 Mbps

### API Limits

- **Messages**: 30 messages per second
- **Grouping**: up to 10 media in one group
- **Bulk operations**: 50 participants at once
- **Inline results**: up to 50 per query

### Recommendations

1. **Optimize videos** for mobile devices
2. **Use compression** for large files
3. **Add thumbnails** for better UX
4. **Use buttons** for interactivity
5. **Cache files** via file_id
6. **Set up webhook** for production

---

*Last updated: July 31, 2025*