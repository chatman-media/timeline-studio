// Real Analysis Engine Control Panel

import { motion } from "framer-motion"
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Download,
  Info,
  Play,
  RefreshCw,
  Settings,
  XCircle,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface RealEnginePanelProps {
  className?: string
}

interface ModelsStatus {
  models_ready: boolean
  object_detector_ready: boolean
  face_detector_ready: boolean
  face_encoder_ready: boolean
  initialization_errors: string[]
}

interface EngineConfig {
  object_model: string
  face_detection_model: string
  face_encoding_model: string
  object_confidence_threshold: number
  face_confidence_threshold: number
  frames_per_minute: number
  detailed_analysis: boolean
}

interface AvailableModels {
  object_detection_models: string[]
  face_detection_models: string[]
  face_encoding_models: string[]
}

export function RealEnginePanel({ className }: RealEnginePanelProps) {
  const [isInitializing, setIsInitializing] = useState(false)
  const [modelsStatus, setModelsStatus] = useState<ModelsStatus | null>(null)
  const [engineConfig, setEngineConfig] = useState<EngineConfig>({
    object_model: "YoloV11Nano",
    face_detection_model: "YoloV11FaceNano",
    face_encoding_model: "FaceNet128D",
    object_confidence_threshold: 0.5,
    face_confidence_threshold: 0.7,
    frames_per_minute: 30,
    detailed_analysis: false,
  })
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null)

  // Загрузка доступных моделей при монтировании
  useEffect(() => {
    loadAvailableModels()
    checkModelsStatus()
  }, [])

  const loadAvailableModels = async () => {
    try {
      const models = await window.__TAURI__.invoke("get_available_models")
      setAvailableModels(models)
    } catch (error) {
      console.error("Failed to load available models:", error)
    }
  }

  const checkModelsStatus = async () => {
    try {
      const status = await window.__TAURI__.invoke("check_models_status")
      setModelsStatus(status)
    } catch (error) {
      console.error("Failed to check models status:", error)
    }
  }

  const initializeEngine = async () => {
    setIsInitializing(true)
    try {
      await window.__TAURI__.invoke("initialize_real_analysis_engine", {
        config: {
          object_model: engineConfig.object_model,
          face_detection_model: engineConfig.face_detection_model,
          face_encoding_model: engineConfig.face_encoding_model,
          object_confidence_threshold: engineConfig.object_confidence_threshold,
          face_confidence_threshold: engineConfig.face_confidence_threshold,
          frames_per_minute: engineConfig.frames_per_minute,
          detailed_analysis: engineConfig.detailed_analysis,
        },
      })

      // Проверяем статус после инициализации
      await checkModelsStatus()
    } catch (error) {
      console.error("Failed to initialize Real Analysis Engine:", error)
    } finally {
      setIsInitializing(false)
    }
  }

  const getStatusIcon = (ready: boolean) => {
    if (ready) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const getModelSize = (modelName: string) => {
    if (modelName.includes("Nano")) return "XS"
    if (modelName.includes("Small")) return "S"
    if (modelName.includes("Medium")) return "M"
    if (modelName.includes("Large")) return "L"
    if (modelName.includes("Extra")) return "XL"
    return "?"
  }

  const getModelSpeed = (modelName: string) => {
    if (modelName.includes("Nano")) return "Очень быстро"
    if (modelName.includes("Small")) return "Быстро"
    if (modelName.includes("Medium")) return "Умеренно"
    if (modelName.includes("Large")) return "Медленно"
    if (modelName.includes("Extra")) return "Очень медленно"
    return "Неизвестно"
  }

  return (
    <TooltipProvider>
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            ONNX Analysis Engine Configuration
            <Badge variant={modelsStatus?.models_ready ? "default" : "secondary"}>
              {modelsStatus?.models_ready ? "Ready" : "Not Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Models Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Models Status</h3>
              <Button variant="outline" size="sm" onClick={checkModelsStatus}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            {modelsStatus && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(modelsStatus.object_detector_ready)}
                  <span className="text-sm">Object Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(modelsStatus.face_detector_ready)}
                  <span className="text-sm">Face Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(modelsStatus.face_encoder_ready)}
                  <span className="text-sm">Face Encoding</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(modelsStatus.models_ready)}
                  <span className="text-sm">All Systems</span>
                </div>
              </div>
            )}

            {modelsStatus?.initialization_errors && modelsStatus.initialization_errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Initialization Errors</span>
                </div>
                {modelsStatus?.initialization_errors?.map((error, index) => (
                  <p key={index} className="text-xs text-red-600">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Model Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Model Configuration
            </h3>

            {/* Object Detection Model */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Object Detection</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getModelSize(engineConfig.object_model)}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getModelSpeed(engineConfig.object_model)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Select
                value={engineConfig.object_model}
                onValueChange={(value) => setEngineConfig((prev) => ({ ...prev, object_model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.object_detection_models.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center gap-2">
                        {model}
                        <Badge variant="outline" className="text-xs">
                          {getModelSize(model)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Face Detection Model */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Face Detection</label>
                <Badge variant="outline" className="text-xs">
                  {getModelSize(engineConfig.face_detection_model)}
                </Badge>
              </div>
              <Select
                value={engineConfig.face_detection_model}
                onValueChange={(value) => setEngineConfig((prev) => ({ ...prev, face_detection_model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.face_detection_models.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center gap-2">
                        {model}
                        <Badge variant="outline" className="text-xs">
                          {getModelSize(model)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Face Encoding Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Face Encoding</label>
              <Select
                value={engineConfig.face_encoding_model}
                onValueChange={(value) => setEngineConfig((prev) => ({ ...prev, face_encoding_model: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.face_encoding_models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Performance Settings */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Performance Settings
            </h3>

            {/* Object Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Object Confidence</label>
                <span className="text-sm text-muted-foreground">
                  {(engineConfig.object_confidence_threshold * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[engineConfig.object_confidence_threshold]}
                onValueChange={([value]) =>
                  setEngineConfig((prev) => ({
                    ...prev,
                    object_confidence_threshold: value,
                  }))
                }
                min={0.1}
                max={0.9}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Face Confidence */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Face Confidence</label>
                <span className="text-sm text-muted-foreground">
                  {(engineConfig.face_confidence_threshold * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[engineConfig.face_confidence_threshold]}
                onValueChange={([value]) =>
                  setEngineConfig((prev) => ({
                    ...prev,
                    face_confidence_threshold: value,
                  }))
                }
                min={0.1}
                max={0.9}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Frames per minute */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Analysis Frequency</label>
                <span className="text-sm text-muted-foreground">{engineConfig.frames_per_minute} frames/min</span>
              </div>
              <Slider
                value={[engineConfig.frames_per_minute]}
                onValueChange={([value]) =>
                  setEngineConfig((prev) => ({
                    ...prev,
                    frames_per_minute: value,
                  }))
                }
                min={10}
                max={60}
                step={5}
                className="w-full"
              />
            </div>

            {/* Detailed Analysis */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Detailed Analysis</label>
              <Switch
                checked={engineConfig.detailed_analysis}
                onCheckedChange={(checked) =>
                  setEngineConfig((prev) => ({
                    ...prev,
                    detailed_analysis: checked,
                  }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={initializeEngine} disabled={isInitializing} className="w-full">
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Models...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Initialize ONNX Models
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" disabled={!modelsStatus?.models_ready} className="w-full">
              <Play className="w-3 h-3 mr-1" />
              Test Models
            </Button>
          </div>

          {/* Performance Info */}
          {modelsStatus?.models_ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Ready for Analysis</span>
              </div>
              <p className="text-xs text-green-600">
                All ONNX models are loaded and ready for AI-powered video analysis including object detection, face
                recognition, and advanced visual analysis.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
