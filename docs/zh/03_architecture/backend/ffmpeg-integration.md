# FFmpeg集成

## 概述

FFmpeg是Timeline Studio中视频处理的主要工具。本文档描述了集成、命令构建和最佳实践。

## 命令构建

### 构建器模式

使用构建器模式构建FFmpeg命令：

```rust
let command = FfmpegCommandBuilder::new()
    .input(video_path)
    .video_codec("libx264")
    .audio_codec("aac")
    .output(output_path)
    .build();
```

### 命令结构

```rust
pub struct FfmpegCommand {
    inputs: Vec<Input>,
    outputs: Vec<Output>,
    global_options: Vec<String>,
    filters: Option<FilterGraph>,
}
```

## 硬件加速

### 检测可用编码器

```rust
pub async fn detect_hardware_encoders() -> Vec<HardwareEncoder> {
    let mut encoders = vec![];
    
    // NVIDIA NVENC
    if check_encoder_available("h264_nvenc").await {
        encoders.push(HardwareEncoder::Nvenc);
    }
    
    // Intel Quick Sync
    if check_encoder_available("h264_qsv").await {
        encoders.push(HardwareEncoder::QuickSync);
    }
    
    // AMD AMF
    if check_encoder_available("h264_amf").await {
        encoders.push(HardwareEncoder::Amf);
    }
    
    // Apple VideoToolbox
    if check_encoder_available("h264_videotoolbox").await {
        encoders.push(HardwareEncoder::VideoToolbox);
    }
    
    encoders
}
```

### 编码器选择策略

1. 优先使用可用的硬件编码
2. 自动回退到软件编码
3. 基于编码器的质量设置

## 视频处理

### 帧提取

```rust
pub async fn extract_frame(
    video_path: &Path,
    timestamp: f64,
    output_format: ImageFormat,
) -> Result<Vec<u8>> {
    let mut cmd = Command::new("ffmpeg");
    
    cmd.args(&[
        "-ss", &timestamp.to_string(),
        "-i", video_path.to_str().unwrap(),
        "-frames:v", "1",
        "-f", "image2pipe",
        "-vcodec", output_format.to_codec(),
        "-",
    ]);
    
    let output = cmd.output().await?;
    
    if !output.status.success() {
        return Err(VideoCompilerError::FFmpegError {
            exit_code: output.status.code(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: format!("{:?}", cmd),
        });
    }
    
    Ok(output.stdout)
}
```

### 预览生成

```rust
pub async fn generate_preview(
    video_path: &Path,
    output_path: &Path,
    duration: f64,
    scale: Option<(u32, u32)>,
) -> Result<()> {
    let mut builder = FfmpegCommandBuilder::new()
        .input(video_path)
        .duration(duration);
    
    if let Some((width, height)) = scale {
        builder = builder.video_filter(&format!("scale={}:{}", width, height));
    }
    
    builder
        .video_codec("libx264")
        .preset("ultrafast")
        .output(output_path)
        .execute()
        .await
}
```

### 项目渲染

```rust
pub async fn render_project(
    project: &ProjectSchema,
    output_path: &Path,
    progress_callback: impl Fn(f32),
) -> Result<()> {
    let pipeline = RenderPipeline::new(project);
    
    // 阶段1：媒体准备
    pipeline.prepare_media().await?;
    progress_callback(0.2);
    
    // 阶段2：应用效果
    pipeline.apply_effects().await?;
    progress_callback(0.4);
    
    // 阶段3：合成
    pipeline.composite_layers().await?;
    progress_callback(0.6);
    
    // 阶段4：最终编码
    pipeline.encode_output(output_path).await?;
    progress_callback(1.0);
    
    Ok(())
}
```

## 滤镜和效果

### 构建滤镜图

```rust
pub struct FilterGraph {
    nodes: Vec<FilterNode>,
    connections: Vec<Connection>,
}

impl FilterGraph {
    pub fn to_string(&self) -> String {
        // 为FFmpeg生成滤镜字符串
        let mut parts = vec![];
        
        for node in &self.nodes {
            parts.push(node.to_string());
        }
        
        parts.join(",")
    }
}
```

### 滤镜示例

```rust
// 缩放
filter_graph.add_filter("scale", &["640:480"]);

// 颜色校正
filter_graph.add_filter("eq", &["brightness=0.1:contrast=1.2"]);

// 文本叠加
filter_graph.add_filter("drawtext", &[
    "text='Timeline Studio'",
    "fontsize=24",
    "fontcolor=white",
    "x=(w-text_w)/2",
    "y=h-50"
]);

// 转场
filter_graph.add_filter("xfade", &[
    "transition=fade",
    "duration=1",
    "offset=5"
]);
```

## 错误处理

### FFmpeg错误类型

```rust
pub enum FFmpegError {
    NotFound,
    InvalidInput(String),
    CodecNotSupported(String),
    OutOfMemory,
    InvalidParameters(String),
    Unknown(String),
}
```

### 解析FFmpeg输出

```rust
pub fn parse_ffmpeg_error(stderr: &str) -> FFmpegError {
    if stderr.contains("No such file") {
        FFmpegError::InvalidInput("文件未找到".to_string())
    } else if stderr.contains("Unknown encoder") {
        FFmpegError::CodecNotSupported("编解码器不支持".to_string())
    } else if stderr.contains("out of memory") {
        FFmpegError::OutOfMemory
    } else {
        FFmpegError::Unknown(stderr.to_string())
    }
}
```

## 性能优化

### 多线程

```rust
// 使用所有可用核心
builder.add_option("-threads", "0");

// 或指定数量
let cpu_count = num_cpus::get();
builder.add_option("-threads", &cpu_count.to_string());
```

### 编码预设

```rust
pub enum EncodingPreset {
    UltraFast,  // 快速渲染，文件较大
    Fast,       // 速度和质量的平衡
    Medium,     // 默认
    Slow,       // 更好的质量，较慢
    VerySlow,   // 最高质量
}

impl EncodingPreset {
    pub fn to_ffmpeg_preset(&self) -> &'static str {
        match self {
            Self::UltraFast => "ultrafast",
            Self::Fast => "fast",
            Self::Medium => "medium",
            Self::Slow => "slow",
            Self::VerySlow => "veryslow",
        }
    }
}
```

### 流媒体优化

```rust
// 用于网络流媒体
builder
    .add_option("-movflags", "+faststart")
    .add_option("-pix_fmt", "yuv420p")
    .video_codec("libx264")
    .add_option("-profile:v", "baseline")
    .add_option("-level", "3.0");
```

## 进度监控

### 进度解析

```rust
pub fn parse_progress(line: &str) -> Option<Progress> {
    // frame=  123 fps=45.6 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1638.4kbits/s
    
    let time_regex = Regex::new(r"time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})").unwrap();
    
    if let Some(captures) = time_regex.captures(line) {
        let hours: f64 = captures[1].parse().unwrap_or(0.0);
        let minutes: f64 = captures[2].parse().unwrap_or(0.0);
        let seconds: f64 = captures[3].parse().unwrap_or(0.0);
        let centiseconds: f64 = captures[4].parse().unwrap_or(0.0);
        
        let current_time = hours * 3600.0 + minutes * 60.0 + seconds + centiseconds / 100.0;
        
        return Some(Progress {
            current_time,
            percent: current_time / total_duration,
        });
    }
    
    None
}
```

## 环境变量

- `FFMPEG_PATH=/custom/path` - 覆盖FFmpeg位置
- `FFMPEG_THREADS=8` - 线程数量
- `FFMPEG_LOGLEVEL=debug` - 日志级别

## 最佳实践

1. **输入验证** - 处理前验证文件
2. **资源管理** - 限制并行操作
3. **临时文件** - 使用唯一名称并在使用后清理
4. **日志记录** - 记录FFmpeg命令用于调试
5. **测试** - 在单元测试中模拟FFmpeg