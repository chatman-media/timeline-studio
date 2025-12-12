# Инициализация Swarm

Инициализируй ruv-swarm для работы с агентами.

## Инструкция

1. Вызови `mcp__ruv-swarm__swarm_init` с параметрами:
   - topology: "$1" (по умолчанию "hierarchical")
   - maxAgents: 8
   - strategy: "adaptive"

2. После инициализации выведи статус через `mcp__ruv-swarm__swarm_status`

3. Сообщи пользователю о готовности роя

## Аргументы
- $1: топология (mesh | hierarchical | ring | star), по умолчанию hierarchical

$ARGUMENTS
