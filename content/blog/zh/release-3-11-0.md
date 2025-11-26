---
title: Timeline Studio 3.11.0 - MCP 工具集成
date: 2025-11-18
author: Timeline 团队
slug: release-3-11-0
excerpt: 革命性的 Model Context Protocol 集成 - AI Chat 中现提供 18 个新 MCP 工具，用于扩展自动化功能和外部服务集成。
category: 发布
readTime: 5 分钟阅读
---

# Timeline Studio 3.11.0 - MCP 工具集成

Timeline Studio 3.11.0 通过支持 Model Context Protocol (MCP) 开启了集成的新时代 - AI Chat 现在可以使用 18 个专门工具来处理外部服务！

## 🔌 主要功能

### 🛠️ AI Chat 中的 18 个 MCP 工具

与 Anthropic 的 Model Context Protocol 集成：

- **文件系统** - 读取、写入、搜索文件
- **Git 操作** - 提交、分支、历史
- **Web 请求** - API 的 HTTP 客户端
- **数据库** - SQLite 操作
- **云服务** - 与流行平台集成

### 🤖 IAITool 适配器

每个 MCP 工具都包装在 IAITool 接口中：

- **统一接口** 用于所有工具
- **自动验证** 参数
- **错误处理** 带清晰消息
- **每个工具的文档**

### 💬 智能 AI Chat

AI 现在可以执行复杂任务：

```
用户："查找项目中的所有视频文件并创建备份"

AI：使用 MCP 工具：
1. fs_search - 搜索 *.mp4、*.mov 文件
2. fs_copy - 复制到备份目录
3. git_commit - 提交更改

结果：所有文件已复制，更改已保存在 Git 中
```

## 🎯 可用工具

### 文件系统
- `fs_read` - 读取文件
- `fs_write` - 写入文件
- `fs_list` - 列出目录中的文件
- `fs_search` - 按模式搜索文件

### Git
- `git_status` - 仓库状态
- `git_commit` - 创建提交
- `git_log` - 提交历史
- `git_diff` - 文件更改

### Web
- `http_get` - GET 请求
- `http_post` - POST 请求
- `fetch_url` - 下载内容

### 媒体
- `analyze_video` - 分析视频文件
- `extract_audio` - 提取音频
- `generate_thumbnail` - 创建预览

### 其他
- `sqlite_query` - SQL 查询
- `run_script` - 执行脚本
- `search_web` - 互联网搜索

## 💡 使用示例

### 工作流自动化

```
"查找所有未使用的媒体文件并移至存档"
"创建项目中所有视频及其时长的报告"
"从 YouTube 下载音轨并添加到项目"
```

### 服务集成

```
"通过 API 将渲染上传到 YouTube"
"向 Slack 发送导出完成通知"
"将项目元数据保存到 Google Sheets"
```

### Git 操作

```
"将当前项目版本保存到 Git"
"显示上周的更改历史"
"为特效实验创建新分支"
```

## 🔧 设置

1. **安装 MCP Server**（可选）：
   ```bash
   npm install -g @anthropic/mcp-server
   ```

2. **在设置 → AI Chat → MCP Tools 中配置工具**

3. **开始使用** - 只需询问 AI！

## 🐛 修复

- **改进的配置** lucide-react 图标
- **添加了 AppHandle** 用于 Vision Analyzer 进度跟踪
- **修复了 MCP Tools 初始化问题**

## 🎯 下一步

- **更多 MCP 工具** - 与流行服务集成
- **自定义工具** - 创建您自己的 MCP 工具
- **市场** - 与社区共享工具

## 📦 更新

从[发布页面](https://github.com/chatman-media/timeline-studio/releases/tag/v3.11.0)下载 Timeline Studio 3.11.0。

MCP 工具开启了无限自动化可能性。试试并分享您的用例！
