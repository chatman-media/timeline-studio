# Subtitles Domain - Changelog

## [2024-11-27] Subtitle Service Consolidation

### Changes

**Domain Consolidation:**
- Merged subtitle functionality from `video-editing/services/subtitles` into unified `domains/subtitles`
- Removed duplicate `SubtitlesService` from video-editing domain
- Updated all features to use consolidated domain service

**New Methods Added:**
- `SubtitleService.exportSubtitleFile()` - Export subtitles to file (SRT, VTT, ASS, SSA)
- `SubtitleService.updateTimelineSubtitles()` - Update subtitles on timeline track

**New Tauri Commands:**
- `saveSubtitleFile()` - Save subtitle file through Rust backend
- `updateTimelineSubtitles()` - Update timeline subtitles through Rust backend

**New Types:**
- `SubtitleExportOptions` - Configuration for subtitle export
- `UpdateTimelineSubtitlesParams` - Parameters for timeline update

**Documentation Updates:**
- Added export methods to API.md
- Added timeline integration to README.md
- Updated Quick Start examples
- Added new types documentation
- Updated Key Features section

**Files Updated:**
- `src/features/subtitles/hooks/use-subtitles-export.ts` - Updated imports
- `src/features/subtitles/hooks/use-subtitle-import.ts` - Updated imports
- Removed `src/domains/video-editing/services/subtitles/` directory

### Migration Guide

**Before (video-editing service):**
```typescript
import { SubtitlesService } from "@/domains/video-editing/services/subtitles"

await SubtitlesService.saveSubtitleFile({ format, content, output_path })
await SubtitlesService.updateTimelineSubtitles({ trackId, subtitles })
```

**After (subtitles domain):**
```typescript
import { subtitleService } from "@/domains/subtitles"

await subtitleService.exportSubtitleFile({ format, content, output_path })
await subtitleService.updateTimelineSubtitles(trackId, subtitles)
```

### Breaking Changes

- Removed static `SubtitlesService` from video-editing domain
- Updated `updateTimelineSubtitles()` signature: now takes separate parameters instead of object

### Benefits

- Single source of truth for subtitle operations
- Consistent API with other domains
- Better separation of concerns
- Easier maintenance and testing

---

## [2024-11-27] Initial Domain Creation

### Created Components

**Services:**
- `SubtitleService` - Singleton service for subtitle operations
  - `importSubtitleFile()` - Import subtitle files (SRT, VTT, ASS, SSA)
  - `analyzeAudioForSync()` - Analyze audio peaks for synchronization
  - `getSupportedFormats()` - Get list of supported formats

**Tauri Commands:**
- `readSubtitleFile()` - Read subtitle file through Rust backend
- `analyzeAudioPeaks()` - Analyze audio peaks using FFmpeg

**Types:**
- `SubtitleImportResult` - Result of subtitle import operation
- `AudioPeaksResult` - Result of audio peak analysis
- `AudioAnalysisOptions` - Configuration for audio analysis

**Documentation:**
- `README.md` - Domain overview and quick start
- `docs/API.md` - Complete API reference
- `docs/ARCHITECTURE.md` - Architecture and design decisions
- `docs/CHANGELOG.md` - This file

### Supported Formats

- **SRT** - SubRip Text (most common format)
- **VTT** - WebVTT (web standard)
- **ASS** - Advanced SubStation Alpha (styled subtitles)
- **SSA** - SubStation Alpha (legacy styled subtitles)

### Architecture Decisions

**1. Singleton Service Pattern**
- Chose Singleton over Context Provider
- Reason: Lightweight domain, no complex state needed
- Benefits: Simple API, no provider setup, easy testing

**2. Tauri Backend Integration**
- All file operations through Rust backend
- FFmpeg integration for audio analysis
- Benefits: Native performance, cross-platform, handles large files

**3. Audio Sync Capability**
- FFT-based audio peak detection
- Configurable precision (windowSize, hopSize, threshold)
- Use case: Automatic subtitle timing alignment

**4. Minimal Surface Area**
- Only 3 public methods in SubtitleService
- Focused on core functionality: import and sync
- Easy to extend later without breaking changes

### Integration Points

- **Video Editing Domain:** Add subtitles to timeline
- **Transcription Feature:** Generate subtitles from audio
- **Timeline Editor:** Display and edit subtitle tracks

### Dependencies

**Internal:**
- `@/lib/tauri-logger` - Structured logging

**External:**
- `@tauri-apps/api/core` - Tauri IPC layer

**Backend:**
- Rust/Tauri - Native file operations
- FFmpeg - Audio analysis (already integrated in Timeline Studio)

### Code Statistics

- **Total LOC:** ~142 lines (excluding tests, docs, index files)
- **Services:** 57 lines
- **Tauri Commands:** 63 lines
- **Types:** 22 lines

### Testing Status

- **Unit Tests:** Not yet implemented (planned)
- **Integration Tests:** Not yet implemented (planned)
- **Tauri Commands:** Tested manually

### Future Enhancements (Planned)

**Short-term:**
- Add unit tests for all service methods
- Add integration tests with mock Tauri commands
- Error handling improvements

**Medium-term:**
- Subtitle editing functionality
- Save modified subtitles back to file
- Additional format support (TTML, SBV, SMI)

**Long-term:**
- Advanced synchronization algorithms
- Automatic subtitle generation from transcripts
- Style management for ASS/SSA formats
- Subtitle preview with styling

### Known Limitations

1. ~~**Read-only:** Currently only imports subtitles, no editing/saving~~ **RESOLVED** - Export and timeline update now supported
2. **Format detection:** Based on file extension only
3. **No parsing:** Returns raw content, features must parse themselves
4. **No validation:** Assumes subtitle files are well-formed
5. **No progress:** Audio analysis doesn't report progress (long files)

### Migration Notes

This is a new domain with no migration needed. To use:

```typescript
import { subtitleService } from "@/domains/subtitles"

// Import subtitles
const result = await subtitleService.importSubtitleFile(path)

// Analyze audio for sync
const peaks = await subtitleService.analyzeAudioForSync(videoPath)

// Get supported formats
const formats = subtitleService.getSupportedFormats()
```

### Related Domains

- **`ai-services`** - Could use subtitle content for AI analysis
- **`video-editing`** - Main consumer of subtitle functionality
- **`transcription`** - Generates subtitle content from audio

### Breaking Changes

None - this is initial release.

### Contributors

- Initial implementation: Domain architecture refactoring
- Documentation: Following Timeline Studio standards
