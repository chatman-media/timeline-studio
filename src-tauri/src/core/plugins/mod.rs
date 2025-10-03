//! Plugin System для Timeline Studio
//!
//! Система плагинов позволяет расширять функциональность приложения
//! без изменения основного кода.

pub mod api;
pub mod api_factory;
pub mod commands;
pub mod context;
pub mod examples;
pub mod loader;
pub mod manager;
pub mod permissions;
pub mod plugin;
pub mod sandbox;
pub mod services;

#[cfg(test)]
pub mod integration_tests;

#[cfg(test)]
pub mod integration_tests_real_services;

pub use context::PluginContext;
pub use examples::{register_example_plugins, BlurEffectPlugin, YouTubeUploaderPlugin};
pub use manager::PluginManager;
pub use permissions::{PluginPermissions, SecurityLevel};
pub use plugin::{
  AppEventType, Plugin, PluginCommand, PluginDependency, PluginMetadata, PluginResponse,
  PluginType, Version,
};
pub use services::{MediaBridge, TimelineBridge, UIBridge};
