# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=for-the-badge&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=for-the-badge&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=for-the-badge&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## 项目概述

Timeline Studio 是一款基于 Tauri 架构（Rust + React）构建的现代视频编辑器。

**我们的目标**：创建一个结合以下特点的编辑器：
- **DaVinci Resolve 的专业能力** - 完全控制编辑、调色、音频混音、视觉效果、动态图形和高级合成
- **丰富的创意库** - 效果、滤镜、转场、多机位模板、动画标题、样式模板和字幕预设，可与 Filmora 等流行编辑器媲美
- **AI 脚本和自动化** - 自动生成不同语言和不同平台的内容

**关键创新**：用户只需上传视频、音乐和其他资源，AI 将自动创建一组针对不同语言和不同平台（YouTube、TikTok、Vimeo、Telegram）优化的视频。

![时间轴界面 #1](/public/screen2.png)

![时间轴界面 #2](/public/screen4.png)

### 项目状态（2025年6月）

**总体完成度：53.8%** ⬆️（根据真实模块状态和14个新计划模块重新计算）
- **已完成**：11个模块（100% 就绪）
- **开发中**：8个模块（45-85% 就绪）
- **已计划**：5个模块（30-85% 就绪）
- **新计划**：14个模块（0% 就绪）- [详情见 planned/](docs-ru/08-roadmap/planned/)

### 关键成就：
- ✅ **视频编译器** - 完全实现GPU加速（100%）
- ✅ **时间轴** - 主编辑器完全功能（100%）
- ✅ **媒体管理** - 文件管理就绪（100%）
- ✅ **核心架构** - app-state、browser、modals、user/project settings（100%）
- ✅ **识别** - YOLO v11对象和人脸识别（100%）
- 🔄 **效果/滤镜/转场** - 丰富的Filmora风格效果库（75-80%）
- 🔄 **导出** - 几乎完成，参数细节待完善（85%）
- 🔄 **资源面板** - 主UI就绪，缺少拖放功能（80%）
- ❗ **AI聊天** - 需要真实API集成（30%）
- 📋 **14个新计划模块** - [查看 planned/](docs-ru/08-roadmap/planned/) 以达到DaVinci + Filmora水平
- 🎯 **目标** - 结合DaVinci的强大功能和Filmora的库以及AI自动化

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

### 快速开始

```bash
# 开发模式
bun run tauri dev

# 运行测试
bun run test && bun run test:rust

# 检查代码质量
bun run check:all
```

### 基本命令

| 命令 | 描述 |
|------|------|
| `bun run tauri dev` | 启动完整应用程序开发模式 |
| `bun run dev` | 仅启动前端 |
| `bun run build` | 生产环境构建 |
| `bun run test` | 运行前端测试 |
| `bun run test:rust` | 运行后端测试 |
| `bun run lint` | 检查代码质量 |
| `bun run fix:all` | 自动修复代码问题 |

📚 **[完整开发指南 →](docs-ru/05-development/README.md)**

### 测试覆盖状态

✅ **前端测试**：3,604 通过  
✅ **后端测试**：554 通过（+18 新增！）  
📊 **总计**：4,158 测试通过

## CI/CD 和代码质量

### 自动化流程
- ✅ **代码检查**：ESLint、Stylelint、Clippy
- ✅ **测试**：前端（Vitest）、后端（Rust）、E2E（Playwright）
- ✅ **覆盖率**：Codecov 集成
- ✅ **构建**：跨平台构建

📚 **[详细 CI/CD 指南 →](docs-ru/06-deployment/README.md)**  
🔧 **[代码检查和格式化 →](docs-ru/05-development/linting-and-formatting.md)**

## 文档和资源

- 📚 [**API 文档**](https://chatman-media.github.io/timeline-studio/api-docs/) - 自动生成的 TypeScript 文档
- 🚀 [**宣传页面**](https://chatman-media.github.io/timeline-studio/) - 项目展示
- 📖 [**完整文档**](docs-ru/README.md) - 俄语完整指南
- 🎬 [**在线演示**](https://chatman-media.github.io/timeline-studio/) - 在线试用编辑器

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