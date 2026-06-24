//! Примеры плагинов для Timeline Studio

pub mod blur_effect_simple;
pub mod youtube_uploader_simple;

pub use blur_effect_simple::BlurEffectPlugin;
pub use youtube_uploader_simple::YouTubeUploaderPlugin;

/// Регистрирует все примеры плагинов в реестре
pub async fn register_example_plugins(
  registry: &crate::plugins::loader::PluginRegistry,
) -> ts_render::video_compiler::error::Result<()> {
  use crate::plugins::loader::{PluginFactory, PluginRegistration};
  use crate::plugins::plugin::Plugin;

  // Регистрируем BlurEffect плагин
  {
    let plugin = BlurEffectPlugin::default();
    let metadata = plugin.metadata().clone();
    let factory: PluginFactory = Box::new(|| Box::new(BlurEffectPlugin::default()));
    let registration = PluginRegistration { metadata, factory };
    registry.register(registration).await?;
  }

  // Регистрируем YouTubeUploader плагин
  {
    let plugin = YouTubeUploaderPlugin::default();
    let metadata = plugin.metadata().clone();
    let factory: PluginFactory = Box::new(|| Box::new(YouTubeUploaderPlugin::default()));
    let registration = PluginRegistration { metadata, factory };
    registry.register(registration).await?;
  }

  log::info!("Registered {} example plugins", 2);

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::plugins::loader::PluginRegistry;

  #[tokio::test]
  async fn test_register_example_plugins() {
    let registry = PluginRegistry::new();

    // Регистрация должна пройти успешно
    assert!(register_example_plugins(&registry).await.is_ok());

    // Проверяем что плагины зарегистрированы
    let plugins = registry.list_plugins().await;
    assert_eq!(plugins.len(), 2);

    // Проверяем конкретные плагины
    assert!(registry.find_plugin("blur-effect").await.is_some());
    assert!(registry.find_plugin("youtube-uploader").await.is_some());
  }
}
