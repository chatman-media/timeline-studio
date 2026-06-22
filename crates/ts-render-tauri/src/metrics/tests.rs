//! Тесты для модуля метрик

#[cfg(test)]
mod metrics_tests {
  use super::super::*;
  use ts_render_services::services::cache_service::{
    AlertSeverity, CacheAlertThresholds, CacheAlertType,
  };
  use ts_render_services::services::monitoring::{MetricsSummary, OperationMetrics};
  use std::collections::HashMap;

  fn create_test_summaries() -> Vec<MetricsSummary> {
    vec![
      MetricsSummary {
        service_name: "test-service-1".to_string(),
        uptime_seconds: 3600,
        total_operations: 100,
        active_operations: 5,
        total_errors: 10,
        operations_per_second: 0.027,
        error_rate: 0.1,
        operation_metrics: {
          let mut map = HashMap::new();
          map.insert(
            "slow-op".to_string(),
            OperationMetrics {
              count: 50,
              errors: 5,
              total_duration_ms: 5000,
              min_duration_ms: 50,
              avg_duration_ms: 100.0,
              max_duration_ms: 200,
              last_error: None,
              last_operation_time: None,
            },
          );
          map.insert(
            "fast-op".to_string(),
            OperationMetrics {
              count: 50,
              errors: 5,
              total_duration_ms: 500,
              min_duration_ms: 5,
              avg_duration_ms: 10.0,
              max_duration_ms: 20,
              last_error: Some("Test error".to_string()),
              last_operation_time: None,
            },
          );
          map
        },
      },
      MetricsSummary {
        service_name: "test-service-2".to_string(),
        uptime_seconds: 3600,
        total_operations: 200,
        active_operations: 10,
        total_errors: 5,
        operations_per_second: 0.056,
        error_rate: 0.025,
        operation_metrics: {
          let mut map = HashMap::new();
          map.insert(
            "medium-op".to_string(),
            OperationMetrics {
              count: 200,
              errors: 5,
              total_duration_ms: 10000,
              min_duration_ms: 25,
              avg_duration_ms: 50.0,
              max_duration_ms: 100,
              last_error: None,
              last_operation_time: None,
            },
          );
          map
        },
      },
    ]
  }

  #[test]
  fn test_count_active_operations() {
    let summaries = create_test_summaries();
    let (total, by_service) = business_logic::count_active_operations(&summaries);

    assert_eq!(total, 15); // 5 + 10
    assert_eq!(by_service.len(), 2);
    assert_eq!(by_service["test-service-1"], 5);
    assert_eq!(by_service["test-service-2"], 10);
  }

  #[test]
  fn test_calculate_error_statistics() {
    let summaries = create_test_summaries();
    let stats = business_logic::calculate_error_statistics(&summaries);

    assert_eq!(stats["total_errors"], 15); // 10 + 5
    assert_eq!(stats["total_operations"], 300); // 100 + 200
    assert!(stats["overall_error_rate"].as_f64().unwrap() > 0.04);
    assert!(stats["overall_error_rate"].as_f64().unwrap() < 0.06);

    let by_service = stats["by_service"].as_object().unwrap();
    assert_eq!(by_service.len(), 2);

    let service1_stats = &by_service["test-service-1"];
    assert_eq!(service1_stats["total_errors"], 10);
    assert_eq!(service1_stats["error_rate"], 0.1);

    let ops_with_errors = service1_stats["operations_with_errors"].as_array().unwrap();
    assert_eq!(ops_with_errors.len(), 2);
  }

  #[test]
  fn test_find_slow_operations() {
    let summaries = create_test_summaries();
    let slow_ops = business_logic::find_slow_operations(&summaries, 2);

    assert_eq!(slow_ops.len(), 2);

    // Первая операция должна быть самой медленной (slow-op с avg 100ms)
    assert_eq!(slow_ops[0]["operation"], "slow-op");
    assert_eq!(slow_ops[0]["avg_duration_ms"], 100.0);

    // Вторая операция - medium-op с avg 50ms
    assert_eq!(slow_ops[1]["operation"], "medium-op");
    assert_eq!(slow_ops[1]["avg_duration_ms"], 50.0);
  }

  #[test]
  fn test_find_slow_operations_limit() {
    let summaries = create_test_summaries();
    let slow_ops = business_logic::find_slow_operations(&summaries, 1);

    assert_eq!(slow_ops.len(), 1);
    assert_eq!(slow_ops[0]["operation"], "slow-op");
  }

  #[test]
  fn test_collect_service_container_metrics() {
    let summaries = vec![
      (
        "render_service",
        MetricsSummary {
          service_name: "render".to_string(),
          uptime_seconds: 3600,
          total_operations: 100,
          active_operations: 2,
          total_errors: 5,
          operations_per_second: 0.028,
          error_rate: 0.05,
          operation_metrics: HashMap::new(),
        },
      ),
      (
        "cache_service",
        MetricsSummary {
          service_name: "cache".to_string(),
          uptime_seconds: 7200,
          total_operations: 1000,
          active_operations: 0,
          total_errors: 2,
          operations_per_second: 0.139,
          error_rate: 0.002,
          operation_metrics: HashMap::new(),
        },
      ),
    ];

    let result = business_logic::collect_service_container_metrics(&summaries);
    let obj = result.as_object().unwrap();

    assert!(obj.contains_key("render_service"));
    assert!(obj.contains_key("cache_service"));
    assert!(obj.contains_key("message"));

    let render_metrics = &obj["render_service"];
    assert_eq!(render_metrics["total_operations"], 100);
    assert_eq!(render_metrics["active_operations"], 2);
    assert_eq!(render_metrics["total_errors"], 5);
    assert_eq!(render_metrics["error_rate"], 0.05);
  }

  #[test]
  fn test_prepare_metrics_for_export_json() {
    let summaries = create_test_summaries();
    let result = business_logic::prepare_metrics_for_export(&summaries, &ExportFormat::Json);

    assert!(result.is_ok());
    let json_str = result.unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert!(parsed.is_array());
    let array = parsed.as_array().unwrap();
    assert_eq!(array.len(), 2);

    assert_eq!(array[0]["service"], "test-service-1");
    assert_eq!(array[0]["total_operations"], 100);
  }

  #[test]
  fn test_prepare_metrics_for_export_prometheus() {
    let summaries = vec![MetricsSummary {
      service_name: "test-service".to_string(),
      uptime_seconds: 3600,
      total_operations: 100,
      active_operations: 5,
      total_errors: 10,
      operations_per_second: 0.027,
      error_rate: 0.1,
      operation_metrics: HashMap::new(),
    }];

    let result = business_logic::prepare_metrics_for_export(&summaries, &ExportFormat::Prometheus);
    assert!(result.is_ok());

    let output = result.unwrap();
    assert!(output.contains("service_operations_total"));
    assert!(output.contains("service_errors_total"));
    assert!(output.contains("service_active_operations"));
    assert!(output.contains("service=\"test-service\""));
    assert!(output.contains("100")); // total_operations
    assert!(output.contains("10")); // total_errors
    assert!(output.contains("5")); // active_operations
  }

  #[test]
  fn test_prepare_metrics_for_export_csv() {
    let summaries = create_test_summaries();
    let result = business_logic::prepare_metrics_for_export(&summaries, &ExportFormat::Csv);

    assert!(result.is_ok());
    let csv = result.unwrap();

    let lines: Vec<&str> = csv.lines().collect();
    assert!(lines.len() > 1);
    assert_eq!(
      lines[0],
      "service,operation,count,errors,avg_duration_ms,min_duration_ms,max_duration_ms"
    );

    // Проверяем наличие данных для операций
    assert!(csv.contains("test-service-1,slow-op,50,5,100,50,200"));
    assert!(csv.contains("test-service-1,fast-op,50,5,10,5,20"));
    assert!(csv.contains("test-service-2,medium-op,200,5,50,25,100"));
  }

  #[test]
  fn test_calculate_performance_metrics() {
    let summaries = create_test_summaries();
    let perf_metrics = business_logic::calculate_performance_metrics(&summaries);

    assert_eq!(perf_metrics.len(), 3); // slow-op, fast-op, medium-op

    // Найдем метрики для fast-op
    let fast_op_metrics = perf_metrics
      .iter()
      .find(|m| m.operation_name == "fast-op")
      .unwrap();

    assert_eq!(fast_op_metrics.service_name, "test-service-1");
    assert_eq!(fast_op_metrics.avg_duration_ms, 10);
    assert_eq!(fast_op_metrics.throughput_ops_per_sec, 100.0); // 1000ms / 10ms
  }

  #[test]
  fn test_aggregate_metrics_by_time() {
    let summaries = create_test_summaries();
    let result = business_logic::aggregate_metrics_by_time(&summaries, 5);

    assert_eq!(result["interval_minutes"], 5);
    assert!(result["current_summary"].is_array());
    assert!(result["note"].is_string());

    let summary_array = result["current_summary"].as_array().unwrap();
    assert_eq!(summary_array.len(), 2);
    assert_eq!(summary_array[0]["service"], "test-service-1");
    assert_eq!(summary_array[0]["operations"], 100);
  }

  #[test]
  fn test_empty_summaries() {
    let empty_summaries: Vec<MetricsSummary> = vec![];

    // count_active_operations
    let (total, by_service) = business_logic::count_active_operations(&empty_summaries);
    assert_eq!(total, 0);
    assert_eq!(by_service.len(), 0);

    // calculate_error_statistics
    let error_stats = business_logic::calculate_error_statistics(&empty_summaries);
    assert_eq!(error_stats["total_errors"], 0);
    assert_eq!(error_stats["overall_error_rate"], 0.0);

    // find_slow_operations
    let slow_ops = business_logic::find_slow_operations(&empty_summaries, 10);
    assert_eq!(slow_ops.len(), 0);
  }

  // ============ Тесты для расширенных метрик ============

  #[test]
  fn test_cache_performance_metrics_generation() {
    let metrics = business_logic::generate_cache_performance_metrics();

    assert!(metrics.hit_rate_last_hour >= 0.0 && metrics.hit_rate_last_hour <= 1.0);
    assert!(metrics.hit_rate_last_day >= 0.0 && metrics.hit_rate_last_day <= 1.0);
    assert!(metrics.average_response_time_ms > 0.0);
    assert!(metrics.peak_memory_usage_mb >= metrics.current_memory_usage_mb);
    assert_eq!(metrics.top_accessed_keys.len(), 3);
    assert_eq!(metrics.slow_operations.len(), 1);
  }

  #[test]
  fn test_alert_thresholds_validation() {
    // Валидные пороги
    let valid_thresholds = CacheAlertThresholds {
      min_hit_rate: 0.8,
      max_memory_usage_mb: 200.0,
      max_response_time_ms: 100.0,
      max_fragmentation: 0.3,
    };
    assert!(business_logic::validate_alert_thresholds(&valid_thresholds));

    // Невалидный hit_rate
    let invalid_hit_rate = CacheAlertThresholds {
      min_hit_rate: 1.5, // > 1.0
      max_memory_usage_mb: 200.0,
      max_response_time_ms: 100.0,
      max_fragmentation: 0.3,
    };
    assert!(!business_logic::validate_alert_thresholds(
      &invalid_hit_rate
    ));

    // Невалидная память
    let invalid_memory = CacheAlertThresholds {
      min_hit_rate: 0.8,
      max_memory_usage_mb: -100.0, // < 0
      max_response_time_ms: 100.0,
      max_fragmentation: 0.3,
    };
    assert!(!business_logic::validate_alert_thresholds(&invalid_memory));
  }

  #[test]
  fn test_cache_alerts_generation() {
    let alerts = business_logic::generate_cache_alerts();

    assert_eq!(alerts.len(), 2);

    // Проверяем первый алерт
    assert!(matches!(alerts[0].alert_type, CacheAlertType::LowHitRate));
    assert!(matches!(alerts[0].severity, AlertSeverity::Warning));
    assert!(alerts[0].current_value < alerts[0].threshold_value);

    // Проверяем второй алерт
    assert!(matches!(
      alerts[1].alert_type,
      CacheAlertType::HighMemoryUsage
    ));
    assert!(matches!(alerts[1].severity, AlertSeverity::Critical));
    assert!(alerts[1].current_value > alerts[1].threshold_value);
  }

  #[test]
  fn test_gpu_metrics_structure() {
    let gpu_metrics = business_logic::generate_gpu_metrics();

    assert_eq!(gpu_metrics["gpu_utilization_percent"], 65.0);
    assert!(gpu_metrics["encoding_sessions"].is_array());
    assert!(
      gpu_metrics["performance_metrics"]["hardware_acceleration_active"]
        .as_bool()
        .unwrap()
    );
    assert_eq!(gpu_metrics["active_encoders"], 2);
  }

  #[test]
  fn test_memory_usage_metrics_structure() {
    let memory_metrics = business_logic::generate_memory_usage_metrics();

    assert_eq!(memory_metrics["total_memory_mb"], 512.0);
    assert!(memory_metrics["services"]["cache_service"].is_object());
    assert_eq!(
      memory_metrics["services"]["cache_service"]["percentage"],
      25.0
    );
    assert!(memory_metrics["memory_alerts"].is_array());
    assert!(memory_metrics["gc_stats"].is_object());
  }

  #[test]
  fn test_custom_alert_creation() {
    // Валидный алерт
    let result = business_logic::create_custom_alert_logic(
      "High CPU Usage",
      "cpu_percent",
      80.0,
      "greater_than",
      "warning",
    );

    assert!(result.is_ok());
    let alert = result.unwrap();
    assert_eq!(alert.alert_name, "High CPU Usage");
    assert_eq!(alert.metric_name, "cpu_percent");
    assert_eq!(alert.threshold, 80.0);
    assert_eq!(alert.operator, "greater_than");
    assert_eq!(alert.severity, "warning");
    assert!(!alert.alert_id.is_empty());

    // Невалидный оператор
    let invalid_operator =
      business_logic::create_custom_alert_logic("Test", "metric", 50.0, "invalid_op", "info");
    assert!(invalid_operator.is_err());

    // Невалидный severity
    let invalid_severity = business_logic::create_custom_alert_logic(
      "Test",
      "metric",
      50.0,
      "greater_than",
      "invalid_severity",
    );
    assert!(invalid_severity.is_err());

    // Невалидный threshold
    let invalid_threshold = business_logic::create_custom_alert_logic(
      "Test",
      "metric",
      f64::NAN,
      "greater_than",
      "warning",
    );
    assert!(invalid_threshold.is_err());
  }

  #[test]
  fn test_metrics_history_generation() {
    let history = business_logic::generate_metrics_history("cache_service", "hit_rate", 6);

    assert_eq!(history.service, "cache_service");
    assert_eq!(history.metric, "hit_rate");
    assert_eq!(history.period_hours, 6);
    assert_eq!(history.data_points.len(), 6);

    // Проверяем что временные метки упорядочены
    for i in 1..history.data_points.len() {
      let ts1 = history.data_points[i - 1]["timestamp"].as_str().unwrap();
      let ts2 = history.data_points[i]["timestamp"].as_str().unwrap();
      let dt1 = chrono::DateTime::parse_from_rfc3339(ts1).unwrap();
      let dt2 = chrono::DateTime::parse_from_rfc3339(ts2).unwrap();
      assert!(dt2 > dt1);
    }

    // Проверяем сводку
    assert!(history.summary.min <= history.summary.max);
    assert!(history.summary.avg >= history.summary.min);
    assert!(history.summary.avg <= history.summary.max);
  }

  #[test]
  fn test_different_metric_types() {
    let metrics = ["hit_rate", "memory_usage", "response_time", "unknown"];

    for metric_name in metrics.iter() {
      let history = business_logic::generate_metrics_history("test_service", metric_name, 3);

      match *metric_name {
        "hit_rate" => {
          // Hit rate должен быть между 0 и 1
          for point in &history.data_points {
            let value = point["value"].as_f64().unwrap();
            assert!((0.0..=1.0 + 0.1).contains(&value)); // Допускаем небольшую погрешность
          }
        }
        "memory_usage" => {
          // Memory usage должен быть >= 100
          for point in &history.data_points {
            let value = point["value"].as_f64().unwrap();
            assert!(value >= 100.0);
          }
        }
        "response_time" => {
          // Response time должен быть >= 10
          for point in &history.data_points {
            let value = point["value"].as_f64().unwrap();
            assert!(value >= 10.0);
          }
        }
        _ => {
          // Другие метрики должны быть >= 0
          for point in &history.data_points {
            let value = point["value"].as_f64().unwrap();
            assert!(value >= 0.0);
          }
        }
      }
    }
  }

  #[test]
  fn test_uuid_format_validation() {
    let result = business_logic::create_custom_alert_logic(
      "Test Alert",
      "test_metric",
      50.0,
      "greater_than",
      "info",
    );

    assert!(result.is_ok());
    let alert = result.unwrap();

    // Проверяем формат UUID
    assert!(uuid::Uuid::parse_str(&alert.alert_id).is_ok());
    assert_eq!(alert.alert_id.len(), 36);
    assert_eq!(alert.alert_id.chars().filter(|&c| c == '-').count(), 4);
  }

  #[test]
  fn test_timestamp_format() {
    let history = business_logic::generate_metrics_history("service", "metric", 1);

    for point in &history.data_points {
      let timestamp = point["timestamp"].as_str().unwrap();

      // Проверяем формат RFC3339
      assert!(timestamp.contains('T'));
      assert!(timestamp.contains('Z') || timestamp.contains('+'));
      assert!(timestamp.len() >= 19); // Минимальная длина для ISO 8601

      // Проверяем что timestamp можно распарсить
      assert!(chrono::DateTime::parse_from_rfc3339(timestamp).is_ok());
    }
  }
}
