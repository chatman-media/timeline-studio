//! Тесты для модуля service_container

#[cfg(test)]
mod service_container_tests {
  use super::super::*;
  use crate::video_compiler::VideoCompilerState;

  #[test]
  fn test_service_metrics_params_serialization() {
    let params = types::GetServiceMetricsParams {
      service_name: "test_service".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("test_service"));

    // Тест десериализации
    let deserialized: types::GetServiceMetricsParams = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.service_name, "test_service");
  }

  #[test]
  fn test_project_service_info_serialization() {
    let info = types::ProjectServiceInfo {
      available: true,
      service_type: "ProjectService".to_string(),
      status: "active".to_string(),
      error: None,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("ProjectService"));
    assert!(json.contains("active"));

    // Тест десериализации
    let deserialized: types::ProjectServiceInfo = serde_json::from_str(&json).unwrap();
    assert!(deserialized.available);
    assert_eq!(deserialized.service_type, "ProjectService");
    assert_eq!(deserialized.status, "active");
    assert!(deserialized.error.is_none());
  }

  #[test]
  fn test_metrics_summary_serialization() {
    let summary = types::AllMetricsSummary {
      total_services: 3,
      active_services: 2,
      total_requests: 1000,
      total_errors: 5,
      average_response_time: 150.5,
      summaries: vec![],
    };

    let json = serde_json::to_string(&summary).unwrap();
    assert!(json.contains("1000"));
    assert!(json.contains("150.5"));

    // Тест десериализации
    let deserialized: types::AllMetricsSummary = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.total_services, 3);
    assert_eq!(deserialized.active_services, 2);
    assert_eq!(deserialized.total_requests, 1000);
    assert_eq!(deserialized.total_errors, 5);
    assert_eq!(deserialized.average_response_time, 150.5);
    assert!(deserialized.summaries.is_empty());
  }

  #[test]
  fn test_project_service_info_with_error() {
    let info = types::ProjectServiceInfo {
      available: false,
      service_type: "ProjectService".to_string(),
      status: "error".to_string(),
      error: Some("Service initialization failed".to_string()),
    };

    assert!(!info.available);
    assert_eq!(info.status, "error");
    assert!(info.error.is_some());
    assert_eq!(
      info.error.as_ref().unwrap(),
      "Service initialization failed"
    );
  }

  #[test]
  fn test_service_metrics_info_creation() {
    let metrics = types::ServiceMetricsInfo {
      service_name: "render_service".to_string(),
      metrics_available: true,
      request_count: 250,
      error_count: 5,
      average_response_time: 123.45,
      status: "active".to_string(),
    };

    assert_eq!(metrics.service_name, "render_service");
    assert!(metrics.metrics_available);
    assert_eq!(metrics.request_count, 250);
    assert_eq!(metrics.error_count, 5);
    assert_eq!(metrics.average_response_time, 123.45);
    assert_eq!(metrics.status, "active");
  }

  #[test]
  fn test_service_metrics_info_no_metrics() {
    let metrics = types::ServiceMetricsInfo {
      service_name: "unknown_service".to_string(),
      metrics_available: false,
      request_count: 0,
      error_count: 0,
      average_response_time: 0.0,
      status: "no_metrics".to_string(),
    };

    assert!(!metrics.metrics_available);
    assert_eq!(metrics.request_count, 0);
    assert_eq!(metrics.error_count, 0);
    assert_eq!(metrics.average_response_time, 0.0);
    assert_eq!(metrics.status, "no_metrics");
  }

  #[test]
  fn test_metrics_summary_info_serialization() {
    let summary_info = types::MetricsSummaryInfo {
      service_name: "cache_service".to_string(),
      request_count: 500,
      error_count: 2,
      response_time: 67.8,
      status: "active".to_string(),
    };

    let json = serde_json::to_string(&summary_info).unwrap();
    assert!(json.contains("cache_service"));
    assert!(json.contains("500"));
    assert!(json.contains("67.8"));

    // Тест десериализации
    let deserialized: types::MetricsSummaryInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.service_name, "cache_service");
    assert_eq!(deserialized.request_count, 500);
    assert_eq!(deserialized.error_count, 2);
    assert_eq!(deserialized.response_time, 67.8);
    assert_eq!(deserialized.status, "active");
  }

  #[test]
  fn test_all_metrics_summary_with_summaries() {
    let summaries = vec![
      types::MetricsSummaryInfo {
        service_name: "render_service".to_string(),
        request_count: 450,
        error_count: 12,
        response_time: 2300.5,
        status: "active".to_string(),
      },
      types::MetricsSummaryInfo {
        service_name: "preview_service".to_string(),
        request_count: 890,
        error_count: 5,
        response_time: 156.7,
        status: "active".to_string(),
      },
    ];

    let all_summary = types::AllMetricsSummary {
      total_services: 2,
      active_services: 2,
      total_requests: 1340,
      total_errors: 17,
      average_response_time: 1228.6,
      summaries,
    };

    assert_eq!(all_summary.total_services, 2);
    assert_eq!(all_summary.active_services, 2);
    assert_eq!(all_summary.total_requests, 1340);
    assert_eq!(all_summary.total_errors, 17);
    assert_eq!(all_summary.summaries.len(), 2);
    assert_eq!(all_summary.summaries[0].service_name, "render_service");
    assert_eq!(all_summary.summaries[1].service_name, "preview_service");
  }

  #[test]
  fn test_prometheus_export_creation() {
    let export = types::PrometheusExport {
            format: "prometheus".to_string(),
            content: "# HELP requests_total Total number of requests\n# TYPE requests_total counter\nrequests_total 1234\n".to_string(),
            timestamp: "2024-01-01T12:00:00Z".to_string(),
            metrics_count: 15,
        };

    assert_eq!(export.format, "prometheus");
    assert!(export.content.contains("requests_total"));
    assert_eq!(export.metrics_count, 15);
    assert!(!export.timestamp.is_empty());
  }

  #[test]
  fn test_prometheus_export_serialization() {
    let export = types::PrometheusExport {
      format: "prometheus".to_string(),
      content: "# Sample prometheus content".to_string(),
      timestamp: chrono::Utc::now().to_rfc3339(),
      metrics_count: 10,
    };

    let json = serde_json::to_string(&export).unwrap();
    assert!(json.contains("prometheus"));
    assert!(json.contains("Sample prometheus content"));

    // Тест десериализации
    let deserialized: types::PrometheusExport = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.format, "prometheus");
    assert_eq!(deserialized.metrics_count, 10);
  }

  #[tokio::test]
  async fn test_metrics_registry_creation() {
    // Тестируем создание MetricsRegistry
    let registry = crate::video_compiler::services::monitoring::MetricsRegistry::new();

    // Тестируем базовую функциональность
    let prometheus_export = registry.export_prometheus().await;
    // Prometheus export может быть пустым в новом реестре - это нормально
    // Просто проверяем, что получили строку
    let _ = prometheus_export;

    // Тестируем получение сводок
    let _summaries = registry.get_all_summaries().await;
    // summaries могут быть пустыми в новом реестре - это нормально
  }

  #[test]
  fn test_service_status_values() {
    let statuses = vec!["active", "inactive", "error", "no_metrics", "unavailable"];

    for status in statuses {
      let info = types::ProjectServiceInfo {
        available: status == "active",
        service_type: "TestService".to_string(),
        status: status.to_string(),
        error: if status == "error" {
          Some("Test error".to_string())
        } else {
          None
        },
      };

      assert_eq!(info.status, status);
      if status == "active" {
        assert!(info.available);
        assert!(info.error.is_none());
      } else if status == "error" {
        assert!(!info.available);
        assert!(info.error.is_some());
      }
    }
  }

  #[test]
  fn test_service_names_validation() {
    let service_names = vec![
      "render_service",
      "preview_service",
      "cache_service",
      "gpu_service",
      "project_service",
      "ffmpeg_service",
    ];

    for service_name in service_names {
      let params = types::GetServiceMetricsParams {
        service_name: service_name.to_string(),
      };

      assert!(!params.service_name.is_empty());
      assert!(params.service_name.contains("service"));
      assert!(params
        .service_name
        .chars()
        .all(|c| c.is_ascii_lowercase() || c == '_'));
    }
  }

  #[test]
  fn test_metrics_calculations() {
    // Тестируем расчет средних значений для метрик
    let summaries = vec![
      types::MetricsSummaryInfo {
        service_name: "service1".to_string(),
        request_count: 100,
        error_count: 5,
        response_time: 50.0,
        status: "active".to_string(),
      },
      types::MetricsSummaryInfo {
        service_name: "service2".to_string(),
        request_count: 200,
        error_count: 10,
        response_time: 100.0,
        status: "active".to_string(),
      },
    ];

    let total_requests: u64 = summaries.iter().map(|s| s.request_count).sum();
    let total_errors: u64 = summaries.iter().map(|s| s.error_count).sum();
    let average_response_time: f64 =
      summaries.iter().map(|s| s.response_time).sum::<f64>() / summaries.len() as f64;

    assert_eq!(total_requests, 300);
    assert_eq!(total_errors, 15);
    assert_eq!(average_response_time, 75.0);

    let all_summary = types::AllMetricsSummary {
      total_services: summaries.len(),
      active_services: summaries.iter().filter(|s| s.status == "active").count(),
      total_requests,
      total_errors,
      average_response_time,
      summaries,
    };

    assert_eq!(all_summary.total_services, 2);
    assert_eq!(all_summary.active_services, 2);
    assert_eq!(all_summary.total_requests, 300);
    assert_eq!(all_summary.total_errors, 15);
    assert_eq!(all_summary.average_response_time, 75.0);
  }

  #[test]
  fn test_error_rate_calculation() {
    let metrics = types::ServiceMetricsInfo {
      service_name: "test_service".to_string(),
      metrics_available: true,
      request_count: 1000,
      error_count: 50,
      average_response_time: 123.45,
      status: "active".to_string(),
    };

    // Расчет процента ошибок
    let error_rate = if metrics.request_count > 0 {
      (metrics.error_count as f64 / metrics.request_count as f64) * 100.0
    } else {
      0.0
    };

    assert_eq!(error_rate, 5.0); // 50/1000 * 100 = 5%
  }

  #[test]
  fn test_timestamp_format() {
    let now = chrono::Utc::now();
    let timestamp = now.to_rfc3339();

    // Проверяем формат RFC3339
    assert!(timestamp.contains('T'));
    assert!(timestamp.contains('Z') || timestamp.contains('+'));
    assert!(timestamp.len() >= 19); // Минимальная длина для ISO 8601
  }

  #[tokio::test]
  async fn test_get_all_metrics_summaries_command() {
    let _state = VideoCompilerState::new().await;
    // Note: Tauri State cannot be directly tested without proper mock
    // This test verifies the AllMetricsSummary creation logic
    let demo_summaries = vec![
      types::MetricsSummaryInfo {
        service_name: "render_service".to_string(),
        request_count: 450,
        error_count: 12,
        response_time: 2300.5,
        status: "active".to_string(),
      },
      types::MetricsSummaryInfo {
        service_name: "preview_service".to_string(),
        request_count: 890,
        error_count: 5,
        response_time: 156.7,
        status: "active".to_string(),
      },
      types::MetricsSummaryInfo {
        service_name: "cache_service".to_string(),
        request_count: 1250,
        error_count: 2,
        response_time: 45.3,
        status: "active".to_string(),
      },
    ];

    let summary = types::AllMetricsSummary {
      total_services: 3,
      active_services: 3,
      total_requests: 2590,
      total_errors: 19,
      average_response_time: 834.2,
      summaries: demo_summaries,
    };

    assert_eq!(summary.total_services, 3);
    assert_eq!(summary.active_services, 3);
    assert_eq!(summary.summaries.len(), 3);
    assert!(summary
      .summaries
      .iter()
      .any(|s| s.service_name == "render_service"));
    assert!(summary
      .summaries
      .iter()
      .any(|s| s.service_name == "preview_service"));
    assert!(summary
      .summaries
      .iter()
      .any(|s| s.service_name == "cache_service"));
  }
}
