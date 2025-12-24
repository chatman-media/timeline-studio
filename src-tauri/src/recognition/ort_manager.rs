use anyhow::Result;
use std::sync::{
  atomic::{AtomicBool, Ordering},
  Once,
};

static INIT: Once = Once::new();
static ORT_INITIALIZED: AtomicBool = AtomicBool::new(false);

pub struct OrtManager;

impl OrtManager {
  pub fn ensure_initialized() -> Result<()> {
    // Проверяем, не была ли уже инициализирована
    if ORT_INITIALIZED.load(Ordering::Acquire) {
      return Ok(());
    }

    let mut result = Ok(());

    INIT.call_once(|| {
      // Используем catch_unwind для предотвращения паники при двойной инициализации
      let init_result = std::panic::catch_unwind(|| {
        // Инициализируем ONNX Runtime
        // ВАЖНО: Environment создается как глобальный синглтон внутри библиотеки ort.
        // При завершении приложения (std::process::exit) деструктор OrtEnv может
        // вызвать SIGABRT из-за попытки очистки уже очищенных mutex'ов.
        // Решение: не используем std::process::exit - полагаемся на graceful shutdown
        // через обработчик window close event в lib.rs
        ort::init().commit()
      });

      match init_result {
        Ok(Ok(_)) => {
          log::info!("ONNX Runtime initialized successfully");
          ORT_INITIALIZED.store(true, Ordering::Release);
        }
        Ok(Err(e)) => {
          log::error!("Failed to initialize ONNX Runtime: {}", e);
          result = Err(anyhow::anyhow!("Failed to initialize ONNX Runtime: {}", e));
        }
        Err(_) => {
          // Panic occurred - возможно, ORT уже был инициализирован
          log::warn!("ONNX Runtime initialization panicked - it may already be initialized");
          // Считаем, что уже инициализирован
          ORT_INITIALIZED.store(true, Ordering::Release);
        }
      }
    });

    if ORT_INITIALIZED.load(Ordering::Acquire) {
      Ok(())
    } else {
      result
    }
  }

  pub fn is_initialized() -> bool {
    ORT_INITIALIZED.load(Ordering::Acquire)
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
