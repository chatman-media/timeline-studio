# Performance Optimization / Оптимизация производительности

Модуль высокопроизводительных компонентов для Timeline Studio с фокусом на async runtime, кэширование, управление памятью и zero-copy операции.

## 🏗️ Архитектура

### Основные компоненты

```
performance/
├── runtime.rs      # Async worker pools и task management
├── cache.rs        # Высокопроизводительное кэширование
├── memory.rs       # Memory pools и управление памятью
├── zerocopy.rs     # Zero-copy операции для больших данных
└── mod.rs          # Общий модуль и координация
```

## 📁 Модули

### `runtime.rs` - Async Runtime Management
**Worker Pools с приоритетами**:
- Configurable thread pools для разных типов задач
- Priority-based task scheduling
- Resource limits и backpressure handling
- Automatic performance tuning

**Основные компоненты**:
```rust
pub struct WorkerPool {
    pool_id: String,
    executor: Arc<ThreadPoolExecutor>,
    config: TaskPoolConfig,
    metrics: Arc<PoolMetrics>,
    shutdown_signal: Arc<AtomicBool>,
}

pub struct TaskPoolConfig {
    pub max_concurrent_tasks: usize,     // Максимум одновременных задач
    pub queue_size: Option<usize>,       // Размер очереди (None = unbounded)
    pub priority: TaskPriority,          // Приоритет пула
    pub timeout: Option<Duration>,       // Timeout для задач
}

#[derive(Debug, Clone, PartialEq)]
pub enum TaskPriority {
    Low,
    Medium, 
    High,
    Critical,
}

pub struct PoolMetrics {
    pub tasks_executed: AtomicU64,
    pub tasks_failed: AtomicU64,
    pub average_execution_time: AtomicU64,
    pub current_queue_size: AtomicUsize,
    pub active_tasks: AtomicUsize,
}
```

**API для работы с пулами**:
```rust
impl WorkerPool {
    pub fn new(pool_id: String, config: TaskPoolConfig) -> Self
    
    // Выполнение задач
    pub async fn execute<F, T>(&self, task: F) -> Result<T>
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    
    pub async fn execute_with_timeout<F, T>(&self, task: F, timeout: Duration) -> Result<T>
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
    
    // Управление пулом
    pub async fn resize(&self, new_size: usize) -> Result<()>
    pub async fn shutdown(&self) -> Result<()>
    pub fn get_metrics(&self) -> PoolMetrics
    
    // Мониторинг
    pub fn current_load(&self) -> f64  // 0.0 - 1.0
    pub fn is_overloaded(&self) -> bool
}

// Runtime coordinator для управления множественными пулами
pub struct RuntimeCoordinator {
    pools: Arc<RwLock<HashMap<String, Arc<WorkerPool>>>>,
    system_monitor: SystemMonitor,
}

impl RuntimeCoordinator {
    pub fn new() -> Self
    
    pub async fn register_pool(&self, pool: Arc<WorkerPool>) -> Result<()>
    pub async fn get_pool(&self, pool_id: &str) -> Option<Arc<WorkerPool>>
    pub async fn auto_tune_all_pools(&self) -> Result<()>
    
    // Интеллектуальное распределение задач
    pub async fn schedule_task<F, T>(&self, task: F, priority: TaskPriority) -> Result<T>
    where
        F: Future<Output = T> + Send + 'static,
        T: Send + 'static,
}
```

**Примеры использования**:
```rust
// Создание специализированных пулов
let video_pool = Arc::new(WorkerPool::new(
    "video_processing".to_string(),
    TaskPoolConfig {
        max_concurrent_tasks: 4,          // Тяжелые задачи
        queue_size: Some(10),
        priority: TaskPriority::High,
        timeout: Some(Duration::from_secs(300)),  // 5 минут на видео
    }
));

let io_pool = Arc::new(WorkerPool::new(
    "io_operations".to_string(), 
    TaskPoolConfig {
        max_concurrent_tasks: 20,         // Много I/O задач
        queue_size: Some(100),
        priority: TaskPriority::Medium,
        timeout: Some(Duration::from_secs(30)),
    }
));

// Координатор для управления
let coordinator = RuntimeCoordinator::new();
coordinator.register_pool(video_pool.clone()).await?;
coordinator.register_pool(io_pool.clone()).await?;

// Выполнение задач
let result = video_pool.execute(async {
    process_video("input.mp4", "output.mp4").await
}).await?;

// Автоматическая настройка производительности
coordinator.auto_tune_all_pools().await?;
```

---

### `cache.rs` - Advanced Caching System
**Множественные стратегии eviction**:
- LRU (Least Recently Used)
- LFU (Least Frequently Used) 
- FIFO (First In, First Out)
- TTL (Time To Live) based
- Hybrid стратегии
- ClearableCache trait для универсальной очистки

**Основные компоненты**:
```rust
// Trait для универсальной очистки кэшей
#[async_trait::async_trait]
pub trait ClearableCache: Send + Sync {
    async fn clear(&self);
    fn cache_name(&self) -> &str;
}

pub struct Cache<K, V> {
    storage: Arc<RwLock<HashMap<K, CacheEntry<V>>>>,
    eviction_policy: EvictionPolicy,
    config: CacheConfig,
    metrics: Arc<CacheMetrics>,
    cleanup_task: Option<JoinHandle<()>>,
}

pub struct CacheConfig {
    pub max_entries: usize,              // Максимум записей
    pub max_size_bytes: usize,           // Максимум памяти
    pub ttl: Duration,                   // TTL по умолчанию
    pub cleanup_interval: Duration,       // Интервал очистки
    pub eviction_policy: EvictionPolicy,
}

#[derive(Debug, Clone)]
pub enum EvictionPolicy {
    LRU,
    LFU, 
    FIFO,
    TTL,
    Hybrid {
        primary: Box<EvictionPolicy>,
        secondary: Box<EvictionPolicy>,
        switch_threshold: f64,           // Когда переключаться
    },
}

struct CacheEntry<V> {
    value: V,
    last_accessed: Instant,
    access_count: AtomicU64,
    created_at: Instant,
    ttl: Option<Duration>,
    size_bytes: usize,
}

pub struct CacheMetrics {
    pub hits: AtomicU64,
    pub misses: AtomicU64, 
    pub evictions: AtomicU64,
    pub total_entries: AtomicUsize,
    pub total_size_bytes: AtomicUsize,
}
```

**API для кэширования**:
```rust
impl<K, V> Cache<K, V> 
where
    K: Hash + Eq + Clone + Send + Sync,
    V: Clone + Send + Sync,
{
    pub fn new(config: CacheConfig) -> Self
    
    // Основные операции
    pub async fn insert(&self, key: K, value: V) -> Option<V>
    pub async fn insert_with_ttl(&self, key: K, value: V, ttl: Duration) -> Option<V>
    pub async fn get(&self, key: &K) -> Option<V>
    pub async fn remove(&self, key: &K) -> Option<V>
    pub async fn clear(&self)
    
    // Batch операции
    pub async fn get_many(&self, keys: &[K]) -> HashMap<K, V>
    pub async fn insert_many(&self, entries: HashMap<K, V>)
    
    // Статистика
    pub fn hit_rate(&self) -> f64
    pub fn size(&self) -> usize
    pub fn memory_usage(&self) -> usize
    pub fn get_metrics(&self) -> CacheMetrics
    
    // Управление
    pub async fn force_cleanup(&self)
    pub async fn resize(&self, new_max_entries: usize)
    pub fn change_eviction_policy(&self, policy: EvictionPolicy)
}

// Специализированные кэши
pub type VideoFrameCache = Cache<String, Vec<u8>>;      // Кэш кадров видео
pub type ThumbnailCache = Cache<String, Vec<u8>>;       // Кэш миниатюр
pub type MetadataCache = Cache<String, VideoMetadata>;   // Кэш метаданных

// Менеджер для централизованного управления кэшами
pub struct CacheManager {
    caches: Arc<RwLock<HashMap<String, Box<dyn std::any::Any + Send + Sync>>>>,
    clearable_caches: Arc<RwLock<HashMap<String, Box<dyn ClearableCache>>>>,
}

impl CacheManager {
    pub async fn add_cache<K, V>(&self, name: String, cache: MemoryCache<K, V>)
    pub async fn add_clearable_cache(&self, name: String, cache: Box<dyn ClearableCache>)
    pub async fn clear_all(&self)  // Очищает все зарегистрированные кэши
    pub async fn list_caches(&self) -> Vec<String>
}
```

**Примеры использования**:
```rust
// Кэш для видео кадров с LRU policy
let frame_cache = Cache::new(CacheConfig {
    max_entries: 1000,
    max_size_bytes: 512 * 1024 * 1024,  // 512MB
    ttl: Duration::from_minutes(30),
    cleanup_interval: Duration::from_minutes(5),
    eviction_policy: EvictionPolicy::LRU,
});

// Сохранение кадра
let frame_data = extract_frame("video.mp4", 120).await?;
frame_cache.insert("video_120", frame_data).await;

// Получение кадра
if let Some(cached_frame) = frame_cache.get("video_120").await {
    // Используем закэшированный кадр
    process_frame(cached_frame).await;
} else {
    // Извлекаем кадр заново
    let frame = extract_frame("video.mp4", 120).await?;
    frame_cache.insert("video_120", frame.clone()).await;
    process_frame(frame).await;
}

// Hybrid eviction policy для сложных случаев
let hybrid_cache = Cache::new(CacheConfig {
    max_entries: 5000,
    max_size_bytes: 1024 * 1024 * 1024,  // 1GB
    ttl: Duration::from_hours(2),
    cleanup_interval: Duration::from_minutes(10),
    eviction_policy: EvictionPolicy::Hybrid {
        primary: Box::new(EvictionPolicy::LFU),      // Основная стратегия
        secondary: Box::new(EvictionPolicy::LRU),    // Fallback
        switch_threshold: 0.8,                       // При 80% заполнения
    },
});

// Мониторинг производительности кэша
println!("Cache hit rate: {:.2}%", frame_cache.hit_rate() * 100.0);
println!("Memory usage: {} MB", frame_cache.memory_usage() / (1024 * 1024));

// Использование CacheManager для централизованной очистки
let manager = CacheManager::new();
manager.add_cache("frames".to_string(), frame_cache).await;
manager.add_cache("thumbnails".to_string(), thumbnail_cache).await;

// Очистка всех кэшей одной командой
manager.clear_all().await;
println!("All caches cleared!");
```

---

### `memory.rs` - Memory Pool Management
**Pool-based memory allocation**:
- Pre-allocated memory chunks
- Reduced allocation overhead
- Fragmentation prevention
- NUMA-aware allocation

**Основные компоненты**:
```rust
pub struct MemoryPool {
    chunks: Vec<MemoryChunk>,
    free_chunks: VecDeque<usize>,
    chunk_size: usize,
    alignment: usize,
    max_chunks: usize,
}

pub struct MemoryChunk {
    data: Box<[u8]>,
    in_use: AtomicBool,
    allocated_at: Option<Instant>,
}

pub struct PooledBuffer {
    pool: Arc<MemoryPool>,
    chunk_index: usize,
    data: *mut u8,
    size: usize,
}

// Safe wrapper для работы с pooled memory
impl PooledBuffer {
    pub fn as_slice(&self) -> &[u8]
    pub fn as_mut_slice(&mut self) -> &mut [u8]
    pub fn len(&self) -> usize
    pub fn is_empty(&self) -> bool
}

// RAII для автоматического возврата памяти в pool
impl Drop for PooledBuffer {
    fn drop(&mut self) {
        self.pool.return_chunk(self.chunk_index);
    }
}
```

**API для memory pools**:
```rust
impl MemoryPool {
    pub fn new(chunk_size: usize, max_chunks: usize) -> Self
    pub fn with_alignment(chunk_size: usize, max_chunks: usize, alignment: usize) -> Self
    
    // Выделение памяти
    pub fn allocate(&self) -> Result<PooledBuffer>
    pub fn try_allocate(&self) -> Option<PooledBuffer>
    
    // Статистика
    pub fn total_chunks(&self) -> usize
    pub fn free_chunks(&self) -> usize
    pub fn utilization(&self) -> f64
    
    // Управление
    pub fn expand(&mut self, additional_chunks: usize) -> Result<()>
    pub fn shrink(&mut self, target_chunks: usize) -> Result<()>
}

// Специализированные пулы для разных типов данных
pub struct VideoBufferPool {
    small_frames: MemoryPool,    // 1920x1080 кадры
    large_frames: MemoryPool,    // 4K кадры
    audio_buffers: MemoryPool,   // Аудио буферы
}

impl VideoBufferPool {
    pub fn new() -> Self {
        Self {
            small_frames: MemoryPool::new(1920 * 1080 * 3, 100),  // RGB24
            large_frames: MemoryPool::new(3840 * 2160 * 3, 50),   // 4K RGB24  
            audio_buffers: MemoryPool::new(44100 * 2 * 4, 200),   // 1sec stereo f32
        }
    }
    
    pub fn allocate_frame(&self, width: usize, height: usize) -> Result<PooledBuffer> {
        let required_size = width * height * 3;
        
        if required_size <= 1920 * 1080 * 3 {
            self.small_frames.allocate()
        } else {
            self.large_frames.allocate()
        }
    }
}
```

---

### `zerocopy.rs` - Zero-Copy Operations
**Минимизация копирования данных**:
- Memory mapping для больших файлов
- Splice operations для pipe transfers
- DMA-style transfers где возможно
- Copy-on-write semantics

**Основные компоненты**:
```rust
pub struct ZeroCopyBuffer {
    inner: ZeroCopyBufferInner,
}

enum ZeroCopyBufferInner {
    MemoryMapped {
        mmap: Mmap,
        offset: usize,
        length: usize,
    },
    Borrowed {
        data: *const u8,
        length: usize,
        lifetime_token: Box<dyn Any + Send + Sync>,
    },
    Owned {
        data: Vec<u8>,
    },
}

pub struct ZeroCopyReader {
    source: Box<dyn ZeroCopySource>,
    buffer_size: usize,
    current_buffer: Option<ZeroCopyBuffer>,
}

pub trait ZeroCopySource: Send + Sync {
    fn read_zero_copy(&mut self, size: usize) -> Result<ZeroCopyBuffer>;
    fn total_size(&self) -> Option<u64>;
    fn position(&self) -> u64;
}

// File-based zero-copy source
pub struct MemoryMappedFile {
    file: File,
    mmap: Mmap,
    position: u64,
}

impl ZeroCopySource for MemoryMappedFile {
    fn read_zero_copy(&mut self, size: usize) -> Result<ZeroCopyBuffer> {
        let remaining = (self.mmap.len() as u64 - self.position) as usize;
        let read_size = size.min(remaining);
        
        if read_size == 0 {
            return Ok(ZeroCopyBuffer::empty());
        }
        
        let buffer = ZeroCopyBuffer::from_mmap(
            &self.mmap,
            self.position as usize,
            read_size
        );
        
        self.position += read_size as u64;
        Ok(buffer)
    }
}
```

**Примеры использования**:
```rust
// Memory-mapped file для больших видео файлов
let video_file = MemoryMappedFile::open("large_video.mp4").await?;
let mut reader = ZeroCopyReader::new(Box::new(video_file), 1024 * 1024);

// Чтение без копирования данных
while let Some(chunk) = reader.read_chunk().await? {
    // Обработка chunk без копирования
    process_video_chunk_zero_copy(&chunk).await?;
}

// Zero-copy transfer между источниками
async fn transfer_zero_copy<S: ZeroCopySource, D: ZeroCopyDestination>(
    mut source: S,
    mut dest: D
) -> Result<u64> {
    let mut total_transferred = 0;
    
    while let Ok(buffer) = source.read_zero_copy(64 * 1024) {
        if buffer.is_empty() {
            break;
        }
        
        let written = dest.write_zero_copy(buffer).await?;
        total_transferred += written;
    }
    
    Ok(total_transferred)
}
```

---

## 🧪 Тестирование

### Покрытие тестами: 32 unit тестов

**`runtime.rs` (14 тестов)**:
- ✅ Worker pool creation и configuration
- ✅ Task execution с различными приоритетами
- ✅ Concurrent access и thread safety
- ✅ Timeout handling
- ✅ Pool resizing и dynamic scaling
- ✅ Metrics collection
- ✅ System monitoring и auto-tuning

**`cache.rs` (18 тестов)**:
- ✅ Все eviction policies (LRU, LFU, FIFO, TTL)
- ✅ TTL expiration и cleanup
- ✅ Concurrent access patterns
- ✅ Memory limits enforcement
- ✅ Hit/miss statistics
- ✅ Batch operations
- ✅ Cache resizing
- ✅ CacheManager operations (clear_all, list_caches)
- ✅ ClearableCache trait implementation
- ✅ Multi-type cache management

**Примеры тестов**:
```rust
#[tokio::test]
async fn test_worker_pool_concurrent_execution() {
    let config = TaskPoolConfig {
        max_concurrent_tasks: 2,
        queue_size: Some(10),
        priority: TaskPriority::Medium,
        timeout: None,
    };
    
    let pool = Arc::new(WorkerPool::new("test_pool".to_string(), config));
    
    // Запускаем больше задач чем может выполняться одновременно
    let mut futures = Vec::new();
    for i in 0..5 {
        let pool_clone = pool.clone();
        futures.push(tokio::spawn(async move {
            pool_clone.execute(async move {
                tokio::time::sleep(Duration::from_millis(100)).await;
                i * 2
            }).await
        }));
    }
    
    // Все задачи должны завершиться успешно
    for future in futures {
        assert!(future.await.is_ok());
    }
}

#[test] 
fn test_cache_lfu_eviction() {
    let config = CacheConfig {
        max_entries: 3,
        max_size_bytes: 1000,
        ttl: Duration::from_secs(10),
        cleanup_interval: Duration::from_secs(5),
        eviction_policy: EvictionPolicy::LFU,
    };
    
    let cache = Cache::new(config);
    
    // Заполняем кэш
    cache.insert("a", "value1");
    cache.insert("b", "value2"); 
    cache.insert("c", "value3");
    
    // Увеличиваем frequency для 'a' и 'b'
    cache.get("a");
    cache.get("a"); 
    cache.get("b");
    
    // Добавляем новый элемент - должен вытеснить 'c' (least frequently used)
    cache.insert("d", "value4");
    
    assert!(cache.get("a").is_some());
    assert!(cache.get("b").is_some());
    assert!(cache.get("c").is_none());  // Вытеснен
    assert!(cache.get("d").is_some());
}
```

---

## 🔧 Интеграция и оптимизация

### Автоматическая настройка производительности
```rust
pub struct PerformanceOptimizer {
    runtime_coordinator: Arc<RuntimeCoordinator>,
    memory_pools: Arc<RwLock<HashMap<String, Arc<MemoryPool>>>>,
    caches: Arc<RwLock<HashMap<String, Arc<dyn CacheManager>>>>,
    system_monitor: SystemMonitor,
}

impl PerformanceOptimizer {
    pub async fn optimize_all(&self) -> Result<()> {
        // Автонастройка runtime pools
        self.runtime_coordinator.auto_tune_all_pools().await?;
        
        // Оптимизация memory pools
        self.optimize_memory_pools().await?;
        
        // Настройка кэшей под текущую нагрузку
        self.optimize_caches().await?;
        
        Ok(())
    }
    
    async fn optimize_memory_pools(&self) -> Result<()> {
        let system_memory = self.system_monitor.available_memory();
        let pools = self.memory_pools.read().await;
        
        for (name, pool) in pools.iter() {
            let utilization = pool.utilization();
            
            if utilization > 0.9 {
                // Расширяем переполненные пулы
                pool.expand(pool.total_chunks() / 4).await?;
            } else if utilization < 0.3 {
                // Сжимаем недоиспользуемые пулы
                pool.shrink(pool.total_chunks() * 3 / 4).await?;
            }
        }
        
        Ok(())
    }
}
```

### Конфигурация для разных сценариев
```rust
// Конфигурация для видео обработки
pub fn video_processing_config() -> PerformanceConfig {
    PerformanceConfig {
        runtime: RuntimeConfig {
            video_pool_size: num_cpus::get().min(8),
            io_pool_size: num_cpus::get() * 2,
            background_pool_size: 2,
        },
        memory: MemoryConfig {
            frame_pool_chunks: 200,
            audio_pool_chunks: 100,
            chunk_alignment: 64,  // Cache line alignment
        },
        cache: CacheConfig {
            frame_cache_size_mb: 512,
            thumbnail_cache_size_mb: 128,
            metadata_cache_entries: 10000,
            eviction_policy: EvictionPolicy::LRU,
        },
    }
}

// Конфигурация для low-memory устройств
pub fn low_memory_config() -> PerformanceConfig {
    PerformanceConfig {
        runtime: RuntimeConfig {
            video_pool_size: 2,
            io_pool_size: 4,
            background_pool_size: 1,
        },
        memory: MemoryConfig {
            frame_pool_chunks: 50,
            audio_pool_chunks: 25,
            chunk_alignment: 32,
        },
        cache: CacheConfig {
            frame_cache_size_mb: 64,
            thumbnail_cache_size_mb: 16,
            metadata_cache_entries: 1000,
            eviction_policy: EvictionPolicy::LFU,  // Более агрессивная очистка
        },
    }
}
```

---

## 📊 Мониторинг производительности

### Встроенные метрики
```rust
// Runtime метрики
pub struct RuntimeMetrics {
    pub pool_utilization: HashMap<String, f64>,
    pub average_task_duration: HashMap<String, Duration>,
    pub queue_lengths: HashMap<String, usize>,
    pub failed_tasks: HashMap<String, u64>,
}

// Cache метрики
pub struct CacheMetrics {
    pub hit_rate: f64,
    pub miss_rate: f64,
    pub eviction_rate: f64,
    pub memory_utilization: f64,
    pub average_access_time: Duration,
}

// Memory метрики
pub struct MemoryMetrics {
    pub pool_utilization: HashMap<String, f64>,
    pub allocation_rate: f64,
    pub fragmentation_ratio: f64,
    pub peak_usage: usize,
}
```

### Integration с телеметрией
```rust
use crate::core::telemetry::Metrics;

impl WorkerPool {
    pub async fn report_metrics(&self, metrics: &Metrics) -> Result<()> {
        let pool_metrics = self.get_metrics();
        
        metrics.set_gauge_with_attributes(
            "worker_pool_utilization",
            self.current_load(),
            vec![("pool_id", &self.pool_id)]
        ).await?;
        
        metrics.increment_counter_with_attributes(
            "tasks_executed_total",
            pool_metrics.tasks_executed.load(Ordering::Relaxed),
            vec![("pool_id", &self.pool_id)]
        ).await?;
        
        Ok(())
    }
}
```

---

## 📚 Связанная документация

- [Performance Optimization Guide](../../../../../docs-ru/08-roadmap/planned/performance-optimization.md)
- [Memory Management Best Practices](../../../../../docs-ru/05-video-compiler/memory-management.md)
- [Caching Strategies](../../../../../docs-ru/05-video-compiler/caching.md)
- [Backend Testing Architecture](../../../../../docs-ru/08-roadmap/in-progress/backend-testing-architecture.md)

---

## 🔨 Последние изменения

### Cache Management Implementation (24.06.2025)
- Добавлен **ClearableCache trait** для универсальной очистки кэшей
- Реализован **CacheManager** с поддержкой различных типов кэшей
- Добавлен метод `clear_all()` для централизованной очистки всех кэшей
- Интегрирован с системой команд Tauri через `clear_all_cache` команду
- Добавлены тесты для новой функциональности (3 новых теста)

---

*Последнее обновление: 24 июня 2025*