# Архитектура сервисного слоя

## Обзор

Сервисный слой Timeline Studio обеспечивает чистое разделение бизнес-логики от слоя команд Tauri, улучшая тестируемость, поддерживаемость и расширяемость.

## Выполненные задачи

### 1. Интеграция сервисного слоя ✅
Успешно подключены все методы сервисов к командам Tauri и решены все ошибки компиляции.

### 2. Интеграция FFmpeg ✅
- Создан `ffmpeg_builder/advanced.rs` с расширенными операциями FFmpeg:
  - `build_thumbnails_command` - Генерация миниатюр видео
  - `build_video_preview_command` - Создание коротких превью клипов
  - `build_waveform_command` - Генерация аудио волновых форм
  - `build_gif_preview_command` - Создание анимированных GIF превью
  - `build_concat_command` - Объединение видео сегментов
  - `build_filter_preview_command` - Применение и предпросмотр фильтров
  - `build_probe_command` - Извлечение метаданных медиа
  - `build_hwaccel_test_command` - Тестирование аппаратного ускорения
  - `build_subtitle_preview_command` - Превью с субтитрами

- Создан `ffmpeg_executor.rs` для выполнения команд:
  - Отслеживание прогресса в реальном времени с парсингом regex
  - Структурированная обработка ошибок
  - Поддержка простого и отслеживаемого выполнения
  - Вспомогательные функции для обнаружения кодеков/форматов

### 3. Улучшения кеша ✅
- Добавлены методы в RenderCache для управления проектами:
  - `get_cached_projects()` - Получить список кешированных проектов
  - `has_project_cache()` - Проверить наличие кеша проекта
  - `get_all_cached_metadata()` - Получить все кешированные метаданные медиа
  - `set_cache_limits()` - Установить лимиты размера кеша
  - `get_cache_limits()` - Получить текущие лимиты кеша

### 4. Генерация превью ✅
- Реализован `generate_frame()` в PreviewService:
  - Находит активный клип на указанной временной метке
  - Генерирует кадр из видеофайла
  - Возвращает черный кадр, если нет активного клипа
  
- Реализован `generate_preview_batch_for_file()`:
  - Генерирует несколько кадров из видеофайла
  - Возвращает массив данных изображений

### 5. Расширенные метрики мониторинга ✅
- Создан `commands/advanced_metrics.rs` с комплексным мониторингом:
  - Метрики производительности кеша (частота попаданий, время отклика, фрагментация)
  - Метрики использования GPU (использование памяти, вычислений, температура)
  - Разбивка использования памяти по компонентам
  - Статистика конвейера (обработанные кадры, ошибки, глубина очередей)
  - Метрики производительности сервисов
  - Система оповещений с настраиваемыми порогами
  - Экспорт в формат Prometheus

## Преимущества архитектуры

1. **Чистое разделение**: Команды → Сервисы → Основная логика
2. **Тестируемость**: Сервисы могут быть замокированы для тестирования
3. **Поддерживаемость**: Бизнес-логика отделена от слоя Tauri
4. **Расширяемость**: Легко добавлять новые сервисы и методы

## Структура сервисов

### Базовая структура сервиса

```rust
pub struct MyService {
    // Зависимости
    cache: Arc<RwLock<Cache>>,
    metrics: Arc<ServiceMetrics>,
}

impl MyService {
    pub fn new(cache: Arc<RwLock<Cache>>) -> Self {
        Self {
            cache,
            metrics: Arc::new(ServiceMetrics::new("my-service")),
        }
    }
    
    pub async fn do_operation(&self) -> Result<Output> {
        let tracker = self.metrics.start_operation("do_operation");
        
        match self.internal_operation().await {
            Ok(result) => {
                tracker.complete().await;
                Ok(result)
            }
            Err(e) => {
                tracker.fail(e.to_string()).await;
                Err(e)
            }
        }
    }
}
```

### Контейнер сервисов

```rust
pub struct ServiceContainer {
    pub render_service: RenderService,
    pub preview_service: PreviewService,
    pub cache_service: CacheService,
    pub project_service: ProjectService,
    pub media_service: MediaService,
    pub metrics: ServiceMetricsContainer,
}
```

## Ключевые изменённые файлы

- `/src/video_compiler/core/cache.rs` - Добавлены методы кеша проектов
- `/src/video_compiler/commands/cache.rs` - Реализованы все команды кеша
- `/src/video_compiler/commands/preview.rs` - Улучшена генерация превью
- `/src/video_compiler/services/preview_service.rs` - Реализована генерация кадров
- `/src/video_compiler/services/monitoring.rs` - Система мониторинга

## Паттерны проектирования

### Dependency Injection

```rust
impl ServiceContainer {
    pub fn new() -> Self {
        let cache = Arc::new(RwLock::new(RenderCache::new()));
        let metrics = ServiceMetricsContainer::new();
        
        Self {
            render_service: RenderService::new(cache.clone()),
            preview_service: PreviewService::new(cache.clone()),
            cache_service: CacheService::new(cache.clone()),
            // ...
            metrics,
        }
    }
}
```

### Async/Await паттерн

```rust
pub async fn complex_operation(&self) -> Result<Output> {
    // Параллельное выполнение
    let (result1, result2) = tokio::join!(
        self.operation1(),
        self.operation2()
    );
    
    // Обработка результатов
    combine_results(result1?, result2?)
}
```

### Обработка ошибок

```rust
pub async fn safe_operation(&self) -> Result<Output> {
    self.validate_input()?;
    
    let result = self.risky_operation().await
        .map_err(|e| VideoCompilerError::OperationFailed(e.to_string()))?;
    
    self.validate_output(&result)?;
    
    Ok(result)
}
```

## Следующие шаги

### Высокий приоритет
1. **Обработка ошибок** - Добавить комплексную обработку ошибок и восстановление
2. **Логирование** - Добавить структурированное логирование во всем сервисном слое

### Средний приоритет
1. **Модульные тесты** - Написать тесты для реализаций сервисов
2. **Интеграционные тесты** - Написать тесты для командного слоя
3. **Оптимизация производительности** - Оптимизировать кеш и генерацию превью

### Низкий приоритет
1. **Документация** - Добавить встроенную документацию для всех публичных API
2. **Метрики** - Расширить метрики производительности и мониторинг

## Итоги

Рефакторинг backend успешно завершен со всей основной функциональностью. Архитектура сервисного слоя обеспечивает прочную основу для будущих улучшений и делает кодовую базу более поддерживаемой и тестируемой.