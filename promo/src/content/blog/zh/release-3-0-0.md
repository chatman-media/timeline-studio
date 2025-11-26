---
title: Timeline Studio 3.0.0 - 革命性转向事件驱动架构
date: 2025-11-18
author: Timeline 团队
slug: release-3-0-0
excerpt: 重大 3.0 版本发布，全新事件驱动架构、Ollama Vision 模型免费 AI 分析和 API 密钥安全存储。Timeline Studio 新时代！
category: 发布
readTime: 8 分钟阅读
---

# Timeline Studio 3.0.0 - 革命性转向事件驱动架构

推出 Timeline Studio 3.0.0 — 完全重新思考应用架构的革命性版本。这是项目历史上最重大的更新，在状态和数据管理方法上有根本性变化。

## 🚨 重大变更

### 事件驱动架构

完全转向事件驱动架构：

**之前：** 每个事件后获取状态
```typescript
// 旧方法
await executeCommand('add_media', params)
await fetchState() // 重新加载整个状态
```

**现在：** 通过事件增量更新
```typescript
// 新方法
await executeCommand('add_media', params)
// MediaAdded 事件仅包含更改
// 提供程序自动更新本地状态
```

**优势：**
- ⚡ **快 10-50 倍** - 无需完整状态加载
- 🔄 **反应性** - UI 立即更新
- 📉 **更少流量** - 仅传输更改
- 🎯 **定向更新** - 每个提供程序监听自己的事件

### 默认使用 Ollama Vision 模型

AI Director 现在使用本地视觉模型：

**新默认设置：**
- `ai_provider: Ollama`（而不是 None）
- `ai_model: moondream2`（轻量级视觉模型）
- `enable_vision_language_model: true`

**为什么需要：**
- ✅ **免费视频分析**（0 API 成本）
- ✅ **本地处理**（100% 隐私）
- ✅ **通过视觉 AI 检测情绪**
- ✅ **离线工作** - 无需互联网

**要求：**
```bash
# 安装 Ollama
brew install ollama  # macOS
# 或从 ollama.ai 下载

# 下载视觉模型
ollama pull moondream2

# 替代方案：
ollama pull llama3.2-vision
ollama pull llava
```

### MediaAdapter 迁移

MediaAdapter 不再从 `projectState` 读取：

**之前：**
```typescript
const files = projectState.imported_media
```

**现在：**
```typescript
const { mediaPool } = useMediaManagement()
const files = mediaPool
```

**优势：**
- 🎯 直接访问媒体数据
- 📡 通过事件自动同步
- 🔌 独立于全局状态

## 🎨 主要功能

### 🤖 多模态 AI 支持

完整视觉模型集成：

- **视频帧分析** - 内容理解
- **面部情绪检测**
- **对象识别** 和场景
- **视频中的动作描述**
- **自动内容分类**

### 🔐 API 密钥安全存储

机密数据安全存储：

- **加密** 系统钥匙链中的 API 密钥
- **OS 集成** - Windows 凭据管理器、macOS 钥匙链、Linux 密钥服务
- **从 .env 文件安全导入**
- **旧密钥自动迁移**

### 📦 MediaManagement 提供程序

新的集中式媒体提供程序：

```typescript
<MediaManagementProvider>
  {/* 自动媒体同步 */}
  {/* MediaAdded/Removed/Updated 事件处理 */}
  {/* 缓存和优化 */}
</MediaManagementProvider>
```

### 🎬 AI Director 改进

- **多选** 视频进行分析
- **自动显示** 最后分析
- **刷新按钮** 重置状态
- **进度条** 实时更新
- **从媒体池选择视频**

### 🔄 代理文件生成

生成代理文件以实现流畅编辑：

- **FFmpeg 集成** 用于转码
- **自动创建** 4K/8K 视频的轻量版本
- **可自定义质量** 的代理
- **后台处理** 不阻塞 UI

### 🎯 特效和滤镜改进

重新设计的特效系统：

- **GPU 加速** 实时预览
- **新特效** 和滤镜
- **改进的性能**
- **不同 GPU 的配置文件**

## 🐛 修复

### 关键

- **浏览器中的无限 AudioContext 循环**
- **AI Director 事件中的竞态条件**
- **收藏夹事件监听器中的 Undefined**
- **u64 类型的 Specta BigInt** 导出

### TypeScript

- 修复了 **131 个类型错误**
- 更新了功能和域中的导入
- 改进了 AI 工具类型

### 测试

- 修复了 **失败的前端测试**
- 修复了 **video_compiler 测试**
- 删除了 **挂起的测试** 语言状态
- 修复了 **use-user-settings 中的不稳定测试**

## 📊 发布统计

- **360+ 次提交**
- **100+ 个文件** 更改
- **10,000+ 行** 代码添加
- **15+ 个新功能**
- **131 个 TypeScript 错误** 修复
- **所有测试** 通过

## 🎯 面向开发者

### API 更改

```typescript
// 事件的新 API
import { useBackendSync } from '@/domains/backend-sync'

function Component() {
  const { listenToEvent } = useBackendSync()

  useEffect(() => {
    return listenToEvent('MediaAdded', (data) => {
      // 事件处理
    })
  }, [])
}
```

### 迁移指南

1. **更新提供程序** - 添加 MediaManagementProvider
2. **用事件监听器替换 fetchState**
3. **更新依赖项** - 使用新钩子
4. **测试事件** - 确保正确处理

## 📦 安装

```bash
# 通过内置更新程序更新
# 或从 GitHub Releases 下载

# 对于 Ollama（推荐）：
brew install ollama
ollama pull moondream2
```

## 🎓 资源

- [事件驱动架构文档](https://github.com/chatman-media/timeline-studio/docs)
- [Ollama Vision 指南](https://github.com/chatman-media/timeline-studio/docs/ollama)
- [迁移指南 2.x → 3.0](https://github.com/chatman-media/timeline-studio/docs/migration-3.0)

## 🙏 致谢

衷心感谢所有贡献者和用户测试 beta 版本！您的反馈帮助使 Timeline Studio 3.0 稳定高效。

这是 Timeline Studio 新时代的开始。事件驱动架构为未来更强大的功能奠定了基础！

---

**下载 Timeline Studio 3.0.0：** [GitHub Releases](https://github.com/chatman-media/timeline-studio/releases/tag/v3.0.0)
