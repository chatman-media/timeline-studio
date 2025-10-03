//! Тесты для модуля monitoring

#[cfg(test)]
mod monitoring_tests {
  use super::super::*;
  use crate::video_compiler::services::monitoring::{MetricsSummary, OperationMetrics};
  use std::collections::HashMap;

  fn create_test_metrics_summary(service_name: &str) -> MetricsSummary {
    MetricsSummary {
      service_name: service_name.to_string(),
      uptime_seconds: 3600,
      total_operations: 100,
      total_errors: 3,
      active_operations: 5,
      operations_per_second: 10.5,
      error_rate: 0.03,
      operation_metrics: HashMap::new(),
    }
  }

  #[test]
  fn test_validate_service_name_valid() {
    let valid_services = vec!["render", "cache", "gpu", "preview", "project", "ffmpeg"];

    for service in valid_services {
      assert!(business_logic::validate_service_name(service).is_ok());
    }
  }

  #[test]
  fn test_validate_service_name_invalid() {
    let invalid_services = vec!["unknown", "invalid", "test", ""];

    for service in invalid_services {
      assert!(business_logic::validate_service_name(service).is_err());
      assert!(business_logic::validate_service_name(service)
        .unwrap_err()
        .contains("Unknown service"));
    }
  }

  #[test]
  fn test_get_available_services() {
    let services = business_logic::get_available_services();

    assert_eq!(services.len(), 6);
    assert!(services.contains(&"render"));
    assert!(services.contains(&"cache"));
    assert!(services.contains(&"gpu"));
    assert!(services.contains(&"preview"));
    assert!(services.contains(&"project"));
    assert!(services.contains(&"ffmpeg"));
  }

  #[test]
  fn test_format_service_metrics_prometheus() {
    let summary = create_test_metrics_summary("test_service");
    let output = business_logic::format_service_metrics_prometheus("test", &summary);

    // Check that all expected metric types are present
    assert!(output.contains("timeline_studio_test_operations_total"));
    assert!(output.contains("timeline_studio_test_errors_total"));
    assert!(output.contains("timeline_studio_test_active_operations"));
    assert!(output.contains("timeline_studio_test_operations_per_second"));
    assert!(output.contains("timeline_studio_test_error_rate"));

    // Check values
    assert!(output.contains("100\n")); // total_operations
    assert!(output.contains("3\n")); // total_errors
    assert!(output.contains("5\n")); // active_operations
    assert!(output.contains("10.50\n")); // operations_per_second
    assert!(output.contains("0.0300\n")); // error_rate

    // Check format headers
    assert!(output.contains("# HELP"));
    assert!(output.contains("# TYPE"));
    assert!(output.contains("counter"));
    assert!(output.contains("gauge"));
  }

  #[test]
  fn test_format_service_metrics_prometheus_with_params() {
    let summary = create_test_metrics_summary("test_service");
    let params = types::PrometheusExportParams {
      include_help: false,
      include_type: true,
      metric_prefix: "custom_prefix".to_string(),
    };

    let output =
      business_logic::format_service_metrics_prometheus_with_params("test", &summary, &params);

    // Should not contain HELP lines
    assert!(!output.contains("# HELP"));

    // Should contain TYPE lines
    assert!(output.contains("# TYPE"));

    // Should use custom prefix
    assert!(output.contains("custom_prefix_test_operations_total"));
    assert!(!output.contains("timeline_studio_test_operations_total"));
  }

  #[test]
  fn test_evaluate_service_health_healthy() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 7200,
      total_operations: 1000,
      total_errors: 20,
      active_operations: 10, // < 100
      operations_per_second: 25.5,
      error_rate: 0.02, // 2% < 5%
      operation_metrics: HashMap::new(),
    };

    let health = business_logic::evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(health.is_healthy);
    assert_eq!(health.error_rate, 2.0); // Converted to percentage
    assert_eq!(health.avg_response_time, 25.5);
    assert!(health.last_error.is_none());
  }

  #[test]
  fn test_evaluate_service_health_unhealthy_high_error_rate() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 3600,
      total_operations: 1000,
      total_errors: 60,
      active_operations: 5,
      operations_per_second: 15.0,
      error_rate: 0.06, // 6% > 5%
      operation_metrics: HashMap::new(),
    };

    let health = business_logic::evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(!health.is_healthy); // Unhealthy due to high error rate
    assert_eq!(health.error_rate, 6.0);
  }

  #[test]
  fn test_evaluate_service_health_unhealthy_too_many_active_ops() {
    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 1800,
      total_operations: 2000,
      total_errors: 10,
      active_operations: 150, // > 100
      operations_per_second: 30.0,
      error_rate: 0.005, // 0.5% < 5%
      operation_metrics: HashMap::new(),
    };

    let health = business_logic::evaluate_service_health("test", &summary);

    assert_eq!(health.service_name, "test");
    assert!(!health.is_healthy); // Unhealthy due to too many active operations
    assert_eq!(health.error_rate, 0.5);
  }

  #[test]
  fn test_evaluate_service_health_with_criteria() {
    let summary = create_test_metrics_summary("test");
    let criteria = types::HealthCriteria {
      max_error_rate_percentage: 10.0, // More lenient
      max_active_operations: 3,        // Stricter
      min_operations_per_second: Some(5.0),
      max_response_time_ms: None,
    };

    let health = business_logic::evaluate_service_health_with_criteria("test", &summary, &criteria);

    // Should be unhealthy because active_operations (5) > max_active_operations (3)
    assert!(!health.is_healthy);
  }

  #[test]
  fn test_format_service_performance_data() {
    let mut operation_metrics = HashMap::new();
    operation_metrics.insert(
      "test_operation".to_string(),
      OperationMetrics {
        count: 50,
        errors: 2,
        total_duration_ms: 1000,
        avg_duration_ms: 20.0,
        max_duration_ms: 50,
        min_duration_ms: 10,
        last_operation_time: Some(std::time::SystemTime::now()),
        last_error: Some("Test error".to_string()),
      },
    );

    let summary = MetricsSummary {
      service_name: "test_service".to_string(),
      uptime_seconds: 14400,
      total_operations: 500,
      total_errors: 25,
      active_operations: 15,
      operations_per_second: 12.3,
      error_rate: 0.05,
      operation_metrics,
    };

    let performance_data = business_logic::format_service_performance_data(&summary);

    assert_eq!(performance_data["total_operations"], 500);
    assert_eq!(performance_data["total_errors"], 25);
    assert_eq!(performance_data["active_operations"], 15);
    assert_eq!(performance_data["operations_per_second"], 12.3);
    assert_eq!(performance_data["error_rate"], 5.0); // Converted to percentage
    assert_eq!(performance_data["uptime_seconds"], 14400);

    // Check operation details
    assert!(performance_data["operation_details"].is_object());
    let operation_details = performance_data["operation_details"].as_object().unwrap();
    assert!(operation_details.contains_key("test_operation"));
  }

  #[test]
  fn test_create_service_performance_summary() {
    let summary = create_test_metrics_summary("test_service");
    let perf_summary = business_logic::create_service_performance_summary("test", &summary);

    assert_eq!(perf_summary.service_name, "test");
    assert_eq!(perf_summary.total_operations, 100);
    assert_eq!(perf_summary.total_errors, 3);
    assert_eq!(perf_summary.active_operations, 5);
    assert_eq!(perf_summary.operations_per_second, 10.5);
    assert_eq!(perf_summary.error_rate_percentage, 3.0);
    assert_eq!(perf_summary.uptime_seconds, 3600);
  }

  #[test]
  fn test_collect_all_metrics_summaries() {
    let service_getter = |service_name: &str| -> Option<MetricsSummary> {
      match service_name {
        "render" | "cache" => Some(create_test_metrics_summary(service_name)),
        _ => None,
      }
    };

    let summaries = business_logic::collect_all_metrics_summaries(service_getter);

    assert_eq!(summaries.len(), 2);
    assert!(summaries.contains_key("render"));
    assert!(summaries.contains_key("cache"));
    assert!(!summaries.contains_key("gpu"));
  }

  #[test]
  fn test_create_health_check_result() {
    let services = vec![
      types::ServiceHealth {
        service_name: "service1".to_string(),
        is_healthy: true,
        error_rate: 1.0,
        avg_response_time: 10.0,
        last_error: None,
      },
      types::ServiceHealth {
        service_name: "service2".to_string(),
        is_healthy: false,
        error_rate: 8.0,
        avg_response_time: 5.0,
        last_error: Some("Error".to_string()),
      },
    ];

    let result = business_logic::create_health_check_result(services);

    assert!(!result.overall_healthy); // One service is unhealthy
    assert_eq!(result.services.len(), 2);
    assert!(result.timestamp <= chrono::Utc::now());
  }

  #[test]
  fn test_should_reset_service_metrics() {
    // Test reset_all = true
    let params_reset_all = types::MetricsResetParams {
      reset_all: true,
      service_names: None,
      preserve_history: false,
    };
    assert!(business_logic::should_reset_service_metrics(
      "render",
      &params_reset_all
    ));

    // Test specific service names
    let params_specific = types::MetricsResetParams {
      reset_all: false,
      service_names: Some(vec!["render".to_string(), "cache".to_string()]),
      preserve_history: false,
    };
    assert!(business_logic::should_reset_service_metrics(
      "render",
      &params_specific
    ));
    assert!(business_logic::should_reset_service_metrics(
      "cache",
      &params_specific
    ));
    assert!(!business_logic::should_reset_service_metrics(
      "gpu",
      &params_specific
    ));

    // Test no reset
    let params_no_reset = types::MetricsResetParams::default();
    assert!(!business_logic::should_reset_service_metrics(
      "render",
      &params_no_reset
    ));
  }

  #[test]
  fn test_validate_prometheus_export_params() {
    // Valid params
    let valid_params = types::PrometheusExportParams::default();
    assert!(business_logic::validate_prometheus_export_params(&valid_params).is_ok());

    // Empty prefix
    let empty_prefix = types::PrometheusExportParams {
      metric_prefix: "".to_string(),
      ..Default::default()
    };
    assert!(business_logic::validate_prometheus_export_params(&empty_prefix).is_err());

    // Invalid characters in prefix
    let invalid_prefix = types::PrometheusExportParams {
      metric_prefix: "invalid-prefix".to_string(),
      ..Default::default()
    };
    assert!(business_logic::validate_prometheus_export_params(&invalid_prefix).is_err());
  }

  #[test]
  fn test_validate_health_criteria() {
    // Valid criteria
    let valid_criteria = types::HealthCriteria::default();
    assert!(business_logic::validate_health_criteria(&valid_criteria).is_ok());

    // Invalid error rate
    let invalid_error_rate = types::HealthCriteria {
      max_error_rate_percentage: 150.0,
      ..Default::default()
    };
    assert!(business_logic::validate_health_criteria(&invalid_error_rate).is_err());

    // Invalid operations per second
    let invalid_ops = types::HealthCriteria {
      min_operations_per_second: Some(-5.0),
      ..Default::default()
    };
    assert!(business_logic::validate_health_criteria(&invalid_ops).is_err());
  }

  #[test]
  fn test_service_type_conversion() {
    // Test from_string
    assert!(matches!(
      types::ServiceType::from_string("render"),
      Some(types::ServiceType::Render)
    ));
    assert!(matches!(
      types::ServiceType::from_string("cache"),
      Some(types::ServiceType::Cache)
    ));
    assert!(types::ServiceType::from_string("invalid").is_none());

    // Test to_string
    assert_eq!(types::ServiceType::Render.to_string(), "render");
    assert_eq!(types::ServiceType::Cache.to_string(), "cache");

    // Test all_services
    let all = types::ServiceType::all_services();
    assert_eq!(all.len(), 6);
    assert!(all.contains(&"render"));
  }
}
