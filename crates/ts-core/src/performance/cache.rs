//! Система кэширования для оптимизации производительности

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, LinkedList};
use std::hash::Hash;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Trait для кэшируемых объектов
pub trait Cacheable: Clone + Send + Sync + 'static {
  /// Получить размер объекта в байтах для учета лимитов памяти
  fn size(&self) -> usize;
}

/// Trait для очистки кэшей
#[async_trait::async_trait]
pub trait ClearableCache: Send + Sync {
  /// Очистить кэш
  async fn clear(&self);

  /// Получить имя кэша для логирования
  fn cache_name(&self) -> &str;
}

impl Cacheable for Vec<u8> {
  fn size(&self) -> usize {
    self.len()
  }
}

impl Cacheable for String {
  fn size(&self) -> usize {
    self.len()
  }
}

impl<T: Clone + Send + Sync + 'static> Cacheable for Arc<T> {
  fn size(&self) -> usize {
    std::mem::size_of::<T>()
  }
}

/// Элемент кэша
#[derive(Debug, Clone)]
struct CacheEntry<V> {
  value: V,
  created_at: Instant,
  last_accessed: Instant,
  access_count: u64,
  size: usize,
}

impl<V: Cacheable> CacheEntry<V> {
  fn new(value: V) -> Self {
    let now = Instant::now();
    let size = value.size();

    Self {
      value,
      created_at: now,
      last_accessed: now,
      access_count: 1,
      size,
    }
  }

  fn access(&mut self) -> &V {
    self.last_accessed = Instant::now();
    self.access_count += 1;
    &self.value
  }

  fn is_expired(&self, ttl: Duration) -> bool {
    self.created_at.elapsed() > ttl
  }
}

/// Конфигурация кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
  /// Максимальное количество элементов
  pub max_entries: usize,

  /// Максимальный размер в байтах
  pub max_size_bytes: usize,

  /// TTL (время жизни) для элементов
  pub ttl: Duration,

  /// Интервал очистки истекших элементов
  pub cleanup_interval: Duration,

  /// Стратегия вытеснения
  pub eviction_policy: EvictionPolicy,
}

impl Default for CacheConfig {
  fn default() -> Self {
    Self {
      max_entries: 10000,
      max_size_bytes: 100 * 1024 * 1024,          // 100MB
      ttl: Duration::from_secs(3600),             // 1 час
      cleanup_interval: Duration::from_secs(300), // 5 минут
      eviction_policy: EvictionPolicy::LRU,
    }
  }
}

/// Стратегия вытеснения элементов
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EvictionPolicy {
  /// Least Recently Used
  LRU,
  /// Least Frequently Used  
  LFU,
  /// First In First Out
  FIFO,
  /// Random
  Random,
}

/// Статистика кэша
#[derive(Debug, Clone, Default)]
pub struct CacheStats {
  pub hits: u64,
  pub misses: u64,
  pub entries: usize,
  pub size_bytes: usize,
  pub hit_rate: f64,
  pub evictions: u64,
  pub expired_removals: u64,
}

impl CacheStats {
  fn update_hit_rate(&mut self) {
    let total = self.hits + self.misses;
    self.hit_rate = if total > 0 {
      self.hits as f64 / total as f64
    } else {
      0.0
    };
  }
}

/// Универсальный LRU кэш
pub struct LruCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  entries: HashMap<K, CacheEntry<V>>,
  access_order: LinkedList<K>,
  config: CacheConfig,
  stats: CacheStats,
  current_size: usize,
}

impl<K, V> LruCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  /// Создать новый LRU кэш
  pub fn new(config: CacheConfig) -> Self {
    Self {
      entries: HashMap::new(),
      access_order: LinkedList::new(),
      config,
      stats: CacheStats::default(),
      current_size: 0,
    }
  }

  /// Получить элемент из кэша
  pub fn get(&mut self, key: &K) -> Option<V> {
    // Сначала проверяем наличие и срок действия
    let (exists, is_expired, value) = if let Some(entry) = self.entries.get_mut(key) {
      if entry.is_expired(self.config.ttl) {
        (true, true, None)
      } else {
        let val = entry.access().clone();
        (true, false, Some(val))
      }
    } else {
      (false, false, None)
    };

    // Теперь выполняем действия без активных заимствований
    if exists && is_expired {
      // Элемент истек
      self.remove_key(key);
      self.stats.misses += 1;
      self.stats.expired_removals += 1;
      None
    } else if let Some(val) = value {
      // Обновляем порядок доступа
      self.update_access_order(key);
      self.stats.hits += 1;
      self.stats.update_hit_rate();
      Some(val)
    } else {
      self.stats.misses += 1;
      self.stats.update_hit_rate();
      None
    }
  }

  /// Поместить элемент в кэш
  pub fn put(&mut self, key: K, value: V) -> Option<V> {
    let entry = CacheEntry::new(value);
    let entry_size = entry.size;

    // Проверяем лимиты и освобождаем место если нужно
    self.ensure_capacity(entry_size);

    // Вставляем новый элемент
    let old_value = if let Some(old_entry) = self.entries.insert(key.clone(), entry) {
      self.current_size -= old_entry.size;
      Some(old_entry.value)
    } else {
      None
    };

    self.current_size += entry_size;

    // Обновляем порядок доступа
    self.update_access_order(&key);

    // Обновляем статистику
    self.stats.entries = self.entries.len();
    self.stats.size_bytes = self.current_size;

    old_value
  }

  /// Удалить элемент из кэша
  pub fn remove(&mut self, key: &K) -> Option<V> {
    self.remove_key(key).map(|entry| entry.value)
  }

  /// Очистить кэш
  pub fn clear(&mut self) {
    self.entries.clear();
    self.access_order.clear();
    self.current_size = 0;
    self.stats.entries = 0;
    self.stats.size_bytes = 0;
  }

  /// Получить статистику
  pub fn stats(&self) -> &CacheStats {
    &self.stats
  }

  /// Получить количество элементов
  pub fn len(&self) -> usize {
    self.entries.len()
  }

  /// Проверить пустой ли кэш
  pub fn is_empty(&self) -> bool {
    self.entries.is_empty()
  }

  /// Очистить истекшие элементы
  pub fn cleanup_expired(&mut self) {
    let mut expired_keys = Vec::new();

    for (key, entry) in &self.entries {
      if entry.is_expired(self.config.ttl) {
        expired_keys.push(key.clone());
      }
    }

    for key in expired_keys {
      self.remove_key(&key);
      self.stats.expired_removals += 1;
    }

    self.stats.entries = self.entries.len();
    self.stats.size_bytes = self.current_size;
  }

  /// Обеспечить емкость для нового элемента
  fn ensure_capacity(&mut self, new_entry_size: usize) {
    // Проверяем лимит по количеству
    while self.entries.len() >= self.config.max_entries {
      if !self.evict_one() {
        break;
      }
    }

    // Проверяем лимит по размеру
    while self.current_size + new_entry_size > self.config.max_size_bytes {
      if !self.evict_one() {
        break;
      }
    }
  }

  /// Вытеснить один элемент
  fn evict_one(&mut self) -> bool {
    match self.config.eviction_policy {
      EvictionPolicy::LRU => self.evict_lru(),
      EvictionPolicy::LFU => self.evict_lfu(),
      EvictionPolicy::FIFO => self.evict_fifo(),
      EvictionPolicy::Random => self.evict_random(),
    }
  }

  /// Вытеснить LRU элемент
  fn evict_lru(&mut self) -> bool {
    if let Some(key) = self.access_order.back().cloned() {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить LFU элемент
  fn evict_lfu(&mut self) -> bool {
    let key_to_remove = self
      .entries
      .iter()
      .min_by_key(|(_, entry)| entry.access_count)
      .map(|(k, _)| k.clone());

    if let Some(key) = key_to_remove {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить FIFO элемент
  fn evict_fifo(&mut self) -> bool {
    let key_to_remove = self
      .entries
      .iter()
      .min_by_key(|(_, entry)| entry.created_at)
      .map(|(k, _)| k.clone());

    if let Some(key) = key_to_remove {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить случайный элемент
  fn evict_random(&mut self) -> bool {
    if let Some(key) = self.entries.keys().next().cloned() {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Обновить порядок доступа
  fn update_access_order(&mut self, key: &K) {
    // Удаляем из текущей позиции
    if let Some(pos) = self.access_order.iter().position(|k| k == key) {
      let mut split = self.access_order.split_off(pos);
      split.pop_front(); // Удаляем найденный элемент
      self.access_order.append(&mut split);
    }

    // Добавляем в начало (самый недавно использованный)
    self.access_order.push_front(key.clone());
  }

  /// Удалить ключ и обновить структуры данных
  fn remove_key(&mut self, key: &K) -> Option<CacheEntry<V>> {
    let entry = self.entries.remove(key)?;
    self.current_size -= entry.size;

    // Удаляем из порядка доступа
    if let Some(pos) = self.access_order.iter().position(|k| k == key) {
      let mut split = self.access_order.split_off(pos);
      split.pop_front();
      self.access_order.append(&mut split);
    }

    Some(entry)
  }
}

/// Потокобезопасный кэш
#[derive(Clone)]
pub struct MemoryCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  inner: Arc<RwLock<LruCache<K, V>>>,
  _cleanup_handle: Arc<tokio::task::JoinHandle<()>>,
}

impl<K, V> MemoryCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  /// Создать новый потокобезопасный кэш
  pub fn new(config: CacheConfig) -> Self {
    let inner = Arc::new(RwLock::new(LruCache::new(config.clone())));

    // Запускаем фоновую очистку
    let cleanup_inner = inner.clone();
    let cleanup_interval = config.cleanup_interval;
    let cleanup_handle = tokio::spawn(async move {
      let mut interval = tokio::time::interval(cleanup_interval);

      loop {
        interval.tick().await;

        if let Ok(mut cache) = cleanup_inner.try_write() {
          cache.cleanup_expired();
        }
      }
    });

    Self {
      inner,
      _cleanup_handle: Arc::new(cleanup_handle),
    }
  }

  /// Получить элемент из кэша
  pub async fn get(&self, key: &K) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.get(key)
  }

  /// Поместить элемент в кэш
  pub async fn put(&self, key: K, value: V) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.put(key, value)
  }

  /// Удалить элемент из кэша
  pub async fn remove(&self, key: &K) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.remove(key)
  }

  /// Очистить кэш
  pub async fn clear(&self) {
    let mut cache = self.inner.write().await;
    cache.clear();
  }

  /// Получить статистику
  pub async fn stats(&self) -> CacheStats {
    let cache = self.inner.read().await;
    cache.stats().clone()
  }

  /// Получить количество элементов
  pub async fn len(&self) -> usize {
    let cache = self.inner.read().await;
    cache.len()
  }

  /// Проверить пустой ли кэш
  pub async fn is_empty(&self) -> bool {
    let cache = self.inner.read().await;
    cache.is_empty()
  }
}

#[async_trait::async_trait]
impl<K, V> ClearableCache for MemoryCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  async fn clear(&self) {
    MemoryCache::clear(self).await;
  }

  fn cache_name(&self) -> &str {
    "MemoryCache"
  }
}

/// Менеджер кэшей
pub struct CacheManager {
  caches: Arc<RwLock<HashMap<String, Box<dyn std::any::Any + Send + Sync>>>>,
  clearable_caches: Arc<RwLock<HashMap<String, Box<dyn ClearableCache>>>>,
}

impl CacheManager {
  /// Создать новый менеджер кэшей
  pub fn new() -> Self {
    Self {
      caches: Arc::new(RwLock::new(HashMap::new())),
      clearable_caches: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Добавить кэш
  pub async fn add_cache<K, V>(&self, name: String, cache: MemoryCache<K, V>)
  where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Cacheable,
  {
    let mut caches = self.caches.write().await;
    caches.insert(name.clone(), Box::new(cache));
    log::info!("Added cache '{name}'");
  }

  /// Добавить очищаемый кэш
  pub async fn add_clearable_cache(&self, name: String, cache: Box<dyn ClearableCache>) {
    let mut clearable_caches = self.clearable_caches.write().await;
    clearable_caches.insert(name.clone(), cache);
    log::info!("Added clearable cache '{name}'");
  }

  /// Получить кэш по имени
  pub async fn get_cache<K, V>(&self, name: &str) -> Option<MemoryCache<K, V>>
  where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Cacheable,
  {
    let caches = self.caches.read().await;
    caches
      .get(name)?
      .downcast_ref::<MemoryCache<K, V>>()
      .cloned()
  }

  /// Удалить кэш
  pub async fn remove_cache(&self, name: &str) -> bool {
    let mut caches = self.caches.write().await;
    if caches.remove(name).is_some() {
      log::info!("Removed cache '{name}'");
      true
    } else {
      false
    }
  }

  /// Получить список кэшей
  pub async fn list_caches(&self) -> Vec<String> {
    let caches = self.caches.read().await;
    let clearable_caches = self.clearable_caches.read().await;
    let mut all_caches: Vec<String> = caches.keys().cloned().collect();
    all_caches.extend(clearable_caches.keys().cloned());
    all_caches.sort();
    all_caches.dedup();
    all_caches
  }

  /// Очистить все кэши
  pub async fn clear_all(&self) {
    let caches = self.caches.read().await;
    let clearable_caches = self.clearable_caches.read().await;
    let total_count = caches.len() + clearable_caches.len();
    log::info!("Clearing all {total_count} caches");

    let mut cleared_count = 0;
    let mut failed_count = 0;

    // Очищаем специальные clearable кэши
    for (name, clearable_cache) in clearable_caches.iter() {
      clearable_cache.clear().await;
      cleared_count += 1;
      log::debug!("Successfully cleared clearable cache '{name}'");
    }

    // Очищаем обычные кэши с известными типами
    for (name, cache_any) in caches.iter() {
      if let Some(memory_cache) = cache_any.downcast_ref::<MemoryCache<String, String>>() {
        memory_cache.clear().await;
        cleared_count += 1;
        log::debug!("Successfully cleared MemoryCache<String, String> '{name}'");
      } else if let Some(memory_cache) = cache_any.downcast_ref::<MemoryCache<String, Vec<u8>>>() {
        memory_cache.clear().await;
        cleared_count += 1;
        log::debug!("Successfully cleared MemoryCache<String, Vec<u8>> '{name}'");
      } else if let Some(memory_cache) =
        cache_any.downcast_ref::<MemoryCache<String, Arc<String>>>()
      {
        memory_cache.clear().await;
        cleared_count += 1;
        log::debug!("Successfully cleared MemoryCache<String, Arc<String>> '{name}'");
      } else {
        failed_count += 1;
        log::warn!("Unknown cache type for '{name}', cannot clear");
      }
    }

    log::info!("Cache clearing completed: {cleared_count} cleared, {failed_count} failed");
  }
}

impl Default for CacheManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_lru_cache() {
    let config = CacheConfig {
      max_entries: 3,
      max_size_bytes: 1000,
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LRU,
    };

    let mut cache = LruCache::new(config);

    // Добавляем элементы
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 3);

    // Доступ к элементу
    assert_eq!(cache.get(&"key1".to_string()), Some("value1".to_string()));

    // Добавляем четвертый элемент - должен вытеснить LRU
    cache.put("key4".to_string(), "value4".to_string());

    assert_eq!(cache.len(), 3);
    assert!(cache.get(&"key2".to_string()).is_none()); // key2 должен быть вытеснен

    // Проверяем статистику
    let stats = cache.stats();
    assert!(stats.hits > 0);
    assert!(stats.evictions > 0);
  }

  #[tokio::test]
  async fn test_memory_cache() {
    let config = CacheConfig::default();
    let cache = MemoryCache::new(config);

    // Тестируем базовые операции
    cache
      .put("test_key".to_string(), "test_value".to_string())
      .await;

    let value = cache.get(&"test_key".to_string()).await;
    assert_eq!(value, Some("test_value".to_string()));

    let removed = cache.remove(&"test_key".to_string()).await;
    assert_eq!(removed, Some("test_value".to_string()));

    let value = cache.get(&"test_key".to_string()).await;
    assert!(value.is_none());
  }

  #[tokio::test]
  async fn test_cache_manager() {
    let manager = CacheManager::new();

    let config = CacheConfig::default();
    let cache: MemoryCache<String, String> = MemoryCache::new(config);

    manager.add_cache("test_cache".to_string(), cache).await;

    let caches = manager.list_caches().await;
    assert!(caches.contains(&"test_cache".to_string()));

    let removed = manager.remove_cache("test_cache").await;
    assert!(removed);
  }

  #[tokio::test]
  async fn test_cache_manager_clear_all() {
    let manager = CacheManager::new();

    // Добавляем несколько кэшей разных типов
    let config = CacheConfig::default();
    let cache1: MemoryCache<String, String> = MemoryCache::new(config.clone());
    let cache2: MemoryCache<String, Vec<u8>> = MemoryCache::new(config.clone());
    let cache3: MemoryCache<String, Arc<String>> = MemoryCache::new(config);

    manager.add_cache("string_cache".to_string(), cache1).await;
    manager.add_cache("bytes_cache".to_string(), cache2).await;
    manager.add_cache("arc_cache".to_string(), cache3).await;

    // Проверяем что кэши добавлены
    let caches = manager.list_caches().await;
    assert_eq!(caches.len(), 3);

    // Очищаем все кэши
    manager.clear_all().await;

    // Кэши остаются в менеджере, но они очищены
    let caches_after = manager.list_caches().await;
    assert_eq!(caches_after.len(), 3);
  }

  #[tokio::test]
  async fn test_clearable_cache_trait() {
    let config = CacheConfig::default();
    let cache: MemoryCache<String, String> = MemoryCache::new(config);

    // Добавляем данные в кэш
    cache
      .put("test_key".to_string(), "test_value".to_string())
      .await;

    // Проверяем что данные есть
    let value = cache.get(&"test_key".to_string()).await;
    assert_eq!(value, Some("test_value".to_string()));

    // Очищаем через trait
    let clearable: &dyn ClearableCache = &cache;
    clearable.clear().await;

    // Проверяем что данные очищены
    let value_after = cache.get(&"test_key".to_string()).await;
    assert!(value_after.is_none());

    // Проверяем имя кэша
    assert_eq!(clearable.cache_name(), "MemoryCache");
  }

  #[test]
  fn test_eviction_policies() {
    // Тест LFU (Least Frequently Used)
    let config = CacheConfig {
      max_entries: 2,
      max_size_bytes: 1000,
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LFU,
    };

    let mut cache = LruCache::new(config);
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());

    // Делаем key1 более часто используемым
    cache.get(&"key1".to_string());
    cache.get(&"key1".to_string());
    cache.get(&"key2".to_string());

    // Добавляем третий элемент - должен вытеснить key2 (менее частый)
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 2);
    assert!(cache.get(&"key1".to_string()).is_some());
    assert!(cache.get(&"key3".to_string()).is_some());
    assert!(cache.get(&"key2".to_string()).is_none());

    // Тест FIFO (First In First Out)
    let config = CacheConfig {
      max_entries: 2,
      max_size_bytes: 1000,
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::FIFO,
    };

    let mut cache = LruCache::new(config);
    cache.put("first".to_string(), "value1".to_string());
    std::thread::sleep(Duration::from_millis(1)); // Гарантируем разное время
    cache.put("second".to_string(), "value2".to_string());

    // Добавляем третий - должен вытеснить первый
    cache.put("third".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 2);
    assert!(cache.get(&"first".to_string()).is_none());
    assert!(cache.get(&"second".to_string()).is_some());
    assert!(cache.get(&"third".to_string()).is_some());
  }

  #[test]
  fn test_cache_size_limits() {
    let config = CacheConfig {
      max_entries: 100,
      max_size_bytes: 50, // Очень маленький лимит
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LRU,
    };

    let mut cache = LruCache::new(config);

    // Добавляем строки по 20 байт
    cache.put("key1".to_string(), "x".repeat(20));
    cache.put("key2".to_string(), "y".repeat(20));

    assert_eq!(cache.len(), 2);

    // Добавляем третью строку - должна вытеснить первую
    cache.put("key3".to_string(), "z".repeat(20));

    assert_eq!(cache.len(), 2);
    assert!(cache.get(&"key1".to_string()).is_none());
    assert!(cache.get(&"key2".to_string()).is_some());
    assert!(cache.get(&"key3".to_string()).is_some());

    // Проверяем что размер не превышает лимит
    let stats = cache.stats();
    assert!(stats.size_bytes <= 50);
  }

  #[test]
  fn test_ttl_expiration() {
    let config = CacheConfig {
      max_entries: 10,
      max_size_bytes: 1000,
      ttl: Duration::from_millis(10), // Очень короткий TTL
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LRU,
    };

    let mut cache = LruCache::new(config);

    cache.put("key1".to_string(), "value1".to_string());
    assert!(cache.get(&"key1".to_string()).is_some());

    // Ждем истечения TTL
    std::thread::sleep(Duration::from_millis(15));

    // Элемент должен быть просрочен и удален при доступе
    assert!(cache.get(&"key1".to_string()).is_none());

    // Проверяем статистику
    let stats = cache.stats();
    assert!(stats.expired_removals > 0);
  }

  #[tokio::test]
  async fn test_memory_cache_concurrent_access() {
    let config = CacheConfig::default();
    let cache = Arc::new(MemoryCache::new(config));

    let mut handles = vec![];

    // Запускаем множественные операции одновременно
    for i in 0..10 {
      let cache_clone = cache.clone();
      let handle = tokio::spawn(async move {
        let key = format!("key{i}");
        let value = format!("value{i}");

        // Добавляем
        cache_clone.put(key.clone(), value.clone()).await;

        // Читаем
        let result = cache_clone.get(&key).await;
        assert_eq!(result, Some(value));

        // Удаляем
        let removed = cache_clone.remove(&key).await;
        assert_eq!(removed, Some(format!("value{i}")));
      });
      handles.push(handle);
    }

    // Ждем завершения всех операций
    for handle in handles {
      handle.await.unwrap();
    }

    // Проверяем что кэш пуст
    assert!(cache.is_empty().await);
  }

  #[test]
  fn test_cache_config_validation() {
    let config = CacheConfig::default();

    // Проверяем разумные значения по умолчанию
    assert!(config.max_entries > 0);
    assert!(config.max_size_bytes > 0);
    assert!(config.ttl > Duration::from_secs(0));
    assert!(config.cleanup_interval > Duration::from_secs(0));
    assert!(matches!(config.eviction_policy, EvictionPolicy::LRU));

    // Проверяем что можно создать кэш с конфигурацией
    let cache = LruCache::<String, String>::new(config);
    assert!(cache.is_empty());
  }

  #[test]
  fn test_cacheable_implementations() {
    // Vec<u8>
    let vec_data = vec![1, 2, 3, 4, 5];
    assert_eq!(vec_data.size(), 5);

    // String
    let string_data = "hello world".to_string();
    assert_eq!(string_data.size(), 11);

    // Arc<T>
    let arc_data = Arc::new(42u32);
    assert_eq!(arc_data.size(), std::mem::size_of::<u32>());
  }

  #[tokio::test]
  async fn test_cache_cleanup_expired() {
    let config = CacheConfig {
      max_entries: 10,
      max_size_bytes: 1000,
      ttl: Duration::from_millis(50),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LRU,
    };

    let mut cache = LruCache::new(config);

    // Добавляем несколько элементов
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 3);

    // Ждем истечения TTL
    tokio::time::sleep(Duration::from_millis(60)).await;

    // Вручную запускаем очистку
    cache.cleanup_expired();

    // Все элементы должны быть удалены
    assert_eq!(cache.len(), 0);
    assert!(cache.is_empty());

    let stats = cache.stats();
    assert_eq!(stats.expired_removals, 3);
  }

  #[test]
  fn test_cache_stats_calculation() {
    let config = CacheConfig::default();
    let mut cache = LruCache::new(config);

    // Начальная статистика
    let stats = cache.stats();
    assert_eq!(stats.hits, 0);
    assert_eq!(stats.misses, 0);
    assert_eq!(stats.hit_rate, 0.0);

    // Добавляем элемент
    cache.put("key1".to_string(), "value1".to_string());

    // Miss - элемента не было
    cache.get(&"nonexistent".to_string());
    let stats = cache.stats();
    assert_eq!(stats.hits, 0);
    assert_eq!(stats.misses, 1);
    assert_eq!(stats.hit_rate, 0.0);

    // Hit - элемент есть
    cache.get(&"key1".to_string());
    let stats = cache.stats();
    assert_eq!(stats.hits, 1);
    assert_eq!(stats.misses, 1);
    assert_eq!(stats.hit_rate, 0.5);

    // Еще один hit
    cache.get(&"key1".to_string());
    let stats = cache.stats();
    assert_eq!(stats.hits, 2);
    assert_eq!(stats.misses, 1);
    assert!((stats.hit_rate - 2.0 / 3.0).abs() < 0.001);
  }

  #[test]
  fn test_random_eviction_policy() {
    let config = CacheConfig {
      max_entries: 2,
      max_size_bytes: 1000,
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::Random,
    };

    let mut cache = LruCache::new(config);

    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());

    assert_eq!(cache.len(), 2);

    // Добавляем третий элемент - один из первых двух должен быть вытеснен случайно
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 2);
    assert!(cache.get(&"key3".to_string()).is_some()); // Новый элемент должен быть

    // Один из key1 или key2 должен быть удален
    let key1_exists = cache.get(&"key1".to_string()).is_some();
    let key2_exists = cache.get(&"key2".to_string()).is_some();
    assert!(key1_exists ^ key2_exists); // Только один из них должен существовать

    let stats = cache.stats();
    assert!(stats.evictions > 0);
  }

  #[tokio::test]
  async fn test_cache_manager_get_cache() {
    let manager = CacheManager::new();

    let config = CacheConfig::default();
    let cache: MemoryCache<String, String> = MemoryCache::new(config);

    manager.add_cache("string_cache".to_string(), cache).await;

    // Получаем кэш обратно
    let retrieved_cache: Option<MemoryCache<String, String>> =
      manager.get_cache("string_cache").await;

    assert!(retrieved_cache.is_some());

    let cache = retrieved_cache.unwrap();

    // Тестируем что он работает
    cache.put("test".to_string(), "value".to_string()).await;
    let value = cache.get(&"test".to_string()).await;
    assert_eq!(value, Some("value".to_string()));

    // Тестируем получение несуществующего кэша
    let nonexistent: Option<MemoryCache<String, String>> = manager.get_cache("nonexistent").await;
    assert!(nonexistent.is_none());
  }

  #[test]
  fn test_cache_clear() {
    let config = CacheConfig::default();
    let mut cache = LruCache::new(config);

    // Добавляем элементы
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 3);
    assert!(!cache.is_empty());

    // Очищаем кэш
    cache.clear();

    assert_eq!(cache.len(), 0);
    assert!(cache.is_empty());

    // Проверяем что статистика размера сброшена
    let stats = cache.stats();
    assert_eq!(stats.entries, 0);
    assert_eq!(stats.size_bytes, 0);

    // Проверяем что элементы действительно удалены
    assert!(cache.get(&"key1".to_string()).is_none());
    assert!(cache.get(&"key2".to_string()).is_none());
    assert!(cache.get(&"key3".to_string()).is_none());
  }

  #[test]
  fn test_cache_remove() {
    let config = CacheConfig::default();
    let mut cache = LruCache::new(config);

    // Добавляем элементы
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());

    assert_eq!(cache.len(), 2);

    // Удаляем существующий элемент
    let removed = cache.remove(&"key1".to_string());
    assert_eq!(removed, Some("value1".to_string()));
    assert_eq!(cache.len(), 1);
    assert!(cache.get(&"key1".to_string()).is_none());

    // Удаляем несуществующий элемент
    let removed = cache.remove(&"nonexistent".to_string());
    assert!(removed.is_none());
    assert_eq!(cache.len(), 1);

    // Проверяем что второй элемент остался
    assert!(cache.get(&"key2".to_string()).is_some());
  }
}
