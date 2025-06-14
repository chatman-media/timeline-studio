# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [العربية](README.ar.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)

## 项目概述

Timeline Studio 是一款基于现代 Web 技术构建的专业视频编辑应用程序，具有原生性能。我们的目标是创建一个达到 DaVinci Resolve 水平的编辑器，让每个人都能使用。

![时间轴界面](/public/screen3.png)

### 项目状态（2025年6月）

**总体完成度：75%**
- ✅ 核心编辑功能完成
- ✅ 带 GPU 加速的视频编译器
- ✅ 识别模块（YOLO v11）
- ✅ 效果、滤镜和转场
- ⚠️ 导出 UI 需要完成（25%）
- ⚠️ 资源面板开发中（40%）
- 🎯 目标 MVP 发布：2025年6月底

## 主要功能

- 🎬 专业视频编辑，支持多轨道时间轴
- 🖥️ 跨平台（Windows、macOS、Linux）
- 🚀 GPU 加速视频处理（NVENC、QuickSync、VideoToolbox）
- 🤖 AI 驱动的对象/人脸识别（YOLO v11）
- 🎨 30+ 种转场、视觉效果和滤镜
- 📝 高级字幕系统，支持 12 种样式和动画
- 🎵 多轨音频编辑，带效果
- 🧠 使用 XState v5 进行状态管理
- 🌐 国际化支持（6 种语言）
- 💾 智能缓存和预览生成
- 🎨 使用 Tailwind CSS v4、shadcn-ui 的现代 UI
- 📚 完整文档，测试覆盖率超过 80%

## 开始使用

### 前提条件

- [Node.js](https://nodejs.org/)（v18 或更高版本）
- [Rust](https://www.rust-lang.org/tools/install)（最新稳定版本）
- [bun](https://bun.sh/)（最新稳定版本）
- [ffmpeg](https://ffmpeg.org/download.html)（最新稳定版本）

### 安装

1. 克隆仓库：

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. 安装依赖：

```bash
bun install
```

### 开发模式启动

```bash
bun run tauri dev
```

### 发布构建

```bash
bun run tauri build
```

## 项目结构

```
timeline-studio/
├── bin/                              # Shell 脚本
├── docs/                             # 自动生成的文档
├── ai-gen-docs/                      # AI 生成的开发者文档
├── examples/                         # API 使用示例
├── promo/                            # GitHub Pages 网站
├── public/                           # 静态文件
├── scripts/                          # JavaScript 脚本
├── src/                              # 前端源代码（React、XState、Next.js）
│   ├── app/                          # 主应用入口
│   ├── components/                   # 共享组件
│   ├── features/                     # 功能模块
│   │   ├── ai-chat/                  # AI 聊天机器人（交互助手）
│   │   ├── app-state/                # 全局应用状态
│   │   ├── browser/                  # 媒体文件浏览器（文件面板）
│   │   ├── camera-capture/           # 视频/照片相机捕获
│   │   ├── effects/                  # 视频效果及其参数
│   │   ├── export/                   # 视频和项目导出
│   │   ├── filters/                  # 视频滤镜（颜色校正、样式）
│   │   ├── keyboard-shortcuts/       # 键盘快捷键和预设
│   │   ├── media/                    # 媒体文件处理（音频/视频）
│   │   ├── media-studio/             # 媒体编辑工作室
│   │   ├── modals/                   # 模态窗口（对话框）
│   │   ├── music/                    # 音乐导入和管理
│   │   ├── options/                  # 导出和项目设置
│   │   ├── project-settings/         # 项目设置（大小、fps 等）
│   │   ├── recognition/              # 场景和对象识别
│   │   ├── resources/                # 项目资源管理
│   │   ├── style-templates/          # 样式和设计模板
│   │   ├── subtitles/                # 字幕导入和编辑
│   │   ├── templates/                # 视频模板和预设
│   │   ├── timeline/                 # 主编辑时间轴
│   │   ├── top-bar/                  # 顶部栏界面
│   │   ├── transitions/              # 视频转场
│   │   ├── user-settings/            # 用户偏好设置
│   │   ├── video-compiler/           # 前端视频编译集成
│   │   └── video-player/             # 自定义视频播放器
│   ├── lib/                          # 共享库和实用程序
│   ├── test/                         # 测试实用程序
│   └── types/                        # TypeScript 类型定义
├── src-tauri/                        # 后端源代码（Rust）
│   ├── src/                          # Rust 源文件
│   │   ├── app_dirs.rs               # 应用目录管理
│   │   ├── filesystem.rs             # 文件系统操作
│   │   ├── language.rs               # 语言/i18n 支持
│   │   ├── lib.rs                    # 主库入口
│   │   ├── media/                    # 媒体处理模块
│   │   ├── recognition/              # YOLO 识别模块
│   │   ├── video_compiler/           # FFmpeg 视频编译
│   │   └── video_server/             # 视频流服务器
│   └── tauri.conf.json               # Tauri 配置
└── ...其他配置文件
```

每个功能包含详细文档：

- **`README.md`** - 功能需求、准备状态

### 📋 关键文档

- **`src/features/DEV-README.md`** - 所有功能的概述，包括优先级和状态
- **`README.md`** - 一般项目信息（英文）
- **`README.es.md`** - 西班牙语版本文档
- **`README.fr.md`** - 法语版本文档
- **`README.de.md`** - 德语版本文档
- **`README.ru.md`** - 俄语版本文档
- **`README.zh.md`** - 中文版本文档
- **`README.pt.md`** - 葡萄牙语版本文档

## 文档

- 📚 [文档地图](ai-gen-docs/MAP.md) - 完整的文档概述
- 🏗️ [架构指南](ai-gen-docs/ARCHITECTURE.md) - 系统架构
- 🧪 [测试指南](ai-gen-docs/testing/TESTING.md) - 测试策略
- 📡 [API 参考](ai-gen-docs/API.md) - Tauri 命令参考
- 🚀 [部署指南](ai-gen-docs/deployment/DEPLOYMENT.md) - 构建和部署
- 🛣️ [路线图](ai-gen-docs/ROADMAP.md) - 开发路线图

## 开发

### 可用脚本

- `bun run dev` - 在开发模式下启动 Next.js
- `bun run tauri dev` - 在开发模式下启动 Tauri
- `bun run build` - 构建 Next.js
- `bun run tauri build` - 构建 Tauri 应用程序
- `bun run test` - 运行所有测试
- `bun run test:watch` - 在监视模式下运行测试
- `bun run lint` - 检查代码
- `bun run format` - 格式化代码

### 技术栈

- **前端**: Next.js 15、React 19、TypeScript、XState v5
- **后端**: Tauri v2 (Rust)、FFmpeg
- **UI**: Tailwind CSS v4、shadcn-ui、Radix UI
- **测试**: Vitest、Testing Library、Playwright
- **AI**: ONNX Runtime、YOLO v11

## 贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解我们的行为准则和提交拉取请求的流程。

## 许可证

本项目根据 MIT 许可证授权 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

- GitHub Issues: [github.com/chatman-media/timeline-studio/issues](https://github.com/chatman-media/timeline-studio/issues)
- Telegram: [@timelinestudio](https://t.me/timelinestudio)
- 网站: [chatman-media.github.io/timeline-studio](https://chatman-media.github.io/timeline-studio/)

---

⭐ 如果您喜欢这个项目，请给我们一个星标！