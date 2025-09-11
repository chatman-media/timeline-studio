# TikTok API Integration

## Overview

TikTok API integration allows you to publish videos in vertical format with automatic optimization, manage hashtags and interact with TikTok audience directly from Timeline Studio.

## Setup

### Getting API Access

1. Register at [TikTok for Developers](https://developers.tiktok.com)
2. Create an app in TikTok Developer Portal
3. Get App ID and App Secret
4. Configure OAuth Redirect URI: `timeline-studio://oauth/tiktok`
5. Apply for Production Access for video publishing

### In-app Configuration

```typescript
// Initialize TikTok client
const tiktok = await initializeTikTok({
  appId: process.env.TIKTOK_APP_ID,
  appSecret: process.env.TIKTOK_APP_SECRET,
  redirectUri: 'timeline-studio://oauth/tiktok'
})
```

## Authentication

### OAuth 2.0 Flow

```typescript
// Start OAuth process
const authUrl = tiktok.getAuthorizationUrl({
  scopes: [
    'user.info.basic',
    'video.upload',
    'video.publish'
  ],
  state: generateSecureState()
})

// Open browser for authorization
await openBrowser(authUrl)

// Handle callback
tiktok.on('authenticated', async (tokens) => {
  await saveTokens('tiktok', tokens)
  const userInfo = await tiktok.getUserInfo()
  console.log(`Authenticated as: ${userInfo.displayName}`)
})
```

### Token Refresh

```typescript
// Automatic refresh
tiktok.on('tokenRefreshed', async (newTokens) => {
  await saveTokens('tiktok', newTokens)
})

// Check token expiry
if (await tiktok.isTokenExpired()) {
  await tiktok.refreshAccessToken()
}
```

## Video Publishing

### Basic Publishing

```typescript
// Simple publish
const post = await tiktok.publishVideo({
  videoPath: '/path/to/video.mp4',
  caption: 'Made with Timeline Studio 🎬',
  privacy: 'public' // 'public' | 'friends' | 'private'
})

// Track upload
post.on('uploadProgress', (progress) => {
  console.log(`Upload: ${progress.percentage}%`)
})

// Publishing complete
post.on('published', (video) => {
  console.log(`Published: ${video.shareUrl}`)
  console.log(`Video ID: ${video.id}`)
})
```

### Advanced Publishing

```typescript
// Publish with additional parameters
const advancedPost = await tiktok.publishVideo({
  videoPath: '/path/to/video.mp4',
  caption: 'Professional video from Timeline Studio',
  hashtags: ['timelinestudio', 'videoediting', 'creative'],
  mentions: ['@friend1', '@friend2'],
  privacy: 'public',
  allowComments: true,
  allowDuet: true,
  allowStitch: true,
  location: {
    id: 'location_id',
    name: 'New York, USA'
  },
  music: {
    id: 'music_id', // TikTok track ID
    startTime: 0,
    endTime: 30
  }
})
```

### TikTok Optimization

```typescript
// Automatic video optimization
const optimizedVideo = await tiktok.optimizeVideo({
  inputPath: '/path/to/horizontal-video.mp4',
  outputPath: '/path/to/tiktok-video.mp4',
  options: {
    // Auto crop to 9:16
    aspectRatio: '9:16',
    resolution: '1080x1920',
    
    // Smart crop with face tracking
    smartCrop: true,
    faceTracking: true,
    
    // TikTok limits
    maxDuration: 60, // seconds
    maxFileSize: 287, // MB
    
    // Quality
    bitrate: 'auto',
    frameRate: 30,
    
    // Effects
    effects: {
      autoEnhance: true,
      stabilization: true
    }
  }
})

// Optimization preview
const preview = await tiktok.generateOptimizationPreview({
  inputPath: '/path/to/video.mp4',
  timestamps: [5, 15, 25] // Key moments
})
```

## Hashtags and Trends

### Trend Analysis

```typescript
// Get trending hashtags
const trendingHashtags = await tiktok.getTrendingHashtags({
  country: 'US',
  category: 'creativity',
  limit: 20
})

// Analyze hashtag
const hashtagAnalytics = await tiktok.analyzeHashtag('#timelinestudio', {
  metrics: ['views', 'videos', 'engagement']
})

// Hashtag recommendations
const suggestedHashtags = await tiktok.suggestHashtags({
  caption: 'Video editing for YouTube',
  videoContent: await analyzeVideoContent(videoPath),
  targetAudience: 'creators'
})
```

### Hashtag Management

```typescript
// Auto-generate hashtags
const hashtags = await tiktok.generateHashtags({
  videoAnalysis: {
    content: 'travel',
    mood: 'energetic',
    style: 'cinematic'
  },
  language: 'en',
  mix: {
    trending: 5,    // Trending
    niche: 5,       // Niche
    branded: 1      // Branded
  }
})

// Validate hashtags
const validatedHashtags = await tiktok.validateHashtags(hashtags, {
  checkBanned: true,
  checkSpelling: true,
  maxLength: 100 // Total length
})
```

## Content Management

### Get Video Information

```typescript
// Video info
const videoInfo = await tiktok.getVideo(videoId)

console.log(`Views: ${videoInfo.stats.viewCount}`)
console.log(`Likes: ${videoInfo.stats.likeCount}`)
console.log(`Comments: ${videoInfo.stats.commentCount}`)
console.log(`Shares: ${videoInfo.stats.shareCount}`)

// List my videos
const myVideos = await tiktok.listMyVideos({
  limit: 50,
  offset: 0,
  fields: ['id', 'title', 'stats', 'createTime']
})
```

### Delete and Update

```typescript
// Delete video
await tiktok.deleteVideo(videoId)

// Update description (if supported)
await tiktok.updateVideo(videoId, {
  caption: 'Updated description',
  privacy: 'friends'
})
```

## Analytics

### Video Statistics

```typescript
// Detailed analytics
const analytics = await tiktok.getVideoAnalytics(videoId, {
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
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

// Views timeline
const viewsChart = await tiktok.getViewsTimeline(videoId, {
  period: 'day',
  last: 30
})
```

### Account Analytics

```typescript
// Account stats
const accountStats = await tiktok.getAccountAnalytics({
  metrics: [
    'followers',
    'following',
    'totalViews',
    'totalLikes',
    'avgEngagement'
  ]
})

// Follower growth
const followerGrowth = await tiktok.getFollowerGrowth({
  period: 'week',
  last: 12
})
```

## Comments

### Comment Management

```typescript
// Get comments
const comments = await tiktok.getComments(videoId, {
  limit: 100,
  offset: 0,
  sort: 'time' // 'time' | 'likes'
})

// Reply to comment
await tiktok.replyToComment(commentId, {
  text: 'Thanks for watching! 😊'
})

// Like comment
await tiktok.likeComment(commentId)

// Delete comment
await tiktok.deleteComment(commentId)
```

### Moderation

```typescript
// Comment settings
await tiktok.setCommentSettings(videoId, {
  allowComments: true,
  filterKeywords: ['spam', 'promo'],
  requireApproval: false
})

// Bulk moderation
await tiktok.moderateComments(videoId, {
  action: 'delete',
  filter: {
    keywords: ['spam'],
    minReports: 3
  }
})
```

## Live Streaming

### Create Broadcast

```typescript
// Create live stream
const liveStream = await tiktok.createLiveStream({
  title: 'Real-time editing',
  description: 'Watch me edit videos in Timeline Studio',
  coverImage: '/path/to/cover.jpg',
  startTime: new Date(Date.now() + 600000), // +10 minutes
  tags: ['editing', 'tutorial', 'timelinestudio']
})

// Get RTMP data
console.log(`Stream URL: ${liveStream.rtmpUrl}`)
console.log(`Stream Key: ${liveStream.streamKey}`)

// Start broadcast
await liveStream.start()

// Monitoring
liveStream.on('viewers', (count) => {
  console.log(`Viewers: ${count}`)
})

liveStream.on('gift', (gift) => {
  console.log(`${gift.user} sent ${gift.name}`)
})
```

## Templates and Effects

### Using TikTok Templates

```typescript
// Get popular templates
const templates = await tiktok.getTemplates({
  category: 'transitions',
  trending: true,
  limit: 20
})

// Apply template
const videoWithTemplate = await tiktok.applyTemplate({
  videoPath: '/path/to/video.mp4',
  templateId: 'template_123',
  customization: {
    text: ['Timeline Studio', '2024'],
    colors: ['#FF0000', '#00FF00'],
    music: 'auto' // Auto-select music
  }
})
```

## Performance Optimization

### Batch Processing

```typescript
// Batch publish
const batchUpload = await tiktok.batchPublish([
  {
    videoPath: '/path/to/video1.mp4',
    caption: 'Video 1',
    scheduledTime: '2024-12-01T10:00:00Z'
  },
  {
    videoPath: '/path/to/video2.mp4',
    caption: 'Video 2',
    scheduledTime: '2024-12-02T10:00:00Z'
  }
], {
  parallel: 2,
  retryFailed: true
})

// Track progress
batchUpload.on('progress', (status) => {
  console.log(`Processed: ${status.completed}/${status.total}`)
})
```

## Error Handling

```typescript
try {
  await tiktok.publishVideo(videoData)
} catch (error) {
  if (error.code === 'VIDEO_TOO_LARGE') {
    console.error('Video exceeds 287MB limit')
    // Compress video
    const compressed = await compressForTikTok(videoData)
    await tiktok.publishVideo(compressed)
  } else if (error.code === 'RATE_LIMIT') {
    console.error('Rate limit exceeded')
    // Retry after delay
    await delay(error.retryAfter * 1000)
  } else if (error.code === 'BANNED_CONTENT') {
    console.error('Content violates TikTok guidelines')
    showContentGuidelines()
  }
}
```

## Limits and Recommendations

### Technical Limits

- **Video size**: maximum 287MB
- **Duration**: 60 seconds (3 minutes for some accounts)
- **Format**: MP4 (H.264)
- **Resolution**: recommended 1080x1920
- **Aspect ratio**: 9:16
- **Frame rate**: 30 or 60 fps

### API Limits

- **Video publish**: 100 per day
- **API requests**: 100 per minute
- **Comments**: 1000 per day
- **Batch operations**: 10 videos at once

### Recommendations

1. **Optimize videos** before upload
2. **Use vertical format** (9:16)
3. **Add trending hashtags** to increase reach
4. **Publish at optimal times** (7PM-11PM)
5. **Use popular music** from TikTok library
6. **Create engaging previews** for first seconds

---

*Last updated: July 31, 2025*