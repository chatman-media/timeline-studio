#!/bin/bash

# Автоматический скрипт для скачивания YOLO моделей
# Создает временный venv, устанавливает ultralytics, скачивает модели

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_DIR/.venv-models"

# Определяем директорию моделей
if [[ "$OSTYPE" == "darwin"* ]]; then
    MODEL_DIR="$HOME/Library/Application Support/timeline-studio/models"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MODEL_DIR="$HOME/.local/share/timeline-studio/models"
else
    echo "❌ Неподдерживаемая ОС: $OSTYPE"
    exit 1
fi

echo "📦 Автоматическая загрузка YOLO моделей..."
echo "📂 Директория: $MODEL_DIR"
echo ""

# Создаем директорию для моделей
mkdir -p "$MODEL_DIR"

# Создаем временный venv если не существует
if [ ! -d "$VENV_DIR" ]; then
    echo "🔧 Создание временного виртуального окружения..."
    python3 -m venv "$VENV_DIR"
    echo "✅ Виртуальное окружение создано"
fi

# Активируем venv
echo "🔄 Активация виртуального окружения..."
source "$VENV_DIR/bin/activate"

# Устанавливаем зависимости вручную (для совместимости с новыми версиями Python)
echo "📥 Установка зависимостей..."
pip install --quiet onnx onnxslim 2>&1 | grep -E "(Collecting|Installing|Successfully)" || true
echo "✅ onnx установлен"

# Устанавливаем ultralytics
echo "📥 Установка ultralytics..."
pip install --quiet ultralytics 2>&1 | grep -E "(Collecting|Installing|Successfully)" || true
echo "✅ ultralytics установлен"

echo ""
echo "🚀 Запуск скрипта загрузки моделей..."
echo ""

# Запускаем Python скрипт
python "$SCRIPT_DIR/download_yolo_models.py"

# Деактивируем venv
deactivate

echo ""
echo "✅ Готово! Модели загружены в: $MODEL_DIR"
echo ""
echo "🧹 Чтобы удалить временное окружение:"
echo "   rm -rf $VENV_DIR"
echo ""
echo "🧪 Теперь можно запустить тесты:"
echo "   bun run test:rust"
