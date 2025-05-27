import React, { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { YoloVideoData } from "@/types/yolo";

interface YoloDataVisualizationProps {
  yoloData: YoloVideoData;
  width?: number;
  height?: number;
}

/**
 * Компонент для визуализации данных YOLO в виде графика
 * Показывает количество обнаруженных объектов по времени
 */
export function YoloDataVisualization({
  yoloData,
  width = 800,
  height = 400,
}: YoloDataVisualizationProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Получаем уникальные классы объектов
  const uniqueClasses = Array.from(
    new Set(
      yoloData.frames.flatMap((frame) =>
        frame.detections.map((detection) => detection.class),
      ),
    ),
  );

  // Цвета для разных классов
  const classColors: Record<string, string> = {
    person: "#ff6b6b",
    car: "#4ecdc4",
    dog: "#45b7d1",
    cat: "#f9ca24",
    bicycle: "#6c5ce7",
    motorcycle: "#a29bfe",
    bus: "#fd79a8",
    truck: "#00b894",
  };

  // Получаем цвет для класса
  const getColorForClass = (className: string): string => {
    return classColors[className] || "#95a5a6";
  };

  // Подготавливаем данные для графика
  const chartData = yoloData.frames.map((frame) => {
    const classCounts: Record<string, number> = {};

    // Подсчитываем количество объектов каждого класса в кадре
    frame.detections.forEach((detection) => {
      const className = detection.class;
      classCounts[className] = (classCounts[className] || 0) + 1;
    });

    return {
      timestamp: frame.timestamp,
      totalDetections: frame.detections.length,
      classCounts,
    };
  });

  // Находим максимальное количество обнаружений для масштабирования
  const maxDetections = Math.max(
    ...chartData.map((data) => data.totalDetections),
    1,
  );

  // Размеры графика с отступами
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Масштабы
  const xScale = (timestamp: number) =>
    (timestamp / Math.max(...chartData.map((d) => d.timestamp))) * chartWidth;

  const yScale = (count: number) =>
    chartHeight - (count / maxDetections) * chartHeight;

  useEffect(() => {
    // Здесь можно добавить дополнительную логику для D3.js, если потребуется
    // Пока используем простую SVG визуализацию
  }, [yoloData]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {t("Анализ обнаружений YOLO")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("Общее количество кадров")}: {yoloData.frames.length}
        </p>
      </div>

      {/* Легенда */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`rounded px-3 py-1 text-sm ${
            selectedClass === null
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setSelectedClass(null)}
        >
          {t("Все классы")}
        </button>
        {uniqueClasses.map((className) => (
          <button
            key={className}
            className={`rounded px-3 py-1 text-sm ${
              selectedClass === className
                ? "text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            style={{
              backgroundColor:
                selectedClass === className
                  ? getColorForClass(className)
                  : undefined,
            }}
            onClick={() => setSelectedClass(className)}
          >
            {className}
          </button>
        ))}
      </div>

      {/* График */}
      <svg ref={svgRef} width={width} height={height} className="border">
        {/* Фон */}
        <rect width={width} height={height} fill="#f8f9fa" />

        {/* Область графика */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Сетка */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1={0}
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#e9ecef"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={chartHeight * ratio + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6c757d"
              >
                {Math.round(maxDetections * (1 - ratio))}
              </text>
            </g>
          ))}

          {/* Линия графика */}
          {chartData.length > 1 && (
            <path
              d={`M ${chartData
                .map((data, index) => {
                  const x = xScale(data.timestamp);
                  const y = selectedClass
                    ? yScale(data.classCounts[selectedClass] || 0)
                    : yScale(data.totalDetections);
                  return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ")}`}
              fill="none"
              stroke={
                selectedClass ? getColorForClass(selectedClass) : "#007bff"
              }
              strokeWidth={2}
            />
          )}

          {/* Точки данных */}
          {chartData.map((data, index) => {
            const x = xScale(data.timestamp);
            const y = selectedClass
              ? yScale(data.classCounts[selectedClass] || 0)
              : yScale(data.totalDetections);

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={3}
                fill={
                  selectedClass ? getColorForClass(selectedClass) : "#007bff"
                }
                className="cursor-pointer"
                // title={`${t("Время")}: ${data.timestamp}s, ${t("Обнаружений")}: ${
                //   selectedClass
                //     ? data.classCounts[selectedClass] || 0
                //     : data.totalDetections
                // }`}
              />
            );
          })}

          {/* Оси */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#6c757d"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={chartHeight}
            stroke="#6c757d"
            strokeWidth={1}
          />

          {/* Подписи осей */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 35}
            textAnchor="middle"
            fontSize="14"
            fill="#6c757d"
          >
            {t("Время (секунды)")}
          </text>
          <text
            x={-40}
            y={chartHeight / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#6c757d"
            transform={`rotate(-90, -40, ${chartHeight / 2})`}
          >
            {t("Количество обнаружений")}
          </text>
        </g>
      </svg>

      {/* Статистика */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded bg-gray-100 p-3">
          <div className="text-sm text-gray-600">{t("Всего кадров")}</div>
          <div className="text-xl font-semibold">{yoloData.frames.length}</div>
        </div>
        <div className="rounded bg-gray-100 p-3">
          <div className="text-sm text-gray-600">{t("Уникальных классов")}</div>
          <div className="text-xl font-semibold">{uniqueClasses.length}</div>
        </div>
        <div className="rounded bg-gray-100 p-3">
          <div className="text-sm text-gray-600">{t("Всего обнаружений")}</div>
          <div className="text-xl font-semibold">
            {chartData.reduce((sum, data) => sum + data.totalDetections, 0)}
          </div>
        </div>
        <div className="rounded bg-gray-100 p-3">
          <div className="text-sm text-gray-600">{t("Среднее за кадр")}</div>
          <div className="text-xl font-semibold">
            {(
              chartData.reduce((sum, data) => sum + data.totalDetections, 0) /
              chartData.length
            ).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
