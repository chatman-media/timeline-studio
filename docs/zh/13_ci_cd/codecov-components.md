# Codecov Component Structure

This document describes component-based code coverage tracking in Timeline Studio.

## Overview

Timeline Studio uses Codecov's component management system to track code coverage separately for each functional module. This provides detailed visibility into which parts of the codebase need additional testing.

## Frontend Components (28 features)

Each frontend feature in `src/features/` is tracked as a separate component:

### Core Editing (5 components)
- **timeline** - Main timeline editing functionality
- **video-player** - Video playback and controls
- **media-studio** - Main editing interface
- **export** - Export functionality with multiple format support
- **video-compiler** - Video rendering and compilation

### AI and Recognition (2 components)
- **ai-chat** - AI assistant integration
- **recognition** - YOLO-based object/face recognition

### Media Management (2 components)
- **browser** - File browser and management
- **media** - Media file processing and metadata

### Effects and Styling (6 components)
- **effects** - Visual effects library
- **filters** - Video filters
- **transitions** - Transition effects
- **style-templates** - Animated intro/outro templates
- **templates** - Multi-camera layout templates
- **subtitles** - Subtitle system with animations

### Application State (5 components)
- **app-state** - Global application state
- **project-settings** - Project configuration
- **user-settings** - User preferences
- **modals** - Modal dialog system
- **resources** - Resource panel management

### Input and Recording (3 components)
- **keyboard-shortcuts** - Hotkey system
- **camera-capture** - Webcam recording
- **voice-recording** - Audio recording

### UI and Utilities (5 components)
- **music** - Music library management
- **options** - Application options
- **top-bar** - Top navigation bar
- **i18n** - Internationalization (10 languages)

## Backend Components (4 features)

The Rust backend is divided into 4 main components:

### Core Functions
- **backend-video-compiler** - FFmpeg integration and video rendering
- **backend-media** - Media processing, thumbnails, metadata
- **backend-recognition** - YOLO v11 integration for AI recognition
- **backend-core** - Core Tauri functionality, commands, and state

## Coverage Goals

- **Overall project**: 80% coverage
- **New code (patches)**: 70% coverage
- **Frontend features**: 75% coverage
- **Rust Backend**: 85% coverage

## Viewing Coverage

Coverage reports are available at:
- [Overall coverage](https://codecov.io/gh/chatman-media/timeline-studio)
- [Frontend coverage](https://codecov.io/gh/chatman-media/timeline-studio?flag=frontend)
- [Rust coverage](https://codecov.io/gh/chatman-media/timeline-studio?flag=rust)

Each component can be viewed separately in the Codecov dashboard under the "Components" tab.

## Adding New Components

When adding a new feature:
1. Create the feature directory in `src/features/` (frontend) or `src-tauri/src/` (backend)
2. Add component configuration to `codecov.yml`
3. Ensure tests are included in the same feature directory under `__tests__/` folder
4. Run coverage locally with `bun run test:coverage` or `bun run test:coverage:rust`