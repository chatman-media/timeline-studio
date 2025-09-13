# Vimeo API Integration

## Overview

Vimeo API integration allows you to upload high-quality videos, manage privacy settings, create showcases, and use advanced Vimeo platform features for professional video work.

## Setup

### Getting API Access

1. Register at [Vimeo Developer](https://developer.vimeo.com)
2. Create a new application
3. Get Client ID, Client Secret, and Access Token
4. Configure scopes for your application
5. For Production access, verify your application

### In-app Configuration

```typescript
// Initialize Vimeo client
const vimeo = await initializeVimeo({
  clientId: process.env.VIMEO_CLIENT_ID,
  clientSecret: process.env.VIMEO_CLIENT_SECRET,
  accessToken: process.env.VIMEO_ACCESS_TOKEN,
  // Or for OAuth
  redirectUri: 'timeline-studio://oauth/vimeo'
})
```

## Authentication

### Personal Access Token

```typescript
// Using personal token
const vimeo = new VimeoClient({
  accessToken: 'your_personal_access_token'
})

// Verify token
const user = await vimeo.request('/me')
console.log(`Authenticated as: ${user.name}`)
```

### OAuth 2.0

```typescript
// Generate authorization URL
const authUrl = vimeo.buildAuthorizationEndpoint({
  redirectUri: 'timeline-studio://oauth/vimeo',
  state: generateSecureState(),
  scopes: [
    'public',
    'private',
    'upload',
    'delete',
    'video_files',
    'promo_codes'
  ]
})

// Exchange code for token
const tokens = await vimeo.accessToken(authCode, redirectUri)
await saveTokens('vimeo', tokens)
```

## Video Upload

### Basic Upload

```typescript
// Simple upload
const upload = await vimeo.upload({
  file: '/path/to/video.mp4',
  name: 'My Amazing Video',
  description: 'Created with Timeline Studio',
  privacy: {
    view: 'anybody', // 'anybody' | 'nobody' | 'password' | 'people' | 'users' | 'unlisted'
    embed: 'public', // 'public' | 'private' | 'whitelist'
    download: true,
    add: true,
    comments: 'anybody'
  }
})

// Track progress
upload.on('progress', (progress) => {
  console.log(`Uploaded: ${progress.percentage}%`)
  console.log(`Speed: ${progress.bytesPerSecond} bytes/sec`)
  console.log(`Time remaining: ${progress.estimatedTimeRemaining}s`)
})

// Upload complete
upload.on('complete', (video) => {
  console.log(`Video uploaded: ${video.link}`)
  console.log(`Video ID: ${video.resource_key}`)
})
```

### Advanced Upload

```typescript
// Upload with advanced settings
const advancedUpload = await vimeo.upload({
  file: '/path/to/video.mp4',
  name: 'Professional Video',
  description: detailedDescription,
  privacy: {
    view: 'unlisted',
    embed: 'whitelist',
    download: false,
    add: false,
    comments: 'nobody'
  },
  password: 'secure_password', // For password-protected videos
  content_rating: ['safe'], // 'safe' | 'unrated' | 'nudity' | 'violence' | 'drugs' | 'language'
  locale: 'en',
  license: 'by-sa', // Creative Commons licenses
  spatial: {
    stereo_format: 'mono', // 'mono' | 'left-right' | 'top-bottom'
    projection: 'equirectangular', // For 360 videos
    field_of_view: 90
  }
})
```

### Tus Resumable Upload

```typescript
// Create resumable upload (Tus protocol)
const tusUpload = await vimeo.createTusUpload({
  size: videoFile.size,
  name: 'Large Video File',
  description: 'Uploading large file'
})

// Upload with resume capability
const uploader = vimeo.uploadWithTus(tusUpload.upload_link, {
  file: videoFile,
  chunkSize: 128 * 1024 * 1024, // 128MB chunks
  retryDelays: [0, 1000, 3000, 5000],
  onProgress: (bytesUploaded, bytesTotal) => {
    updateProgressBar(bytesUploaded / bytesTotal)
  },
  onError: (error) => {
    console.error('Upload error:', error)
    // Upload will automatically resume
  }
})

// Pause/resume
uploader.pause()
uploader.resume()
```

## Video Management

### Update Information

```typescript
// Update metadata
await vimeo.request(`/videos/${videoId}`, {
  method: 'PATCH',
  body: {
    name: 'New Title',
    description: 'Updated description',
    privacy: {
      view: 'password',
      password: 'new_password'
    },
    categories: [
      '/categories/animation',
      '/categories/documentary'
    ],
    tags: ['timeline-studio', 'editing', '2024']
  }
})

// Set thumbnail
await vimeo.createPicture(videoId, {
  time: 15.5, // Timestamp in seconds
  active: true
})

// Upload custom thumbnail
await vimeo.uploadPicture(videoId, {
  file: '/path/to/thumbnail.jpg'
})
```

### Get Information

```typescript
// Detailed video information
const video = await vimeo.request(`/videos/${videoId}`, {
  fields: 'uri,name,description,duration,width,height,created_time,stats,pictures,download,files'
})

console.log(`Views: ${video.stats.plays}`)
console.log(`Duration: ${video.duration}s`)
console.log(`Resolution: ${video.width}x${video.height}`)

// Get video list
const videos = await vimeo.request('/me/videos', {
  page: 1,
  per_page: 25,
  query: 'timeline studio',
  direction: 'desc',
  sort: 'date',
  filter: 'playable'
})
```

## Folders and Showcases

### Create Folders

```typescript
// Create project folder
const folder = await vimeo.request('/me/projects', {
  method: 'POST',
  body: {
    name: 'Timeline Studio Projects',
    privacy: {
      view: 'anybody'
    }
  }
})

// Add video to folder
await vimeo.request(`/me/projects/${folder.resource_key}/videos/${videoId}`, {
  method: 'PUT'
})

// Create nested structure
const subFolder = await vimeo.request(`/me/projects/${folder.resource_key}/folders`, {
  method: 'POST',
  body: {
    name: 'Tutorials'
  }
})
```

### Showcases

```typescript
// Create showcase
const showcase = await vimeo.request('/me/albums', {
  method: 'POST',
  body: {
    name: 'Best of Timeline Studio',
    description: 'Best work created with Timeline Studio',
    privacy: 'anybody',
    brand_color: '#FF5733',
    layout: 'grid', // 'grid' | 'player' | 'list'
    theme: 'dark', // 'dark' | 'light'
    sort: 'manual', // 'manual' | 'date' | 'alphabetical' | 'plays' | 'likes' | 'comments' | 'duration'
    hide_nav: false,
    hide_upcoming: false
  }
})

// Add video to showcase
await vimeo.request(`/me/albums/${showcase.resource_key}/videos/${videoId}`, {
  method: 'PUT',
  body: {
    position: 1 // Position in showcase
  }
})
```

## Embedding

### Embed Settings

```typescript
// Get embed code
const embedData = await vimeo.request(`/videos/${videoId}`, {
  fields: 'embed'
})

// Configure embed parameters
await vimeo.request(`/videos/${videoId}`, {
  method: 'PATCH',
  body: {
    embed: {
      title: {
        name: 'show', // 'show' | 'hide'
        owner: 'show',
        portrait: 'show'
      },
      logos: {
        vimeo: false,
        custom: {
          active: true,
          link: 'https://yourdomain.com',
          sticky: true
        }
      },
      buttons: {
        like: true,
        watchlater: true,
        share: true,
        embed: false,
        hd: true,
        fullscreen: true,
        scaling: true
      },
      color: '#FF5733',
      volume: true,
      speed: true,
      pip: true // Picture-in-picture
    }
  }
})

// Generate iframe
const iframe = `
<iframe 
  src="https://player.vimeo.com/video/${videoId}?h=${embedData.embed.html.split('h=')[1].split('"')[0]}"
  width="1920" 
  height="1080" 
  frameborder="0" 
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen>
</iframe>
`
```

### Embed Domains

```typescript
// Add domains to whitelist
await vimeo.request(`/videos/${videoId}/privacy/domains`, {
  method: 'PUT',
  body: {
    domain: 'yourdomain.com'
  }
})

// Get domain list
const domains = await vimeo.request(`/videos/${videoId}/privacy/domains`)

// Remove domain
await vimeo.request(`/videos/${videoId}/privacy/domains/yourdomain.com`, {
  method: 'DELETE'
})
```

## Analytics

### Video Statistics

```typescript
// General statistics
const stats = await vimeo.request(`/videos/${videoId}/stats`)

console.log(`Total plays: ${stats.plays}`)
console.log(`Unique viewers: ${stats.unique_viewers}`)
console.log(`Average time watched: ${stats.average_time_watched}`)
console.log(`Total time watched: ${stats.total_time_watched}`)

// Detailed analytics (requires Vimeo Pro)
const analytics = await vimeo.request(`/videos/${videoId}/analytics`, {
  dimension: 'country', // 'country' | 'device_type' | 'embed_domain' | 'stream_type' | 'video'
  from: '2024-01-01',
  to: '2024-12-31',
  sort: 'plays',
  direction: 'desc'
})

// Views timeline
const timeSeriesData = await vimeo.request(`/videos/${videoId}/analytics/timeseries`, {
  metric: 'plays', // 'plays' | 'loads' | 'finishes' | 'downloads' | 'unique_viewers'
  interval: 'day', // 'day' | 'week' | 'month'
  from: '2024-01-01',
  to: '2024-12-31'
})
```

## Live Streaming

### Create Broadcast

```typescript
// Create live event (requires Vimeo Premium)
const liveEvent = await vimeo.request('/me/live_events', {
  method: 'POST',
  body: {
    title: 'Timeline Studio Live Demo',
    privacy: {
      view: 'anybody',
      embed: 'public'
    },
    streaming_privacy: {
      view: 'anybody'
    },
    schedule: {
      start_time: '2024-12-25T15:00:00+00:00'
    },
    auto_cc: true, // Automatic captions
    dvr: true, // Digital Video Recorder
    low_latency: true
  }
})

// Get RTMP data
console.log(`RTMP URL: ${liveEvent.rtmp.url}`)
console.log(`Stream Key: ${liveEvent.rtmp.stream_key}`)

// Manage broadcast
await vimeo.request(`/live_events/${liveEvent.resource_key}/activate`, {
  method: 'POST'
})

await vimeo.request(`/live_events/${liveEvent.resource_key}/end`, {
  method: 'POST'
})
```

## Teams and Permissions

### Team Management

```typescript
// Add team member
await vimeo.request('/me/team_members', {
  method: 'POST',
  body: {
    email: 'editor@example.com',
    role: 'contributor', // 'admin' | 'contributor' | 'viewer'
    folder_permission: 'edit', // 'view' | 'edit' | 'upload'
    video_permission: 'edit' // 'view' | 'edit' | 'delete'
  }
})

// Manage permissions
await vimeo.request(`/videos/${videoId}/permissions`, {
  method: 'POST',
  body: {
    users: [
      {
        uri: '/users/12345',
        can_edit: true,
        can_delete: false,
        can_view: true
      }
    ]
  }
})
```

## Error Handling

```typescript
try {
  await vimeo.upload(videoData)
} catch (error) {
  if (error.name === 'QUOTA_EXCEEDED') {
    console.error('Storage quota exceeded')
    showUpgradePrompt()
  } else if (error.name === 'INVALID_FILE') {
    console.error('Unsupported file format')
    showSupportedFormats()
  } else if (error.name === 'UPLOAD_ERROR') {
    console.error('Upload error:', error.message)
    // Attempt to resume for Tus uploads
    if (error.uploadUrl) {
      resumeUpload(error.uploadUrl)
    }
  } else if (error.name === 'RATE_LIMIT') {
    console.error('Rate limit exceeded')
    await delay(error.retryAfter * 1000)
  }
}
```

## Limits and Recommendations

### Plan Limits

| Feature | Basic | Plus | Pro | Business | Premium |
|---------|-------|------|-----|----------|---------|
| Storage/week | 500MB | 5GB | 20GB | No limit | No limit |
| Total storage | 5GB | 250GB | 1TB | 5TB | 7TB |
| File size | 500MB | 5GB | 25GB | 25GB | 25GB |
| Live streaming | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics | Basic | Basic | Advanced | Advanced | Advanced |
| Teams | ❌ | ❌ | 3 members | 10 members | No limit |

### API Limits

- **Requests**: 5000 per hour (authenticated), 1000 per hour (unauthenticated)
- **Upload**: Depends on plan
- **Tus chunk size**: 128MB recommended for large files

### Recommendations

1. **Use Tus protocol** for large files
2. **Optimize videos** before upload to save space
3. **Cache data** to reduce API requests
4. **Use webhooks** to track events
5. **Configure domains** for secure embedding
6. **Use tags and categories** for better organization

---

*Last updated: July 31, 2025*