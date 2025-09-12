# Timeline Studio 项目结构

[← 返回章节](README.md) | [← 返回目录](../README.md)

## 📋 目录

- [结构概览](#结构概览)
- [前端 (React/Next.js)](#前端-reactnextjs)
- [后端 (Rust/Tauri)](#后端-rusttauri)
- [配置文件](#配置文件)
- [支持目录](#支持目录)

## 🏗️ 结构概览

```
timeline-studio/
├── src/                  # 前端代码 (React/Next.js)
│   ├── app/              # Next.js App Router
│   ├── components/       # 通用 UI 组件
│   ├── features/         # 功能模块
│   ├── i18n/             # 国际化
│   ├── lib/              # 工具和助手
│   ├── styles/           # 全局样式
│   └── test/             # 测试工具
│
├── src-tauri/            # 后端代码 (Rust)
│   ├── src/              # Rust 源代码
│   ├── Cargo.toml        # Rust 配置
│   └── tauri.conf.json   # Tauri 配置
│
├── public/               # 静态文件
├── docs/                 # 文档
├── e2e/                  # 端到端测试
└── ...configuration files # 配置文件
```

## ⚛️ 前端 (React/Next.js)

### `/src/app/`
Next.js 15 App Router - 应用程序入口点。

```
app/
├── layout.tsx           # 根布局
├── page.tsx             # 主页面
├── globals.css          # 全局样式
└── providers.tsx        # React 提供者
```

### `/src/features/`
按功能模块组织的主要业务逻辑。

```
features/
├── timeline/          # 时间轴编辑器
│   ├── components/    # React 组件
│   ├── hooks/         # 自定义钩子
│   ├── services/      # 业务逻辑
│   ├── types/         # TypeScript 类型
│   ├── utils/         # 工具函数
│   ├── __tests__/     # 测试
│   └── README.md      # 模块文档
│
├── video-player/      # 视频播放器
├── browser/           # 媒体文件浏览器
├── effects/           # 视觉效果
├── export/            # 视频导出
├── ai-chat/           # AI 助手
├── ai-content-intelligence/  # 智能内容分析
├── montage-planner/   # AI 蒙太奇规划器
├── person-identification/    # 人物识别
├── fairlight-audio/   # 专业音频混音器
├── color-grading/     # 色彩校正
├── motion-graphics/   # 动画和图形
├── multicam/          # 多机位拍摄
├── camera-capture/    # 摄像头捕获
├── voice-recording/   # 语音录制
├── filters/           # 滤镜系统
├── transitions/       # 剪辑转场
├── templates/         # 多机位模板
├── style-templates/   # 动画模板
├── subtitles/         # 字幕处理
├── recognition/       # 场景识别
├── keyboard-shortcuts/# 键盘快捷键
├── modals/            # 模态窗口
├── media-studio/      # 主界面
├── project-settings/  # 项目设置
├── user-settings/     # 用户设置
└── app-state/         # 全局应用状态
```

#### 关键模块：

**核心编辑模块：**
1. **`timeline`** - 编辑的核心组件
2. **`video-player`** - 具有帧精确控制的自定义播放器
3. **`browser`** - 媒体文件管理器
4. **`media-studio`** - 主应用程序界面

**AI 模块：**
5. **`ai-chat`** - AI 助手（Claude/OpenAI 集成）
6. **`ai-content-intelligence`** - 智能内容分析
7. **`montage-planner`** - 自动蒙太奇规划
8. **`person-identification`** - 人物识别和跟踪

**专业工具：**
9. **`fairlight-audio`** - 带效果的完整音频混音器
10. **`color-grading`** - 专业色彩校正
11. **`motion-graphics`** - 带关键帧的动画系统

**效果和转场：**
12. **`effects`** - 视觉效果（100+ 种效果）
13. **`filters`** - 滤镜系统
14. **`transitions`** - 剪辑转场

**附加功能：**
15. **`multicam`** - 多机位同步
16. **`camera-capture`** - 摄像头/屏幕视频捕获
17. **`voice-recording`** - 配音录制
18. **`subtitles`** - 字幕创建和编辑

### `/src/components/`
基于 shadcn/ui 的可重用 UI 组件。

```
components/
├── ui/                # 基础 UI 组件
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
└── layout/            # 布局组件
    ├── header.tsx
    ├── sidebar.tsx
    └── ...
```

### `/src/lib/`
通用工具和助手函数。

```
lib/
├── utils.ts          # 通用工具
├── cn.ts             # 类名工具
├── date.ts           # 日期操作
└── validation.ts     # 数据验证
```

### `/src/i18n/`
国际化系统（10 种语言）。

```
i18n/
├── index.ts         # i18next 配置
├── constants.ts     # 语言常量
├── locales/         # 翻译文件
│   ├── en.json      # 英语
│   ├── ru.json      # 俄语
│   └── ...9 other languages # 其他 9 种语言
└── services/         # i18n 提供者
```

## 🦀 后端 (Rust/Tauri)

### `/src-tauri/src/`
Rust 后端逻辑。

```
src-tauri/src/
├── main.rs             # Tauri 入口点
├── lib.rs              # 根库模块
├── commands.rs         # Tauri 命令
│
├── media/             # 媒体处理模块
│   ├── mod.rs         # 主模块文件
│   ├── scanner.rs     # 文件扫描
│   ├── metadata.rs    # 元数据提取
│   └── cache.rs       # 缓存
│
├── video_compiler/    # 视频编译
│   ├── mod.rs
│   ├── ffmpeg.rs      # FFmpeg 集成
│   ├── encoder.rs     # 视频编码
│   └── progress.rs    # 进度跟踪
│
├── recognition/       # ML 识别
│   ├── mod.rs
│   ├── yolo.rs        # YOLO 集成
│   ├── tracker.rs     # 对象跟踪
│   ├── face_detection.rs    # 人脸检测
│   └── scene_analysis.rs    # 场景分析
│
├── audio/             # 音频处理
│   ├── mod.rs
│   ├── fairlight_engine.rs  # 音频引擎
│   ├── effects_chain.rs     # 效果链
│   └── midi_handler.rs      # MIDI 控制器
│
├── color/             # 色彩校正
│   ├── mod.rs
│   ├── grading_engine.rs    # 色彩分级引擎
│   ├── lut_processor.rs     # LUT 处理
│   └── scopes.rs            # 专业示波器
│
├── montage/           # 蒙太奇规划器
│   ├── mod.rs
│   ├── content_analyzer.rs   # 内容分析
│   ├── plan_generator.rs     # 计划生成器
│   └── rhythm_calculator.rs  # 节奏计算
│
├── project/           # 项目管理
├── export/            # 导出功能
└── utils/             # 通用工具
```

### 关键 Rust 模块：

**核心模块：**
1. **`media`** - 媒体文件处理、元数据、预览
2. **`video_compiler`** - 用于渲染的 FFmpeg 集成
3. **`project`** - 项目保存/加载
4. **`export`** - 导出为各种格式

**AI 和识别：**
5. **`recognition`** - 用于对象、人脸和场景识别的 YOLO 模型
6. **`montage`** - 带内容分析的 AI 蒙太奇规划器

**专业工具：**
7. **`audio`** - 类似 Fairlight 的音频引擎，带效果和 MIDI
8. **`color`** - GPU 加速的色彩校正，带 LUT 和示波器

### Tauri 命令
前后端交互的命令：

```rust
#[tauri::command]
async fn get_media_metadata(path: String) -> Result<MediaMetadata> {
    // 实现
}

#[tauri::command]
async fn export_video(settings: ExportSettings) -> Result<String> {
    // 实现
}
```

## ⚙️ 配置文件

### 根配置

```
├── package.json        # NPM 依赖和脚本
├── bun.lockb           # Bun 锁定文件
├── tsconfig.json       # TypeScript 配置
├── next.config.ts      # Next.js 配置
├── tailwind.config.ts  # Tailwind CSS 设置
├── vitest.config.ts    # 测试配置
└── .env.example        # 环境变量示例
```

### Tauri 配置

```
src-tauri/
├── tauri.conf.json     # 主配置
├── Cargo.toml          # Rust 依赖
└── build.rs            # 构建脚本
```

### `tauri.conf.json` 中的重要设置：

```json
{
  "productName": "Timeline Studio",
  "version": "1.0.0",
  "identifier": "com.timeline.studio",
  "build": {
    "features": ["gpu-acceleration", "ml-recognition"]
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage"],
    "resources": ["models/*", "assets/*"]
  }
}
```

## 📁 支持目录

### `/public/`
静态资源，可直接访问。

```
public/
├── icons/              # 应用程序图标
├── models/             # YOLO 模型
└── samples/            # 示例媒体文件
```

### `/e2e/`
使用 Playwright 的端到端测试。

```
e2e/
├── tests/              # 测试场景
├── fixtures/           # 测试数据
└── playwright.config.ts
```

### `/docs/`
项目文档（您现在就在这里！）。

## 🔧 开发脚本

### 主要命令

```bash
# 开发
bun run dev              # 仅前端
bun run tauri dev        # 前端 + 后端

# 测试
bun run test            # 单元测试
bun run test:e2e        # E2E 测试
bun run test:coverage   # 代码覆盖率

# 构建
bun run build           # 生产构建
bun run tauri build     # 应用程序构建

# 代码质量
bun run lint            # ESLint 检查
bun run lint:fix        # 自动修复
bun run type-check      # TypeScript 检查
```

## 📊 架构原则

1. **基于功能的结构** - 代码按功能组织
2. **关注点分离** - UI、业务逻辑和数据分离
3. **类型安全** - TypeScript 和 Rust 中的严格类型
4. **模块化** - 每个模块独立且可重用
5. **可测试性** - 代码编写时考虑测试

## 🎯 下一步？

现在您已经了解了项目结构：

1. [研究架构](../02-architecture/README.md) - 组件如何交互
2. [选择要学习的模块](../03-features/README.md) - 实现细节
3. [设置开发环境](../05-development/setup.md) - 最佳配置
4. [开始开发](../05-development/README.md) - 最佳实践

---

[← 第一个项目](first-project.md) | [下一步：架构 →](../02-architecture/README.md)