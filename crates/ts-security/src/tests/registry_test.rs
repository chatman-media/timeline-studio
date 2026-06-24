#[cfg(test)]
mod tests {
  use ts_command_registry::CommandRegistry;
  use crate::registry::SecurityCommandRegistry;

  #[test]
  fn test_security_command_registry_trait_implementation() {
    // Проверяем что SecurityCommandRegistry корректно реализует CommandRegistry trait
    fn assert_command_registry<T: CommandRegistry>() {}
    assert_command_registry::<SecurityCommandRegistry>();
  }
}
