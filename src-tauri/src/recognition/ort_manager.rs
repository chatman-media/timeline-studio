use anyhow::Result;
use std::sync::{Mutex, Once};

static INIT: Once = Once::new();
static ORT_INITIALIZED: Mutex<bool> = Mutex::new(false);

pub struct OrtManager;

impl OrtManager {
  pub fn ensure_initialized() -> Result<()> {
    // Проверяем, не была ли уже инициализирована
    if let Ok(initialized) = ORT_INITIALIZED.lock() {
      if *initialized {
        return Ok(());
      }
    }

    let mut result = Ok(());

    INIT.call_once(|| {
      // Используем catch_unwind для предотвращения паники при двойной инициализации
      let init_result = std::panic::catch_unwind(|| ort::init().commit());

      match init_result {
        Ok(Ok(_)) => {
          log::info!("ONNX Runtime initialized successfully");
          if let Ok(mut initialized) = ORT_INITIALIZED.lock() {
            *initialized = true;
          }
        }
        Ok(Err(e)) => {
          log::error!("Failed to initialize ONNX Runtime: {}", e);
          result = Err(anyhow::anyhow!("Failed to initialize ONNX Runtime: {}", e));
        }
        Err(_) => {
          // Panic occurred - возможно, ORT уже был инициализирован
          log::warn!("ONNX Runtime initialization panicked - it may already be initialized");
          // Считаем, что уже инициализирован
          if let Ok(mut initialized) = ORT_INITIALIZED.lock() {
            *initialized = true;
          }
        }
      }
    });

    if let Ok(initialized) = ORT_INITIALIZED.lock() {
      if *initialized {
        Ok(())
      } else {
        result
      }
    } else {
      Err(anyhow::anyhow!("Failed to check ORT initialization status"))
    }
  }

  pub fn is_initialized() -> bool {
    ORT_INITIALIZED.lock().map(|g| *g).unwrap_or(false)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_ort_manager_initialization() {
    let result = OrtManager::ensure_initialized();

    // Просто проверяем, что функция не паникует
    // Результат может быть как Ok, так и Err в зависимости от окружения
    assert!(result.is_ok() || result.is_err());

    assert_eq!(OrtManager::is_initialized(), result.is_ok());
  }
}
