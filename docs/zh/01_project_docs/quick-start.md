# 快速开始指南

## 🚀 开始使用 Timeline Studio

本指南将帮助您在几分钟内启动并运行 Timeline Studio。

## 前置条件

开始之前，请确保您已安装以下软件：

- **Node.js** 18.0.0 或更高版本
- **Bun**（最新版本）
- **Rust** 1.81.0 或更高版本
- **FFmpeg** 6.0 或更高版本

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

### 2. 安装依赖

```bash
bun install
```

### 3. 平台特定设置

#### macOS
```bash
# 安装 FFmpeg
brew install ffmpeg

# 安装 ONNX Runtime（用于 AI 功能）
brew install onnxruntime

# 设置环境变量（添加到 ~/.zshrc 或 ~/.bashrc）
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### Windows
```powershell
# 运行设置脚本
./scripts/setup-rust-env-windows.ps1

# 或手动安装 FFmpeg
# 从 https://www.gyan.dev/ffmpeg/builds/ 下载
# 解压到 C:\ffmpeg
# 将 C:\ffmpeg\bin 添加到 PATH
```

#### Linux
```bash
# 安装依赖
sudo apt-get update
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev
```

## 🎮 运行 Timeline Studio

### 开发模式

```bash
bun run tauri dev
```

这将：
- 启动 Next.js 开发服务器
- 启动 Tauri 应用程序窗口
- 为前端和后端启用热重载

### 生产构建

```bash
bun run tauri build
```

这将为您的平台创建优化的生产构建。

## 🎬 创建您的第一个项目

1. **启动 Timeline Studio**
   - 运行 `bun run tauri dev`
   - 应用程序窗口将打开

2. **创建新项目**
   - 在欢迎屏幕上点击"新建项目"
   - 选择项目设置（分辨率、帧率）
   - 点击"创建"

3. **导入媒体**
   - 在媒体浏览器中点击"导入"按钮
   - 选择您的视频文件
   - 等待导入完成

4. **编辑您的视频**
   - 将媒体从浏览器拖拽到时间轴
   - 使用工具栏进行剪切、转场、特效
   - 在视频播放器中预览您的编辑

5. **导出您的项目**
   - 在顶部菜单中点击"导出"
   - 选择格式和质量设置
   - 选择目标位置
   - 点击"开始导出"

## 🤖 使用 AI 功能

### Claude/OpenAI 集成

1. **设置 API 密钥**
   - 转到设置 → AI 配置
   - 输入您的 Claude 或 OpenAI API 密钥
   - 密钥安全存储在您的系统钥匙串中

2. **使用 AI 助手**
   - 点击侧边栏中的 AI 聊天图标
   - 询问有关编辑技巧的问题
   - 获取项目建议

3. **自动功能**
   - 场景检测
   - 对象识别
   - 使用 Whisper 自动字幕

## 🚀 高级功能

### AI 驱动的工具

#### AI 内容智能
使用人工智能进行智能内容分析：

- **自动场景检测** - 识别场景变化和关键帧
- **对象识别** - 使用 YOLO/ONNX 模型检测视频中的对象
- **脚本生成** - 自动创建描述和对话
- **平台适配** - 为 YouTube、TikTok、Instagram 优化内容
- **OCR 功能** - 视频帧中的文本识别

#### 智能蒙太奇规划器
AI 驱动的编辑助手，用于自动专业视频创作：

- **素材分析** - 自动分析所有导入的文件
- **计划生成** - 创建各种风格的蒙太奇计划
- **最佳时刻检测** - 自动找到有趣的镜头
- **节奏建议** - 建议最佳节拍
- **时间轴集成** - 一键应用计划

#### 人物识别
面部识别和角色识别系统：

- **自动面部检测** - 找到视频中的所有面孔
- **角色识别** - 与已知档案匹配
- **档案管理** - 创建和编辑角色卡片
- **出现统计** - 分析每个角色的屏幕时间
- **时间轴集成** - 剪辑上的角色标记

### 专业工具

#### Fairlight 音频
具有全面工具的专业音频混音套件：

- **7 段参数均衡器** - 精确的频率控制
- **效果套件** - 压缩器、混响、AI 降噪
- **环绕声** - 支持立体声、5.1、7.1
- **MIDI 集成** - 完整的 MIDI 控制器支持
- **专业仪表** - LUFS、频谱分析仪、相位相关性

#### 调色
DaVinci Resolve 级别的专业色彩校正：

- **色轮** - 提升/伽马/增益/偏移控制
- **曲线** - 带贝塞尔插值的 RGB 和色调曲线
- **HSL 调整** - 色温、色调、对比度、饱和度
- **LUT 支持** - 导入 .cube 文件
- **专业示波器** - 波形、矢量示波器、直方图

#### 动态图形
基于关键帧的动画系统：

- **完整的关键帧系统** - 为任何参数制作动画
- **插值类型** - 线性、贝塞尔、缓动、弹跳、弹性
- **表达式引擎** - 用于程序动画的 JavaScript
- **预设库** - 即用型动画效果
- **可视化曲线编辑器** - 微调动画

### 附加功能

#### 多机位编辑
专业的多摄像机项目支持：

- **快速切换** - 热键 1-9 用于角度变化
- **同步** - 通过时间码或音频
- **可视化网格** - 同时预览所有摄像机
- **手动调整** - 每个摄像机的偏移校正
- **链接剪辑** - 自动时间轴同步

#### 摄像机捕获
直接在 Timeline Studio 中录制视频：

- **设备选择** - 选择摄像机和麦克风
- **质量设置** - 分辨率和 FPS 控制
- **屏幕录制** - 捕获屏幕、窗口或浏览器标签
- **实时预览** - 录制时监控
- **WebM 格式** - 最佳质量和大小

#### 语音录制
专业的画外音录制：

- **麦克风选择** - 从所有可用设备中选择
- **倒计时器** - 录制前 0 到 10 秒
- **可视化指示器** - 信号电平和录制时间
- **最长 5 分钟** - 适合解说
- **自动保存** - 直接保存到项目媒体库

## 🔧 常见问题

### 找不到 FFmpeg
```bash
# 验证 FFmpeg 安装
ffmpeg -version

# 如果找不到，请为您的平台重新安装 FFmpeg
```

### 构建失败
- 确保所有前置条件都已安装
- 清除缓存：`cargo clean && bun install --force`
- 检查 Rust 版本：`rustc --version`

### 性能问题
- 在设置中启用 GPU 加速
- 为 4K 素材使用代理文件
- 关闭其他资源密集型应用程序

## 📚 下一步

- 阅读[架构概览](ARCHITECTURE_OVERVIEW.md)
- 探索[功能文档](../02_REQUIREMENTS/FUNCTIONAL_requirements.md)
- 加入我们的[Discord 社区](https://discord.gg/gwJUYxck)
- 查看[视频教程](https://www.youtube.com/@chatman-media)

## 💡 提示

- 使用键盘快捷键进行更快的编辑（按 `?` 查看全部）
- 在设置中启用自动保存以防止数据丢失
- GPU 加速显著提高导出速度
- 建议定期备份您的项目

---

*需要帮助？访问我们的[故障排除指南](../05_DEVELOPMENT/TROUBLESHOOTING.md)或在我们的[社区聊天](https://t.me/timelinestudio)中提问*