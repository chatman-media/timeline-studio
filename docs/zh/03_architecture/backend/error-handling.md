# 错误处理指南

## 概述

Timeline Studio后端使用基于`VideoCompilerError`枚举的综合错误处理系统，提供详细的错误信息和恢复建议。

## 错误类型

### 核心错误类型 (`video_compiler/core/error.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCompilerError {
    // 验证和模式错误
    ValidationError(String),
    
    // FFmpeg相关
    FFmpegError {
        exit_code: Option<i32>,
        stderr: String,
        command: String,
    },
    
    // 依赖项
    DependencyMissing(String),
    
    // IO操作
    IoError(String),
    
    // 媒体处理
    MediaFileError { path: String, reason: String },
    UnsupportedFormat { format: String, file_path: String },
    
    // 渲染
    RenderError {
        job_id: String,
        stage: String,
        message: String,
    },
    
    // 预览生成
    PreviewError { timestamp: f64, reason: String },
    
    // 缓存操作
    CacheError(String),
    
    // 配置
    ConfigError(String),
    
    // 资源管理
    ResourceError {
        resource_type: String,
        available: String,
        required: String,
    },
    
    // 超时
    TimeoutError {
        operation: String,
        timeout_seconds: u64,
    },
    
    // 用户操作
    CancelledError(String),
    
    // GPU处理
    GpuError(String),
    GpuUnavailable(String),
    
    // 模板处理
    TemplateNotFound(String),
    
    // 无效参数
    InvalidParameter(String),
    
    // 未实现
    NotImplemented(String),
    
    // 路径验证
    InvalidPath(String),
    
    // 并发限制
    TooManyActiveJobs(String),
}
```

## 错误处理模式

### 1. 服务级错误处理

服务使用带有VideoCompilerError的Result<T>类型：

```rust
pub async fn generate_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // 输入验证
    if !video_path.exists() {
        return Err(VideoCompilerError::MediaFileError {
            path: video_path.to_string_lossy().to_string(),
            reason: "文件未找到".to_string(),
        });
    }
    
    // 带错误转换的处理
    let result = ffmpeg_operation().await
        .map_err(|e| VideoCompilerError::FFmpegError {
            exit_code: e.code(),
            stderr: e.stderr(),
            command: "generate_preview".to_string(),
        })?;
    
    Ok(result)
}
```

### 2. 命令级错误处理

命令将错误转换为用户友好的消息：

```rust
#[tauri::command]
pub async fn render_video(
    state: State<'_, VideoCompilerState>,
    project_id: String,
) -> Result<String> {
    match state.render_service.render(&project_id).await {
        Ok(job_id) => Ok(job_id),
        Err(e) => {
            log::error!("渲染失败: {}", e);
            match e {
                VideoCompilerError::TooManyActiveJobs(_) => {
                    Err("请等待当前渲染完成".into())
                }
                VideoCompilerError::MediaFileError { path, .. } => {
                    Err(format!("媒体文件缺失: {}", path).into())
                }
                _ => Err(format!("渲染失败: {}", e).into())
            }
        }
    }
}
```

### 3. FFmpeg错误处理

FFmpeg操作的特殊处理：

```rust
impl FFmpegExecutor {
    pub async fn execute(&self, command: Command) -> Result<FFmpegExecutionResult> {
        let output = command.output().await
            .map_err(|e| VideoCompilerError::DependencyMissing(
                format!("FFmpeg未找到: {}", e)
            ))?;
        
        if !output.status.success() {
            return Err(VideoCompilerError::FFmpegError {
                exit_code: output.status.code(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: format!("{:?}", command),
            });
        }
        
        Ok(FFmpegExecutionResult { ... })
    }
}
```

## 错误恢复策略

### 1. 自动重试

对于瞬态错误：

```rust
async fn with_retry<T, F>(
    operation: F,
    max_attempts: u32,
) -> Result<T>
where
    F: Fn() -> Future<Output = Result<T>>,
{
    let mut last_error = None;
    
    for attempt in 1..=max_attempts {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                log::warn!("尝试{}失败: {}", attempt, e);
                last_error = Some(e);
                
                // 只重试特定错误类型
                match &e {
                    VideoCompilerError::IoError(_) |
                    VideoCompilerError::TimeoutError { .. } => {
                        tokio::time::sleep(Duration::from_secs(attempt as u64)).await;
                    }
                    _ => break, // 不重试其他错误
                }
            }
        }
    }
    
    Err(last_error.unwrap())
}
```

### 2. 回退策略

对于预览生成：

```rust
async fn generate_preview_with_fallback(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // 尝试硬件加速
    match self.generate_hw_preview(video_path, timestamp).await {
        Ok(data) => return Ok(data),
        Err(VideoCompilerError::GpuUnavailable(_)) => {
            log::info!("GPU不可用，回退到软件渲染");
        }
        Err(e) => return Err(e),
    }
    
    // 回退到软件渲染
    self.generate_sw_preview(video_path, timestamp).await
}
```

### 3. 资源清理

确保错误时的清理：

```rust
pub async fn render_with_cleanup(
    &self,
    project: &ProjectSchema,
) -> Result<String> {
    let temp_dir = create_temp_dir().await?;
    
    let result = async {
        // 渲染操作
        render_internal(project, &temp_dir).await
    }.await;
    
    // 始终清理，即使出错
    if let Err(e) = remove_temp_dir(&temp_dir).await {
        log::warn!("清理临时目录失败: {}", e);
    }
    
    result
}
```

## 错误监控

错误由监控系统自动跟踪：

```rust
let tracker = self.metrics.start_operation("render");
match self.render_internal().await {
    Ok(result) => {
        tracker.complete().await;
        Ok(result)
    }
    Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[RenderService] 错误: {}", e);
        
        // 更新错误统计
        self.metrics.increment_error_count("render", &e);
        
        Err(e)
    }
}
```

## 最佳实践

### 1. 使用特定错误类型

优先使用特定错误变体而非通用错误：

```rust
// 好的做法
Err(VideoCompilerError::MediaFileError {
    path: video_path.to_string(),
    reason: "不支持的编解码器: h265".to_string(),
})

// 不好的做法
Err(VideoCompilerError::Unknown("处理视频失败".to_string()))
```

### 2. 包含上下文

始终在错误消息中提供上下文：

```rust
// 好的做法
Err(VideoCompilerError::RenderError {
    job_id: job_id.clone(),
    stage: "编码".to_string(),
    message: format!("编码片段失败 {} / {}", current, total),
})

// 不好的做法
Err(VideoCompilerError::RenderError {
    job_id: "".to_string(),
    stage: "".to_string(),
    message: "编码失败".to_string(),
})
```

### 3. 适当记录错误

使用适当的日志级别：

```rust
match operation().await {
    Ok(result) => Ok(result),
    Err(e) => {
        match &e {
            VideoCompilerError::CancelledError(_) => {
                log::info!("用户取消操作: {}", e);
            }
            VideoCompilerError::ValidationError(_) => {
                log::warn!("验证错误: {}", e);
            }
            VideoCompilerError::FFmpegError { .. } |
            VideoCompilerError::IoError(_) => {
                log::error!("严重错误: {}", e);
            }
            _ => {
                log::error!("意外错误: {}", e);
            }
        }
        Err(e)
    }
}
```

### 4. 用户友好的消息

在命令级别将技术错误转换为用户友好的消息：

```rust
fn user_message_for_error(error: &VideoCompilerError) -> String {
    match error {
        VideoCompilerError::DependencyMissing(_) => {
            "未安装必需的软件。请查看安装指南。".to_string()
        }
        VideoCompilerError::MediaFileError { path, .. } => {
            format!("无法访问媒体文件: {}", path.file_name().unwrap_or_default())
        }
        VideoCompilerError::ResourceError { resource_type, available, required } => {
            format!("{}不足: 可用{}, 需要{}", resource_type, available, required)
        }
        _ => "发生错误。请查看日志了解详情。".to_string()
    }
}
```

## 测试错误处理

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_missing_file_error() {
        let service = PreviewService::new();
        let result = service.generate_preview(
            Path::new("/nonexistent/file.mp4"),
            0.0
        ).await;
        
        assert!(matches!(
            result,
            Err(VideoCompilerError::MediaFileError { .. })
        ));
    }
    
    #[tokio::test]
    async fn test_invalid_timestamp_error() {
        let service = PreviewService::new();
        let result = service.generate_preview(
            Path::new("test.mp4"),
            -5.0  // 无效时间戳
        ).await;
        
        assert!(matches!(
            result,
            Err(VideoCompilerError::InvalidParameter(_))
        ));
    }
}
```

### 集成测试

测试错误在各层间的传播：

```rust
#[tokio::test]
async fn test_command_error_handling() {
    let state = create_test_state().await;
    
    // 使用无效项目进行测试
    let result = generate_preview_command(
        State(&state),
        "invalid_project_id".to_string(),
        0.0
    ).await;
    
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("项目未找到"));
}
```

## 常见错误场景

### 1. 媒体文件缺失

当项目引用已移动/删除的文件时：
- 使用MediaRestorationService搜索文件
- 提供包含原始路径的清晰错误消息
- 提供使用新路径更新项目的选项

### 2. FFmpeg失败

常见FFmpeg错误及其处理：
- 缺少编解码器：建议安装说明
- 无效参数：执行前验证
- 内存不足：降低质量/分辨率设置

### 3. 资源耗尽

处理系统限制：
- 磁盘空间：渲染前检查
- 内存：监控并限制并发操作
- GPU：回退到CPU处理

### 4. 并发限制

防止系统过载：
- 将多余操作排队
- 提供队列位置反馈
- 允许操作取消

## 未来改进

1. **错误恢复数据库**：存储常见错误及其解决方案
2. **自动错误报告**：可选的错误跟踪遥测
3. **智能重试逻辑**：基于错误模式的ML重试决策
4. **错误聚合**：将相似错误分组进行批量解决
5. **自我修复**：自动修复常见问题（缓存清理、临时文件删除）