# Руководство по тестированию

## Обзор

Этот документ описывает стратегию тестирования, организацию тестов и лучшие практики для backend Timeline Studio.

## Настройка разработки

### Предварительные требования

- Rust 1.70+ с cargo
- FFmpeg установлен и доступен в PATH
- Node.js 24+ (для интеграции с frontend)
- Tauri CLI: `cargo install tauri-cli`

### Запуск в режиме разработки

```bash
# Запуск тестов
cargo test

# Запуск с покрытием
cargo tarpaulin --workspace

# Запуск конкретного теста
cargo test test_name

# Запуск Tauri в режиме разработки
cargo tauri dev
```

## Стратегия тестирования

### Модульные тесты

Каждый модуль должен иметь комплексные модульные тесты, покрывающие:

1. **Сценарии успешного выполнения** - Нормальное ожидаемое поведение
2. **Граничные случаи** - Граничные условия, пустые входные данные
3. **Обработка ошибок** - Неверные входные данные, системные сбои
4. **Сериализация** - JSON сериализация/десериализация
5. **Управление состоянием** - Параллельный доступ, мутации

### Организация тестов

Тесты организованы двумя способами:

1. **Встроенные тесты** - Маленькие модули имеют тесты внизу файла
   ```rust
   #[cfg(test)]
   mod tests {
       use super::*;
       // тесты здесь
   }
   ```

2. **Отдельные файлы тестов** - Большие модули используют `tests.rs` в той же директории
   ```
   src/
   ├── media/
   │   ├── metadata.rs
   │   └── metadata/
   │       └── tests.rs
   ```

### Руководство по мокированию

- Используйте условную компиляцию для платформо-специфичных тестов
- Мокируйте внешние зависимости (FFmpeg, файловая система)
- Создавайте тестовые фикстуры с помощью крейта `tempfile`
- Избегайте захардкоженных путей - используйте временные директории

## Покрытие кода

### Текущий статус

По последним измерениям:
- Общее покрытие: 42.62%
- Целевое покрытие: 90%
- Всего строк покрыто: 1464/3435

### Покрытие по модулям

| Модуль | Покрытие | Строк покрыто | Приоритет |
|--------|----------|---------------|-----------|
| filesystem.rs | 90.74% | 49/54 | Завершено |
| language.rs | 90.91% | 20/22 | Завершено |
| media/metadata.rs | 69.66% | 62/89 | Высокий |
| media/ffmpeg.rs | 80.00% | 4/5 | Низкий |
| media/files.rs | 100.00% | 11/11 | Завершено |
| video_compiler/commands.rs | 20.34% | 72/354 | Критический |
| video_compiler/cache.rs | 95.31% | 122/128 | Завершено |
| video_compiler/error.rs | 98.52% | 133/135 | Завершено |
| video_compiler/ffmpeg_builder.rs | 21.71% | 208/958 | Критический |
| video_compiler/frame_extraction.rs | 45.32% | 92/203 | Средний |
| video_compiler/gpu.rs | 40.96% | 77/188 | Средний |
| video_compiler/pipeline.rs | 32.10% | 147/458 | Высокий |
| video_compiler/preview.rs | 40.77% | 95/233 | Средний |
| video_compiler/progress.rs | 74.49% | 146/196 | Низкий |
| video_compiler/renderer.rs | 82.86% | 58/70 | Низкий |
| video_compiler/schema.rs | 71.43% | 95/133 | Низкий |
| video_server/server.rs | 68.92% | 51/74 | Низкий |
| lib.rs | 4.60% | 4/87 | Критический |
| main.rs | 0.00% | 0/2 | Н/Д |

### Улучшение покрытия

1. **Идентификация непротестированного кода**
   ```bash
   cargo tarpaulin --workspace --ignore-tests
   ```

2. **Генерация HTML отчета**
   ```bash
   cargo tarpaulin --workspace --html
   ```

3. **Области фокуса**
   - Обработчики команд
   - Пути ошибок
   - Асинхронные операции
   - Операции с кешем

## Примеры тестов

### Тестирование асинхронных функций

```rust
#[tokio::test]
async fn test_async_operation() {
    let service = MyService::new();
    let result = service.async_method().await;
    assert!(result.is_ok());
}
```

### Тестирование с временными файлами

```rust
use tempfile::tempdir;

#[test]
fn test_file_operations() {
    let temp_dir = tempdir().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    
    // Выполнение операций с файлом
    write_file(&file_path, "content").unwrap();
    
    // Проверка
    assert!(file_path.exists());
}
```

### Тестирование обработки ошибок

```rust
#[test]
fn test_error_handling() {
    let result = risky_operation();
    
    assert!(matches!(
        result,
        Err(VideoCompilerError::InvalidInput(_))
    ));
}
```

## Интеграционные тесты

### Структура
```
tests/
├── integration/
│   ├── render_test.rs
│   ├── preview_test.rs
│   └── common/
│       └── mod.rs
```

### Пример интеграционного теста
```rust
// tests/integration/render_test.rs
use timeline_studio::*;

#[tokio::test]
async fn test_full_render_pipeline() {
    let project = create_test_project();
    let result = render_project(&project).await;
    assert!(result.is_ok());
}
```

## CI/CD проверки

### Pre-commit проверки

1. `cargo fmt -- --check` - Проверка форматирования
2. `cargo clippy -- -D warnings` - Линтинг
3. `cargo test` - Запуск всех тестов
4. `cargo tarpaulin --fail-under 80` - Проверка покрытия

## Лучшие практики

1. **Именование тестов** - Используйте описательные имена
2. **Изоляция** - Каждый тест должен быть независимым
3. **Детерминированность** - Тесты должны давать одинаковый результат
4. **Скорость** - Держите модульные тесты быстрыми
5. **Документация** - Комментируйте сложные тестовые сценарии