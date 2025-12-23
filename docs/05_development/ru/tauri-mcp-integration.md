# Интеграция Tauri MCP для Timeline Studio

## Обзор

Tauri MCP (Model Context Protocol) сервер предоставляет AI-ассистентам возможность взаимодействовать с Timeline Studio во время разработки и тестирования. Это позволяет автоматизировать тестирование, отладку и разработку через стандартизированный интерфейс.

## Возможности

### 1. Управление процессами
- **Запуск приложения**: `launch_app`
- **Остановка приложения**: `stop_app`
- **Получение логов**: `get_app_logs`
- **Мониторинг ресурсов**: `monitor_resources`

### 2. Манипуляция окнами
- **Захват скриншотов**: `take_screenshot`
- **Получение информации об окне**: `get_window_info`
- **Изменение размера окна**: `resize_window`
- **Перемещение окна**: `move_window`

### 3. Имитация ввода
- **Эмуляция клавиатуры**: `send_keyboard_input`
- **Эмуляция мыши**: `send_mouse_click`, `send_mouse_move`
- **Прокрутка**: `send_scroll`

### 4. Отладка
- **Выполнение JavaScript**: `execute_javascript`
- **Интеграция с DevTools**: `open_devtools`
- **Инспектирование элементов**: `inspect_element`

### 5. IPC взаимодействие
- **Вызов Tauri команд**: `call_tauri_command`
- **Эмиссия событий**: `emit_event`
- **Получение списка команд**: `list_tauri_commands`

## Установка

### Требования
- Rust 1.70+
- Cargo
- Tauri v2 приложение

### Установка через Cargo

```bash
cargo install tauri-mcp
```

После установки binary будет доступен в `~/.cargo/bin/tauri-mcp`.

## Конфигурация

### 1. Файл конфигурации (tauri-mcp.toml)

Создан в корне проекта:

```toml
# Автоматическое обнаружение Tauri приложений
auto_discover = true

# Управление сеансами
session_management = true

# Уровень логирования
log_level = "info"

[server]
host = "127.0.0.1"
port = 3000

[screenshots]
format = "png"
jpeg_quality = 90
```

### 2. Claude Desktop Integration

Добавлено в `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tauri-mcp": {
      "command": "tauri-mcp",
      "args": ["serve"],
      "env": {
        "TAURI_MCP_LOG_LEVEL": "info",
        "TAURI_MCP_CONFIG": "./tauri-mcp.toml"
      }
    }
  }
}
```

### 3. Переменные окружения

- `TAURI_MCP_LOG_LEVEL` - Уровень логирования (trace, debug, info, warn, error)
- `TAURI_MCP_CONFIG` - Путь к файлу конфигурации
- `TAURI_MCP_APP_PATH` - Путь к Tauri приложению (если auto_discover не работает)

## Использование

### Запуск сервера

```bash
# Базовый запуск
tauri-mcp serve

# С кастомными параметрами
tauri-mcp serve --host 127.0.0.1 --port 3000

# Для конкретного приложения
tauri-mcp --app-path ./src-tauri serve
```

### Примеры использования с Claude

#### Пример 1: Запуск и тестирование

```
Запусти Timeline Studio, подожди 5 секунд,
сделай скриншот главного окна,
затем останови приложение
```

Claude выполнит:
1. `launch_app` - запустит приложение
2. Подождет 5 секунд
3. `take_screenshot` - сделает скриншот
4. `stop_app` - остановит приложение

#### Пример 2: Автоматизированное тестирование

```
Открой Timeline Studio, кликни на кнопку "New Project",
заполни поле "Project Name" значением "Test Project",
нажми Enter, затем сделай скриншот
```

Claude выполнит:
1. `launch_app`
2. `send_mouse_click` на координаты кнопки
3. `send_keyboard_input` для ввода текста
4. `send_keyboard_input` для Enter
5. `take_screenshot`

#### Пример 3: Отладка через JavaScript

```
Выполни в Timeline Studio следующий JavaScript код:
console.log("Current project:", window.__TAURI__.project);
return window.innerWidth;
```

Claude выполнит:
```javascript
execute_javascript({
  code: `
    console.log("Current project:", window.__TAURI__.project);
    return window.innerWidth;
  `
})
```

#### Пример 4: Вызов Tauri команд

```
Вызови команду create_project с параметрами:
name="My Project", aspectRatio="16:9"
```

Claude выполнит:
```javascript
call_tauri_command({
  command: "create_project",
  args: {
    name: "My Project",
    aspectRatio: "16:9"
  }
})
```

## Workflow примеры

### E2E тестирование

```typescript
// Claude может автоматизировать весь flow:
1. launch_app()
2. wait(2000)
3. send_mouse_click({x: 100, y: 200}) // Кнопка "Import"
4. send_keyboard_input({text: "/path/to/video.mp4"})
5. send_keyboard_input({key: "Enter"})
6. wait(1000)
7. take_screenshot({name: "after-import.png"})
8. call_tauri_command({command: "get_timeline_state"})
9. stop_app()
```

### Отладка UI проблем

```typescript
1. launch_app()
2. execute_javascript({code: "
   const buttons = document.querySelectorAll('button');
   return Array.from(buttons).map(b => ({
     text: b.textContent,
     visible: b.offsetParent !== null
   }));
"})
3. take_screenshot({region: {x: 0, y: 0, width: 800, height: 600}})
4. open_devtools()
```

### Производительное тестирование

```typescript
1. launch_app()
2. monitor_resources({duration: 30}) // 30 секунд мониторинга
3. send_mouse_click(...) // Выполнить действие
4. wait(5000)
5. get_app_logs()
6. stop_app()
```

## API Reference

### launch_app
Запускает Tauri приложение.

**Параметры:**
- `app_path` (optional) - Путь к приложению
- `dev_mode` (optional) - Запуск в режиме разработки

**Возвращает:**
- `process_id` - PID процесса
- `window_id` - ID главного окна

### take_screenshot
Делает скриншот окна приложения.

**Параметры:**
- `format` (optional) - Формат: "png", "jpeg", "webp"
- `quality` (optional) - Качество JPEG (1-100)
- `region` (optional) - Область захвата {x, y, width, height}
- `output_path` (optional) - Путь для сохранения

**Возвращает:**
- `base64` - Скриншот в base64
- `path` - Путь к сохраненному файлу

### execute_javascript
Выполняет JavaScript код в webview.

**Параметры:**
- `code` - JavaScript код для выполнения
- `timeout` (optional) - Таймаут в мс

**Возвращает:**
- `result` - Результат выполнения
- `logs` - Логи консоли

### call_tauri_command
Вызывает Tauri команду.

**Параметры:**
- `command` - Имя команды
- `args` (optional) - Аргументы команды

**Возвращает:**
- `result` - Результат команды
- `error` (if failed) - Ошибка

## Ограничения

1. **Безопасность**: MCP сервер имеет полный доступ к приложению. Используйте только в разработке/тестировании.
2. **Производительность**: Захват скриншотов и мониторинг могут влиять на производительность.
3. **Совместимость**: Требует Tauri v2. Не работает с Tauri v1.
4. **Платформа**: Некоторые функции (например, симуляция ввода) могут работать по-разному на разных ОС.

## Troubleshooting

### Сервер не запускается

```bash
# Проверьте установку
which tauri-mcp

# Проверьте версию
tauri-mcp --version

# Проверьте логи
TAURI_MCP_LOG_LEVEL=debug tauri-mcp serve
```

### Приложение не обнаруживается

Укажите путь явно:

```bash
tauri-mcp --app-path /path/to/timeline-studio/src-tauri serve
```

Или в конфигурации:

```toml
app_path = "./src-tauri"
```

### Проблемы с скриншотами

Убедитесь что приложение запущено и окно видимо:

```bash
# Проверьте список окон
tauri-mcp list-windows
```

### Ошибки JavaScript

Проверьте что код выполняется в правильном контексте:

```javascript
// Плохо - может не работать
execute_javascript({code: "myCustomFunction()"})

// Хорошо - используйте глобальные объекты
execute_javascript({code: "window.myCustomFunction()"})
```

## Best Practices

1. **Используйте wait()** между командами для стабильности
2. **Проверяйте состояние** перед действиями
3. **Логируйте все действия** для отладки
4. **Cleanup после тестов** - всегда останавливайте приложение
5. **Используйте try-catch** для обработки ошибок
6. **Сохраняйте скриншоты** для документирования проблем

## Дополнительные ресурсы

- **GitHub репозиторий**: https://github.com/dirvine/tauri-mcp
- **Документация MCP**: https://modelcontextprotocol.io
- **Tauri документация**: https://tauri.app
- **Примеры**: См. `/examples` в репозитории

## Changelog

### 2025-12-22
- ✅ Первоначальная настройка tauri-mcp
- ✅ Создан конфигурационный файл
- ✅ Добавлена интеграция с Claude Desktop
- ✅ Создана документация
