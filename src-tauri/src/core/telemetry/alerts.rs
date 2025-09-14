//! Система алертов для телеметрии
//!
//! Этот модуль предоставляет функциональность для управления алертами
//! на основе метрик и событий телеметрии.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use tracing::{error, info, warn};

/// Уровень серьезности алерта
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AlertSeverity {
  /// Критический алерт
  Critical,
  /// Предупреждение
  Warning,
  /// Информационный алерт
  Info,
}

impl std::fmt::Display for AlertSeverity {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      AlertSeverity::Critical => write!(f, "CRITICAL"),
      AlertSeverity::Warning => write!(f, "WARNING"),
      AlertSeverity::Info => write!(f, "INFO"),
    }
  }
}

/// Правило алерта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
  /// Уникальный идентификатор правила
  pub id: String,
  /// Название правила
  pub name: String,
  /// Описание правила
  pub description: String,
  /// Метрика для мониторинга
  pub metric_name: String,
  /// Условие срабатывания (например, "> 0.8")
  pub condition: String,
  /// Пороговое значение
  pub threshold: f64,
  /// Уровень серьезности
  pub severity: AlertSeverity,
  /// Включено ли правило
  pub enabled: bool,
  /// Интервал проверки
  pub check_interval: Duration,
  /// Время ожидания перед повторным алертом
  pub cooldown: Duration,
}

impl AlertRule {
  /// Создает новое правило алерта
  pub fn new(
    id: String,
    name: String,
    metric_name: String,
    condition: String,
    threshold: f64,
    severity: AlertSeverity,
  ) -> Self {
    Self {
      id,
      name,
      description: String::new(),
      metric_name,
      condition,
      threshold,
      severity,
      enabled: true,
      check_interval: Duration::from_secs(60),
      cooldown: Duration::from_secs(300),
    }
  }

  /// Проверяет, срабатывает ли правило для данного значения
  pub fn evaluate(&self, value: f64) -> bool {
    if !self.enabled {
      return false;
    }

    match self.condition.as_str() {
      ">" => value > self.threshold,
      ">=" => value >= self.threshold,
      "<" => value < self.threshold,
      "<=" => value <= self.threshold,
      "==" => (value - self.threshold).abs() < f64::EPSILON,
      "!=" => (value - self.threshold).abs() >= f64::EPSILON,
      _ => {
        warn!("Unknown condition: {}", self.condition);
        false
      }
    }
  }
}

/// Активный алерт
#[derive(Debug, Clone)]
pub struct Alert {
  /// Правило, которое вызвало алерт
  pub rule: AlertRule,
  /// Значение метрики, которое вызвало алерт
  pub value: f64,
  /// Время создания алерта
  pub timestamp: Instant,
  /// Сообщение алерта
  pub message: String,
}

impl Alert {
  /// Создает новый алерт
  pub fn new(rule: AlertRule, value: f64, message: String) -> Self {
    Self {
      rule,
      value,
      timestamp: Instant::now(),
      message,
    }
  }
}

/// Менеджер алертов
#[derive(Debug)]
pub struct AlertManager {
  /// Правила алертов
  rules: Arc<Mutex<HashMap<String, AlertRule>>>,
  /// Активные алерты
  active_alerts: Arc<Mutex<HashMap<String, Alert>>>,
  /// Время последней проверки для каждого правила
  last_check: Arc<Mutex<HashMap<String, Instant>>>,
  /// Время последнего алерта для каждого правила (для cooldown)
  last_alert: Arc<Mutex<HashMap<String, Instant>>>,
  /// Канал для отправки алертов
  alert_sender: Option<mpsc::UnboundedSender<Alert>>,
}

impl AlertManager {
  /// Создает новый менеджер алертов
  pub fn new() -> Self {
    Self {
      rules: Arc::new(Mutex::new(HashMap::new())),
      active_alerts: Arc::new(Mutex::new(HashMap::new())),
      last_check: Arc::new(Mutex::new(HashMap::new())),
      last_alert: Arc::new(Mutex::new(HashMap::new())),
      alert_sender: None,
    }
  }

  /// Создает новый менеджер алертов с каналом для уведомлений
  pub fn with_channel() -> (Self, mpsc::UnboundedReceiver<Alert>) {
    let (sender, receiver) = mpsc::unbounded_channel();
    let mut manager = Self::new();
    manager.alert_sender = Some(sender);
    (manager, receiver)
  }

  /// Добавляет правило алерта
  pub fn add_rule(&self, rule: AlertRule) -> Result<(), String> {
    let mut rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if rules.contains_key(&rule.id) {
      return Err(format!("Rule with id '{}' already exists", rule.id));
    }
    
    info!("Adding alert rule: {} ({})", rule.name, rule.id);
    rules.insert(rule.id.clone(), rule);
    Ok(())
  }

  /// Удаляет правило алерта
  pub fn remove_rule(&self, rule_id: &str) -> Result<(), String> {
    let mut rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if rules.remove(rule_id).is_some() {
      info!("Removed alert rule: {}", rule_id);
      
      // Также удаляем связанные данные
      if let Ok(mut last_check) = self.last_check.lock() {
        last_check.remove(rule_id);
      }
      if let Ok(mut last_alert) = self.last_alert.lock() {
        last_alert.remove(rule_id);
      }
      if let Ok(mut active_alerts) = self.active_alerts.lock() {
        active_alerts.remove(rule_id);
      }
      
      Ok(())
    } else {
      Err(format!("Rule with id '{}' not found", rule_id))
    }
  }

  /// Получает все правила
  pub fn get_rules(&self) -> Result<Vec<AlertRule>, String> {
    let rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(rules.values().cloned().collect())
  }

  /// Получает правило по ID
  pub fn get_rule(&self, rule_id: &str) -> Result<Option<AlertRule>, String> {
    let rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(rules.get(rule_id).cloned())
  }

  /// Включает или выключает правило
  pub fn set_rule_enabled(&self, rule_id: &str, enabled: bool) -> Result<(), String> {
    let mut rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(rule) = rules.get_mut(rule_id) {
      rule.enabled = enabled;
      info!("Rule '{}' {}", rule_id, if enabled { "enabled" } else { "disabled" });
      Ok(())
    } else {
      Err(format!("Rule with id '{}' not found", rule_id))
    }
  }

  /// Проверяет метрику против всех правил
  pub fn check_metric(&self, metric_name: &str, value: f64) -> Result<(), String> {
    let rules = self.rules.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = Instant::now();
    
    for rule in rules.values() {
      if rule.metric_name != metric_name || !rule.enabled {
        continue;
      }
      
      // Проверяем интервал проверки
      if let Ok(mut last_check) = self.last_check.lock() {
        if let Some(last) = last_check.get(&rule.id) {
          if now.duration_since(*last) < rule.check_interval {
            continue;
          }
        }
        last_check.insert(rule.id.clone(), now);
      }
      
      // Проверяем условие
      if rule.evaluate(value) {
        // Проверяем cooldown
        let should_alert = if let Ok(last_alert) = self.last_alert.lock() {
          if let Some(last) = last_alert.get(&rule.id) {
            now.duration_since(*last) >= rule.cooldown
          } else {
            true
          }
        } else {
          true
        };
        
        if should_alert {
          self.trigger_alert(rule.clone(), value)?;
        }
      } else {
        // Если условие не выполняется, удаляем активный алерт
        if let Ok(mut active_alerts) = self.active_alerts.lock() {
          if active_alerts.remove(&rule.id).is_some() {
            info!("Alert resolved: {} ({})", rule.name, rule.id);
          }
        }
      }
    }
    
    Ok(())
  }

  /// Запускает алерт
  fn trigger_alert(&self, rule: AlertRule, value: f64) -> Result<(), String> {
    let message = format!(
      "Alert: {} - {} {} {} (current: {})",
      rule.name, rule.metric_name, rule.condition, rule.threshold, value
    );
    
    let alert = Alert::new(rule.clone(), value, message.clone());
    
    // Логируем алерт
    match rule.severity {
      AlertSeverity::Critical => error!("{}", message),
      AlertSeverity::Warning => warn!("{}", message),
      AlertSeverity::Info => info!("{}", message),
    }
    
    // Сохраняем активный алерт
    if let Ok(mut active_alerts) = self.active_alerts.lock() {
      active_alerts.insert(rule.id.clone(), alert.clone());
    }
    
    // Обновляем время последнего алерта
    if let Ok(mut last_alert) = self.last_alert.lock() {
      last_alert.insert(rule.id.clone(), Instant::now());
    }
    
    // Отправляем алерт через канал, если он настроен
    if let Some(sender) = &self.alert_sender {
      if let Err(e) = sender.send(alert) {
        error!("Failed to send alert: {}", e);
      }
    }
    
    Ok(())
  }

  /// Получает все активные алерты
  pub fn get_active_alerts(&self) -> Result<Vec<Alert>, String> {
    let active_alerts = self.active_alerts.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(active_alerts.values().cloned().collect())
  }

  /// Получает количество активных алертов по уровню серьезности
  pub fn get_alert_counts(&self) -> Result<HashMap<AlertSeverity, usize>, String> {
    let active_alerts = self.active_alerts.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut counts = HashMap::new();
    
    for alert in active_alerts.values() {
      *counts.entry(alert.rule.severity).or_insert(0) += 1;
    }
    
    Ok(counts)
  }

  /// Очищает все активные алерты
  pub fn clear_alerts(&self) -> Result<(), String> {
    let mut active_alerts = self.active_alerts.lock().map_err(|e| format!("Lock error: {}", e))?;
    let count = active_alerts.len();
    active_alerts.clear();
    info!("Cleared {} active alerts", count);
    Ok(())
  }
}

impl Default for AlertManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_alert_rule_creation() {
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    assert_eq!(rule.id, "test_rule");
    assert_eq!(rule.name, "Test Rule");
    assert_eq!(rule.metric_name, "cpu_usage");
    assert_eq!(rule.threshold, 0.8);
    assert_eq!(rule.severity, AlertSeverity::Warning);
    assert!(rule.enabled);
  }

  #[test]
  fn test_alert_rule_evaluation() {
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    assert!(rule.evaluate(0.9));
    assert!(!rule.evaluate(0.7));
    assert!(!rule.evaluate(0.8));
  }

  #[test]
  fn test_alert_manager_add_remove_rules() {
    let manager = AlertManager::new();
    
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    // Добавляем правило
    assert!(manager.add_rule(rule.clone()).is_ok());
    
    // Проверяем, что правило добавлено
    let rules = manager.get_rules().unwrap();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].id, "test_rule");
    
    // Удаляем правило
    assert!(manager.remove_rule("test_rule").is_ok());
    
    // Проверяем, что правило удалено
    let rules = manager.get_rules().unwrap();
    assert_eq!(rules.len(), 0);
  }

  #[test]
  fn test_alert_severity_display() {
    assert_eq!(AlertSeverity::Critical.to_string(), "CRITICAL");
    assert_eq!(AlertSeverity::Warning.to_string(), "WARNING");
    assert_eq!(AlertSeverity::Info.to_string(), "INFO");
  }

  #[test]
  fn test_alert_rule_different_conditions() {
    let rule_gt = AlertRule::new(
      "gt_rule".to_string(),
      "Greater Than Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    let rule_lt = AlertRule::new(
      "lt_rule".to_string(),
      "Less Than Rule".to_string(),
      "memory_free".to_string(),
      "<".to_string(),
      0.2,
      AlertSeverity::Critical,
    );
    
    let rule_eq = AlertRule::new(
      "eq_rule".to_string(),
      "Equal Rule".to_string(),
      "status".to_string(),
      "==".to_string(),
      1.0,
      AlertSeverity::Info,
    );
    
    // Тестируем условие >
    assert!(rule_gt.evaluate(0.9));
    assert!(!rule_gt.evaluate(0.7));
    
    // Тестируем условие <
    assert!(rule_lt.evaluate(0.1));
    assert!(!rule_lt.evaluate(0.3));
    
    // Тестируем условие ==
    assert!(rule_eq.evaluate(1.0));
    assert!(!rule_eq.evaluate(0.9));
  }

  #[test]
  fn test_alert_manager_check_metric() {
    let manager = AlertManager::new();
    
    let rule = AlertRule::new(
      "cpu_rule".to_string(),
      "CPU Usage Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    manager.add_rule(rule).unwrap();
    
    // Проверяем метрику, которая должна вызвать алерт
    assert!(manager.check_metric("cpu_usage", 0.9).is_ok());
    
    // Проверяем метрику, которая не должна вызвать алерт
    assert!(manager.check_metric("cpu_usage", 0.7).is_ok());
    
    // Проверяем несуществующую метрику
    assert!(manager.check_metric("unknown_metric", 0.5).is_ok());
  }

  #[test]
  fn test_alert_manager_enable_disable_rule() {
    let manager = AlertManager::new();
    
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    manager.add_rule(rule).unwrap();
    
    // Отключаем правило
    assert!(manager.set_rule_enabled("test_rule", false).is_ok());
    
    let rule = manager.get_rule("test_rule").unwrap().unwrap();
    assert!(!rule.enabled);
    
    // Включаем правило обратно
    assert!(manager.set_rule_enabled("test_rule", true).is_ok());
    
    let rule = manager.get_rule("test_rule").unwrap().unwrap();
    assert!(rule.enabled);
    
    // Пытаемся изменить несуществующее правило
    assert!(manager.set_rule_enabled("nonexistent", true).is_err());
  }

  #[test]
  fn test_alert_manager_get_alert_counts() {
    let manager = AlertManager::new();
    
    // Добавляем правила разной серьезности
    let critical_rule = AlertRule::new(
      "critical_rule".to_string(),
      "Critical Rule".to_string(),
      "disk_usage".to_string(),
      ">".to_string(),
      0.95,
      AlertSeverity::Critical,
    );
    
    let warning_rule = AlertRule::new(
      "warning_rule".to_string(),
      "Warning Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    manager.add_rule(critical_rule).unwrap();
    manager.add_rule(warning_rule).unwrap();
    
    // Вызываем алерты
    manager.check_metric("disk_usage", 0.97).unwrap();
    manager.check_metric("cpu_usage", 0.85).unwrap();
    
    let counts = manager.get_alert_counts().unwrap();
    
    // Проверяем, что счетчики корректны
    assert!(counts.contains_key(&AlertSeverity::Critical));
    assert!(counts.contains_key(&AlertSeverity::Warning));
  }

  #[test]
  fn test_alert_creation() {
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    let alert = Alert::new(rule.clone(), 0.9, "CPU usage is high".to_string());
    
    assert_eq!(alert.rule.id, "test_rule");
    assert_eq!(alert.value, 0.9);
    assert_eq!(alert.message, "CPU usage is high");
  }

  #[test]
  fn test_alert_manager_clear_alerts() {
    let manager = AlertManager::new();
    
    let rule = AlertRule::new(
      "test_rule".to_string(),
      "Test Rule".to_string(),
      "cpu_usage".to_string(),
      ">".to_string(),
      0.8,
      AlertSeverity::Warning,
    );
    
    manager.add_rule(rule).unwrap();
    manager.check_metric("cpu_usage", 0.9).unwrap();
    
    // Проверяем, что есть активные алерты
    let alerts = manager.get_active_alerts().unwrap();
    assert!(!alerts.is_empty());
    
    // Очищаем алерты
    assert!(manager.clear_alerts().is_ok());
    
    // Проверяем, что алерты очищены
    let alerts = manager.get_active_alerts().unwrap();
    assert!(alerts.is_empty());
  }
}