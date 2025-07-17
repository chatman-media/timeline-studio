# Core Modules / Основные модули

Основные компоненты архитектуры Timeline Studio backend, реализующие dependency injection, event system, plugin architecture, telemetry и performance optimization.

## 📁 Структура модулей

### 🔗 Dependency Injection (`di.rs`)
**Назначение**: Система управления зависимостями и сервисами

**Основные компоненты**:
- `ServiceContainer` - контейнер сервисов с type-safe resolution
- `Service` trait - базовый интерфейс для всех сервисов  
- `ServiceProvider` - фабрика для lazy-loaded сервисов

**Возможности**:
- Thread-safe управление сервисами через `Arc<RwLock>`
- Type-safe downcast без unsafe кода
- Lifecycle management (initialize, health_check, shutdown)
- Concurrent access support

**Использование**:
```rust
let container = ServiceContainer::new();
container.register(MyService::new()).await?;
let service = container.resolve::<MyService>().await?;
```

**Тесты**: 8 unit тестов, 100% покрытие

---

### 📡 Event System (`events.rs`)
**Назначение**: Асинхронная система событий для межкомпонентного взаимодействия

**Основные компоненты**:
- `EventBus` - центральный диспетчер событий
- `EventHandler` trait - интерфейс обработчиков
- Priority-based event routing

**Возможности**:
- Async event handlers
- Type-safe event subscription/publishing
- Priority-based routing
- Error handling и resilience

**Использование**:
```rust
let bus = EventBus::new();
bus.subscribe::<MyEvent>(|event| async move {
    // Handle event
}).await;
bus.publish(MyEvent { data: "test" }).await?;
```

**Тесты**: 9 unit тестов, полное покрытие функциональности

---

### 🔌 Plugin System (`plugins/`)
**Назначение**: Безопасная система плагинов с sandbox изоляцией

**Модули**:
- `plugin.rs` - базовая структура плагинов
- `manager.rs` - управление жизненным циклом плагинов
- `permissions.rs` - система разрешений и безопасности
- `sandbox.rs` - изоляция плагинов
- `loader.rs` - загрузка WASM плагинов
- `api.rs` - API для взаимодействия с плагинами
- `context.rs` - контекст выполнения

**Возможности**:
- WASM-based plugin execution
- Granular permission system (filesystem, network, system calls)
- Resource limits и timeout controls
- Command execution с валидацией
- Metadata management

**Использование**:
```rust
let manager = PluginManager::new();
let plugin = manager.load_plugin("./plugin.wasm").await?;
let result = manager.execute_command(&plugin.id, "process_video", args).await?;
```

**Тесты**: 29 unit тестов, покрытие всех модулей

---

### 📊 Telemetry (`telemetry/`)
**Назначение**: Система мониторинга, метрик и трейсинга

**Модули**:
- `metrics.rs` - OpenTelemetry метрики (Counter, Gauge, Histogram)
- `health.rs` - Health checks и мониторинг состояния
- `tracer.rs` - Distributed tracing
- `middleware.rs` - HTTP middleware для автоматического трейсинга
- `config.rs` - конфигурация telemetry

**Возможности**:
- OpenTelemetry integration
- Custom metrics с различными типами
- Health check system с кэшированием
- Automatic HTTP request tracing
- System metrics collection (CPU, memory)
- Export в Prometheus, Jaeger, etc.

**Использование**:
```rust
let metrics = Metrics::new().await?;
metrics.increment_counter("requests_total", 1).await?;

let health = HealthCheckManager::new();
health.add_check(Box::new(DatabaseHealthCheck)).await;
let status = health.check_all().await?;
```

**Тесты**: 34 unit тестов, полное покрытие

---

### ⚡ Performance (`performance/`)
**Назначение**: Оптимизация производительности и управление ресурсами

**Модули**:
- `runtime.rs` - асинхронные worker pools и task management
- `cache.rs` - высокопроизводительное кэширование с различными стратегиями
- `memory.rs` - управление памятью и memory pools
- `zerocopy.rs` - zero-copy операции для больших данных

**Возможности**:
- Configurable worker pools с приоритетами
- LRU/LFU/FIFO cache eviction policies
- TTL support для кэша
- Memory pooling для frequent allocations
- Zero-copy data transfers
- Automatic performance tuning

**Использование**:
```rust
// Worker pool
let pool = WorkerPool::new("video_processing".to_string(), config);
pool.execute(task).await?;

// Cache
let cache = Cache::new(config);
cache.insert("key", data, ttl).await;
let value = cache.get("key").await;
```

**Тесты**: 29 unit тестов, все сценарии покрыты

---

### 🧪 Test Utils (`test_utils.rs`)
**Назначение**: Переиспользуемая тестовая инфраструктура

**Компоненты**:
- Mock implementations всех основных сервисов
- Test fixtures и helper functions
- Timeout utilities и async testing support
- Macros для упрощения тестов

**Возможности**:
- `MockService` и `MockService2` для DI тестов
- `MockEventBus` для event system тестов  
- `MockPluginManager` для plugin тестов
- Test environment setup
- Async timeout helpers

**Использование**:
```rust
use crate::core::test_utils::*;

let container = create_test_container().await;
let mock_service = container.resolve::<MockService>().await?;
assert_timeout!(Duration::from_secs(1), async_operation()).await;
```

**Тесты**: 6 unit тестов для самой инфраструктуры

---

## 🏗️ Архитектурные принципы

### Dependency Injection
Все компоненты используют DI контейнер для управления зависимостями:
```rust
// Регистрация сервисов
container.register(EventBus::new()).await?;
container.register(PluginManager::new()).await?;
container.register(Metrics::new().await?).await?;

// Автоматическое внедрение зависимостей
let service = container.resolve::<VideoCompilerService>().await?;
```

### Async-First
Все API проектируются с поддержкой async/await:
- Non-blocking operations
- Timeout support
- Concurrent processing
- Backpressure handling

### Type Safety
- Compile-time гарантии через Rust type system
- No unsafe code в production paths
- Generic interfaces с trait bounds
- Error handling через `Result<T, Error>`

### Modularity
- Loose coupling через traits
- Plugin-based extensibility  
- Configuration-driven behavior
- Hot-swappable components

---

## 📊 Метрики тестирования

| Модуль | Тестов | Покрытие | Статус |
|--------|--------|----------|--------|
| DI | 8 | 100% | ✅ |
| Events | 9 | 100% | ✅ |
| Plugins | 29 | 100% | ✅ |
| Telemetry | 34 | 100% | ✅ |
| Performance | 29 | 100% | ✅ |
| Test Utils | 6 | 100% | ✅ |
| **Итого** | **115** | **100%** | ✅ |

---

## 🚀 Интеграция

### В main приложении
```rust
use timeline_studio::core::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Создание DI контейнера
    let container = ServiceContainer::new();
    
    // Регистрация core сервисов
    container.register(EventBus::new()).await?;
    container.register(PluginManager::new()).await?;
    container.register(Metrics::new().await?).await?;
    
    // Инициализация всех сервисов
    container.initialize_all().await?;
    
    // Ваше приложение здесь...
    
    // Graceful shutdown
    container.shutdown_all().await?;
    Ok(())
}
```

### С Video Compiler
```rust
// Video Compiler сервисы используют core infrastructure
let video_compiler = container.resolve::<VideoCompilerService>().await?;
video_compiler.initialize().await?;
```

---

## 📚 Дополнительная документация

- [Backend Testing Architecture](../../../../docs-ru/08-roadmap/in-progress/backend-testing-architecture.md)
- [Performance Optimization](../../../../docs-ru/08-roadmap/planned/performance-optimization.md) 
- [Plugin Development Guide](../../../../docs-ru/06-plugins/development-guide.md)
- [Telemetry Configuration](../../../../docs-ru/07-telemetry/configuration.md)

---

## 🔄 Последние изменения (25 июня 2025)

### DI контейнер
- Улучшена обработка ошибок в ServiceContainer
- Добавлены дополнительные методы для работы с сервисами

### Performance модуль
- Реализован ClearableCache trait для универсальной очистки кэшей
- Добавлен CacheManager для централизованного управления кэшами
- Обновлена документация performance/README.md

### Plugins система
- Добавлены services bridges для интеграции с media, timeline и UI
- Улучшена система разрешений
- Обновлена документация plugins/README.md

### Telemetry
- Добавлены новые метрики для отслеживания производительности
- Улучшена интеграция с OpenTelemetry
- Обновлена документация telemetry/README.md

---

*Последнее обновление: 25 июня 2025*