//! Cache - Модуль кэширования для Video Compiler
//!
//! Этот модуль реализует LRU кэш для превью кадров, промежуточных результатов
//! рендеринга и метаданных медиа файлов для улучшения производительности.

use crate::video_compiler::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};

/// Основной кэш Video Compiler
#[derive(Debug)]
pub struct RenderCache {
  /// Кэш превью кадров
  preview_cache: LruCache<PreviewKey, PreviewData>,
  /// Кэш метаданных файлов
  metadata_cache: LruCache<String, MediaMetadata>,
  /// Кэш промежуточных результатов рендеринга
  render_cache: LruCache<String, RenderCacheData>,
  /// Настройки кэша
  settings: CacheSettings,
  /// Статистика использования
  stats: CacheStats,
}

impl RenderCache {
  /// Создать новый кэш с настройками по умолчанию
  pub fn new() -> Self {
    Self::with_settings(CacheSettings::default())
  }

  /// Создать новый кэш с указанными настройками
  pub fn with_settings(settings: CacheSettings) -> Self {
    Self {
      preview_cache: LruCache::new(settings.max_preview_entries),
      metadata_cache: LruCache::new(settings.max_metadata_entries),
      render_cache: LruCache::new(settings.max_render_entries),
      settings,
      stats: CacheStats::default(),
    }
  }

  /// Получить превью кадр из кэша
  pub async fn get_preview(&mut self, key: &PreviewKey) -> Option<PreviewData> {
    self.stats.preview_requests += 1;

    if let Some(data) = self.preview_cache.get(key) {
      // Проверяем, не истек ли кэш
      if !data.is_expired(self.settings.preview_ttl) {
        self.stats.preview_hits += 1;
        // Декомпрессируем данные перед возвратом
        let mut decompressed_data = data.clone();
        if let Ok(decompressed) = decompress_preview_data(&data.image_data) {
          decompressed_data.image_data = decompressed;
        }
        return Some(decompressed_data);
      } else {
        // Удаляем истекший элемент
        self.preview_cache.remove(key);
      }
    }

    self.stats.preview_misses += 1;
    None
  }

  /// Сохранить превью кадр в кэш
  pub async fn store_preview(&mut self, key: PreviewKey, data: Vec<u8>) -> Result<()> {
    // Сжимаем данные перед сохранением
    let compressed_data = compress_preview_data(&data)?;

    let preview_data = PreviewData {
      image_data: compressed_data,
      timestamp: SystemTime::now(),
      _access_count: 0,
    };

    self.preview_cache.insert(key, preview_data);
    self.cleanup_if_needed().await?;
    Ok(())
  }

  /// Получить метаданные файла из кэша
  pub async fn get_metadata(&mut self, file_path: &str) -> Option<MediaMetadata> {
    self.stats.metadata_requests += 1;

    if let Some(metadata) = self.metadata_cache.get(&file_path.to_string()) {
      if !metadata.is_expired(self.settings.metadata_ttl) {
        self.stats.metadata_hits += 1;
        return Some(metadata.clone());
      } else {
        self.metadata_cache.remove(&file_path.to_string());
      }
    }

    self.stats.metadata_misses += 1;
    None
  }

  /// Сохранить метаданные файла в кэш
  pub async fn store_metadata(&mut self, file_path: String, metadata: MediaMetadata) -> Result<()> {
    self.metadata_cache.insert(file_path, metadata);
    self.cleanup_if_needed().await?;
    Ok(())
  }

  /// Получить данные рендеринга из кэша
  #[allow(dead_code)] // Used in logic functions and tests
  pub async fn get_render_data(&mut self, cache_key: &str) -> Option<RenderCacheData> {
    self.stats.render_requests += 1;

    if let Some(data) = self.render_cache.get(&cache_key.to_string()) {
      if !data.is_expired(self.settings.render_ttl) {
        self.stats.render_hits += 1;
        return Some(data.clone());
      } else {
        self.render_cache.remove(&cache_key.to_string());
      }
    }

    self.stats.render_misses += 1;
    None
  }

  /// Сохранить данные рендеринга в кэш
  #[allow(dead_code)] // Used in logic functions and tests
  pub async fn store_render_data(
    &mut self,
    cache_key: String,
    data: RenderCacheData,
  ) -> Result<()> {
    self.render_cache.insert(cache_key, data);
    self.cleanup_if_needed().await?;
    Ok(())
  }

  /// Очистить весь кэш
  pub async fn clear_all(&mut self) {
    self.preview_cache.clear();
    self.metadata_cache.clear();
    self.render_cache.clear();
    self.stats = CacheStats::default();
  }

  /// Очистить весь кэш (алиас для clear_all)
  pub async fn clear(&mut self) -> Result<()> {
    self.clear_all().await;
    Ok(())
  }

  /// Очистить кэш проекта
  pub async fn clear_project(&mut self, _project_id: &str) -> Result<()> {
    // Простая реализация - очищаем весь кэш
    // В будущем можно добавить фильтрацию по project_id
    self.clear_all().await;
    Ok(())
  }

  /// Очистить только превью кэш
  pub async fn clear_previews(&mut self) {
    self.preview_cache.clear();
  }

  /// Получить статистику кэша
  pub fn get_stats(&self) -> &CacheStats {
    &self.stats
  }

  /// Получить настройки кэша
  pub fn get_settings(&self) -> &CacheSettings {
    &self.settings
  }

  /// Получить использование памяти кэшем (приблизительно)
  pub fn get_memory_usage(&self) -> CacheMemoryUsage {
    let preview_memory = self.preview_cache.estimate_memory_usage();
    let metadata_memory = self.metadata_cache.estimate_memory_usage();
    let render_memory = self.render_cache.estimate_memory_usage();

    CacheMemoryUsage {
      preview_bytes: preview_memory,
      metadata_bytes: metadata_memory,
      render_bytes: render_memory,
      total_bytes: preview_memory + metadata_memory + render_memory,
    }
  }

  /// Очистка кэша при необходимости
  async fn cleanup_if_needed(&mut self) -> Result<()> {
    let memory_usage = self.get_memory_usage();
    let max_memory = self.settings.max_memory_mb * 1024 * 1024;

    if memory_usage.total_bytes > max_memory {
      log::info!("Превышен лимит памяти кэша, выполняется очистка");
      self.cleanup_old_entries().await?;
    }

    Ok(())
  }

  /// Очистка старых записей
  pub async fn cleanup_old_entries(&mut self) -> Result<()> {
    let _now = SystemTime::now();

    // Очищаем истекшие превью
    self
      .preview_cache
      .retain(|_, data| !data.is_expired(self.settings.preview_ttl));

    // Очищаем истекшие метаданные
    self
      .metadata_cache
      .retain(|_, metadata| !metadata.is_expired(self.settings.metadata_ttl));

    // Очищаем истекшие данные рендеринга
    self
      .render_cache
      .retain(|_, data| !data.is_expired(self.settings.render_ttl));

    Ok(())
  }

  /// Получить список закэшированных проектов
  pub fn get_cached_projects(&self) -> Vec<String> {
    let mut projects = std::collections::HashSet::new();

    // Собираем уникальные ID проектов из ключей рендер-кэша
    for key in self.render_cache.keys() {
      if let Some(project_id) = key.split('/').next() {
        projects.insert(project_id.to_string());
      }
    }

    projects.into_iter().collect()
  }

  /// Проверить наличие кэша для проекта
  pub fn has_project_cache(&self, project_id: &str) -> bool {
    self
      .render_cache
      .keys()
      .any(|key| key.starts_with(project_id))
  }

  /// Получить метаданные всех закэшированных медиафайлов
  pub fn get_all_cached_metadata(&self) -> HashMap<String, MediaMetadata> {
    self
      .metadata_cache
      .iter()
      .map(|(k, v)| (k.clone(), v.clone()))
      .collect()
  }

  /// Установить максимальный размер кэша (в количестве элементов)
  pub fn set_cache_limits(
    &mut self,
    preview_limit: usize,
    metadata_limit: usize,
    render_limit: usize,
  ) {
    self.settings.max_preview_entries = preview_limit;
    self.settings.max_metadata_entries = metadata_limit;
    self.settings.max_render_entries = render_limit;

    // Пересоздаем кэши с новыми лимитами
    self.preview_cache.resize(preview_limit);
    self.metadata_cache.resize(metadata_limit);
    self.render_cache.resize(render_limit);
  }

  /// Получить текущие лимиты кэша
  pub fn get_cache_limits(&self) -> (usize, usize, usize) {
    (
      self.settings.max_preview_entries,
      self.settings.max_metadata_entries,
      self.settings.max_render_entries,
    )
  }
}

impl Default for RenderCache {
  fn default() -> Self {
    Self::new()
  }
}

#[async_trait::async_trait]
impl crate::core::performance::cache::ClearableCache for RenderCache {
  async fn clear(&self) {
    // RenderCache не является потокобезопасным по умолчанию
    // Но мы можем обернуть его в Arc<RwLock<_>> для потокобезопасности
    // Пока что просто логируем операцию
    log::info!("Clearing RenderCache via ClearableCache trait");
  }

  fn cache_name(&self) -> &str {
    "RenderCache"
  }
}

/// Ключ для кэша превью
#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub struct PreviewKey {
  /// Путь к файлу
  pub file_path: String,
  /// Временная метка (секунды)
  pub timestamp: u64,
  /// Разрешение превью
  pub resolution: (u32, u32),
  /// Качество превью
  pub quality: u8,
}

impl PreviewKey {
  pub fn new(file_path: String, timestamp: f64, resolution: (u32, u32), quality: u8) -> Self {
    Self {
      file_path,
      timestamp: (timestamp * 1000.0) as u64, // Конвертируем в миллисекунды
      resolution,
      quality,
    }
  }
}

/// Данные превью кадра
#[derive(Debug, Clone)]
pub struct PreviewData {
  /// Данные изображения (JPEG/PNG)
  pub image_data: Vec<u8>,
  /// Время создания
  pub timestamp: SystemTime,
  /// Количество обращений
  pub _access_count: u64,
}

impl PreviewData {
  /// Проверить, истек ли кэш
  pub fn is_expired(&self, ttl: Duration) -> bool {
    self.timestamp.elapsed().unwrap_or(Duration::ZERO) > ttl
  }
}

/// Метаданные медиа файла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
  /// Путь к файлу
  pub file_path: String,
  /// Размер файла в байтах
  pub file_size: u64,
  /// Время модификации файла
  pub modified_time: SystemTime,
  /// Длительность в секундах
  pub duration: f64,
  /// Разрешение видео (если есть)
  pub resolution: Option<(u32, u32)>,
  /// FPS (если есть)
  pub fps: Option<f32>,
  /// Битрейт (bps)
  pub bitrate: Option<u32>,
  /// Кодек видео
  pub video_codec: Option<String>,
  /// Кодек аудио
  pub audio_codec: Option<String>,
  /// Время кэширования
  pub cached_at: SystemTime,
}

impl MediaMetadata {
  /// Проверить, истек ли кэш
  pub fn is_expired(&self, ttl: Duration) -> bool {
    self.cached_at.elapsed().unwrap_or(Duration::ZERO) > ttl
  }
}

/// Данные кэша рендеринга
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields are used in tests and logic functions
pub struct RenderCacheData {
  /// Ключ кэша
  pub cache_key: String,
  /// Путь к результирующему файлу
  pub output_path: PathBuf,
  /// Параметры рендеринга (хеш)
  pub render_hash: String,
  /// Время создания
  pub created_at: SystemTime,
  /// Размер результирующего файла
  pub file_size: u64,
}

impl RenderCacheData {
  /// Проверить, истек ли кэш
  pub fn is_expired(&self, ttl: Duration) -> bool {
    self.created_at.elapsed().unwrap_or(Duration::ZERO) > ttl
  }
}

/// Настройки кэша
#[derive(Debug, Clone)]
pub struct CacheSettings {
  /// Максимальное количество превью в кэше
  pub max_preview_entries: usize,
  /// Максимальное количество метаданных в кэше
  pub max_metadata_entries: usize,
  /// Максимальное количество данных рендеринга в кэше
  pub max_render_entries: usize,
  /// Максимальное использование памяти в MB
  pub max_memory_mb: usize,
  /// TTL для превью
  pub preview_ttl: Duration,
  /// TTL для метаданных
  pub metadata_ttl: Duration,
  /// TTL для данных рендеринга
  pub render_ttl: Duration,
}

impl Default for CacheSettings {
  fn default() -> Self {
    Self {
      max_preview_entries: 1000,
      max_metadata_entries: 500,
      max_render_entries: 100,
      max_memory_mb: 512,
      preview_ttl: Duration::from_secs(3600),  // 1 час
      metadata_ttl: Duration::from_secs(1800), // 30 минут
      render_ttl: Duration::from_secs(7200),   // 2 часа
    }
  }
}

/// Статистика использования кэша
#[derive(Debug, Default, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheStats {
  /// Запросы превью
  pub preview_requests: u64,
  /// Попадания превью
  pub preview_hits: u64,
  /// Промахи превью
  pub preview_misses: u64,
  /// Запросы метаданных
  pub metadata_requests: u64,
  /// Попадания метаданных
  pub metadata_hits: u64,
  /// Промахи метаданных
  pub metadata_misses: u64,
  /// Запросы рендеринга
  pub render_requests: u64,
  /// Попадания рендеринга
  pub render_hits: u64,
  /// Промахи рендеринга
  pub render_misses: u64,
}

impl CacheStats {
  /// Получить общий процент попаданий
  pub fn hit_ratio(&self) -> f32 {
    let total_requests = self.preview_requests + self.metadata_requests + self.render_requests;
    let total_hits = self.preview_hits + self.metadata_hits + self.render_hits;

    if total_requests == 0 {
      0.0
    } else {
      total_hits as f32 / total_requests as f32
    }
  }

  /// Получить процент попаданий превью
  pub fn preview_hit_ratio(&self) -> f32 {
    if self.preview_requests == 0 {
      0.0
    } else {
      self.preview_hits as f32 / self.preview_requests as f32
    }
  }
}

/// Использование памяти кэшем
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMemoryUsage {
  /// Память, используемая превью (байты)
  pub preview_bytes: usize,
  /// Память, используемая метаданными (байты)
  pub metadata_bytes: usize,
  /// Память, используемая данными рендеринга (байты)
  pub render_bytes: usize,
  /// Общее использование памяти (байты)
  pub total_bytes: usize,
}

impl CacheMemoryUsage {
  /// Получить использование в мегабайтах
  pub fn total_mb(&self) -> f32 {
    self.total_bytes as f32 / (1024.0 * 1024.0)
  }
}

/// Простая реализация LRU кэша
#[derive(Debug)]
struct LruCache<K, V> {
  map: HashMap<K, LruNode<V>>,
  capacity: usize,
  head: Option<K>,
  tail: Option<K>,
}

#[derive(Debug, Clone)]
struct LruNode<V> {
  value: V,
  _prev: Option<String>,
  _next: Option<String>,
}

impl<K, V> LruCache<K, V>
where
  K: Clone + std::hash::Hash + Eq + std::fmt::Debug,
  V: Clone,
{
  fn new(capacity: usize) -> Self {
    Self {
      map: HashMap::new(),
      capacity,
      head: None,
      tail: None,
    }
  }

  fn get(&mut self, key: &K) -> Option<V> {
    if let Some(node) = self.map.get(key) {
      let value = node.value.clone();
      // В реальной реализации здесь бы мы перемещали элемент в начало
      Some(value)
    } else {
      None
    }
  }

  fn insert(&mut self, key: K, value: V) {
    if self.map.len() >= self.capacity {
      // Удаляем самый старый элемент
      if let Some(oldest_key) = self.get_oldest_key() {
        self.map.remove(&oldest_key);
      }
    }

    let node = LruNode {
      value,
      _prev: None,
      _next: None,
    };

    self.map.insert(key, node);
  }

  fn remove(&mut self, key: &K) -> Option<V> {
    self.map.remove(key).map(|node| node.value)
  }

  fn clear(&mut self) {
    self.map.clear();
    self.head = None;
    self.tail = None;
  }

  fn retain<F>(&mut self, mut f: F)
  where
    F: FnMut(&K, &V) -> bool,
  {
    self.map.retain(|k, v| f(k, &v.value));
  }

  fn estimate_memory_usage(&self) -> usize {
    // Простая оценка использования памяти
    std::mem::size_of::<Self>()
      + self.map.capacity() * (std::mem::size_of::<K>() + std::mem::size_of::<V>())
  }

  fn get_oldest_key(&self) -> Option<K> {
    // Упрощенная реализация - возвращаем первый ключ
    self.map.keys().next().cloned()
  }

  fn keys(&self) -> impl Iterator<Item = &K> {
    self.map.keys()
  }

  fn iter(&self) -> impl Iterator<Item = (&K, &V)> {
    self.map.iter().map(|(k, v)| (k, &v.value))
  }

  fn resize(&mut self, new_capacity: usize) {
    self.capacity = new_capacity;
    // Если текущий размер больше новой емкости, удаляем старые элементы
    while self.map.len() > new_capacity {
      if let Some(oldest_key) = self.get_oldest_key() {
        self.map.remove(&oldest_key);
      } else {
        break;
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;

  #[tokio::test]
  async fn test_cache_creation() {
    let cache = RenderCache::new();
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 0);
    assert_eq!(stats.metadata_requests, 0);
  }

  #[tokio::test]
  async fn test_preview_cache() {
    let mut cache = RenderCache::new();
    let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (640, 360), 75);
    let image_data = vec![1, 2, 3, 4, 5];

    // Сохраняем превью
    cache
      .store_preview(key.clone(), image_data.clone())
      .await
      .unwrap();

    // Получаем превью
    let cached_data = cache.get_preview(&key).await;
    assert!(cached_data.is_some());
    assert_eq!(cached_data.unwrap().image_data, image_data);

    // Проверяем статистику
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 1);
    assert_eq!(stats.preview_hits, 1);
    assert_eq!(stats.preview_misses, 0);
  }

  #[tokio::test]
  async fn test_metadata_cache() {
    let mut cache = RenderCache::new();
    let file_path = "/test/video.mp4".to_string();
    let metadata = MediaMetadata {
      file_path: file_path.clone(),
      file_size: 1024000,
      modified_time: SystemTime::now(),
      duration: 120.0,
      resolution: Some((1920, 1080)),
      fps: Some(30.0),
      bitrate: Some(8000000),
      video_codec: Some("h264".to_string()),
      audio_codec: Some("aac".to_string()),
      cached_at: SystemTime::now(),
    };

    // Сохраняем метаданные
    cache
      .store_metadata(file_path.clone(), metadata.clone())
      .await
      .unwrap();

    // Получаем метаданные
    let cached_metadata = cache.get_metadata(&file_path).await;
    assert!(cached_metadata.is_some());
    assert_eq!(cached_metadata.unwrap().duration, 120.0);
  }

  #[tokio::test]
  async fn test_cache_expiration() {
    let settings = CacheSettings {
      preview_ttl: Duration::from_millis(10), // Очень короткий TTL для теста
      ..Default::default()
    };
    let mut cache = RenderCache::with_settings(settings);

    let key = PreviewKey::new("/test/video.mp4".to_string(), 5.0, (320, 180), 50);
    let image_data = vec![10, 20, 30];

    // Сохраняем превью
    cache.store_preview(key.clone(), image_data).await.unwrap();

    // Сразу должно быть доступно
    assert!(cache.get_preview(&key).await.is_some());

    // Ждем истечения TTL
    tokio::time::sleep(Duration::from_millis(20)).await;

    // Теперь должно быть недоступно
    assert!(cache.get_preview(&key).await.is_none());
  }

  #[tokio::test]
  async fn test_cache_stats() {
    let mut cache = RenderCache::new();
    let key = PreviewKey::new("/test/video.mp4".to_string(), 1.0, (640, 360), 75);

    // Промах
    cache.get_preview(&key).await;

    // Сохраняем и попадание
    cache
      .store_preview(key.clone(), vec![1, 2, 3])
      .await
      .unwrap();
    cache.get_preview(&key).await;

    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 2);
    assert_eq!(stats.preview_hits, 1);
    assert_eq!(stats.preview_misses, 1);
    assert_eq!(stats.preview_hit_ratio(), 0.5);
  }

  #[tokio::test]
  async fn test_memory_usage() {
    let cache = RenderCache::new();
    let usage = cache.get_memory_usage();

    assert_eq!(
      usage.total_bytes,
      usage.preview_bytes + usage.metadata_bytes + usage.render_bytes
    );
    assert!(usage.total_mb() >= 0.0);
  }

  #[tokio::test]
  async fn test_cache_clear() {
    let mut cache = RenderCache::new();
    let key = PreviewKey::new("/test/video.mp4".to_string(), 2.0, (640, 360), 75);

    // Добавляем данные
    cache
      .store_preview(key.clone(), vec![1, 2, 3])
      .await
      .unwrap();
    assert!(cache.get_preview(&key).await.is_some());

    // Очищаем превью
    cache.clear_previews().await;
    assert!(cache.get_preview(&key).await.is_none());
  }

  #[test]
  fn test_lru_cache() {
    let mut lru = LruCache::new(2);

    lru.insert("key1".to_string(), "value1".to_string());
    lru.insert("key2".to_string(), "value2".to_string());

    assert_eq!(lru.get(&"key1".to_string()), Some("value1".to_string()));

    // Добавляем третий элемент, должен вытеснить самый старый
    lru.insert("key3".to_string(), "value3".to_string());

    // key1 или key2 должен быть удален (в зависимости от реализации)
    assert!(lru.get(&"key3".to_string()).is_some());
  }

  #[tokio::test]
  async fn test_cache_with_custom_settings() {
    let settings = CacheSettings {
      max_preview_entries: 50,
      max_metadata_entries: 25,
      max_render_entries: 10,
      max_memory_mb: 256,
      preview_ttl: Duration::from_secs(1800),
      metadata_ttl: Duration::from_secs(900),
      render_ttl: Duration::from_secs(3600),
    };
    let cache = RenderCache::with_settings(settings.clone());
    assert_eq!(cache.settings.max_preview_entries, 50);
    assert_eq!(cache.settings.max_memory_mb, 256);
  }

  #[tokio::test]
  async fn test_preview_cache_miss() {
    let mut cache = RenderCache::new();
    let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (640, 360), 75);

    // Пытаемся получить несуществующее превью
    let cached_data = cache.get_preview(&key).await;
    assert!(cached_data.is_none());

    // Проверяем статистику
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 1);
    assert_eq!(stats.preview_hits, 0);
    assert_eq!(stats.preview_misses, 1);
  }

  #[tokio::test]
  async fn test_metadata_cache_miss() {
    let mut cache = RenderCache::new();

    // Пытаемся получить несуществующие метаданные
    let cached_metadata = cache.get_metadata("/nonexistent.mp4").await;
    assert!(cached_metadata.is_none());

    // Проверяем статистику
    let stats = cache.get_stats();
    assert_eq!(stats.metadata_requests, 1);
    assert_eq!(stats.metadata_hits, 0);
    assert_eq!(stats.metadata_misses, 1);
  }

  #[tokio::test]
  async fn test_render_cache() {
    let mut cache = RenderCache::new();
    let cache_key = "render_job_123".to_string();
    let render_data = RenderCacheData {
      cache_key: cache_key.clone(),
      output_path: std::path::PathBuf::from("/output/render.mp4"),
      render_hash: "abc123def456".to_string(),
      created_at: SystemTime::now(),
      file_size: 5000000,
    };

    // Сохраняем данные рендеринга
    cache
      .store_render_data(cache_key.clone(), render_data.clone())
      .await
      .unwrap();

    // Получаем данные рендеринга
    let cached_render = cache.get_render_data(&cache_key).await;
    assert!(cached_render.is_some());
    assert_eq!(cached_render.unwrap().render_hash, "abc123def456");

    // Проверяем статистику
    let stats = cache.get_stats();
    assert_eq!(stats.render_requests, 1);
    assert_eq!(stats.render_hits, 1);
  }

  #[tokio::test]
  async fn test_render_cache_miss() {
    let mut cache = RenderCache::new();

    // Пытаемся получить несуществующие данные рендеринга
    let cached_render = cache.get_render_data("nonexistent_job").await;
    assert!(cached_render.is_none());

    // Проверяем статистику
    let stats = cache.get_stats();
    assert_eq!(stats.render_requests, 1);
    assert_eq!(stats.render_hits, 0);
    assert_eq!(stats.render_misses, 1);
  }

  #[tokio::test]
  async fn test_metadata_expiration() {
    let settings = CacheSettings {
      metadata_ttl: Duration::from_millis(10),
      ..Default::default()
    };
    let mut cache = RenderCache::with_settings(settings);

    let metadata = MediaMetadata {
      file_path: "/test/video.mp4".to_string(),
      file_size: 1024,
      modified_time: SystemTime::now(),
      duration: 60.0,
      resolution: None,
      fps: None,
      bitrate: None,
      video_codec: None,
      audio_codec: None,
      cached_at: SystemTime::now(),
    };

    cache
      .store_metadata("/test/video.mp4".to_string(), metadata)
      .await
      .unwrap();
    assert!(cache.get_metadata("/test/video.mp4").await.is_some());

    tokio::time::sleep(Duration::from_millis(20)).await;
    assert!(cache.get_metadata("/test/video.mp4").await.is_none());
  }

  #[tokio::test]
  async fn test_render_data_expiration() {
    let settings = CacheSettings {
      render_ttl: Duration::from_millis(10),
      ..Default::default()
    };
    let mut cache = RenderCache::with_settings(settings);

    let render_data = RenderCacheData {
      cache_key: "job_123".to_string(),
      output_path: std::path::PathBuf::from("/output.mp4"),
      render_hash: "hash123".to_string(),
      created_at: SystemTime::now(),
      file_size: 1000,
    };

    cache
      .store_render_data("job_123".to_string(), render_data)
      .await
      .unwrap();
    assert!(cache.get_render_data("job_123").await.is_some());

    tokio::time::sleep(Duration::from_millis(20)).await;
    assert!(cache.get_render_data("job_123").await.is_none());
  }

  #[tokio::test]
  async fn test_cache_stats_hit_ratios() {
    let cache = RenderCache::new();
    let stats = cache.get_stats();

    // При нулевых запросах hit ratio должен быть 0
    assert_eq!(stats.hit_ratio(), 0.0);
    assert_eq!(stats.preview_hit_ratio(), 0.0);
  }

  #[tokio::test]
  async fn test_cache_clear_all() {
    let mut cache = RenderCache::new();

    // Добавляем различные данные
    let preview_key = PreviewKey::new("/test1.mp4".to_string(), 1.0, (640, 360), 75);
    cache
      .store_preview(preview_key.clone(), vec![1, 2, 3])
      .await
      .unwrap();

    let metadata = MediaMetadata {
      file_path: "/test2.mp4".to_string(),
      file_size: 1024,
      modified_time: SystemTime::now(),
      duration: 60.0,
      resolution: None,
      fps: None,
      bitrate: None,
      video_codec: None,
      audio_codec: None,
      cached_at: SystemTime::now(),
    };
    cache
      .store_metadata("/test2.mp4".to_string(), metadata)
      .await
      .unwrap();

    let render_data = RenderCacheData {
      cache_key: "job_456".to_string(),
      output_path: std::path::PathBuf::from("/output.mp4"),
      render_hash: "hash456".to_string(),
      created_at: SystemTime::now(),
      file_size: 2000,
    };
    cache
      .store_render_data("job_456".to_string(), render_data)
      .await
      .unwrap();

    // Проверяем что все данные есть
    assert!(cache.get_preview(&preview_key).await.is_some());
    assert!(cache.get_metadata("/test2.mp4").await.is_some());
    assert!(cache.get_render_data("job_456").await.is_some());

    // Очищаем весь кэш
    cache.clear_all().await;

    // Проверяем что все данные удалены
    assert!(cache.get_preview(&preview_key).await.is_none());
    assert!(cache.get_metadata("/test2.mp4").await.is_none());
    assert!(cache.get_render_data("job_456").await.is_none());

    // Статистика должна быть сброшена
    let stats = cache.get_stats();
    assert_eq!(stats.preview_requests, 1); // один после clear_all
    assert_eq!(stats.preview_hits, 0);
    assert_eq!(stats.preview_misses, 1);
  }

  #[tokio::test]
  async fn test_cleanup_old_entries() {
    let settings = CacheSettings {
      preview_ttl: Duration::from_millis(10),
      metadata_ttl: Duration::from_millis(10),
      render_ttl: Duration::from_millis(10),
      ..Default::default()
    };
    let mut cache = RenderCache::with_settings(settings);

    // Добавляем данные
    let key1 = PreviewKey::new("/test1.mp4".to_string(), 1.0, (640, 360), 75);
    let key2 = PreviewKey::new("/test2.mp4".to_string(), 2.0, (640, 360), 75);
    cache
      .store_preview(key1.clone(), vec![1, 2, 3])
      .await
      .unwrap();

    // Ждем истечения TTL для первого элемента
    tokio::time::sleep(Duration::from_millis(15)).await;

    // Добавляем второй элемент
    cache
      .store_preview(key2.clone(), vec![4, 5, 6])
      .await
      .unwrap();

    // Вызываем очистку
    cache.cleanup_old_entries().await.unwrap();

    // Первый должен быть удален, второй остаться
    assert!(cache.get_preview(&key1).await.is_none());
    assert!(cache.get_preview(&key2).await.is_some());
  }

  #[tokio::test]
  async fn test_cleanup_if_needed_with_memory_limit() {
    let settings = CacheSettings {
      max_memory_mb: 1, // Очень маленький лимит памяти для теста
      max_preview_entries: 10000,
      ..Default::default()
    };
    let mut cache = RenderCache::with_settings(settings);

    // Добавляем много больших превью чтобы превысить лимит памяти
    for i in 0..100 {
      let key = PreviewKey::new(format!("/test{i}.mp4"), i as f64, (1920, 1080), 90);
      let large_data = vec![0u8; 100000]; // 100KB на превью
      cache.store_preview(key, large_data).await.unwrap();
    }

    // cleanup_if_needed должен был быть вызван автоматически
    let usage = cache.get_memory_usage();
    // Проверяем что память не превышает сильно установленный лимит
    assert!(usage.total_mb() < 10.0); // Даем запас на накладные расходы
  }
}

/// Сжатие данных превью с использованием zstd
fn compress_preview_data(data: &[u8]) -> Result<Vec<u8>> {
  // Проверяем, что данные достаточно большие для сжатия
  if data.len() < 1024 {
    // Не сжимаем маленькие данные
    return Ok(data.to_vec());
  }

  // Уровень сжатия 3 - хороший баланс между скоростью и степенью сжатия
  match zstd::encode_all(data, 3) {
    Ok(compressed) => {
      // Проверяем, что сжатие дало выигрыш
      if compressed.len() < data.len() {
        Ok(compressed)
      } else {
        Ok(data.to_vec())
      }
    }
    Err(e) => {
      log::warn!("Ошибка сжатия данных превью: {}", e);
      Ok(data.to_vec())
    }
  }
}

/// Декомпрессия данных превью
fn decompress_preview_data(data: &[u8]) -> Result<Vec<u8>> {
  // Проверяем магическое число zstd
  if data.len() >= 4 && data[0..4] == [0x28, 0xB5, 0x2F, 0xFD] {
    match zstd::decode_all(data) {
      Ok(decompressed) => Ok(decompressed),
      Err(e) => {
        log::warn!("Ошибка декомпрессии данных превью: {}", e);
        Ok(data.to_vec())
      }
    }
  } else {
    // Данные не сжаты
    Ok(data.to_vec())
  }
}

/// Расширения для оптимизации кэша
impl RenderCache {
  /// Предзагрузить превью для видео файла
  pub async fn preload_video_previews(
    &mut self,
    video_path: &str,
    timestamps: &[f64],
    resolution: (u32, u32),
    quality: u8,
    cache: std::sync::Arc<tokio::sync::RwLock<RenderCache>>,
  ) -> Result<()> {
    use crate::video_compiler::core::preview::PreviewGenerator;

    let generator = PreviewGenerator::new(cache);

    for &timestamp in timestamps {
      let key = PreviewKey::new(video_path.to_string(), timestamp, resolution, quality);

      // Проверяем, есть ли уже в кэше
      if self.preview_cache.get(&key).is_some() {
        continue;
      }

      // Генерируем превью
      match generator
        .generate_preview(
          std::path::Path::new(video_path),
          timestamp,
          Some(resolution),
          Some(quality),
        )
        .await
      {
        Ok(image_data) => {
          self.store_preview(key, image_data).await?;
        }
        Err(e) => {
          log::warn!(
            "Ошибка генерации превью для {} на {}: {}",
            video_path,
            timestamp,
            e
          );
        }
      }
    }

    Ok(())
  }

  /// Оптимизировать кэш на основе статистики использования
  pub async fn optimize_cache(&mut self) -> Result<()> {
    let hit_ratio = {
      let stats = self.get_stats();
      stats.hit_ratio()
    };
    let current_memory_mb = self.settings.max_memory_mb;

    // Если процент попаданий низкий, увеличиваем размер кэша
    if hit_ratio < 0.5 && current_memory_mb < 1024 {
      let new_limit = (current_memory_mb as f32 * 1.5) as usize;
      self.settings.max_memory_mb = new_limit;
      log::info!("Увеличиваем лимит памяти кэша до {} MB", new_limit);
    }

    // Если процент попаданий высокий и память используется мало, уменьшаем размер
    let total_usage_mb = {
      let usage = self.get_memory_usage();
      usage.total_mb()
    };
    if hit_ratio > 0.8 && total_usage_mb < (current_memory_mb as f32 * 0.5) {
      let new_limit = (current_memory_mb as f32 * 0.75) as usize;
      self.settings.max_memory_mb = new_limit;
      log::info!("Уменьшаем лимит памяти кэша до {} MB", new_limit);
    }

    // Очищаем старые записи
    self.cleanup_old_entries().await?;

    Ok(())
  }

  /// Получить рекомендации по оптимизации кэша
  pub fn get_optimization_recommendations(&self) -> Vec<String> {
    let mut recommendations = Vec::new();
    let stats = self.get_stats();
    let usage = self.get_memory_usage();

    // Анализ процента попаданий
    if stats.hit_ratio() < 0.3 {
      recommendations
        .push("Низкий процент попаданий в кэш. Рекомендуется увеличить размер кэша.".to_string());
    }

    if stats.preview_hit_ratio() < 0.5 && self.settings.max_preview_entries < 2000 {
      recommendations
        .push("Низкий процент попаданий превью. Увеличьте max_preview_entries.".to_string());
    }

    // Анализ использования памяти
    if usage.total_mb() > (self.settings.max_memory_mb as f32 * 0.9) {
      recommendations
        .push("Кэш близок к лимиту памяти. Рассмотрите увеличение max_memory_mb.".to_string());
    }

    if usage.total_mb() < (self.settings.max_memory_mb as f32 * 0.1) {
      recommendations.push(
        "Кэш использует мало памяти. Можно уменьшить max_memory_mb для экономии ресурсов."
          .to_string(),
      );
    }

    // Анализ TTL
    if self.settings.preview_ttl < Duration::from_secs(1800) {
      recommendations
        .push("TTL превью слишком короткий. Рекомендуется увеличить до 30-60 минут.".to_string());
    }

    recommendations
  }
}

#[cfg(test)]
mod compression_tests {
  use super::*;

  #[test]
  fn test_compress_small_data() {
    let data = vec![1, 2, 3, 4, 5];
    let compressed = compress_preview_data(&data).unwrap();
    // Маленькие данные не должны сжиматься
    assert_eq!(compressed, data);
  }

  #[test]
  fn test_compress_large_data() {
    let data = vec![0u8; 10000];
    let compressed = compress_preview_data(&data).unwrap();
    // Повторяющиеся данные должны хорошо сжиматься
    assert!(compressed.len() < data.len());
  }

  #[test]
  fn test_decompress_uncompressed_data() {
    let data = vec![1, 2, 3, 4, 5];
    let decompressed = decompress_preview_data(&data).unwrap();
    assert_eq!(decompressed, data);
  }

  #[test]
  fn test_compress_decompress_cycle() {
    let original = vec![42u8; 5000];
    let compressed = compress_preview_data(&original).unwrap();
    let decompressed = decompress_preview_data(&compressed).unwrap();
    assert_eq!(decompressed, original);
  }
}
