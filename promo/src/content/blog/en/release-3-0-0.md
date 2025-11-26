---
title: Timeline Studio 3.0.0 - Revolutionary Transition to Event-Driven Architecture
date: 2024-11-18
author: Timeline Team
slug: release-3-0-0
excerpt: Major 3.0 release with completely redesigned event-driven architecture, Ollama Vision Models for free AI analysis, and secure storage for API keys. A new era for Timeline Studio!
category: Release
readTime: 8 min read
---

# Timeline Studio 3.0.0 - Revolutionary Transition to Event-Driven Architecture

Introducing Timeline Studio 3.0.0 — a revolutionary release that completely rethinks the application architecture. This is the most significant update in project history with fundamental changes in approach to state and data management.

## 🚨 BREAKING CHANGES

### Event-Driven Architecture

Complete transition to event-driven architecture:

**Before:** Fetch state after each event
```typescript
// Old approach
await executeCommand('add_media', params)
await fetchState() // Load entire state again
```

**Now:** Incremental updates through events
```typescript
// New approach
await executeCommand('add_media', params)
// MediaAdded event contains only changes
// Providers automatically update local state
```

**Benefits:**
- ⚡ **10-50x faster** - no full state loading
- 🔄 **Reactivity** - UI updates instantly
- 📉 **Less traffic** - only changes transmitted
- 🎯 **Targeted updates** - each provider listens to its own events

### Ollama Vision Models by Default

AI Director now uses local vision models:

**New default settings:**
- `ai_provider: Ollama` (instead of None)
- `ai_model: moondream2` (lightweight vision model)
- `enable_vision_language_model: true`

**Why this is needed:**
- ✅ **Free video analysis** (0 API costs)
- ✅ **Local processing** (100% privacy)
- ✅ **Emotion detection** through vision AI
- ✅ **Offline work** - no internet needed

**Requirements:**
```bash
# Install Ollama
brew install ollama  # macOS
# or download from ollama.ai

# Download vision model
ollama pull moondream2

# Alternatives:
ollama pull llama3.2-vision
ollama pull llava
```

### MediaAdapter Migration

MediaAdapter no longer reads from `projectState`:

**Before:**
```typescript
const files = projectState.imported_media
```

**Now:**
```typescript
const { mediaPool } = useMediaManagement()
const files = mediaPool
```

**Benefits:**
- 🎯 Direct access to media data
- 📡 Automatic sync through events
- 🔌 Independence from global state

## 🎨 Main Features

### 🤖 Multimodal AI Support

Full vision model integration:

- **Video frame analysis** - content understanding
- **Emotion detection** on faces
- **Object recognition** and scenes
- **Action description** in video
- **Automatic content categorization**

### 🔐 Secure Storage for API Keys

Secure storage of confidential data:

- **Encryption** of API keys in system keychain
- **OS integration** - Windows Credential Manager, macOS Keychain, Linux Secret Service
- **Secure import** from .env files
- **Automatic migration** of old keys

### 📦 MediaManagement Provider

New centralized media provider:

```typescript
<MediaManagementProvider>
  {/* Automatic media synchronization */}
  {/* MediaAdded/Removed/Updated event handling */}
  {/* Caching and optimization */}
</MediaManagementProvider>
```

### 🎬 AI Director Improvements

- **Multiple selection** of videos for analysis
- **Automatic display** of last analysis
- **Refresh button** to reset state
- **Progress bar** with real-time updates
- **Video selection from media pool**

### 🔄 Proxy File Generation

Proxy file generation for smooth editing:

- **FFmpeg integration** for transcoding
- **Automatic creation** of light versions of 4K/8K video
- **Customizable quality** of proxies
- **Background processing** without blocking UI

### 🎯 Effects & Filters Improvements

Redesigned effects system:

- **GPU acceleration** for real-time preview
- **New effects** and filters
- **Improved performance**
- **Profiles for different GPUs**

## 🐛 Fixes

### Critical

- **Infinite AudioContext loop** in Browser
- **Race condition** in AI Director events
- **Undefined in favorites** event listeners
- **Specta BigInt** export for u64 types

### TypeScript

- Fixed **131 type errors**
- Updated imports in features and domains
- Improved AI tools typing

### Tests

- Fixed **failing frontend tests**
- Fixed **video_compiler tests**
- Removed **hanging test** language state
- Fixed **flaky test** in use-user-settings

## 📊 Release Statistics

- **360+ commits**
- **100+ files** changed
- **10,000+ lines** of code added
- **15+ new features**
- **131 TypeScript errors** fixed
- **All tests** passing

## 🎯 For Developers

### API Changes

```typescript
// New API for events
import { useBackendSync } from '@/domains/backend-sync'

function Component() {
  const { listenToEvent } = useBackendSync()

  useEffect(() => {
    return listenToEvent('MediaAdded', (data) => {
      // Event handling
    })
  }, [])
}
```

### Migration Guide

1. **Update providers** - add MediaManagementProvider
2. **Replace fetchState** with event listeners
3. **Update dependencies** - use new hooks
4. **Test events** - ensure proper handling

## 📦 Installation

```bash
# Update through built-in updater
# or download from GitHub Releases

# For Ollama (recommended):
brew install ollama
ollama pull moondream2
```

## 🎓 Resources

- [Event-Driven Architecture Documentation](https://github.com/chatman-media/timeline-studio/docs)
- [Ollama Vision Guide](https://github.com/chatman-media/timeline-studio/docs/ollama)
- [Migration Guide 2.x → 3.0](https://github.com/chatman-media/timeline-studio/docs/migration-3.0)

## 🙏 Thanks

Huge thanks to all contributors and users for testing beta versions! Your feedback helped make Timeline Studio 3.0 stable and performant.

This is the beginning of a new era for Timeline Studio. Event-driven architecture lays the foundation for even more powerful features in the future!

---

**Download Timeline Studio 3.0.0:** [GitHub Releases](https://github.com/chatman-media/timeline-studio/releases/tag/v3.0.0)
