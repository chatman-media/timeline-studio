# Dependency Injection Research for Rust

## Overview of Popular DI Solutions

### 1. **Shaku** (⭐ 350+)
**Repository**: https://github.com/AzureMarker/shaku

**Advantages:**
- Compile-time and runtime DI
- Good documentation
- Async support
- Macros for simplification
- Thread-safe by default

**Disadvantages:**
- Requires derive macros
- Can complicate code
- Not the most active development

**Example:**
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
**Repository**: https://github.com/Mossaka/dependency-injection-rs

**Advantages:**
- Simple API
- Minimal dependencies
- Runtime resolution

**Disadvantages:**
- Fewer features
- No compile-time checks
- Small community

### 3. **Axum-style DI** (built into Tauri)
**Using State<T> in Tauri**

**Advantages:**
- Already used in the project
- Native Tauri support
- Ease of use
- Type-safe

**Disadvantages:**
- Limited to Tauri commands
- Not a full DI container

**Current usage:**
```rust
#[tauri::command]
pub async fn my_command(
    state: State<'_, VideoCompilerState>,
) -> Result<String> {
    // ...
}
```

### 4. **Custom DI Container**

**Advantages:**
- Full control
- Exactly for our needs
- Integration with CommandRegistry

**Disadvantages:**
- Development time
- Need to maintain
- Possible bugs

## Recommendation

For Timeline Studio, I recommend a **hybrid approach**:

1. **Use Tauri State** for command-level DI (already exists)
2. **Create a lightweight ServiceContainer** for internal services
3. **Don't use heavy DI frameworks** - they add complexity

## Proposed Architecture

```rust
// src-tauri/src/core/di.rs

use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Lightweight DI container for services
pub struct ServiceContainer {
    services: Arc<RwLock<HashMap<TypeId, Box<dyn Any + Send + Sync>>>>,
}

impl ServiceContainer {
    pub fn new() -> Self {
        Self {
            services: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register singleton service
    pub async fn register<T: Any + Send + Sync + 'static>(&self, service: T) {
        let mut services = self.services.write().await;
        services.insert(TypeId::of::<T>(), Box::new(service));
    }

    /// Resolve service
    pub async fn resolve<T: Any + Send + Sync + 'static>(&self) -> Option<Arc<T>> {
        let services = self.services.read().await;
        services
            .get(&TypeId::of::<T>())
            .and_then(|s| s.downcast_ref::<T>())
            .map(|s| Arc::new(s.clone()))
    }
}

/// Trait for services with lifecycle
pub trait Service: Send + Sync {
    async fn initialize(&mut self) -> Result<()>;
    async fn shutdown(&mut self) -> Result<()>;
}
```

## Implementation Plan

1. **Phase 1**: Create basic ServiceContainer
2. **Phase 2**: Integrate with existing services
3. **Phase 3**: Add lifecycle management
4. **Phase 4**: Event system integration

## Conclusions

- No need for heavy DI framework
- Tauri State + lightweight ServiceContainer is sufficient
- Focus on simplicity and performance
- Gradual implementation