# YouTube API Integration

## Overview

YouTube API integration allows you to upload videos, manage playlists, get analytics and work with comments directly from Timeline Studio.

## Setup

### Getting API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add `timeline-studio://oauth/callback` to allowed URIs

### In-app Configuration

```typescript
// Initialize YouTube client
const youtube = await initializeYouTube({
  clientId: process.env.YOUTUBE_CLIENT_ID,
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  redirectUri: 'timeline-studio://oauth/callback'
})
```

## Authentication

### OAuth 2.0 Flow

```typescript
// Start OAuth process
const authUrl = youtube.getAuthorizationUrl({
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtubepartner'
  ]
})

// Open browser for authorization
await openBrowser(authUrl)

// Handle callback
youtube.on('authenticated', (tokens) => {
  saveTokens(tokens)
})
```

### Token Refresh

```typescript
// Automatic token refresh
youtube.on('tokenRefreshed', (newTokens) => {
  saveTokens(newTokens)
})

// Manual refresh
const refreshedTokens = await youtube.refreshAccessToken()
```

## Video Upload

### Basic Upload

```typescript
// Simple upload
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

// Track progress
upload.on('progress', (progress) => {
  console.log(`Upload progress: ${progress.percentage}%`)
  console.log(`Bytes sent: ${progress.bytesUploaded}/${progress.totalBytes}`)
})

// Upload complete
upload.on('complete', (video) => {
  console.log(`Video uploaded: https://youtube.com/watch?v=${video.id}`)
})
```

### Advanced Settings

```typescript
// Upload with additional parameters
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
    publishAt: '2024-12-25T10:00:00Z', // Scheduled
    recordingDetails: {
      recordingDate: '2024-12-20T15:30:00Z',
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

### Resumable Upload

```typescript
// Create resumable session
const session = await youtube.createResumableUpload({
  videoSize: videoFile.size,
  metadata: videoMetadata
})

// Upload with resume capability
const resumableUpload = await youtube.resumeUpload(session, {
  startByte: lastUploadedByte,
  onProgress: updateProgressBar
})

// Handle interruptions
resumableUpload.on('interrupted', async (error) => {
  // Save progress
  await saveUploadProgress(session.id, resumableUpload.bytesUploaded)
  
  // Attempt to resume
  setTimeout(() => {
    resumableUpload.resume()
  }, 5000)
})
```

## Video Management

### Update Metadata

```typescript
// Update video information
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

// Set thumbnail
await youtube.setThumbnail(videoId, {
  imagePath: '/path/to/new-thumbnail.jpg'
})
```

### Get Information

```typescript
// Get video details
const video = await youtube.getVideo(videoId, {
  parts: ['snippet', 'statistics', 'status', 'contentDetails']
})

console.log(`Views: ${video.statistics.viewCount}`)
console.log(`Likes: ${video.statistics.likeCount}`)
console.log(`Duration: ${video.contentDetails.duration}`)

// Get video list
const myVideos = await youtube.listVideos({
  mine: true,
  maxResults: 50,
  order: 'date',
  parts: ['snippet', 'statistics']
})
```

## Playlists

### Create Playlist

```typescript
// Create new playlist
const playlist = await youtube.createPlaylist({
  title: 'Timeline Studio Showcase',
  description: 'Videos created with Timeline Studio',
  privacyStatus: 'public',
  tags: ['timeline-studio', 'showcase']
})

// Add video to playlist
await youtube.addToPlaylist({
  playlistId: playlist.id,
  videoId: video.id,
  position: 0 // Position in playlist
})
```

### Manage Playlists

```typescript
// Get playlists
const playlists = await youtube.listPlaylists({
  mine: true,
  maxResults: 50
})

// Update playlist
await youtube.updatePlaylist(playlistId, {
  title: 'New Title',
  description: 'Updated description',
  privacyStatus: 'private'
})

// Remove video from playlist
await youtube.removeFromPlaylist(playlistItemId)
```

## Comments

### Get Comments

```typescript
// Get video comments
const comments = await youtube.getComments(videoId, {
  maxResults: 100,
  order: 'relevance', // 'time' | 'relevance'
  textFormat: 'plainText' // 'html' | 'plainText'
})

// Get comment replies
const replies = await youtube.getCommentReplies(commentId)
```

### Manage Comments

```typescript
// Reply to comment
await youtube.replyToComment(commentId, {
  text: 'Thanks for watching! Created with Timeline Studio.'
})

// Moderate comments
await youtube.moderateComment(commentId, {
  moderationStatus: 'heldForReview' // 'published' | 'heldForReview' | 'rejected'
})

// Set comment settings
await youtube.setCommentSettings(videoId, {
  allowComments: true,
  moderationMode: 'automatic' // 'automatic' | 'manual'
})
```

## Analytics

### YouTube Analytics API

```typescript
// Get channel analytics
const analytics = await youtube.getAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  metrics: ['views', 'likes', 'shares', 'estimatedMinutesWatched'],
  dimensions: ['day']
})

// Video analytics
const videoAnalytics = await youtube.getVideoAnalytics(videoId, {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
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

// Demographics
const demographics = await youtube.getDemographics(videoId, {
  dimensions: ['ageGroup', 'gender']
})
```

### Reports

```typescript
// Generate report
const report = await youtube.generateReport({
  videoIds: [video1Id, video2Id],
  dateRange: 'last30Days',
  metrics: ['all'],
  format: 'csv'
})

// Export report
await youtube.exportReport(report, '/path/to/report.csv')
```

## Live Streaming

### Create Broadcast

```typescript
// Create live stream
const broadcast = await youtube.createBroadcast({
  title: 'Live from Timeline Studio',
  description: 'Live streaming test',
  scheduledStartTime: new Date(Date.now() + 3600000), // +1 hour
  privacyStatus: 'unlisted',
  enableDvr: true,
  enableContentEncryption: false,
  enableEmbed: true,
  recordFromStart: true,
  startWithSlate: false
})

// Create stream
const stream = await youtube.createStream({
  title: 'Timeline Studio Stream',
  resolution: '1080p',
  frameRate: '30fps',
  ingestionType: 'rtmp'
})

// Bind broadcast to stream
await youtube.bindBroadcastToStream(broadcast.id, stream.id)

// Get RTMP URL
console.log(`Stream URL: ${stream.cdn.ingestionInfo.ingestionAddress}`)
console.log(`Stream Key: ${stream.cdn.ingestionInfo.streamName}`)
```

### Manage Broadcast

```typescript
// Start broadcast
await youtube.transitionBroadcast(broadcast.id, 'live')

// Pause broadcast
await youtube.transitionBroadcast(broadcast.id, 'pause')

// Complete broadcast
await youtube.transitionBroadcast(broadcast.id, 'complete')

// Monitor status
const status = await youtube.getBroadcastStatus(broadcast.id)
console.log(`Status: ${status.lifeCycleStatus}`)
console.log(`Health: ${status.healthStatus.status}`)
```

## Error Handling

```typescript
try {
  await youtube.uploadVideo(videoData)
} catch (error) {
  if (error.code === 'quotaExceeded') {
    console.error('API quota exceeded')
    showQuotaWarning()
  } else if (error.code === 'videoNotFound') {
    console.error('Video not found')
  } else if (error.code === 'forbidden') {
    console.error('Access forbidden')
    refreshAuthentication()
  } else if (error.code === 'uploadFailed') {
    console.error('Upload failed:', error.message)
    // Attempt to resume
    attemptResume(error.uploadUrl)
  }
}
```

## Limits and Recommendations

### API Quotas

- **Daily limit**: 10,000 units
- **Video upload**: 1600 units
- **Metadata update**: 50 units
- **Data read**: 1 unit

### Recommendations

1. **Cache data** to reduce requests
2. **Use batch requests** where possible
3. **Implement exponential backoff** for retries
4. **Monitor quota usage** via API
5. **Use webhooks** for updates

---

*Last updated: July 31, 2025*