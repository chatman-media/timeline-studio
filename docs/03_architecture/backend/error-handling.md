# Руководство по обработке ошибок

## Обзор

Backend Timeline Studio использует комплексную систему обработки ошибок на основе перечисления `VideoCompilerError`, предоставляющую детальную информацию об ошибках и рекомендации по восстановлению.

## Типы ошибок

### Основные типы ошибок (`video_compiler/core/error.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCompilerError {
    // Ошибки валидации и схемы
    ValidationError(String),
    
    // Связанные с FFmpeg
    FFmpegError {
        exit_code: Option<i32>,
        stderr: String,
        command: String,
    },
    
    // Зависимости
    DependencyMissing(String),
    
    // Операции ввода-вывода
    IoError(String),
    
    // Обработка медиа
    MediaFileError { path: String, reason: String },
    UnsupportedFormat { format: String, file_path: String },
    
    // Рендеринг
    RenderError {
        job_id: String,
        stage: String,
        message: String,
    },
    
    // Генерация превью
    PreviewError { timestamp: f64, reason: String },
    
    // Операции с кешем
    CacheError(String),
    
    // Конфигурация
    ConfigError(String),
    
    // Управление ресурсами
    ResourceError {
        resource_type: String,
        available: String,
        required: String,
    },
    
    // Таймауты
    TimeoutError {
        operation: String,
        timeout_seconds: u64,
    },
    
    // Действия пользователя
    CancelledError(String),
    
    // Обработка на GPU
    GpuError(String),
    GpuUnavailable(String),
    
    // Обработка шаблонов
    TemplateNotFound(String),
    
    // Неверные параметры
    InvalidParameter(String),
    
    // Не реализовано
    NotImplemented(String),
    
    // Валидация путей
    InvalidPath(String),
    
    // Ограничения параллелизма
    TooManyActiveJobs(String),
}
```

## Паттерны обработки ошибок

### 1. Обработка ошибок на уровне сервисов

Сервисы используют тип Result<T> с VideoCompilerError:

```rust
pub async fn generate_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // Валидация входных данных
    if !video_path.exists() {
        return Err(VideoCompilerError::MediaFileError {
            path: video_path.to_string_lossy().to_string(),
            reason: "Файл не найден".to_string(),
        });
    }
    
    // Обработка с преобразованием ошибок
    let result = ffmpeg_operation().await
        .map_err(|e| VideoCompilerError::FFmpegError {
            exit_code: e.code(),
            stderr: e.stderr(),
            command: "generate_preview".to_string(),
        })?;
    
    Ok(result)
}
```

### 2. Обработка ошибок на уровне команд

Команды преобразуют ошибки в понятные пользователю сообщения:

```rust
#[tauri::command]
pub async fn render_video(
    state: State<'_, VideoCompilerState>,
    project_id: String,
) -> Result<String> {
    match state.render_service.render(&project_id).await {
        Ok(job_id) => Ok(job_id),
        Err(e) => {
            log::error!("Рендеринг не удался: {}", e);
            match e {
                VideoCompilerError::TooManyActiveJobs(_) => {
                    Err("Пожалуйста, дождитесь завершения текущих рендеров".into())
                }
                VideoCompilerError::MediaFileError { path, .. } => {
                    Err(format!("Медиафайл отсутствует: {}", path).into())
                }
                _ => Err(format!("Рендеринг не удался: {}", e).into())
            }
        }
    }
}
```

### 3. Обработка ошибок FFmpeg

Специальная обработка для операций FFmpeg:

```rust
impl FFmpegExecutor {
    pub async fn execute(&self, command: Command) -> Result<FFmpegExecutionResult> {
        let output = command.output().await
            .map_err(|e| VideoCompilerError::DependencyMissing(
                format!("FFmpeg не найден: {}", e)
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

## Стратегии восстановления после ошибок

### 1. Автоматический повтор

Для временных ошибок:

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
                log::warn!("Попытка {} не удалась: {}", attempt, e);
                last_error = Some(e);
                
                // Повторяем только определенные типы ошибок
                match &e {
                    VideoCompilerError::IoError(_) |
                    VideoCompilerError::TimeoutError { .. } => {
                        tokio::time::sleep(Duration::from_secs(attempt as u64)).await;
                    }
                    _ => break, // Не повторяем другие ошибки
                }
            }
        }
    }
    
    Err(last_error.unwrap())
}
```

### 2. Резервные стратегии

Для генерации превью:

```rust
async fn generate_preview_with_fallback(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // Пробуем аппаратное ускорение
    match self.generate_hw_preview(video_path, timestamp).await {
        Ok(data) => return Ok(data),
        Err(VideoCompilerError::GpuUnavailable(_)) => {
            log::info!("GPU недоступен, переключаемся на программный рендеринг");
        }
        Err(e) => return Err(e),
    }
    
    // Переключаемся на программный рендеринг
    self.generate_sw_preview(video_path, timestamp).await
}
```

### 3. Очистка ресурсов

Гарантируем очистку при ошибках:

```rust
pub async fn render_with_cleanup(
    &self,
    project: &ProjectSchema,
) -> Result<String> {
    let temp_dir = create_temp_dir().await?;
    
    let result = async {
        // Операции рендеринга
        render_internal(project, &temp_dir).await
    }.await;
    
    // Всегда очищаем, даже при ошибке
    if let Err(e) = remove_temp_dir(&temp_dir).await {
        log::warn!("Не удалось очистить временную директорию: {}", e);
    }
    
    result
}
```

## Мониторинг ошибок

Ошибки автоматически отслеживаются системой мониторинга:

```rust
let tracker = self.metrics.start_operation("render");
match self.render_internal().await {
    Ok(result) => {
        tracker.complete().await;
        Ok(result)
    }
    Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[RenderService] Ошибка: {}", e);
        
        // Обновляем статистику ошибок
        self.metrics.increment_error_count("render", &e);
        
        Err(e)
    }
}
```

## Лучшие практики

### 1. Используйте конкретные типы ошибок

Предпочитайте конкретные варианты ошибок общим:

```rust
// Хорошо
Err(VideoCompilerError::MediaFileError {
    path: video_path.to_string(),
    reason: "Неподдерживаемый кодек: h265".to_string(),
})

// Плохо
Err(VideoCompilerError::Unknown("Не удалось обработать видео".to_string()))
```

### 2. Включайте контекст

Всегда предоставляйте контекст в сообщениях об ошибках:

```rust
// Хорошо
Err(VideoCompilerError::RenderError {
    job_id: job_id.clone(),
    stage: "кодирование".to_string(),
    message: format!("Не удалось закодировать сегмент {} из {}", current, total),
})

// Плохо
Err(VideoCompilerError::RenderError {
    job_id: "".to_string(),
    stage: "".to_string(),
    message: "Кодирование не удалось".to_string(),
})
```

### 3. Логируйте ошибки правильно

Используйте подходящие уровни логирования:

```rust
match operation().await {
    Ok(result) => Ok(result),
    Err(e) => {
        match &e {
            VideoCompilerError::CancelledError(_) => {
                log::info!("Операция отменена пользователем: {}", e);
            }
            VideoCompilerError::ValidationError(_) => {
                log::warn!("Ошибка валидации: {}", e);
            }
            VideoCompilerError::FFmpegError { .. } |
            VideoCompilerError::IoError(_) => {
                log::error!("Критическая ошибка: {}", e);
            }
            _ => {
                log::error!("Неожиданная ошибка: {}", e);
            }
        }
        Err(e)
    }
}
```

### 4. Понятные сообщения для пользователей

Преобразуйте технические ошибки в понятные сообщения на уровне команд:

```rust
fn user_message_for_error(error: &VideoCompilerError) -> String {
    match error {
        VideoCompilerError::DependencyMissing(_) => {
            "Необходимое ПО не установлено. Пожалуйста, проверьте руководство по установке.".to_string()
        }
        VideoCompilerError::MediaFileError { path, .. } => {
            format!("Не удается получить доступ к медиафайлу: {}", path.file_name().unwrap_or_default())
        }
        VideoCompilerError::ResourceError { resource_type, available, required } => {
            format!("Недостаточно {}: {} доступно, {} требуется", resource_type, available, required)
        }
        _ => "Произошла ошибка. Пожалуйста, проверьте логи для получения подробностей.".to_string()
    }
}
```

## Тестирование обработки ошибок

### Модульные тесты

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_missing_file_error() {
        let service = PreviewService::new();
        let result = service.generate_preview(
            Path::new("/несуществующий/файл.mp4"),
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
            -5.0  // Неверная метка времени
        ).await;
        
        assert!(matches!(
            result,
            Err(VideoCompilerError::InvalidParameter(_))
        ));
    }
}
```

### Интеграционные тесты

Тестирование распространения ошибок через слои:

```rust
#[tokio::test]
async fn test_command_error_handling() {
    let state = create_test_state().await;
    
    // Тестируем с невалидным проектом
    let result = generate_preview_command(
        State(&state),
        "invalid_project_id".to_string(),
        0.0
    ).await;
    
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Проект не найден"));
}
```

## Распространенные сценарии ошибок

### 1. Отсутствующие медиафайлы

Когда проект ссылается на перемещенные/удаленные файлы:
- Используйте MediaRestorationService для поиска файлов
- Предоставляйте четкие сообщения об ошибках с исходными путями
- Предлагайте обновить проект с новыми путями

### 2. Сбои FFmpeg

Распространенные ошибки FFmpeg и их обработка:
- Отсутствующие кодеки: предложите инструкции по установке
- Неверные параметры: валидируйте перед выполнением
- Недостаток памяти: уменьшите настройки качества/разрешения

### 3. Исчерпание ресурсов

Обработка системных ограничений:
- Дисковое пространство: проверяйте перед рендерингом
- Память: мониторьте и ограничивайте параллельные операции
- GPU: переключайтесь на обработку CPU

### 4. Ограничения параллельных операций

Предотвращение перегрузки системы:
- Ставьте избыточные операции в очередь
- Предоставляйте обратную связь о позиции в очереди
- Разрешайте отмену операций

## Будущие улучшения

1. **База данных восстановления после ошибок**: Хранение распространенных ошибок и их решений
2. **Автоматическая отправка отчетов об ошибках**: Телеметрия с согласия для отслеживания ошибок
3. **Умная логика повторов**: Решения о повторах на основе ML и паттернов ошибок
4. **Агрегация ошибок**: Группировка похожих ошибок для пакетного решения
5. **Самовосстановление**: Автоматические исправления распространенных проблем (очистка кеша, удаление временных файлов)