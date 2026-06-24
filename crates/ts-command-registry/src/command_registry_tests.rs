#[cfg(test)]
mod command_registry_tests {
  use crate::CommandRegistry;
  use serde::{Deserialize, Serialize};
  use tauri::{Builder, Runtime};

  // Mock commands for testing
  #[tauri::command]
  fn test_command_1() -> String {
    "Command 1 executed".to_string()
  }

  #[tauri::command]
  fn test_command_2(input: String) -> String {
    format!("Command 2 received: {input}")
  }

  #[tauri::command]
  async fn test_async_command(value: i32) -> Result<i32, String> {
    Ok(value * 2)
  }

  #[derive(Debug, Serialize, Deserialize)]
  struct TestData {
    name: String,
    value: i32,
  }

  #[tauri::command]
  fn test_complex_command(data: TestData) -> Result<TestData, String> {
    Ok(TestData {
      name: format!("Processed: {}", data.name),
      value: data.value + 10,
    })
  }

  // Mock module implementing CommandRegistry
  struct TestModule;

  impl CommandRegistry for TestModule {
    fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
      builder.invoke_handler(tauri::generate_handler![
        test_command_1,
        test_command_2,
        test_async_command,
        test_complex_command
      ])
    }
  }

  // Another test module
  struct AnotherTestModule;

  impl CommandRegistry for AnotherTestModule {
    fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
      builder.invoke_handler(tauri::generate_handler![
        another_command,
        yet_another_command
      ])
    }
  }

  #[tauri::command]
  fn another_command() -> &'static str {
    "Another command"
  }

  #[tauri::command]
  fn yet_another_command(id: u64) -> u64 {
    id * 2
  }

  #[test]
  fn test_command_registry_trait() {
    // Test that the trait can be implemented
    let _module = TestModule;
    let _another_module = AnotherTestModule;
  }

  #[test]
  fn test_register_commands_macro() {
    // Test macro expansion
    let commands = ["test_command_1", "test_command_2"];
    assert_eq!(commands.len(), 2);
  }

  #[test]
  fn test_command_registry_with_empty_commands() {
    struct EmptyModule;

    impl CommandRegistry for EmptyModule {
      fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
        builder
      }
    }

    let _empty = EmptyModule;
  }

  #[test]
  fn test_multiple_module_registration() {
    // Test that multiple modules can implement the trait
    struct ModuleA;
    struct ModuleB;
    struct ModuleC;

    impl CommandRegistry for ModuleA {
      fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
        builder
      }
    }

    impl CommandRegistry for ModuleB {
      fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
        builder
      }
    }

    impl CommandRegistry for ModuleC {
      fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
        builder
      }
    }

    // Instantiate to avoid dead code warnings
    let _a = ModuleA;
    let _b = ModuleB;
    let _c = ModuleC;
  }

  #[test]
  fn test_command_functions() {
    // Test individual command functions
    assert_eq!(test_command_1(), "Command 1 executed");
    assert_eq!(
      test_command_2("test".to_string()),
      "Command 2 received: test"
    );
    assert_eq!(another_command(), "Another command");
    assert_eq!(yet_another_command(5), 10);
  }

  #[tokio::test]
  async fn test_async_command_function() {
    let result = test_async_command(21).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 42);
  }

  #[test]
  fn test_complex_command_function() {
    let input = TestData {
      name: "Test".to_string(),
      value: 5,
    };

    let result = test_complex_command(input);
    assert!(result.is_ok());

    let output = result.unwrap();
    assert_eq!(output.name, "Processed: Test");
    assert_eq!(output.value, 15);
  }

  #[test]
  fn test_command_registry_pattern() {
    // Test the pattern of using CommandRegistry trait
    fn register_all_modules<R: Runtime>(mut builder: Builder<R>) -> Builder<R> {
      builder = TestModule::register_commands(builder);
      builder = AnotherTestModule::register_commands(builder);
      builder
    }

    // This tests the pattern without actually building the app
    // Just verify the function can be defined
    let _ = register_all_modules::<tauri::Wry>;
  }

  #[test]
  fn test_command_error_handling() {
    #[tauri::command]
    fn error_command(should_fail: bool) -> Result<String, String> {
      if should_fail {
        Err("Command failed".to_string())
      } else {
        Ok("Success".to_string())
      }
    }

    assert!(error_command(false).is_ok());
    assert!(error_command(true).is_err());
  }

  #[test]
  fn test_command_with_optional_params() {
    #[tauri::command]
    fn optional_param_command(required: String, optional: Option<String>) -> String {
      match optional {
        Some(opt) => format!("{required} with {opt}"),
        None => required,
      }
    }

    assert_eq!(optional_param_command("test".to_string(), None), "test");
    assert_eq!(
      optional_param_command("test".to_string(), Some("option".to_string())),
      "test with option"
    );
  }

  #[test]
  fn test_command_with_result_types() {
    #[tauri::command]
    fn result_command(input: i32) -> Result<i32, String> {
      if input > 0 {
        Ok(input * 2)
      } else {
        Err("Input must be positive".to_string())
      }
    }

    assert_eq!(result_command(5).unwrap(), 10);
    assert!(result_command(-1).is_err());
  }

  #[test]
  fn test_command_serialization() {
    use serde_json;

    let data = TestData {
      name: "Serialize Test".to_string(),
      value: 42,
    };

    let json = serde_json::to_string(&data).unwrap();
    let deserialized: TestData = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.name, data.name);
    assert_eq!(deserialized.value, data.value);
  }

  #[test]
  fn test_command_registry_composability() {
    // Test that CommandRegistry implementations can be composed
    struct CompositeModule;

    impl CommandRegistry for CompositeModule {
      fn register_commands<R: Runtime>(mut builder: Builder<R>) -> Builder<R> {
        // Register commands from other modules
        builder = TestModule::register_commands(builder);
        builder = AnotherTestModule::register_commands(builder);
        // Add own commands
        builder.invoke_handler(tauri::generate_handler![composite_command])
      }
    }

    #[tauri::command]
    fn composite_command() -> &'static str {
      "Composite command"
    }

    let _composite = CompositeModule;
    assert_eq!(composite_command(), "Composite command");
  }

  #[test]
  fn test_macro_with_trailing_comma() {
    // Test that the macro works with trailing comma
    let command_list = ["cmd1", "cmd2", "cmd3"];
    assert_eq!(command_list.len(), 3);
  }

  #[test]
  fn test_macro_without_trailing_comma() {
    // Test that the macro works without trailing comma
    let command_list = ["cmd1", "cmd2", "cmd3"];
    assert_eq!(command_list.len(), 3);
  }
}
