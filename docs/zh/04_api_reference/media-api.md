# MEDIA API REFERENCE

## Overview

The Media API provides comprehensive functionality for working with media files, including import, analysis, processing, and export operations.

## Core Types

### MediaFile

```typescript
interface MediaFile {
  id: string;
  path: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  duration: number; // in seconds
  size: number; // in bytes
  metadata: MediaMetadata;
  thumbnail?: string;
  proxy?: ProxyInfo;
}
```

### MediaMetadata

```typescript
interface MediaMetadata {
  // Video properties
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
  pixelFormat?: string;
  
  // Audio properties
  sampleRate?: number;
  channels?: number;
  audioCodec?: string;
  audioBitrate?: number;
  
  // Common properties
  creation_date?: string;
  modification_date?: string;
  tags?: Record<string, string>;
}
```

## Import Operations

### `importMedia`

Import media files into the project.

```typescript
async function importMedia(options: ImportOptions): Promise<MediaFile[]>

interface ImportOptions {
  paths: string[];
  generateProxies?: boolean;
  generateThumbnails?: boolean;
  analyzeMeta data?: boolean;
}

// Example
const media = await importMedia({
  paths: ['/path/to/video.mp4'],
  generateProxies: true,
  generateThumbnails: true
});
```

### `importMediaFromUrl`

Import media from URL.

```typescript
async function importMediaFromUrl(
  url: string,
  options?: UrlImportOptions
): Promise<MediaFile>

interface UrlImportOptions {
  headers?: Record<string, string>;
  timeout?: number;
  saveAs?: string;
}
```

## Analysis Operations

### `analyzeMedia`

Perform deep analysis of media file.

```typescript
async function analyzeMedia(
  mediaId: string,
  options?: AnalysisOptions
): Promise<DetailedAnalysis>

interface AnalysisOptions {
  includeScenes?: boolean;
  includeAudio?: boolean;
  includeQuality?: boolean;
}

interface DetailedAnalysis {
  basic: MediaMetadata;
  scenes?: SceneInfo[];
  audio?: AudioAnalysis;
  quality?: QualityMetrics;
}
```

### `detectScenes`

Detect scene changes in video.

```typescript
async function detectScenes(
  mediaId: string,
  threshold?: number
): Promise<SceneInfo[]>

interface SceneInfo {
  index: number;
  startTime: number;
  endTime: number;
  startFrame: number;
  endFrame: number;
  thumbnail: string;
}
```

## Thumbnail Operations

### `generateThumbnail`

Generate thumbnail at specific time.

```typescript
async function generateThumbnail(
  mediaId: string,
  time: number,
  options?: ThumbnailOptions
): Promise<string>

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-100
  format?: 'jpeg' | 'png' | 'webp';
}
```

### `generateThumbnailGrid`

Generate grid of thumbnails.

```typescript
async function generateThumbnailGrid(
  mediaId: string,
  options?: GridOptions
): Promise<string>

interface GridOptions {
  rows: number;
  columns: number;
  width?: number;
  height?: number;
  timestamps?: number[]; // specific times, or auto-generate
}
```

## Proxy Operations

### `generateProxy`

Generate proxy file for better performance.

```typescript
async function generateProxy(
  mediaId: string,
  options?: ProxyOptions
): Promise<ProxyInfo>

interface ProxyOptions {
  resolution?: '720p' | '1080p' | 'auto';
  codec?: 'h264' | 'prores' | 'dnxhd';
  quality?: 'low' | 'medium' | 'high';
}

interface ProxyInfo {
  path: string;
  resolution: { width: number; height: number };
  codec: string;
  size: number;
}
```

### `toggleProxy`

Switch between proxy and original.

```typescript
async function toggleProxy(
  mediaId: string,
  useProxy: boolean
): Promise<void>
```

## Processing Operations

### `trimMedia`

Trim media file.

```typescript
async function trimMedia(
  mediaId: string,
  startTime: number,
  endTime: number,
  options?: TrimOptions
): Promise<MediaFile>

interface TrimOptions {
  copyCodec?: boolean; // faster but less precise
  outputPath?: string;
}
```

### `extractAudio`

Extract audio from video.

```typescript
async function extractAudio(
  mediaId: string,
  options?: ExtractAudioOptions
): Promise<MediaFile>

interface ExtractAudioOptions {
  format?: 'wav' | 'mp3' | 'aac';
  quality?: number;
  channels?: 'mono' | 'stereo';
}
```

### `concatenateMedia`

Concatenate multiple media files.

```typescript
async function concatenateMedia(
  mediaIds: string[],
  options?: ConcatOptions
): Promise<MediaFile>

interface ConcatOptions {
  transition?: 'none' | 'crossfade' | 'dissolve';
  transitionDuration?: number;
  outputPath?: string;
}
```

## Frame Operations

### `extractFrame`

Extract single frame as image.

```typescript
async function extractFrame(
  mediaId: string,
  frameNumber: number,
  options?: FrameOptions
): Promise<string>

interface FrameOptions {
  format?: 'jpeg' | 'png' | 'bmp';
  quality?: number;
  scale?: { width: number; height: number };
}
```

### `extractFrameSequence`

Extract sequence of frames.

```typescript
async function extractFrameSequence(
  mediaId: string,
  startFrame: number,
  endFrame: number,
  options?: SequenceOptions
): Promise<string[]>

interface SequenceOptions {
  step?: number; // extract every N frames
  format?: 'jpeg' | 'png';
  outputPattern?: string; // e.g., "frame_%04d.png"
}
```

## Audio Operations

### `normalizeAudio`

Normalize audio levels.

```typescript
async function normalizeAudio(
  mediaId: string,
  options?: NormalizeOptions
): Promise<MediaFile>

interface NormalizeOptions {
  target?: number; // target LUFS
  peak?: number; // max peak level
  algorithm?: 'ebu' | 'peak' | 'rms';
}
```

### `removeAudioNoise`

Remove background noise.

```typescript
async function removeAudioNoise(
  mediaId: string,
  options?: NoiseReductionOptions
): Promise<MediaFile>

interface NoiseReductionOptions {
  sensitivity?: number; // 0-1
  amount?: number; // 0-1
  noiseProfile?: string; // path to noise profile
}
```

## Metadata Operations

### `updateMetadata`

Update media metadata.

```typescript
async function updateMetadata(
  mediaId: string,
  metadata: Partial<MediaMetadata>
): Promise<void>
```

### `extractSubtitles`

Extract embedded subtitles.

```typescript
async function extractSubtitles(
  mediaId: string
): Promise<SubtitleTrack[]>

interface SubtitleTrack {
  index: number;
  language?: string;
  format: string;
  content: string;
}
```

## Export Operations

### `exportMedia`

Export processed media.

```typescript
async function exportMedia(
  mediaId: string,
  options: ExportOptions
): Promise<ExportResult>

interface ExportOptions {
  format: 'mp4' | 'mov' | 'webm' | 'gif';
  codec?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  resolution?: { width: number; height: number };
  fps?: number;
  bitrate?: number;
  outputPath: string;
}

interface ExportResult {
  path: string;
  size: number;
  duration: number;
  format: string;
}
```

## Streaming Operations

### `createStreamingManifest`

Create HLS/DASH manifest for streaming.

```typescript
async function createStreamingManifest(
  mediaId: string,
  options: StreamingOptions
): Promise<ManifestInfo>

interface StreamingOptions {
  protocol: 'hls' | 'dash';
  variants: Array<{
    resolution: string;
    bitrate: number;
  }>;
  segmentDuration?: number;
}
```

## Events

Media operations emit progress events:

```typescript
// Listen for import progress
mediaApi.on('import:progress', (event: ImportProgress) => {
  console.log(`Importing: ${event.percent}%`);
});

// Listen for processing progress
mediaApi.on('process:progress', (event: ProcessProgress) => {
  console.log(`Processing: ${event.current}/${event.total}`);
});
```

## Error Handling

```typescript
try {
  const media = await importMedia({ paths: ['/invalid/path'] });
} catch (error) {
  if (error.code === 'FILE_NOT_FOUND') {
    // Handle missing file
  } else if (error.code === 'UNSUPPORTED_FORMAT') {
    // Handle unsupported format
  }
}
```

Common error codes:
- `FILE_NOT_FOUND` - File doesn't exist
- `UNSUPPORTED_FORMAT` - Format not supported
- `CODEC_ERROR` - Codec issues
- `INSUFFICIENT_SPACE` - Not enough disk space
- `PROCESSING_ERROR` - General processing error

---

*For implementation examples, see the [Media Processing Guide](../05_DEVELOPMENT/MEDIA_PROCESSING.md)*