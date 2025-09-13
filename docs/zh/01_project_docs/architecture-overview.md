# TIMELINE STUDIO 架构概览

## 🏗️ 总体架构

Timeline Studio 基于现代模块化架构构建，结合了原生桌面应用程序的强大功能和Web技术的便利性。

```
┌─────────────────────────────────────────────────────────────┐
│                      Timeline Studio                         │
├─────────────────────────┬───────────────────────────────────┤
│      前端              │           后端                    │
│    (Next.js 15)        │         (Rust + Tauri)           │
├─────────────────────────┼───────────────────────────────────┤
│  • React 19            │  • 视频编译器 (FFmpeg)            │
│  • XState v5           │  • GPU 加速                      │
│  • shadcn/ui           │  • 媒体处理                       │
│  • Tailwind CSS v4     │  • 插件系统                       │
│  • 基于功能的架构        │  • 安全层                         │
└─────────────────────────┴───────────────────────────────────┘
```

## 🎨 前端架构

### 基于功能的组织结构

`/src/features/` 中的每个功能都是一个独立的模块：

```
src/features/
├── timeline/           # 主编辑器
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义钩子
│   ├── services/      # 业务逻辑和 XState 状态机
│   ├── types/         # TypeScript 类型
│   ├── utils/         # 辅助函数
│   └── __tests__/     # 测试
├── video-player/      # 视频播放器
├── media-studio/      # 主界面
├── ai-chat/          # AI 助手
├── ai-content-intelligence/  # 智能内容分析
├── montage-planner/   # AI 蒙太奇规划器
├── person-identification/    # 人物识别
├── fairlight-audio/   # 专业音频混音器
├── color-grading/     # 色彩校正
├── motion-graphics/   # 动画和图形
├── multicam/          # 多机位编辑
├── camera-capture/    # 摄像头捕获
├── voice-recording/   # 语音录制
└── ...               # 其他功能
```

### 状态管理

- **XState v5** 用于复杂逻辑（时间轴、播放器、浏览器）
- **React Context** 用于全局状态
- **Tauri Store** 用于持久化数据存储
- **Local Storage** 用于临时用户设置

### UI 架构

- **shadcn/ui** - 基于 Radix UI 的现成组件
- **Tailwind CSS v4** - 实用优先的样式
- **CSS Variables** - 主题化
- **Framer Motion** - 动画

### 关键模块

#### AI 模块
- **AI 内容智能** - 内容分析、场景/物体检测（YOLO/ONNX）、脚本生成
- **蒙太奇规划器** - 通过 AI 素材分析自动生成蒙太奇计划
- **人物识别** - 人脸检测和识别、DBSCAN 聚类

#### 专业工具
- **Fairlight 音频** - 完整的音频混音器，支持 Web Audio API、效果和 MIDI
- **色彩分级** - 专业色彩校正，支持 LUT、曲线和示波器
- **动态图形** - 带表达式引擎的关键帧系统

#### 附加功能
- **多机位** - 通过时间码/音频进行多机位同步
- **摄像头捕获** - 通过 WebRTC 从摄像头和屏幕捕获视频
- **语音录制** - 专业配音录制

## ⚙️ 后端架构

### 模块化结构

```
src-tauri/src/
├── core/              # 核心基础设施
│   ├── di/           # 依赖注入
│   ├── events/       # 事件总线系统
│   ├── performance/  # 内存管理
│   ├── plugins/      # 插件系统
│   └── telemetry/    # 指标和监控
├── security/          # 安全
│   ├── secure_storage.rs    # 数据加密
│   ├── oauth_handler.rs     # 社交媒体 OAuth
│   └── api_validator.rs     # API 密钥验证
├── media/             # 媒体处理
│   ├── metadata.rs   # 文件分析
│   ├── ffmpeg.rs     # FFmpeg 集成
│   └── preview.rs    # 预览生成
├── video_compiler/    # 视频编译
│   ├── core/         # GPU、管道、编解码器
│   ├── services/     # 服务层
│   └── cache/        # LRU 缓存
├── recognition/       # AI 识别
│   ├── yolo_processor.rs    # YOLO 模型
│   ├── face_detection.rs    # 人脸检测
│   └── scene_analysis.rs    # 场景分析
├── audio/             # 音频处理
│   ├── fairlight_engine.rs  # 音频引擎
│   ├── effects_chain.rs     # 效果链
│   └── midi_handler.rs      # MIDI 控制器
├── color/             # 色彩校正
│   ├── grading_engine.rs    # 色彩分级引擎
│   ├── lut_processor.rs     # LUT 处理
│   └── scopes.rs            # 专业示波器
└── montage/           # 蒙太奇规划器
    ├── content_analyzer.rs   # 内容分析
    ├── plan_generator.rs     # 计划生成
    └── rhythm_calculator.rs  # 节奏计算
```

### 关键组件

1. **视频编译器** - 基于 FFmpeg 的视频处理核心
2. **GPU 服务** - 硬件加速（NVENC、QuickSync）
3. **插件系统** - 通过插件实现可扩展性
4. **安全层** - 安全存储和 OAuth
5. **媒体管道** - 媒体处理管道
6. **AI 识别** - 用于内容分析的 YOLO/ONNX 模型
7. **Fairlight 引擎** - 专业音频处理
8. **色彩引擎** - GPU 加速的色彩校正
9. **蒙太奇 AI** - 智能分析和规划

## 🔌 前后端通信

### Tauri 命令

```rust
// 后端
#[tauri::command]
async fn process_video(path: String, options: VideoOptions) -> Result<VideoOutput> {
    // 处理视频
}

// 前端
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('process_video', {
    path: '/path/to/video.mp4',
    options: { format: 'mp4', quality: 'high' }
});
```

### 事件系统

```typescript
// 前端订阅
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('render-progress', (event) => {
    console.log('进度:', event.payload.percent);
});

// 后端发射
window.emit("render-progress", ProgressPayload { percent: 75.0 });
```

## 🔐 安全

### API 密钥
- 存储在系统钥匙串（macOS）、凭据存储（Windows）、密钥服务（Linux）中
- 保存前使用 AES-256 加密
- 从不以明文传输

### OAuth 令牌
- 使用 PKCE 流程确保安全
- 令牌自动刷新
- 支持 YouTube、TikTok、Vimeo、Telegram

## 🚀 性能

### 前端优化
- 按路由进行代码分割
- 组件懒加载
- 昂贵计算的记忆化
- 大列表虚拟化

### 后端优化
- 渲染的 GPU 加速
- 预览的 LRU 缓存
- 通过 tokio 进行并行处理
- 尽可能使用零拷贝操作

## 🧪 测试

### 前端
- **Vitest** 用于单元测试
- **Testing Library** 用于组件测试
- **Playwright** 用于端到端测试
- **80%+** 代码覆盖率

### 后端
- **Cargo test** 用于单元测试
- **集成测试** 用于命令测试
- **Mockall** 用于模拟
- **Proptest** 用于基于属性的测试

## 📦 构建系统

### 开发
```bash
bun run tauri dev  # 前后端热重载
```

### 生产
```bash
bun run tauri build  # 优化构建
```

### 平台
- **Windows**: MSI/NSIS 安装程序
- **macOS**: DMG/App 包
- **Linux**: AppImage/deb/rpm

---

*详细信息请参阅架构部分的专门文档*