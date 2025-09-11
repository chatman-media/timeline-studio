# Integrations

## 📋 Contents

Documentation for Timeline Studio integrations with external services and platforms.

### 🌐 Social Media

- [**youtube-api.md**](youtube-api.md) - YouTube API Integration
  - Video upload
  - Playlist management
  - Analytics and comments

- [**tiktok-api.md**](tiktok-api.md) - TikTok API Integration
  - Video publishing
  - Vertical format optimization
  - Hashtags and descriptions

- [**vimeo-api.md**](vimeo-api.md) - Vimeo API Integration
  - High quality upload
  - Privacy and settings
  - Video embedding

- [**telegram-api.md**](telegram-api.md) - Telegram API Integration
  - Send videos to channels
  - Telegram compression
  - Bots and automation

### 🤖 AI Services

- [**claude-api.md**](claude-api.md) - Claude API Integration (Anthropic)
  - API configuration
  - Streaming responses
  - Context and history

- [**openai-api.md**](openai-api.md) - OpenAI API Integration
  - GPT-4 integration
  - DALL-E for image generation
  - Whisper for transcription

- [**anthropic-api.md**](anthropic-api.md) - Advanced Anthropic Integration
  - Claude 3 models
  - Safety and moderation
  - Token optimization

## 🔑 Common Principles

### Authentication

All integrations use secure key storage via Tauri:

```typescript
// Save API key
await saveApiKey('youtube', {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: 'refresh-token'
})

// Get key
const credentials = await getApiKey('youtube')
```

### OAuth 2.0

Social networks use OAuth 2.0 flow:

```typescript
// Initialize OAuth
const auth = await initializeOAuth('youtube', {
  redirectUri: 'timeline-studio://oauth/callback',
  scopes: ['upload', 'manage']
})

// Get token
const token = await auth.getAccessToken()
```

### Error Handling

Standardized error handling for all integrations:

```typescript
try {
  await uploadToYouTube(video, metadata)
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Rate limit exceeded
  } else if (error.code === 'AUTH_FAILED') {
    // Authentication failed
  } else if (error.code === 'NETWORK_ERROR') {
    // Network error
  }
}
```

## 📊 Limits and Quotas

Each integration has its own limitations:

| Service | Request Limit | File Size | Other Limits |
|---------|--------------|-----------|--------------|
| YouTube | 10,000 units/day | 128GB | 12 hours video |
| TikTok | 100 req/min | 287MB | 60 seconds |
| Vimeo | Depends on plan | 25GB | No limits |
| Telegram | 30 msg/sec | 50MB | 20 minutes |
| Claude | 1000 req/day | - | 100k tokens |
| OpenAI | Depends on plan | - | 128k tokens |

## 🔗 Related Sections

- [Export API](../export-api.md) - Video export API
- [AI Chat API](../ai-chat-api.md) - AI chat integrations
- [Social Media API](../social-media-api.md) - General social media API

---

*Last updated: July 31, 2025*