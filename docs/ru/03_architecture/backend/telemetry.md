# Telemetry System / Система телеметрии

> **⚠️ ВАЖНО:** Для логирования в Timeline Studio используйте **TauriLogger**, а не console.*
> См. [TauriLogger Руководство](./telemetry-tauri-logger.md) для полной документации.

Комплексная система мониторинга, метрик и трейсинга Timeline Studio с поддержкой OpenTelemetry стандартов для наблюдения за производительностью и здоровьем приложения.

## 📋 Обзор

Система телеметрии Timeline Studio предоставляет comprehensive мониторинг всех аспектов работы приложения - от производительности видео обработки до использования системных ресурсов. Построена на OpenTelemetry стандартах для максимальной совместимости и гибкости.

### 🎯 Основные возможности

- **OpenTelemetry интеграция** - стандартные метрики, трейсы и логи
- **Real-time мониторинг** - мгновенные updates статуса системы
- **Health checks** - автоматические проверки состояния сервисов
- **Performance tracking** - детальная аналитика производительности
- **Export в различные backend'ы** - Prometheus, Jaeger, Grafana и др.
- **Comprehensive testing** - 61 unit тест с полным покрытием (98%)

## 📁 Структура документации

### Настройка и конфигурация
- [**Configuration Guide**](configuration.md) - Настройка системы телеметрии
- [**Installation Guide**](installation.md) - Установка и интеграция
- [**Environment Setup**](environment.md) - Настройка окружения для dev/prod

### Мониторинг и наблюдение
- [**Monitoring Setup**](monitoring.md) - Настройка мониторинга в production
- [**Dashboards**](dashboards.md) - Готовые dashboard'ы для Grafana
- [**Alerting Rules**](alerting.md) - Правила алертов и уведомлений

### Разработка и интеграция
- [**OpenTelemetry Guide**](opentelemetry.md) - Работа с OpenTelemetry
- [**Custom Metrics**](custom-metrics.md) - Создание пользовательских метрик
- [**Distributed Tracing**](tracing.md) - Настройка distributed tracing

### Troubleshooting и оптимизация
- [**Performance Analysis**](performance-analysis.md) - Анализ производительности
- [**Troubleshooting Guide**](troubleshooting.md) - Решение проблем
- [**Best Practices**](best-practices.md) - Лучшие практики

## 🚀 Быстрый старт

### 1. Базовая настройка

```rust
use timeline_studio::core::telemetry::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Создание конфигурации
    let config = TelemetryConfig {
        enabled: true,
        service_name: "timeline-studio".to_string(),
        service_version: "1.0.0".to_string(),
        
        tracing: TracingConfig {
            enabled: true,
            sample_rate: 0.1,  // 10% трейсов
            exporters: vec![
                TracingExporter::Console,
                TracingExporter::Jaeger { 
                    endpoint: "http://localhost:14268/api/traces".to_string() 
                },
            ],
            ..Default::default()
        },
        
        metrics: MetricsConfig {
            enabled: true,
            collection_interval: Duration::from_secs(10),
            exporters: vec![
                MetricsExporter::Prometheus { port: 9090 },
                MetricsExporter::Console,
            ],
            ..Default::default()
        },
        
        health: HealthConfig {
            enabled: true,
            check_interval: Duration::from_secs(30),
            cache_ttl: Duration::from_secs(60),
            default_timeout: Duration::from_secs(5),
        },
    };
    
    // Инициализация телеметрии
    let telemetry = TelemetryManager::new(config).await?;
    telemetry.initialize().await?;
    
    // Ваше приложение здесь...
    
    Ok(())
}
```

### 2. Сбор метрик

```rust
use timeline_studio::core::telemetry::Metrics;

async fn example_video_processing(metrics: Arc<Metrics>) -> Result<()> {
    // Счетчик обработанных видео
    metrics.increment_counter("videos_processed_total", 1).await?;
    
    // Текущее использование памяти
    let memory_usage = get_memory_usage();
    metrics.set_gauge("memory_usage_bytes", memory_usage as f64).await?;
    
    // Время обработки кадра
    let start = Instant::now();
    process_video_frame().await?;
    let duration = start.elapsed().as_millis() as f64;
    
    metrics.record_histogram("frame_processing_duration_ms", duration).await?;
    
    // Метрики с атрибутами для детализации
    metrics.increment_counter_with_attributes(
        "api_requests_total",
        1,
        vec![("method", "POST"), ("endpoint", "/render"), ("status", "success")]
    ).await?;
    
    Ok(())
}
```

### 3. Health Checks

```rust
use timeline_studio::core::telemetry::{HealthCheckManager, HealthCheck, HealthStatus, HealthCheckResult};

// Создание custom health check
struct DatabaseHealthCheck {
    connection_pool: Arc<DbPool>,
}

#[async_trait]
impl HealthCheck for DatabaseHealthCheck {
    fn name(&self) -> &str { "database" }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        match self.connection_pool.get_connection().await {
            Ok(_) => HealthCheckResult {
                status: HealthStatus::Healthy,
                message: "Database connection successful".to_string(),
                timestamp: SystemTime::now(),
                check_duration: start.elapsed(),
                metadata: HashMap::new(),
            },
            Err(e) => HealthCheckResult {
                status: HealthStatus::Unhealthy,
                message: format!("Database connection failed: {}", e),
                timestamp: SystemTime::now(),
                check_duration: start.elapsed(),
                metadata: HashMap::new(),
            }
        }
    }
}

// Настройка health checks
async fn setup_health_checks() -> Result<()> {
    let health_manager = HealthCheckManager::new();
    
    // Добавление предустановленных проверок
    health_manager.add_check(Box::new(DatabaseHealthCheck::new(db_pool))).await;
    health_manager.add_check(Box::new(DiskSpaceHealthCheck::new("/tmp", 0.9))).await;
    health_manager.add_check(Box::new(MemoryHealthCheck::new(0.8))).await;
    
    // Настройка интервалов
    health_manager.set_cache_ttl(Duration::from_secs(60));
    health_manager.set_default_timeout(Duration::from_secs(10));
    
    // Запуск периодических проверок
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            if let Err(e) = health_manager.check_all().await {
                log::error!("Health check failed: {:?}", e);
            }
        }
    });
    
    Ok(())
}
```

### 4. Distributed Tracing

```rust
use timeline_studio::core::telemetry::Tracer;

async fn example_traced_operation(tracer: Arc<Tracer>) -> Result<()> {
    // Автоматический трейсинг
    tracer.trace_async("video_render_pipeline", |span| async move {
        span.set_attribute("video_id", "12345");
        span.set_attribute("resolution", "1920x1080");
        span.set_attribute("codec", "h264");
        
        // Этап 1: Подготовка
        span.add_event("preparation_started");
        prepare_video_data().await?;
        span.add_event("preparation_completed");
        
        // Этап 2: Рендеринг с child span
        let render_result = tracer.trace_async("video_render", |render_span| async move {
            render_span.set_attribute("frames_count", "3600");
            render_span.set_attribute("target_fps", "30");
            
            render_video_frames().await
        }).await?;
        
        // Этап 3: Финализация
        span.add_event("finalization_started");
        finalize_video(render_result).await?;
        span.add_event("finalization_completed");
        
        Ok(())
    }).await
}

// Ручное управление spans для complex сценариев
async fn manual_tracing_example(tracer: Arc<Tracer>) -> Result<()> {
    let main_span = tracer.span_builder("complex_video_operation")
        .with_attribute("operation_type", "batch_processing")
        .with_attribute("batch_size", "50")
        .start(&tracer);
    
    for i in 0..50 {
        let item_span = tracer.span_builder(&format!("process_item_{}", i))
            .with_attribute("item_index", &i.to_string())
            .with_parent(&main_span)
            .start(&tracer);
        
        match process_single_item(i).await {
            Ok(result) => {
                item_span.set_attribute("result_size", &result.len().to_string());
                item_span.add_event("processing_successful");
            },
            Err(e) => {
                item_span.set_attribute("error", &e.to_string());
                item_span.add_event("processing_failed");
            }
        }
        
        item_span.end();
    }
    
    main_span.end();
    Ok(())
}
```

## 📊 Предустановленные метрики

### Системные метрики
```rust
// Автоматически собираются каждые 10 секунд
system_cpu_usage_percent          // Использование CPU (%)
system_memory_usage_bytes         // Использование памяти (bytes) 
system_memory_available_bytes     // Доступная память (bytes)
system_disk_usage_bytes          // Использование диска (bytes)
system_disk_available_bytes      // Свободное место (bytes)
system_network_bytes_sent        // Отправлено по сети (bytes)
system_network_bytes_received    // Получено по сети (bytes)
```

### Приложение метрики
```rust
// Производительность видео обработки
video_processing_duration_ms     // Время обработки видео (ms)
frame_processing_duration_ms     // Время обработки кадра (ms)
frames_processed_total           // Общее количество обработанных кадров
videos_processed_total           // Общее количество обработанных видео
encoding_speed_fps               // Скорость кодирования (fps)

// API и запросы
api_requests_total               // Общее количество API запросов
api_request_duration_ms          // Длительность API запросов (ms)
api_errors_total                 // Общее количество ошибок API

// Кэш статистика
cache_hits_total                 // Попадания в кэш
cache_misses_total               // Промахи кэша
cache_evictions_total            // Вытеснения из кэша
cache_size_bytes                 // Размер кэша (bytes)

// Runtime метрики
worker_pool_utilization          // Загрузка worker pools (0-1)
tasks_executed_total             // Выполненные задачи
tasks_failed_total               // Неудачные задачи
queue_size                       // Размер очередей задач
```

### Health статусы
```rust
// Общий статус системы
system_health_status             // 0=Unknown, 1=Healthy, 2=Warning, 3=Unhealthy

// Компонентные проверки
database_health_status           // Состояние базы данных
disk_space_health_status         // Свободное место на диске
memory_health_status             // Доступная память
external_api_health_status       // Доступность внешних API
ffmpeg_health_status             // Доступность FFmpeg
```

## 🔧 Конфигурация для разных окружений

### Development окружение
```json
{
  "telemetry": {
    "enabled": true,
    "service_name": "timeline-studio-dev",
    "service_version": "dev-build",
    
    "tracing": {
      "enabled": true,
      "sample_rate": 1.0,
      "max_attributes_per_span": 128,
      "max_events_per_span": 256,
      "exporters": [
        {"Console": {}},
        {"File": {"path": "./logs/traces.json"}}
      ]
    },
    
    "metrics": {
      "enabled": true,
      "collection_interval": "5s",
      "retention_period": "1h",
      "exporters": [
        {"Console": {}},
        {"File": {"path": "./logs/metrics.json"}}
      ]
    },
    
    "health": {
      "enabled": true,
      "check_interval": "10s",
      "cache_ttl": "30s",
      "default_timeout": "2s"
    }
  }
}
```

### Production окружение
```json
{
  "telemetry": {
    "enabled": true,
    "service_name": "timeline-studio",
    "service_version": "1.0.0",
    
    "tracing": {
      "enabled": true,
      "sample_rate": 0.01,
      "max_attributes_per_span": 32,
      "max_events_per_span": 64,
      "exporters": [
        {
          "Jaeger": {
            "endpoint": "http://jaeger-collector:14268/api/traces"
          }
        }
      ]
    },
    
    "metrics": {
      "enabled": true,
      "collection_interval": "15s",
      "retention_period": "24h",
      "exporters": [
        {
          "Prometheus": {
            "port": 9090,
            "path": "/metrics"
          }
        }
      ]
    },
    
    "health": {
      "enabled": true,
      "check_interval": "30s",
      "cache_ttl": "60s",
      "default_timeout": "5s"
    }
  }
}
```

### High-load окружение
```json
{
  "telemetry": {
    "enabled": true,
    "service_name": "timeline-studio-cluster",
    "service_version": "1.0.0",
    
    "tracing": {
      "enabled": true,
      "sample_rate": 0.001,
      "max_attributes_per_span": 16,
      "max_events_per_span": 32,
      "batch_export": {
        "max_batch_size": 1000,
        "max_export_timeout": "10s",
        "export_interval": "30s"
      },
      "exporters": [
        {
          "Jaeger": {
            "endpoint": "http://jaeger-cluster:14268/api/traces",
            "compression": "gzip"
          }
        }
      ]
    },
    
    "metrics": {
      "enabled": true,
      "collection_interval": "30s",
      "retention_period": "7d",
      "aggregation": {
        "histogram_buckets": [0.001, 0.01, 0.1, 1, 10, 100, 1000],
        "summary_quantiles": [0.5, 0.9, 0.95, 0.99]
      },
      "exporters": [
        {
          "Prometheus": {
            "port": 9090,
            "path": "/metrics",
            "enable_compression": true
          }
        }
      ]
    },
    
    "health": {
      "enabled": true,
      "check_interval": "60s",
      "cache_ttl": "120s",
      "default_timeout": "10s",
      "parallel_checks": true
    }
  }
}
```

## 📈 Интеграции

### Prometheus + Grafana

```yaml
# docker-compose.yml для monitoring stack
version: '3.8'
services:
  timeline-studio:
    image: timeline-studio:latest
    ports:
      - "3000:3000"
      - "9090:9090"  # Prometheus метрики
    environment:
      - TELEMETRY_ENABLED=true
      - PROMETHEUS_PORT=9090
    
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  grafana-storage:
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'timeline-studio'
    static_configs:
      - targets: ['timeline-studio:9090']
    scrape_interval: 10s
    metrics_path: '/metrics'
    
rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Jaeger для трейсинга

```yaml
# docker-compose для Jaeger
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"   # Jaeger UI
      - "14268:14268"   # HTTP collector
      - "14250:14250"   # gRPC collector
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=memory
```

### ELK Stack для логов

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.4.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      
  logstash:
    image: docker.elastic.co/logstash/logstash:8.4.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
      
  kibana:
    image: docker.elastic.co/kibana/kibana:8.4.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## 🚨 Алерты и уведомления

### Prometheus Alert Rules

```yaml
# alert_rules.yml
groups:
  - name: timeline-studio-alerts
    rules:
      # Высокое использование CPU
      - alert: HighCPUUsage
        expr: system_cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ $value }}% for more than 5 minutes"
          
      # Низкая скорость обработки видео
      - alert: SlowVideoProcessing
        expr: rate(video_processing_duration_ms_sum[5m]) / rate(video_processing_duration_ms_count[5m]) > 30000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Slow video processing detected"
          description: "Average video processing time is {{ $value }}ms"
          
      # Высокий процент ошибок API
      - alert: HighAPIErrorRate
        expr: rate(api_errors_total[5m]) / rate(api_requests_total[5m]) > 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"
          description: "API error rate is {{ $value | humanizePercentage }}"
          
      # Переполнение диска
      - alert: DiskSpaceLow
        expr: (system_disk_available_bytes / system_disk_usage_bytes) < 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk space running low"
          description: "Less than 10% disk space remaining"
          
      # Unhealthy сервисы
      - alert: ServiceUnhealthy
        expr: system_health_status == 3
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Service is unhealthy"
          description: "Health check indicates service is in unhealthy state"
```

### Настройка уведомлений

```rust
// Интеграция с системой алертов
use timeline_studio::core::telemetry::{AlertManager, AlertRule, AlertSeverity};

async fn setup_alerting() -> Result<()> {
    let alert_manager = AlertManager::new();
    
    // Правило для мониторинга производительности
    alert_manager.add_rule(AlertRule {
        name: "slow_video_processing".to_string(),
        condition: "video_processing_duration_ms_avg > 30000".to_string(),
        severity: AlertSeverity::Warning,
        description: "Video processing is taking too long".to_string(),
        cooldown: Duration::from_minutes(5),
        actions: vec![
            AlertAction::Email {
                recipients: vec!["admin@timeline-studio.com".to_string()],
                subject: "Performance Alert: Slow Video Processing".to_string(),
            },
            AlertAction::Webhook {
                url: "https://hooks.slack.com/services/...".to_string(),
                payload: serde_json::json!({
                    "text": "🚨 Video processing performance degraded",
                    "channel": "#alerts"
                }),
            },
        ],
    }).await?;
    
    // Правило для мониторинга ошибок
    alert_manager.add_rule(AlertRule {
        name: "high_error_rate".to_string(),
        condition: "api_errors_rate_5m > 0.1".to_string(),
        severity: AlertSeverity::Critical,
        description: "API error rate is too high".to_string(),
        cooldown: Duration::from_minutes(1),
        actions: vec![
            AlertAction::PagerDuty {
                service_key: "your-pagerduty-key".to_string(),
                description: "Critical: High API error rate in Timeline Studio".to_string(),
            },
        ],
    }).await?;
    
    Ok(())
}
```

## 🔍 Troubleshooting

### Общие проблемы

#### Высокое потребление памяти
```bash
# Проверка метрик памяти
curl http://localhost:9090/metrics | grep memory

# Анализ через Grafana query
sum(rate(memory_usage_bytes[5m])) by (component)

# Поиск memory leaks в трейсах
# Jaeger UI -> Service: timeline-studio -> Operation: memory_allocation
```

#### Медленная обработка видео
```bash
# Анализ производительности через метрики
curl http://localhost:9090/metrics | grep video_processing_duration

# Детальный анализ через трейсы
# Jaeger UI -> поиск spans с duration > 30s
```

#### Проблемы с экспортом метрик
```rust
// Проверка статуса экспорта
let telemetry = TelemetryManager::get_instance();
let export_status = telemetry.get_export_status().await;

for (exporter, status) in export_status {
    match status {
        ExportStatus::Healthy => println!("{} exporter is working", exporter),
        ExportStatus::Failed(error) => println!("{} exporter failed: {}", exporter, error),
        ExportStatus::Degraded(warning) => println!("{} exporter degraded: {}", exporter, warning),
    }
}
```

### Debugging трейсов

```rust
// Включение debug уровня для трейсинга
let config = TelemetryConfig {
    tracing: TracingConfig {
        enabled: true,
        sample_rate: 1.0,  // 100% для debugging
        debug_mode: true,
        log_spans: true,
        exporters: vec![
            TracingExporter::Console,  // Вывод в консоль для debug
            TracingExporter::File { path: "./debug_traces.json".to_string() },
        ],
        ..Default::default()
    },
    ..Default::default()
};

// Детальное логирование для конкретных операций
tracer.trace_async("debug_video_processing", |span| async move {
    span.set_attribute("debug", "true");
    span.set_attribute("input_file_size", &file_size.to_string());
    
    // Детальные события для каждого этапа
    span.add_event("input_validation_start");
    validate_input().await?;
    span.add_event("input_validation_end");
    
    span.add_event("preprocessing_start");
    let preprocessed = preprocess_video().await?;
    span.add_event("preprocessing_end");
    span.set_attribute("preprocessed_frames", &preprocessed.frame_count.to_string());
    
    span.add_event("encoding_start");
    let encoded = encode_video(preprocessed).await?;
    span.add_event("encoding_end");
    span.set_attribute("output_size", &encoded.size.to_string());
    
    Ok(encoded)
}).await
```

## 🔗 Связанные разделы

- [**Backend Architecture**](../02-architecture/backend.md) - Архитектура backend
- [**Performance Optimization**](../08-roadmap/planned/performance-optimization.md) - Оптимизация производительности
- [**Backend Testing**](../08-roadmap/in-progress/backend-testing-architecture.md) - Тестирование backend
- [**Development Commands**](../05-development/development-commands.md) - Команды разработки

---

*Последнее обновление: 24 июня 2025*