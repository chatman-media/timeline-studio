import { cn } from "@/lib/utils"

import type { NodeParameter } from "../../types/node-compositing"

interface NodeParameterControlProps {
  parameter: NodeParameter
  onChange: (value: any) => void
  className?: string
}

export function NodeParameterControl({ parameter, onChange, className }: NodeParameterControlProps) {
  if (parameter.visible === false) return null

  const renderControl = () => {
    switch (parameter.type) {
      case "number":
        return (
          <div className="flex items-center gap-2" data-oid=":av1--8">
            <input
              type="range"
              value={parameter.value}
              min={parameter.min ?? 0}
              max={parameter.max ?? 100}
              step={parameter.step ?? 1}
              onChange={(e) => onChange(Number.parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  ((parameter.value - (parameter.min ?? 0)) / ((parameter.max ?? 100) - (parameter.min ?? 0))) * 100
                }%, #374151 ${
                  ((parameter.value - (parameter.min ?? 0)) / ((parameter.max ?? 100) - (parameter.min ?? 0))) * 100
                }%, #374151 100%)`,
              }}
              data-oid="ju9ep:-"
            />

            <input
              type="number"
              value={parameter.value}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              onChange={(e) => onChange(Number.parseFloat(e.target.value))}
              className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              data-oid="j4z5zof"
            />
          </div>
        )

      case "color":
        return (
          <div className="flex items-center gap-2" data-oid="k3vv.v:">
            <input
              type="color"
              value={parameter.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-6 bg-transparent border border-gray-600 rounded cursor-pointer"
              data-oid="5onl4dj"
            />

            <input
              type="text"
              value={parameter.value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              data-oid="2cqlgqp"
            />
          </div>
        )

      case "select":
        return (
          <select
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            data-oid="fk2f5gy"
          >
            {parameter.options?.map((option) => (
              <option key={option.value} value={option.value} data-oid="gg1-1cm">
                {option.label}
              </option>
            ))}
          </select>
        )

      case "boolean":
        return (
          <label className="flex items-center gap-2 cursor-pointer" data-oid="h2nm9hj">
            <input
              type="checkbox"
              checked={parameter.value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"
              data-oid="t_1k-e7"
            />

            <span className="text-xs text-gray-300" data-oid="g7wh.z5">
              Enable
            </span>
          </label>
        )

      case "text":
        return (
          <input
            type="text"
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            data-oid="wcakb5:"
          />
        )

      case "range":
        return (
          <div className="space-y-1" data-oid="w70dvz_">
            <div className="flex gap-2" data-oid="013zvbd">
              <input
                type="number"
                value={parameter.value[0]}
                min={parameter.min ?? 0}
                max={parameter.value[1]}
                step={parameter.step ?? 1}
                onChange={(e) => onChange([Number.parseFloat(e.target.value), parameter.value[1]])}
                className="flex-1 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                data-oid="em0wa81"
              />

              <span className="text-xs text-gray-500" data-oid="5zr-bf8">
                to
              </span>
              <input
                type="number"
                value={parameter.value[1]}
                min={parameter.value[0]}
                max={parameter.max ?? 100}
                step={parameter.step ?? 1}
                onChange={(e) => onChange([parameter.value[0], Number.parseFloat(e.target.value)])}
                className="flex-1 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                data-oid="phw_41z"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-1", className)} data-oid="y-j-:6t">
      <label className="text-xs text-gray-400 flex items-center justify-between" data-oid="mfny6_d">
        <span data-oid="7cl93.3">{parameter.name}</span>
        {parameter.animatable && (
          <button
            className="w-4 h-4 text-gray-600 hover:text-blue-400 transition-colors"
            title="Add keyframe"
            data-oid="iv1lmcu"
          >
            ◆
          </button>
        )}
      </label>
      {renderControl()}
    </div>
  )
}
