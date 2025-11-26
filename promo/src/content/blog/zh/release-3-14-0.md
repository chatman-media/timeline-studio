---
title: Timeline Studio 3.14.0 - 本地 AI 模型优先
date: 2024-11-18
author: Timeline 团队
slug: release-3-14-0
excerpt: 更新专注于隐私 - 本地 AI 模型现在在自动选择中具有优先权。完全离线处理您的数据！
category: 发布
readTime: 4 分钟阅读
---

# Timeline Studio 3.14.0 - 本地 AI 模型优先

Timeline Studio 3.14.0 在隐私和独立性方面迈出了重要一步 - 在使用 AI 功能时，本地 AI 模型现在会自动首先选择。

## 🔐 主要功能

### 🏠 本地模型优先

您的数据保留在您的计算机上：

- **自动选择** 本地模型（Ollama、LM Studio）
- **完全隐私** - 数据不会离开您的计算机
- **离线工作** - AI 功能无需互联网
- **节省 API** - 免费使用本地模型

现在打开 AI Chat 时，应用首先检查本地模型可用性：

1. **Ollama** - 如果已安装并运行
2. **LM Studio** - 如果本地可用
3. **云模型** - 仅在本地不可用时

### 🛡️ MCP Claude 支持

为 Claude 添加了 Model Context Protocol 支持：

- **MCP 兼容性** 与 Claude Desktop
- **安全导入** 带 mcp_claude 类型的 API 密钥
- **通过 MCP 与本地服务集成**

## 🐛 修复

- **改进的 AI 集成** - 修复了模型选择问题
- **为新模型选择逻辑更新的测试**
- **修复了导入 API 密钥时的安全问题**

## 💡 为什么这很重要

### 隐私
您的视频项目、AI 对话和所有中间数据都保留在本地。没有人能访问您的内容。

### 独立性
不依赖云服务可用性或互联网连接。随时随地工作。

### 节省
本地模型免费使用。无 API 账单，无限制。

### 性能
对于许多任务，本地模型工作更快 - 没有云数据传输延迟。

## 🚀 设置

### 安装 Ollama

1. 下载 [Ollama](https://ollama.ai)
2. 安装推荐模型：
   ```bash
   ollama pull llama2
   ollama pull codellama
   ollama pull mistral
   ```
3. 运行 Ollama - Timeline Studio 将自动检测它

### 使用

1. 在 Timeline Studio 中打开 AI Chat
2. 应用自动选择本地模型
3. 开始工作 - 一切都是本地的！

## 🎯 下一步

- **更多本地模型** - 支持新模型
- **优化** - 改进的本地模型性能
- **离线优先方法** - 更多功能将离线工作

## 📦 更新

从[发布页面](https://github.com/chatman-media/timeline-studio/releases/tag/v3.14.0)下载 Timeline Studio 3.14.0。

感谢您的支持！我们继续使 Timeline Studio 成为更私密和独立的工具。
