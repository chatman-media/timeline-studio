# 架构

## 📋 目录

本节包含Timeline Studio的详细架构文档。

### 🔄 核心文档
- [**communication.md**](communication.md) - 通过Tauri IPC进行前后端交互
- [**data-flow.md**](data-flow.md) - 应用数据流

### 🎨 前端架构
- [**frontend/**](frontend/) - 前端架构概述
- [**frontend/state-management.md**](frontend/state-management.md) - 使用XState进行状态管理

### 🦀 后端架构
- [**backend/**](backend/) - Rust后端架构概述
- [**backend/rust-architecture.md**](backend/rust-architecture.md) - Rust应用架构
- [**backend/type-mapping.md**](backend/type-mapping.md) - 前端和后端类型映射
- [**backend/service-layer.md**](backend/service-layer.md) - 服务层
- [**backend/error-handling.md**](backend/error-handling.md) - 错误处理

### 🎬 集成
- [**backend/ffmpeg-integration.md**](backend/ffmpeg-integration.md) - FFmpeg集成
- [**backend/plugin-system.md**](backend/plugin-system.md) - 插件系统

### 📊 监控
- [**backend/telemetry.md**](backend/telemetry.md) - 遥测和指标
- [**backend/monitoring-and-metrics.md**](backend/monitoring-and-metrics.md) - 性能监控

### 🔒 安全
- [**backend/security-architecture.md**](backend/security-architecture.md) - 安全架构

### 📈 图表
- [**backend/architecture-diagram.md**](backend/architecture-diagram.md) - 架构图

## 🏗️ 关键原则

### 前端（React + TypeScript）
- **状态管理**: 使用XState处理复杂状态
- **组件架构**: 基于功能的组织
- **类型安全**: TypeScript严格类型
- **性能**: React 19优化

### 后端（Rust + Tauri）
- **类型安全**: Spekta类型同步
- **性能**: 零拷贝操作，多线程
- **安全**: 沙盒插件，加密
- **GPU加速**: NVENC、AMF、QuickSync、VideoToolbox

### 通信
- **IPC**: Tauri命令和事件
- **类型安全**: 自动生成类型
- **错误处理**: 结构化错误
- **流式传输**: 流数据传输

## 🔗 相关章节

- [需求](../02_requirements/) - 功能和技术需求
- [API参考](../04_api_reference/) - API参考指南
- [开发](../05_development/) - 开发者指南

---

*最后更新：2025年7月31日*