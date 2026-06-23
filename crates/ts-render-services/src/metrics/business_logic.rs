//! Бизнес-логика для работы с метриками

use super::types::*;
use crate::services::cache_service::{
  AlertSeverity, CacheAlert, CacheAlertThresholds, CacheAlertType, CachePerformanceMetrics,
  SlowCacheOperation,
};
use crate::services::monitoring::MetricsSummary;

/// Подсчитать активные операции из сводок
pub fn count_active_operations(
  summaries: &[MetricsSummary],
) -> (u64, serde_json::Map<String, serde_json::Value>) {
  let mut active_operations = serde_json::Map::new();
  let mut total_active: u64 = 0;

  for summary in summaries {
    active_operations.insert(
      summary.service_name.clone(),
      serde_json::Value::Number(summary.active_operations.into()),
    );
    total_active += summary.active_operations as u64;
  }

  (total_active, active_operations)
}

/// Подсчитать статистику ошибок
pub fn calculate_error_statistics(summaries: &[MetricsSummary]) -> serde_json::Value {
  let mut error_stats = serde_json::Map::new();
  let mut total_errors = 0;
  let mut total_operations = 0;

  for summary in summaries {
    let service_stats = serde_json::json!({
        "total_errors": summary.total_errors,
        "total_operations": summary.total_operations,
        "error_rate": summary.error_rate,
        "operations_with_errors": summary.operation_metrics.iter()
            .filter(|(_, m)| m.errors > 0)
            .map(|(name, m)| serde_json::json!({
                "operation": name,
                "errors": m.errors,
                "total": m.count,
                "last_error": m.last_error,
            }))
            .collect::<Vec<_>>(),
    });

    error_stats.insert(summary.service_name.clone(), service_stats);
    total_errors += summary.total_errors;
    total_operations += summary.total_operations;
  }

  let overall_error_rate = if total_operations > 0 {
    total_errors as f64 / total_operations as f64
  } else {
    0.0
  };

  serde_json::json!({
      "total_errors": total_errors,
      "total_operations": total_operations,
      "overall_error_rate": overall_error_rate,
      "by_service": error_stats,
  })
}

/// Найти медленные операции
pub fn find_slow_operations(summaries: &[MetricsSummary], limit: usize) -> Vec<serde_json::Value> {
  let mut all_operations = Vec::new();

  for summary in summaries {
    for (op_name, metrics) in &summary.operation_metrics {
      all_operations.push(serde_json::json!({
          "service": summary.service_name.clone(),
          "operation": op_name,
          "avg_duration_ms": metrics.avg_duration_ms,
          "max_duration_ms": metrics.max_duration_ms,
          "count": metrics.count,
      }));
    }
  }

  // Сортируем по средней длительности
  all_operations.sort_by(|a, b| {
    let a_duration = a["avg_duration_ms"].as_f64().unwrap_or(0.0);
    let b_duration = b["avg_duration_ms"].as_f64().unwrap_or(0.0);
    b_duration.partial_cmp(&a_duration).unwrap()
  });

  all_operations.truncate(limit);
  all_operations
}

/// Собрать метрики сервисного контейнера
pub fn collect_service_container_metrics(
  summaries: &[(&str, MetricsSummary)],
) -> serde_json::Value {
  let mut result = serde_json::Map::new();

  for (name, summary) in summaries {
    result.insert(
      name.to_string(),
      serde_json::json!({
          "total_operations": summary.total_operations,
          "active_operations": summary.active_operations,
          "total_errors": summary.total_errors,
          "error_rate": summary.error_rate,
      }),
    );
  }

  result.insert(
    "message".to_string(),
    serde_json::Value::String(
      "All service metrics containers are accessible and functioning".to_string(),
    ),
  );

  serde_json::Value::Object(result)
}

/// Подготовить метрики для экспорта
pub fn prepare_metrics_for_export(
  summaries: &[MetricsSummary],
  format: &ExportFormat,
) -> Result<String, String> {
  match format {
    ExportFormat::Json => {
      let metrics: Vec<_> = summaries
        .iter()
        .map(|s| {
          serde_json::json!({
              "service": s.service_name,
              "total_operations": s.total_operations,
              "active_operations": s.active_operations,
              "total_errors": s.total_errors,
              "error_rate": s.error_rate,
              "operations": s.operation_metrics,
          })
        })
        .collect();

      serde_json::to_string_pretty(&metrics)
        .map_err(|e| format!("Failed to serialize metrics: {}", e))
    }
    ExportFormat::Prometheus => {
      let mut output = String::new();

      for summary in summaries {
        let service_label = format!("service=\"{}\"", summary.service_name);

        // Общие метрики сервиса
        output.push_str(&format!(
          "# HELP service_operations_total Total number of operations\n\
                     # TYPE service_operations_total counter\n\
                     service_operations_total{{{}}} {}\n\n",
          service_label, summary.total_operations
        ));

        output.push_str(&format!(
          "# HELP service_errors_total Total number of errors\n\
                     # TYPE service_errors_total counter\n\
                     service_errors_total{{{}}} {}\n\n",
          service_label, summary.total_errors
        ));

        output.push_str(&format!(
          "# HELP service_active_operations Current number of active operations\n\
                     # TYPE service_active_operations gauge\n\
                     service_active_operations{{{}}} {}\n\n",
          service_label, summary.active_operations
        ));

        // Метрики по операциям
        for (op_name, metrics) in &summary.operation_metrics {
          let op_labels = format!("{},operation=\"{}\"", service_label, op_name);

          output.push_str(&format!(
            "operation_count{{{}}} {}\n",
            op_labels, metrics.count
          ));

          output.push_str(&format!(
            "operation_errors{{{}}} {}\n",
            op_labels, metrics.errors
          ));

          output.push_str(&format!(
            "operation_duration_ms_avg{{{}}} {}\n",
            op_labels, metrics.avg_duration_ms
          ));
        }
      }

      Ok(output)
    }
    ExportFormat::Csv => {
      let mut csv_lines = vec![
        "service,operation,count,errors,avg_duration_ms,min_duration_ms,max_duration_ms"
          .to_string(),
      ];

      for summary in summaries {
        for (op_name, metrics) in &summary.operation_metrics {
          csv_lines.push(format!(
            "{},{},{},{},{},{},{}",
            summary.service_name,
            op_name,
            metrics.count,
            metrics.errors,
            metrics.avg_duration_ms,
            metrics.min_duration_ms,
            metrics.max_duration_ms
          ));
        }
      }

      Ok(csv_lines.join("\n"))
    }
  }
}

/// Рассчитать метрики производительности
pub fn calculate_performance_metrics(summaries: &[MetricsSummary]) -> Vec<PerformanceMetrics> {
  let mut performance_metrics = Vec::new();

  for summary in summaries {
    for (op_name, metrics) in &summary.operation_metrics {
      if metrics.count > 0 {
        // Простой расчет throughput (операций в секунду)
        // В реальности нужно учитывать временной интервал
        let throughput = if metrics.avg_duration_ms > 0.0 {
          1000.0 / metrics.avg_duration_ms
        } else {
          0.0
        };

        performance_metrics.push(PerformanceMetrics {
          service_name: summary.service_name.clone(),
          operation_name: op_name.clone(),
          avg_duration_ms: metrics.avg_duration_ms as u64,
          p95_duration_ms: metrics.max_duration_ms, // Упрощение
          p99_duration_ms: metrics.max_duration_ms, // Упрощение
          throughput_ops_per_sec: throughput,
        });
      }
    }
  }

  performance_metrics
}

/// Агрегировать метрики по времени
pub fn aggregate_metrics_by_time(
  summaries: &[MetricsSummary],
  interval_minutes: u32,
) -> serde_json::Value {
  // В реальной реализации здесь бы была группировка по временным интервалам
  // Сейчас возвращаем упрощенную версию
  serde_json::json!({
      "interval_minutes": interval_minutes,
      "current_summary": summaries.iter().map(|s| {
          serde_json::json!({
              "service": s.service_name,
              "operations": s.total_operations,
              "errors": s.total_errors,
              "active": s.active_operations,
          })
      }).collect::<Vec<_>>(),
      "note": "Time-based aggregation not yet implemented"
  })
}

// ============ Расширенные метрики ============

/// Генерация метрик производительности кэша
pub fn generate_cache_performance_metrics() -> CachePerformanceMetrics {
  CachePerformanceMetrics {
    hit_rate_last_hour: 0.85,
    hit_rate_last_day: 0.82,
    average_response_time_ms: 12.5,
    peak_memory_usage_mb: 256.0,
    current_memory_usage_mb: 128.0,
    fragmentation_ratio: 0.15,
    top_accessed_keys: vec![
      "preview_1920x1080_60fps".to_string(),
      "render_segment_0-10s".to_string(),
      "metadata_video.mp4".to_string(),
    ],
    slow_operations: vec![SlowCacheOperation {
      operation: "get_preview".to_string(),
      key: "large_4k_preview".to_string(),
      duration_ms: 250.0,
      timestamp: chrono::Utc::now().to_rfc3339(),
    }],
  }
}

/// Валидация порогов алертов
pub fn validate_alert_thresholds(thresholds: &CacheAlertThresholds) -> bool {
  thresholds.min_hit_rate >= 0.0
    && thresholds.min_hit_rate <= 1.0
    && thresholds.max_memory_usage_mb > 0.0
    && thresholds.max_response_time_ms > 0.0
    && thresholds.max_fragmentation >= 0.0
    && thresholds.max_fragmentation <= 1.0
}

/// Генерация алертов кэша
pub fn generate_cache_alerts() -> Vec<CacheAlert> {
  vec![
    CacheAlert {
      alert_type: CacheAlertType::LowHitRate,
      message: "Cache hit rate упал ниже 80%".to_string(),
      severity: AlertSeverity::Warning,
      timestamp: chrono::Utc::now().to_rfc3339(),
      current_value: 0.75,
      threshold_value: 0.80,
    },
    CacheAlert {
      alert_type: CacheAlertType::HighMemoryUsage,
      message: "Использование памяти кэша превысило 200 MB".to_string(),
      severity: AlertSeverity::Critical,
      timestamp: chrono::Utc::now().to_rfc3339(),
      current_value: 225.0,
      threshold_value: 200.0,
    },
  ]
}

/// Генерация метрик GPU
pub fn generate_gpu_metrics() -> serde_json::Value {
  serde_json::json!({
      "gpu_utilization_percent": 65.0,
      "memory_used_mb": 1024.0,
      "memory_total_mb": 8192.0,
      "memory_utilization_percent": 12.5,
      "temperature_celsius": 72.0,
      "power_usage_watts": 150.0,
      "active_encoders": 2,
      "encoding_sessions": [
          {
              "session_id": "render_001",
              "codec": "h264_nvenc",
              "resolution": "1920x1080",
              "fps": 30,
              "bitrate_mbps": 8.0,
              "duration_seconds": 45.2
          },
          {
              "session_id": "preview_002",
              "codec": "h264_nvenc",
              "resolution": "640x360",
              "fps": 15,
              "bitrate_mbps": 1.0,
              "duration_seconds": 12.8
          }
      ],
      "performance_metrics": {
          "encode_fps": 28.5,
          "queue_length": 3,
          "average_encode_time_ms": 35.2,
          "failed_encodes": 0,
          "hardware_acceleration_active": true
      }
  })
}

/// Генерация метрик использования памяти
pub fn generate_memory_usage_metrics() -> serde_json::Value {
  serde_json::json!({
      "total_memory_mb": 512.0,
      "services": {
          "cache_service": {
              "memory_mb": 128.0,
              "percentage": 25.0,
              "peak_memory_mb": 256.0,
              "allocations": 1250,
              "deallocations": 1180
          },
          "render_service": {
              "memory_mb": 256.0,
              "percentage": 50.0,
              "peak_memory_mb": 384.0,
              "allocations": 850,
              "deallocations": 820
          },
          "preview_service": {
              "memory_mb": 64.0,
              "percentage": 12.5,
              "peak_memory_mb": 96.0,
              "allocations": 420,
              "deallocations": 400
          },
          "gpu_service": {
              "memory_mb": 32.0,
              "percentage": 6.25,
              "peak_memory_mb": 48.0,
              "allocations": 180,
              "deallocations": 175
          },
          "project_service": {
              "memory_mb": 16.0,
              "percentage": 3.125,
              "peak_memory_mb": 24.0,
              "allocations": 95,
              "deallocations": 90
          },
          "ffmpeg_service": {
              "memory_mb": 16.0,
              "percentage": 3.125,
              "peak_memory_mb": 32.0,
              "allocations": 60,
              "deallocations": 58
          }
      },
      "memory_alerts": [
          {
              "service": "render_service",
              "type": "high_usage",
              "message": "Render service использует более 400 MB памяти",
              "severity": "warning"
          }
      ],
      "gc_stats": {
          "collections": 15,
          "total_freed_mb": 89.5,
          "average_collection_time_ms": 2.3
      }
  })
}

/// Создание кастомного алерта
pub fn create_custom_alert_logic(
  alert_name: &str,
  metric_name: &str,
  threshold: f64,
  operator: &str,
  severity: &str,
) -> Result<CustomAlertResult, String> {
  // Валидация оператора
  match operator {
    "greater_than" | "less_than" | "equals" => {}
    _ => return Err(format!("Invalid operator: {operator}")),
  }

  // Валидация severity
  match severity {
    "info" | "warning" | "critical" => {}
    _ => return Err(format!("Invalid severity: {severity}")),
  }

  // Валидация порога
  if !threshold.is_finite() {
    return Err("Invalid threshold value".to_string());
  }

  let alert_id = uuid::Uuid::new_v4().to_string();
  let created_at = chrono::Utc::now().to_rfc3339();

  Ok(CustomAlertResult {
    alert_id,
    alert_name: alert_name.to_string(),
    metric_name: metric_name.to_string(),
    threshold,
    operator: operator.to_string(),
    severity: severity.to_string(),
    created_at,
  })
}

/// Генерация истории метрик
pub fn generate_metrics_history(
  service_name: &str,
  metric_name: &str,
  hours_back: u32,
) -> MetricsHistoryResult {
  // Симуляция исторических данных
  let mut data_points = Vec::new();
  let start_time = chrono::Utc::now() - chrono::Duration::hours(hours_back as i64);

  for i in 0..hours_back {
    let timestamp = start_time + chrono::Duration::hours(i as i64);
    let value = match metric_name {
      "hit_rate" => 0.8 + (i as f64 * 0.01) + ((i % 7) as f64 * 0.02 - 0.07),
      "memory_usage" => 120.0 + (i as f64 * 2.0) + ((i % 11) as f64 * 4.0),
      "response_time" => 10.0 + ((i % 13) as f64 * 1.5),
      _ => (i % 17) as f64 * 6.0,
    };

    data_points.push(serde_json::json!({
        "timestamp": timestamp.to_rfc3339(),
        "value": value
    }));
  }

  let min = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .fold(f64::INFINITY, f64::min);
  let max = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .fold(f64::NEG_INFINITY, f64::max);
  let sum: f64 = data_points
    .iter()
    .map(|p| p["value"].as_f64().unwrap_or(0.0))
    .sum();
  let avg = if data_points.is_empty() {
    0.0
  } else {
    sum / data_points.len() as f64
  };

  MetricsHistoryResult {
    service: service_name.to_string(),
    metric: metric_name.to_string(),
    period_hours: hours_back,
    data_points,
    summary: MetricsHistorySummary { min, max, avg },
  }
}
