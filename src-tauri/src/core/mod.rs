//! Core infrastructure modules for Timeline Studio

pub mod di;
pub mod events;
pub mod performance;
pub mod plugins;
pub mod serde_helpers; // 🔧 Serde serialization helpers
pub mod telemetry;
pub mod validation; // 🔒 Input validation utilities

#[cfg(test)]
pub mod test_utils;

// Re-export only when fully implemented
#[allow(unused_imports)]
pub use di::{Service, ServiceContainer, ServiceProvider};
#[allow(unused_imports)]
pub use events::{AppEvent, EventBus, EventHandler};
#[allow(unused_imports)]
pub use performance::{
  AudioZeroCopy, CacheConfig, CacheManager, DataType, MemoryManager, RuntimeConfig, RuntimeManager,
  VideoZeroCopy, ZeroCopyBuffer, ZeroCopyManager,
};
#[allow(unused_imports)]
pub use plugins::{
  AppEventType, Plugin, PluginCommand, PluginContext, PluginDependency, PluginManager,
  PluginMetadata, PluginPermissions, PluginResponse, PluginType, SecurityLevel, Version,
};
#[allow(unused_imports)]
pub use telemetry::{
  HealthCheckManager, LogLevel, MetricsCollector, TelemetryConfig, TelemetryConfigBuilder,
  TelemetryManager, Tracer,
};
#[allow(unused_imports)]
pub use validation::{InputValidator, ValidationError, ValidationResult};
