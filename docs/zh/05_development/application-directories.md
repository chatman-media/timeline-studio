# Timeline Studio Application Directories

## Overview

Timeline Studio automatically creates and manages a directory structure for storing user data and application resources.

On first launch, the following directories are created:

### Base Directory Location
- **macOS**: `~/Movies/Timeline Studio`
- **Windows**: `~/Videos/Timeline Studio`
- **Linux**: `~/Videos/Timeline Studio`

### Directory Structure
```
Timeline Studio/
├── Media/                  # User media files and resources
│   ├── Videos/            # Video files
│   ├── Images/            # Images
│   ├── Music/             # Audio/music files
│   ├── Effects/           # Custom video effects
│   ├── Transitions/       # Custom transitions
│   ├── Filters/           # Custom filters
│   ├── StyleTemplates/    # Style templates
│   ├── Subtitles/         # Subtitle files
│   └── Templates/         # Layout templates
├── Projects/              # Saved project files
├── Snapshot/              # Screenshots and frame captures
├── Cinematic/             # Cinematic presets and LUTs
├── Output/                # Rendered/exported videos
├── Render/                # Temporary render files
├── Recognition/           # AI recognition data (YOLO etc.)
├── Backup/                # Project backups
├── MediaProxy/            # Proxy media for performance
├── Caches/                # Application caches
│   ├── Previews/          # Video preview cache
│   ├── Renders/           # Render cache
│   ├── Frames/            # Frame extraction cache
│   └── Temp/              # Temporary files
├── Recorded/              # Screen/camera recordings
├── Audio/                 # Audio recordings and processing
├── Cloud Project/         # Cloud sync projects
├── Upload/                # Files awaiting upload
└── Chats/                 # AI chat sessions and history
```

### Automatic Resource Scanning and Loading

On application startup, Timeline Studio automatically scans the following directories and loads found files:

#### Scanned Directories:
- **Media/Videos/** - Video files (.mp4, .avi, .mov, .mkv, .webm etc.)
- **Media/Images/** - Images (.jpg, .png, .gif, .svg, .webp etc.)
- **Media/Music/** - Music files (.mp3, .wav, .ogg, .m4a, .flac etc.)
- **Media/Effects/** - JSON files with effect descriptions
- **Media/Transitions/** - JSON files with transition descriptions
- **Media/Filters/** - JSON files with filter descriptions
- **Media/StyleTemplates/** - JSON files for style templates
- **Media/Subtitles/** - JSON files for subtitle styles

#### Auto-loading Features:
1. **Media Files** (video, images, music):
   - Identified by file extension
   - Automatically added to corresponding browser sections
   - Metadata (size, duration) extracted later

2. **JSON Resources** (effects, filters, transitions etc.):
   - Validated before loading
   - Invalid files are ignored
   - Automatically added to resource management system

#### Performance Optimization:
- **Result Caching** - scan results are cached for 15 minutes
- **Batch Processing** - files processed in batches of 10
- **Parallel Scanning** - all directories scanned simultaneously

#### Usage in Code:
```typescript
import { useAutoLoadUserData } from '@/features/media-studio/services';

// In React component
function MyComponent() {
  const { isLoading, loadedData, error, reload } = useAutoLoadUserData();
  
  if (isLoading) return <div>Loading resources...</div>;
  if (error) return <div>Error: {error}</div>;
  
  console.log('Loaded media files:', loadedData.media);
  console.log('Loaded effects:', loadedData.effects);
}
```

### Accessing Directories in Code

**Rust (Backend):**
```rust
use timeline_studio::app_directories_service::AppDirectoriesService;

// Get base directory
let base_dir = AppDirectoriesService::get_base_directory().await?;

// Get specific directory
let projects_dir = AppDirectoriesService::get_projects_directory().await?;
```

**TypeScript (Frontend):**
```typescript
import { appDirectoriesService } from '@/features/app-state/services';

// Get all directories
const directories = await appDirectoriesService.getAppDirectories();
console.log(directories.projects_dir);
console.log(directories.media_dir);
```

## Usage Notes

### Automatic Creation
All directories are created automatically on first application launch. If a directory is deleted, it will be restored on next startup.

### Security
- Regularly backup the `Projects/` folder
- The `Backup/` folder contains automatic backups
- Caches can be safely deleted - they will be recreated

### Disk Space Cleanup
To free up space, you can delete:
- `Caches/` - will be recreated
- `Render/` - temporary render files
- `Output/` - exported videos (if you have copies)
- `MediaProxy/` - proxy files (will be recreated when needed)