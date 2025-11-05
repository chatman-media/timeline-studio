#!/usr/bin/env python3
"""
Упрощенный скрипт для скачивания YOLO моделей (без onnxruntime)
"""

import os
from pathlib import Path

# Путь к директории с моделями
MODELS_DIR = Path.home() / "Library" / "Application Support" / "timeline-studio" / "models"

# Создаем директорию если не существует
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print(f"📂 Директория для моделей: {MODELS_DIR}")
print()

# Импортируем ultralytics
try:
    from ultralytics import YOLO
except ImportError:
    print("❌ ultralytics не установлен!")
    print("   Установите: pip install ultralytics")
    exit(1)

# Отключаем проверку зависимостей ultralytics
os.environ['YOLO_AUTOINSTALL'] = 'false'

def export_model(model_name: str, output_name: str):
    """Экспортирует модель в ONNX без simplify"""
    print(f"{'='*60}")
    print(f"📦 Модель: {model_name} → {output_name}")

    output_path = MODELS_DIR / output_name

    if output_path.exists():
        print(f"✓ Уже существует: {output_path}")
        return True

    try:
        # Загружаем модель
        print(f"  📥 Загрузка...")
        model = YOLO(model_name)

        # Экспортируем БЕЗ simplify (не требует onnxruntime)
        print(f"  🔄 Экспорт в ONNX...")
        export_path = model.export(
            format='onnx',
            simplify=False,  # Отключаем simplify!
            dynamic=False,
            opset=12,
        )

        # Переносим файл
        if Path(export_path).exists():
            Path(export_path).rename(output_path)
            size = output_path.stat().st_size / (1024 * 1024)
            print(f"  ✅ Экспортирована: {output_path} ({size:.1f} MB)")
            return True
        else:
            print(f"  ❌ Файл не найден: {export_path}")
            return False

    except Exception as e:
        print(f"  ❌ Ошибка: {e}")
        return False

# Модели для скачивания
models = [
    ("yolov8n.pt", "yolov8n.onnx"),      # YOLOv8 nano
    ("yolo11n.pt", "yolo11n.onnx"),      # YOLOv11 nano
]

print("🚀 Начинаем экспорт моделей...")
print()

success_count = 0
for model_name, output_name in models:
    if export_model(model_name, output_name):
        success_count += 1
    print()

print(f"{'='*60}")
print(f"✅ Готово! Экспортировано {success_count} из {len(models)} моделей")
print()
print(f"📂 Модели сохранены в: {MODELS_DIR}")
print()

# Показываем список
import subprocess
result = subprocess.run(["ls", "-lh", str(MODELS_DIR)], capture_output=True, text=True)
if result.returncode == 0:
    print("📋 Список моделей:")
    for line in result.stdout.strip().split('\n'):
        if '.onnx' in line:
            print(f"  {line}")

print()
print("🧪 Запустите тесты: bun run test:rust")
