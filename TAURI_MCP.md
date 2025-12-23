# Tauri MCP Integration

MCP (Model Context Protocol) сервер для взаимодействия с Timeline Studio через AI-ассистенты.

## Быстрый старт

### 1. Установка (уже выполнено ✅)

```bash
cargo install tauri-mcp
```

Версия: **0.1.4**
Установлено в: `~/.cargo/bin/tauri-mcp`

### 2. Конфигурация

Файл `tauri-mcp.toml` создан в корне проекта с оптимальными настройками.

### 3. Claude Desktop

MCP сервер добавлен в `claude_desktop_config.json`:

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

### 4. Использование

После перезапуска Claude Desktop, вы можете использовать команды вроде:

- "Запусти Timeline Studio и сделай скриншот"
- "Открой DevTools для отладки"
- "Выполни JavaScript код в приложении"
- "Протестируй импорт видео файла"

## Основные возможности

✅ **Управление процессами** - Запуск, остановка, мониторинг
✅ **Скриншоты** - Автоматический захват экрана
✅ **Симуляция ввода** - Клавиатура, мышь, прокрутка
✅ **JavaScript REPL** - Выполнение кода в webview
✅ **IPC команды** - Вызов Tauri команд
✅ **DevTools** - Интеграция с Chrome DevTools

## Примеры команд

### Базовое тестирование
```
Запусти Timeline Studio, подожди 3 секунды,
сделай скриншот, затем останови приложение
```

### E2E тест
```
1. Запусти приложение
2. Кликни на "New Project"
3. Введи название "Test Project"
4. Нажми Enter
5. Сделай скриншот
6. Проверь что проект создан через JavaScript
```

### Отладка
```
Открой Timeline Studio, запусти DevTools,
выполни: console.log(window.__TAURI__)
```

## Документация

Полная документация: [docs/05_development/ru/tauri-mcp-integration.md](docs/05_development/ru/tauri-mcp-integration.md)

## Проверка работы

```bash
# Запуск сервера вручную
tauri-mcp serve

# С дебагом
TAURI_MCP_LOG_LEVEL=debug tauri-mcp serve

# Для конкретного приложения
tauri-mcp --app-path ./src-tauri serve
```

## Ресурсы

- **GitHub**: https://github.com/dirvine/tauri-mcp
- **MCP Protocol**: https://modelcontextprotocol.io
- **Tauri Docs**: https://tauri.app

---

**Статус**: ✅ Готово к использованию
**Дата настройки**: 2025-12-22
**Версия**: 0.1.4
