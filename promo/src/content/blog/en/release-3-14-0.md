---
title: Timeline Studio 3.14.0 - Priority for Local AI Models
date: 2025-11-18
author: Timeline Team
slug: release-3-14-0
excerpt: Update focuses on privacy - local AI models now have priority in auto-selection. Work with your data completely offline!
category: Release
readTime: 4 min read
---

# Timeline Studio 3.14.0 - Priority for Local AI Models

Timeline Studio 3.14.0 takes an important step towards privacy and independence - local AI models are now automatically selected first when using AI features.

## 🔐 Main Feature

### 🏠 Local Models Priority

Your data stays on your computer:

- **Automatic selection** of local models (Ollama, LM Studio)
- **Full privacy** - data doesn't leave your computer
- **Offline work** - no internet needed for AI features
- **API savings** - free use of local models

Now when opening AI Chat, the app first checks local model availability:

1. **Ollama** - if installed and running
2. **LM Studio** - if available locally
3. **Cloud models** - only if local unavailable

### 🛡️ MCP Claude Support

Added Model Context Protocol support for Claude:

- **MCP compatibility** with Claude Desktop
- **Secure import** of API keys with mcp_claude type
- **Integration with local services** via MCP

## 🐛 Fixes

- **Improved AI integration** - fixed model selection issues
- **Updated tests** for new model selection logic
- **Fixed security issues** when importing API keys

## 💡 Why This Matters

### Privacy
Your video projects, AI dialogs, and all intermediate data stay local. No one gets access to your content.

### Independence
Don't depend on cloud service availability or internet connection. Work anywhere.

### Savings
Local models are free to use. No API bills, no limits.

### Performance
For many tasks, local models work faster - no delays from cloud data transfer.

## 🚀 Setup

### Install Ollama

1. Download [Ollama](https://ollama.ai)
2. Install recommended models:
   ```bash
   ollama pull llama2
   ollama pull codellama
   ollama pull mistral
   ```
3. Run Ollama - Timeline Studio will automatically detect it

### Usage

1. Open AI Chat in Timeline Studio
2. App automatically selects local model
3. Start working - everything is local!

## 🎯 What's Next

- **More local models** - support for new models
- **Optimization** - improved local model performance
- **Offline-first approach** - even more features will work offline

## 📦 Update

Download Timeline Studio 3.14.0 from [releases page](https://github.com/chatman-media/timeline-studio/releases/tag/v3.14.0).

Thank you for your support! We continue making Timeline Studio a more private and independent tool.
