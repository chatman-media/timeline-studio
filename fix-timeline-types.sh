#!/bin/bash

# Скрипт для исправления TypeScript ошибок в features/timeline

# 1. Удалить frameRange из SceneInfo в тестах
find src/features/timeline/__tests__/services -name "*.test.ts" -type f -exec sed -i '' '/frameRange:/d' {} \;

# 2. Удалить isCollapsed из TimelineTrack в тестах
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/^[[:space:]]*isCollapsed: false,$/d' {} \;

# 3. Добавить timelineTransitions в ProjectResources моки
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' 's/transitions: \[\],$/transitions: [],\n    timelineTransitions: [],/g' {} \;

# 4. Удалить selectedTrackIds из useTimelineSelection моков (уже есть selectedTracks)
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/selectedTrackIds: \[\],$/d' {} \;
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/selectedTrackIds: \[.*\],$/d' {} \;

# 5. Удалить state и selectedTrackIds из useTimeline моков
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/state: .* as any,$/d' {} \;
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/^[[:space:]]*selectedTrackIds: \[.*\],$/d' {} \;

# 6. Удалить createdAt из TimelineTrack/TimelineSection моков
find src/features/timeline/__tests__ -name "*.test.ts*" -type f -exec sed -i '' '/^[[:space:]]*createdAt: new Date(),$/d' {} \;

echo "Скрипт завершен. Проверьте результаты."
