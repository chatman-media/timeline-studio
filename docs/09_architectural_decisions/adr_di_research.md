# Исследование Dependency Injection для Rust

## Обзор популярных DI решений

### 1. **Shaku** (⭐ 350+)
**Репозиторий**: https://github.com/AzureMarker/shaku

**Преимущества:**
- Compile-time и runtime DI
- Хорошая документация
- Поддержка async
- Макросы для упрощения
- Thread-safe по умолчанию

**Недостатки:**
- Требует derive макросов
- Может усложнить код
- Не самая активная разработка

**Пример:**
```rust
use shaku::{module, Component, Interface, HasComponent};

trait MyService: Interface {
    fn process(&self) -> String;
}

#[derive(Component)]
#[shaku(interface = MyService)]
struct MyServiceImpl;

impl MyService for MyServiceImpl {
    fn process(&self) -> String {
        "Processing...".to_string()
    }
}

module! {
    MyModule {
        components = [MyServiceImpl],
        providers = []
    }
}
```

### 2. **dependency-injection** (⭐ 100+)
**Репозиторий**: https://github.com/Mossaka/dependency-injection-rs

**Преимущества:**
- Простой API
- Минимальные зависимости
- Runtime resolution

**Недостатки:**
- Меньше функций
- Нет compile-time проверок
- Маленькое сообщество

### 3. **Axum-style DI** (встроенный в Tauri)
**Использование State<T> в Tauri**

**Преимущества:**
- Уже используется в проекте
- Нативная поддержка Tauri
- Простота использования
- Type-safe

**Недостатки:**
- Ограничен Tauri commands
- Не полноценный DI container

**Текущее использование:**
```rust
#[tauri::command]
pub async fn my_command(
    state: State<'_, VideoCompilerState>,
) -> Result<String> {
    // ...
}
```

### 4. **Самописный DI Container**

**Преимущества:**
- Полный контроль
- Точно под наши нужды
- Интеграция с CommandRegistry

**Недостатки:**
- Время на разработку
- Нужно поддерживать
- Возможные баги

## Рекомендация

Для Timeline Studio рекомендую **гибридный подход**:

1. **Использовать Tauri State** для command-level DI (уже есть)
2. **Создать легковесный ServiceContainer** для внутренних сервисов
3. **Не использовать тяжелые DI фреймворки** - они добавят сложности

## Предлагаемая архитектура

```rust
// src-tauri/src/core/di.rs

use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Легковесный DI контейнер для сервисов
pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, Box<dyn Any + Send + Sync>>>>,
}

impl ServiceContainer {
    pub fn new() -> Self {
        Self {
            services: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Регистрация singleton сервиса
    pub async fn register<T: Any + Send + Sync + 'static>(&self, service: T) {
        let mut services = self.services.write().await;
        services.insert(TypeId::of::<T>(), Box::new(service));
    }

    /// Получение сервиса
    pub async fn resolve<T: Any + Send + Sync + 'static>(&self) -> Option<Arc<T>> {
        let services = self.services.read().await;
        services
            .get(&TypeId::of::<T>())
            .and_then(|s| s.downcast_ref::<T>())
            .map(|s| Arc::new(s.clone()))
    }
}

/// Trait для сервисов с жизненным циклом
pub trait Service: Send + Sync {
    async fn initialize(&mut self) -> Result<()>;
    async fn shutdown(&mut self) -> Result<()>;
}
```

## План внедрения

1. **Фаза 1**: Создать базовый ServiceContainer
2. **Фаза 2**: Интегрировать с существующими сервисами
3. **Фаза 3**: Добавить lifecycle management
4. **Фаза 4**: Event system интеграция

## Выводы

- Не нужен тяжелый DI фреймворк
- Tauri State + легкий ServiceContainer достаточно
- Фокус на простоте и производительности
- Постепенное внедрение