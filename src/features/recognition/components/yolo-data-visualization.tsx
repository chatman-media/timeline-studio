import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import type { YoloVideoData } from "@/features/recognition/types/yolo"

interface YoloDataVisualizationProps {
  yoloData: YoloVideoData
  width?: number
  height?: number
}

/**
 * Компонент для визуализации данных YOLO в виде графика
 * Показывает количество обнаруженных объектов по времени
 */
export function YoloDataVisualization({ yoloData, width = 800, height = 400 }: YoloDataVisualizationProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Получаем уникальные классы объектов
  const uniqueClasses = Array.from(
    new Set(yoloData.frames.flatMap((frame) => frame.detections.map((detection) => detection.class))),
  )

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
  }

  // Получаем цвет для класса
  const getColorForClass = (className: string): string => {
    return classColors[className] || "#95a5a6"
  }

  // Подготавливаем данные для графика
  const chartData = yoloData.frames.map((frame) => {
    const classCounts: Record<string, number> = {}

    // Подсчитываем количество объектов каждого класса в кадре
    frame.detections.forEach((detection) => {
      const className = detection.class
      classCounts[className] = (classCounts[className] || 0) + 1
    })

    return {
      timestamp: frame.timestamp,
      totalDetections: frame.detections.length,
      classCounts,
    }
  })

  // Находим максимальное количество обнаружений для масштабирования
  const maxDetections = Math.max(...chartData.map((data) => data.totalDetections), 1)

  // Размеры графика с отступами
  const margin = { top: 20, right: 20, bottom: 40, left: 60 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Масштабы
  const xScale = (timestamp: number) => (timestamp / Math.max(...chartData.map((d) => d.timestamp))) * chartWidth

  const yScale = (count: number) => chartHeight - (count / maxDetections) * chartHeight

  useEffect(() => {
    // Здесь можно добавить дополнительную логику для D3.js, если потребуется
    // Пока используем простую SVG визуализацию
  }, [yoloData])
  return (
    <div className="w-full" data-oid="pkdwev_">
      <div className="mb-4" data-oid="u5w-zm8">
        <h3 className="text-lg font-semibold" data-oid="s7-zn77">
          {t("recognition.yolo.detectionAnalysisTitle")}
        </h3>
        <p className="text-sm text-gray-600" data-oid="15ec-op">
          {t("recognition.yolo.totalFrameCount")}: {yoloData.frames.length}
        </p>
      </div>

      {/* Легенда */}
      <div className="mb-4 flex flex-wrap gap-2" data-oid=":7_7bt1">
        <button
          className={`rounded px-3 py-1 text-sm ${
            selectedClass === null ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setSelectedClass(null)}
          data-oid="mf.wm.1"
        >
          {t("recognition.yolo.allClasses")}
        </button>
        {uniqueClasses.map((className) => (
          <button
            key={className}
            className={`rounded px-3 py-1 text-sm ${
              selectedClass === className ? "text-white" : "bg-gray-200 text-gray-700"
            }`}
            style={{
              backgroundColor: selectedClass === className ? getColorForClass(className) : undefined,
            }}
            onClick={() => setSelectedClass(className)}
            data-oid="abp1zwk"
          >
            {className}
          </button>
        ))}
      </div>

      {/* График */}
      <svg ref={svgRef} width={width} height={height} className="border" data-oid="fn24erl">
        {/* Фон */}
        <rect width={width} height={height} fill="#f8f9fa" data-oid="taiqu0:" />

        {/* Область графика */}
        <g transform={`translate(${margin.left}, ${margin.top})`} data-oid="811k8ck">
          {/* Сетка */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <g key={ratio} data-oid="sy53192">
              <line
                x1={0}
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#e9ecef"
                strokeWidth={1}
                data-oid="d__h3iv"
              />

              <text
                x={-10}
                y={chartHeight * ratio + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6c757d"
                data-oid="3udt_bt"
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
                  const x = xScale(data.timestamp)
                  const y = selectedClass ? yScale(data.classCounts[selectedClass] || 0) : yScale(data.totalDetections)
                  return `${index === 0 ? "M" : "L"} ${x} ${y}`
                })
                .join(" ")}`}
              fill="none"
              stroke={selectedClass ? getColorForClass(selectedClass) : "#007bff"}
              strokeWidth={2}
              data-oid=":wt-43m"
            />
          )}

          {/* Точки данных */}
          {chartData.map((data, index) => {
            const x = xScale(data.timestamp)
            const y = selectedClass ? yScale(data.classCounts[selectedClass] || 0) : yScale(data.totalDetections)

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={3}
                fill={selectedClass ? getColorForClass(selectedClass) : "#007bff"}
                className="cursor-pointer"
                // title={`${t("Время")}: ${data.timestamp}s, ${t("Обнаружений")}: ${
                //   selectedClass
                //     ? data.classCounts[selectedClass] || 0
                //     : data.totalDetections
                // }`}
                data-oid="l1bo20w"
              />
            )
          })}

          {/* Оси */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#6c757d"
            strokeWidth={1}
            data-oid="afyz9dq"
          />

          <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#6c757d" strokeWidth={1} data-oid="dkvalz7" />

          {/* Подписи осей */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 35}
            textAnchor="middle"
            fontSize="14"
            fill="#6c757d"
            data-oid=":740sf0"
          >
            {t("recognition.yolo.timeAxisLabel")}
          </text>
          <text
            x={-40}
            y={chartHeight / 2}
            textAnchor="middle"
            fontSize="14"
            fill="#6c757d"
            transform={`rotate(-90, -40, ${chartHeight / 2})`}
            data-oid="gcatd88"
          >
            {t("recognition.yolo.detectionCount")}
          </text>
        </g>
      </svg>

      {/* Статистика */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4" data-oid="6qea3yl">
        <div className="rounded bg-gray-100 p-3" data-oid="n8uql:2">
          <div className="text-sm text-gray-600" data-oid="9k_u:a-">
            {t("recognition.yolo.totalFrames")}
          </div>
          <div className="text-xl font-semibold" data-oid="5yzs4xi">
            {yoloData.frames.length}
          </div>
        </div>
        <div className="rounded bg-gray-100 p-3" data-oid="uc5a5ln">
          <div className="text-sm text-gray-600" data-oid="zyowo7p">
            {t("recognition.yolo.uniqueClasses")}
          </div>
          <div className="text-xl font-semibold" data-oid="khe9qfu">
            {uniqueClasses.length}
          </div>
        </div>
        <div className="rounded bg-gray-100 p-3" data-oid="o7-b9q7">
          <div className="text-sm text-gray-600" data-oid="c_w0tmy">
            {t("recognition.yolo.totalDetections")}
          </div>
          <div className="text-xl font-semibold" data-oid="2hgg2gi">
            {chartData.reduce((sum, data) => sum + data.totalDetections, 0)}
          </div>
        </div>
        <div className="rounded bg-gray-100 p-3" data-oid="lfj_-nv">
          <div className="text-sm text-gray-600" data-oid="eizb9fm">
            {t("recognition.yolo.averagePerFrame")}
          </div>
          <div className="text-xl font-semibold" data-oid="1.r-1cd">
            {(chartData.reduce((sum, data) => sum + data.totalDetections, 0) / chartData.length).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}
