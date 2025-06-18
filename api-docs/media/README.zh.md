# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)

[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## 项目概述

Timeline Studio 是一款基于现代 Web 技术构建的专业视频编辑应用程序，具有原生性能。我们的目标是创建一个达到 DaVinci Resolve 水平的编辑器，让每个人都能使用。

![时间轴界面 #1](/public/screen2.png)

![时间轴界面 #2](/public/screen4.png)

### 项目状态（2025年6月）

**总体完成度：86.2%** ⬆️（OAuth 集成和 Export 完成后更新）
- ✅ 核心编辑功能完成
- ✅ 带 GPU 加速的视频编译器
- ✅ 识别模块（YOLO v11）- ORT 已修复
- ✅ 效果、滤镜和转场（75-80%）
- ✅ Export - 完整的社交媒体集成！（98%）🎉
- ✅ OAuth 集成 - 支持 YouTube/TikTok/Vimeo/Telegram
- ✅ 统一的预览系统与 Preview Manager
- ✅ 媒体持久化和临时项目
- ✅ 模板系统 - 基于配置（95% 完成）
- ✅ Timeline 90% 完成
- ⚠️ 资源面板开发中（85%）
- 🎯 目标 MVP 发布：2025年6月底

## 主要功能

- 🎬 专业视频编辑，支持多轨道时间轴
- 🖥️ 跨平台（Windows、macOS、Linux）
- 🚀 GPU 加速视频处理（NVENC、QuickSync、VideoToolbox）
- 🤖 AI 驱动的对象/人脸识别（YOLO v11 - ORT 已修复）
- 🎨 30+ 种转场、视觉效果和滤镜
- 📝 高级字幕系统，支持 12 种样式和动画
- 🎵 多轨音频编辑，带效果
- 📤 导出到 MP4/MOV/WebM，支持社交媒体 OAuth 集成
- 🔐 支持 YouTube/TikTok/Vimeo/Telegram OAuth，安全令牌存储
- 📱 设备预设（iPhone、iPad、Android）用于优化导出
- 🧠 使用 XState v5 进行状态管理
- 🌐 国际化支持（11 种语言）
- 💾 智能缓存和统一预览系统
- 🎨 使用 Tailwind CSS v4、shadcn-ui 的现代 UI
- 📚 完整文档，2400+ 测试（98.8% 成功率）

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

## 文档

### 📚 主要文档

- 📚 [文档地图](docs-ru/MAP.md) - 完整文档概述
- 🏗️ [架构指南](docs-ru/ARCHITECTURE.md) - 系统架构
- 🧪 [测试指南](docs-ru/testing/TESTING.md) - 测试策略
- 📡 [API 参考](docs-ru/API.md) - Tauri 命令参考
- 🚀 [部署指南](docs-ru/deployment/DEPLOYMENT.md) - 构建和部署
- 🛣️ [路线图](docs-ru/ROADMAP.md) - 开发路线图

### 📋 项目文档

- **`src/features/README.md`** - 所有功能的概述，包含优先级和状态
- **语言版本**：通过上方的切换器提供13种语言版本

## 开发

### 可用脚本

- `bun run dev` - 在开发模式下启动 Next.js
- `bun run tauri dev` - 在开发模式下启动 Tauri
- `bun run build` - 构建 Next.js
- `bun run tauri build` - 构建 Tauri 应用程序

#### 代码检查和格式化

- `bun run lint` - 使用 ESLint 检查 JavaScript/TypeScript 代码
- `bun run lint:fix` - 修复 ESLint 错误
- `bun run lint:css` - 使用 Stylelint 检查 CSS 代码
- `bun run lint:css:fix` - 修复 Stylelint 错误
- `bun run format:imports` - 格式化导入
- `bun run lint:rust` - 使用 Clippy 检查 Rust 代码
- `bun run format:rust` - 使用 rustfmt 格式化 Rust 代码
- `bun run check:all` - 运行所有检查和测试
- `bun run fix:all` - 修复所有代码检查错误

#### 测试

- `bun run test` - 运行测试
- `bun run test:app` - 仅运行应用程序组件测试
- `bun run test:watch` - 在监视模式下运行测试
- `bun run test:ui` - 使用 UI 界面运行测试
- `bun run test:e2e` - 使用 Playwright 运行端到端测试

### 状态机（XState v5）

项目使用 XState v5 来管理复杂的状态逻辑。

#### ✅ 已实现的状态机（11个）：

- `appSettingsMachine` - 集中设置管理
- `browserStateMachine` - 浏览器状态管理
- `chatMachine` - AI 聊天管理
- `modalMachine` - 模态窗口管理
- `playerMachine` - 视频播放器管理
- `resourcesMachine` - 时间轴资源管理
- `userSettingsMachine` - 用户设置
- `projectSettingsMachine` - 项目设置
- `mediaMachine` - 媒体文件管理
- `timelineMachine` - 主时间轴状态机

### 测试

项目使用 Vitest 进行单元测试。测试位于功能的 __tests__ 目录中，模拟对象在 __mocks__ 中。

#### 🧪 测试覆盖率状态：
```bash
⨯ bun run test

 Test Files  229 passed (229)
      Tests  3022 passed | 20 skipped (3042)
   Start at  13:35:14
   Duration  29.47s (transform 5.44s, setup 47.14s, collect 24.93s, tests 31.95s, environment 72.34s, prepare 23.00s)

⨯ bun run test:rust
   test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

```

```bash
# 运行客户端测试
bun run test

# 运行 rust 测试
bun run test:rust

# 运行带覆盖率报告的测试
bun run test:coverage

# 运行特定功能的测试
bun run test src/features/effects
```

## 持续集成和部署

项目配置为使用 GitHub Actions 进行持续集成和部署。工作流程：

### 验证和构建

- `check-all.yml` - 运行所有检查和测试
- `lint-css.yml` - 仅检查 CSS 代码（CSS 文件更改时运行）
- `lint-rs.yml` - 仅检查 Rust 代码（Rust 文件更改时运行）
- `lint-js.yml` - 仅检查 JavaScript/TypeScript 代码（JavaScript/TypeScript 文件更改时运行）

### 部署

- `build.yml` - 构建项目
- `build-release.yml` - 为发布构建项目
- `deploy-promo.yml` - 在 GitHub Pages 上构建和发布宣传页面
- `docs.yml` - 在 GitHub Pages 上生成和发布 API 文档

### 代码检查器配置

#### Stylelint（CSS）

项目使用 Stylelint 来检查 CSS 代码。配置位于 `.stylelintrc.json` 文件中。主要功能：

- 支持 Tailwind CSS 指令
- 忽略重复选择器以兼容 Tailwind
- 保存文件时自动错误修复（在 VS Code 中）

要运行 CSS 代码检查器，请使用命令：

```bash
bun lint:css
```

对于自动错误修复：

```bash
bun lint:css:fix
```

## API 文档

API 文档可在以下位置获取：[https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

要在本地生成文档，请使用命令：

```bash
bun run docs
```

文档将在 `docs/` 文件夹中可用。

对于实时文档开发：

```bash
bun run docs:watch
```

当 `main` 分支中的源代码更改时，文档会使用 GitHub Actions 工作流程 `docs.yml` 自动更新。

## 宣传页面

项目宣传页面可在以下位置获取：[https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

宣传页面源代码位于 `promo/` 文件夹中。

对于宣传页面的本地开发，请使用命令：

```bash
cd promo
bun install
bun run dev
```

要构建宣传页面：

```bash
cd promo
bun run build
```

当 `main` 分支上的 `promo/` 文件夹中的文件更改时，宣传页面会使用 GitHub Actions 工作流程 `deploy-promo.yml` 自动更新。

## 附加资源

- [Tauri 文档](https://v2.tauri.app/start/)
- [XState 文档](https://xstate.js.org/docs/)
- [Vitest 文档](https://vitest.dev/guide/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Shadcn UI 文档](https://ui.shadcn.com/)
- [Stylelint 文档](https://stylelint.io/)
- [ESLint 文档](https://eslint.org/docs/latest/)
- [Playwright 文档](https://playwright.dev/docs/intro)
- [TypeDoc 文档](https://typedoc.org/)
- [ffmpeg 文档](https://ffmpeg.org/documentation.html)

## 许可证

本项目在带有 Commons Clause 条件的 MIT 许可证下分发。

**主要条款：**

- **开源**：您可以根据 MIT 许可证条款自由使用、修改和分发代码。
- **商业使用限制**：Commons Clause 禁止在没有与作者单独协议的情况下"销售"软件。
- **"销售"**意味着使用软件功能向第三方提供收费的产品或服务。

此许可证允许：

- 将代码用于个人和非商业项目
- 研究和修改代码
- 在相同许可证下分发修改

但禁止：

- 在没有许可证的情况下创建基于代码的商业产品或服务

要获得商业许可证，请联系作者：ak.chatman.media@gmail.com

完整的许可证文本可在 [LICENSE](./LICENSE) 文件中找到

## GitHub Pages

项目使用 GitHub Pages 托管 API 文档和宣传页面：

- **宣传页面**：[https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API 文档**：[https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

当 `main` 分支中的相应文件更改时，两个页面都会使用 GitHub Actions 工作流程自动更新。