<div align="center">

  <!-- Основное изображение с горой -->
  <!-- <a href="https://timelinestudio.pro/">
    <picture>
      <img src="public/mountain.png" alt="Timeline Studio" width="100%" style="max-width: 800px; border-radius: 10px 10px 0 0; box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3); mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);" />
    </picture>
  </a> -->
  
  <!-- Анимированный текст Timeline Studio -->
  <a href="https://timelinestudio.pro/">
    <img src="https://readme-typing-svg.herokuapp.com?font=Brush+Script+MT&size=80&pause=2000&color=8B5CF6&center=true&vCenter=true&width=800&height=100&lines=Timeline+Studio&duration=4000" alt="Timeline Studio" />
  </a>
  
  <!-- Подзаголовок -->
  <p align="center">
    <b>🎬 AI-Powered Video Editor • 🚀 Multi-Platform Export • ⚡ GPU Acceleration</b>
  </p>

</div>

<div align="center">

[Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Node.js](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=node.js&logo=node.js&logoColor=white)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=rust&logo=rust&logoColor=white)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](./docs/en/README.md)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/uvSBCw6e)

</div>

## 🎬 About the Project

### What is Timeline Studio?

**Timeline Studio** is a next-generation professional video editor with AI integration that automates content creation for social media. Built on modern technologies (Tauri + Next.js), it combines the power of desktop applications with the convenience of web interfaces.

### 🎯 Key Advantages

- **🤖 100+ AI Tools** - complete video production automation with multi-provider support
- **⚡ GPU Acceleration** - hardware encoding NVENC, QuickSync, VideoToolbox
- **🔌 Plugin System** - extend functionality without changing code
- **🌐 15 Language Interface** - complete localization for global audience with RTL support
- **🔒 Local Processing** - your content stays private
- **📊 80%+ Test Coverage** - professional-level reliability

### 🚀 Problems We Solve

**One upload → dozens of ready versions:**
- 📱 **TikTok** - vertical shorts with trending effects (direct upload)
- 📺 **YouTube** - full movies, short clips, Shorts (direct upload)
- 🎬 **Vimeo** - high-quality cinematic versions (direct upload)
- ✈️ **Telegram** - optimized versions for channels and chats (direct upload)
- 📸 **Instagram** - Reels, Stories, posts optimized for manual upload

### 💡 How It Works

> *"Create a video about my trip to Asia for all social media" - and in minutes you have ready variants: dynamic shorts for TikTok, atmospheric vlog for YouTube, bright Stories for Instagram. AI selects the best moments, syncs with music and adapts for each platform.*

### ⚡ Why This Changes Everything

- **10x Time Savings** - no more manual adaptation for each video
- **AI Understands Trends** - knows what works on each social network
- **Professional Quality** - using the same tools as major studios
- **Modular Architecture** - easily add new features through plugins
- **Open Source** - transparency and ability to participate in development

![Timeline Interface #1](/public/screen.png)

## 🏗️ Architecture

Timeline Studio is built on modern modular architecture:

### Frontend (Next.js 15 + React 19)
- **Feature-based organization** - each function in `/src/features/` is self-contained
- **State Management** - XState v5 for complex states
- **UI Components** - shadcn/ui + Radix UI + Tailwind CSS v4
- **TypeScript** - strict typing and safety

### Backend (Rust + Tauri v2)
- **Modular structure** - Core, Security, Media, Compiler, Plugins
- **Service layer** - DI container, EventBus, Telemetry
- **FFmpeg integration** - advanced video processing
- **Security** - API key encryption, OAuth, Keychain

📚 **[Detailed Frontend Architecture →](docs/en/03_architecture/frontend/)**
📚 **[Detailed Backend Architecture →](docs/en/03_architecture/backend/)**
📚 **[Plugin System →](docs/en/08_tasks/planned/plugin-system.md)**
🛠️ **[Technical Stack Details →](docs/en/03_architecture/backend/rust-architecture.md#technology-overview)**

## 🤖 AI Integration

Timeline Studio features comprehensive AI integration with 100+ specialized tools:

### AI Providers
- **Claude** (Anthropic) - Primary AI with advanced reasoning
- **OpenAI** - GPT-4 models for diverse tasks
- **DeepSeek** - Specialized reasoning models
- **Ollama** - Local models for offline operation

### AI Tool Categories
- **Timeline Tools** (50) - Intelligent project creation and editing
- **Media Analysis** (27) - Scene detection, quality analysis, content intelligence
- **Audio Processing** (12) - Transcription, noise removal, music sync
- **Export Optimization** (12) - Platform-specific adaptations
- **Effects & Filters** (10) - AI-powered visual enhancements
- **And 40+ more specialized tools**

📚 **[AI Chat Documentation →](src/features/ai-chat/README.md)**
🛠️ **[AI Tools Reference →](src/features/ai-chat/tools/README.md)**

## 📚 Backend Module Documentation

Timeline Studio uses a modular Rust backend architecture. Each module provides specific functionality:

### Core Modules
🔧 **[Core System](src-tauri/src/core/README.md)** - DI container, EventBus, Performance monitoring
🔌 **[Plugin System](src-tauri/src/core/plugins/README.md)** - Modular plugin architecture with sandbox security
🎬 **[Video Compiler](src-tauri/src/video_compiler/README.md)** - FFmpeg integration and video processing
📁 **[Media Management](src-tauri/src/media/README.md)** - File scanning, metadata extraction, thumbnails

### AI & Recognition
🧠 **[Smart Montage Planner](src-tauri/src/montage_planner/README.md)** - AI-powered video montage generation
👁️ **[Recognition System](src-tauri/src/recognition/README.md)** - YOLO object detection and scene analysis
📝 **[Subtitles Engine](src-tauri/src/subtitles/README.md)** - Subtitle generation, parsing, synchronization

### Security & Services
🔒 **[Security Module](src-tauri/src/security/README.md)** - API validation, OAuth, secure storage

*All modules include comprehensive test suites and detailed API documentation.*

## 🏗️ Project Status

**🚀 Alpha version: 97.5% ready** 🎯

✅ **Completed**: 55+ modules (100% ready) - 30+ frontend + 25+ backend
📋 **Recently Completed**:
- 🤖 **AI Chat Integration** - Full Claude/OpenAI/DeepSeek/Ollama provider support with 100+ specialized tools
- 💬 **Chat UI** - Modern chat interface with markdown support, code highlighting, and streaming responses
- 🧠 **Smart Montage Planner** - AI-powered automatic montage generation with quality analysis
- 🎬 **Timeline Integration** - Complete timeline editing with AI assistance

[→ Detailed Roadmap](docs/en/10_project_state/)

## Getting Started

### Quick Setup

```bash
# Clone and install
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Run development mode
bun run tauri dev
```

### Requirements
- Node.js v24+, Rust, Bun, FFmpeg

### 🚑 Troubleshooting Common Issues

#### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Windows - use setup script
./scripts/setup-rust-env-windows.ps1

# Linux
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev
```

#### Build Failures
- **Windows**: Ensure Visual Studio 2022 with C++ tools is installed
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build essentials: `sudo apt-get install build-essential`

📚 **[Complete Installation Guide →](docs/en/02_requirements/)**
🪟 **[Windows Setup →](docs/en/06_deployment/platforms/)**
🎥 **[Video Tutorial →](https://www.youtube.com/@chatman-media)**
📖 **[Full Documentation →](docs/en/)** - Complete documentation with 18+ sections

## Development

### Quick Start

```bash
# Development mode
bun run tauri dev

# Run tests
bun run test && bun run test:rust

# Check code quality
bun run check:all
```

📚 **[Complete Development Guide →](docs/en/05_development/)**

## CI/CD & Code Quality

### Automated Workflows
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testing**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Coverage**: Codecov integration
- ✅ **Build**: Cross-platform builds

📚 **[Detailed CI/CD Guide →](docs/en/13_ci_cd/)**
🔧 **[Linting & Formatting →](docs/en/05_development/linting-and-formatting.md)**

## 👨‍💻 Developer Resources

### Contributing to Timeline Studio
- 🤝 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- 🐛 **[Report Issues](https://github.com/chatman-media/timeline-studio/issues)** - Found a bug? Let us know!
- 💡 **[Feature Requests](https://github.com/chatman-media/timeline-studio/discussions)** - Suggest new features

### Plugin Development
- 🔌 **[Plugin System Guide](docs/en/08_tasks/planned/plugin-system.md)** - Build your own plugins
- 🚀 **[Plugin Quickstart](docs/en/05_development/)** - Get started in 5 minutes
- 📦 **[Plugin API Reference](docs/en/04_api_reference/)** - Complete API documentation

### Testing & Quality
- 🧪 **[Testing Guide](docs/en/12_testing/)** - Unit, integration, E2E testing
- 📊 **[Test Utils](docs/en/12_testing/)** - Audio and Tauri component testing
- ✅ **[Code Style](CLAUDE.md#code-style-guidelines)** - Coding standards
- 🔍 **[Performance Guide](docs/en/08_tasks/planned/performance-optimization.md)** - Optimization tips

## 🌐 Community & Support

### Join Our Community
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/uvSBCw6e)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

### Get Help
- 📚 **[FAQ](docs/en/09_architectural_decisions/)** - Frequently asked questions
- 💬 **[Discussions](https://github.com/chatman-media/timeline-studio/discussions)** - Ask questions, share ideas
- 🐛 **[Issue Tracker](https://github.com/chatman-media/timeline-studio/issues)** - Report bugs
- 📧 **Email Support** - ak.chatman.media@gmail.com

### Project Roadmap
- 🗺️ **[Development Roadmap](docs/en/10_project_state/)** - See what's coming next
- ✨ **[Completed Features](docs/en/08_tasks/completed/)** - Recently shipped features
- 🎯 **[Alpha Release Progress](docs/en/17_releases/)** - 97.5% complete!
- 📊 **[Project Status](#project-status)** - Current development stats

### Support the Project
- ⭐ **[Star on GitHub](https://github.com/chatman-media/timeline-studio)** - Show your support
- 🤝 **[Contribute](CONTRIBUTING.md)** - Join the development
- 💼 **[Commercial License](docs/en/11_legal/)** - For business use

## 🤝 Contributors

Thank you to all the amazing people who have contributed to Timeline Studio:

<a href="https://github.com/chatman-media/timeline-studio/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=chatman-media/timeline-studio" />
</a>

## 💎 Sponsors

Timeline Studio is supported by these amazing sponsors:

<div align="center">

### 🌟 Gold Sponsors

<a href="https://github.com/alagiz">
  <img src="https://github.com/alagiz.png" width="80" height="80" alt="alagiz" style="border-radius: 50%; margin: 10px;" />
</a>
<a href="https://github.com/alexk984">
  <img src="https://github.com/alexk984.png" width="80" height="80" alt="alexk984" style="border-radius: 50%; margin: 10px;" />
</a>
<a href="https://github.com/andreypeulskiy">
  <img src="https://github.com/andreypeulskiy.png" width="80" height="80" alt="andreypeulskiy" style="border-radius: 50%; margin: 10px;" />
</a>
<a href="https://github.com/gerusm">
  <img src="https://github.com/gerusm.png" width="80" height="80" alt="gerusm" style="border-radius: 50%; margin: 10px;" />
</a>

Special thanks to our generous crypto sponsors who have contributed $1,000+ to the project development!

</div>

## Support 💝🚀

Support the development via crypto donations:

<div align="center">
  <table>
    <tr>
      <td align="center">
        <strong>BTC</strong><br/>
        <img src="public/qr/btc.png" alt="BTC QR Code" height="200" /><br/>
        <code>14s9Y9Rb2CUWHSAatiQMhfkpx1MWXofUzw</code>
      </td>
      <td align="center">
        <strong>ETH</strong><br/>
        <img src="public/qr/eth.png" alt="ETH QR Code" height="200" /><br/>
        <code>0x286D65151b622dCC16624cEd8463FDa45585fd60</code>
      </td>
    </tr>
    <tr>
      <td align="center">
        <strong>TON</strong><br/>
        <img src="public/qr/ton.png" alt="TON QR Code" height="200" /><br/>
        <code>UQD1M80nPyzph5ZW1vfp_r19XI5MaerNhDq4dWXbXCo96WFj</code>
      </td>
      <td align="center">
        <strong>NOT</strong><br/>
        <img src="public/qr/not.png" alt="NOT QR Code" height="200" /><br/>
        <code>UQD1M80nPyzph5ZW1vfp_r19XI5MaerNhDq4dWXbXCo96WFj</code>
      </td>
    </tr>
  </table>
</div>

## Star History
<a href="https://www.star-history.com/#chatman-media/timeline-studio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
 </picture>
</a>

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/47cf226e78d9ead27baf3add875327e91e852a11.svg "Repobeats analytics image")

## License

MIT License with Commons Clause - free for personal use, commercial use requires agreement.

📄 **[Full License Details →](docs/en/11_legal/)** | 📧 **Commercial License**: ak.chatman.media@gmail.com
