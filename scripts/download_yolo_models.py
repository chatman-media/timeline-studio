#!/usr/bin/env python3
"""
Скрипт для скачивания и экспорта YOLO моделей в формат ONNX
Требует: pip install ultralytics
"""

import os
from pathlib import Path
from ultralytics import YOLO

# Путь к директории с моделями
MODELS_DIR = Path.home() / "Library" / "Application Support" / "timeline-studio" / "models"

# Создаем директорию если не существует
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print(f"Директория для моделей: {MODELS_DIR}")

def download_and_export(model_name: str, output_name: str):
    """Скачивает модель YOLO и экспортирует в ONNX формат"""
    print(f"\n{'='*60}")
    print(f"Обработка модели: {model_name}")
    print(f"Выходной файл: {output_name}")

    output_path = MODELS_DIR / output_name

    # Проверяем, существует ли уже модель
    if output_path.exists():
        print(f"✓ Модель уже существует: {output_path}")
        return

    try:
        # Загружаем модель (автоматически скачивается если отсутствует)
        print(f"Загрузка модели {model_name}...")
        model = YOLO(model_name)

        # Экспортируем в ONNX (без simplify если onnx не установлен)
        print(f"Экспорт в ONNX...")
        try:
            model.export(
                format='onnx',
                simplify=True,
                dynamic=False,
                opset=12,
            )
        except Exception as export_error:
            # Если не удалось с simplify, пробуем без
            print(f"  ⚠️  Ошибка с simplify, пробую без оптимизации...")
            model.export(
                format='onnx',
                simplify=False,
                dynamic=False,
                opset=12,
            )

        # Находим экспортированный файл
        exported_file = Path(model_name.replace('.pt', '.onnx'))

        if exported_file.exists():
            # Перемещаем в нужную директорию
            exported_file.rename(output_path)
            print(f"✓ Модель успешно экспортирована: {output_path}")
        else:
            print(f"✗ Ошибка: экспортированный файл не найден")

    except Exception as e:
        print(f"✗ Ошибка при обработке {model_name}: {e}")

# Список моделей для скачивания
models = [
    # YOLOv11 модели
    ("yolo11n.pt", "yolo11n.onnx"),           # Detection
    ("yolo11n-seg.pt", "yolo11n-seg.onnx"),   # Segmentation
    ("yolo11n-face.pt", "yolo11n-face.onnx"), # Face (может не существовать)

    # YOLOv8 модели (legacy)
    ("yolov8n.pt", "yolov8n.onnx"),           # Detection
    ("yolov8n-seg.pt", "yolov8n-seg.onnx"),   # Segmentation
]

print("Начинаем загрузку и экспорт YOLO моделей")
print(f"Всего моделей для обработки: {len(models)}")

for model_name, output_name in models:
    download_and_export(model_name, output_name)

print(f"\n{'='*60}")
print("Готово!")
print(f"\nМодели сохранены в: {MODELS_DIR}")
print("\nТеперь можно запустить тесты: bun run test:rust")
