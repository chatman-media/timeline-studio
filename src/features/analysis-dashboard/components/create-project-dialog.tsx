// Dialog for creating new analysis projects

import { open } from "@tauri-apps/plugin-dialog"
import { Clock, FileVideo, FolderOpen, HardDrive, Info, Settings, Upload, X, Zap } from "lucide-react"
import React, { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAnalysis } from "../hooks/use-analysis"
import { AnalysisConfig, QualityMode } from "../types/analysis"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject, getDefaultConfig, loading, error, setError } = useAnalysis()

  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [config, setConfig] = useState<AnalysisConfig | null>(null)
  const [currentTab, setCurrentTab] = useState("files")

  // Load default config on mount
  useEffect(() => {
    if (open && !config) {
      getDefaultConfig().then(setConfig)
    }
  }, [open, config, getDefaultConfig])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setProjectName("")
      setProjectDescription("")
      setSelectedFiles([])
      setConfig(null)
      setCurrentTab("files")
      setError(null)
    }
  }, [open, setError])

  // Handle file selection
  const handleSelectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Video Files",
            extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv", "m4v"],
          },
          {
            name: "Audio Files",
            extensions: ["mp3", "wav", "aac", "flac", "ogg", "m4a"],
          },
          {
            name: "Image Files",
            extensions: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
          },
        ],
      })

      if (selected && Array.isArray(selected)) {
        setSelectedFiles(selected)
      } else if (selected) {
        setSelectedFiles([selected])
      }
    } catch (err) {
      setError(`Failed to select files: ${err}`)
    }
  }

  // Remove selected file
  const removeFile = (filePath: string) => {
    setSelectedFiles((files) => files.filter((f) => f !== filePath))
  }

  // Handle create project
  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError("Введите название проекта")
      return
    }

    if (selectedFiles.length === 0) {
      setError("Выберите файлы для анализа")
      return
    }

    if (!config) {
      setError("Конфигурация не загружена")
      return
    }

    const projectId = await createProject(
      projectName.trim(),
      projectDescription.trim() || undefined,
      config,
      selectedFiles,
    )

    if (projectId) {
      onOpenChange(false)
    }
  }

  const canCreate = projectName.trim() && selectedFiles.length > 0 && config && !loading

  if (!config) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
              <p>Загрузка конфигурации...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать проект анализа</DialogTitle>
          <DialogDescription>Настройте новый проект для анализа ваших медиафайлов с помощью ИИ</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">Файлы</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="advanced">Расширенные</TabsTrigger>
          </TabsList>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Название проекта *</Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Например: Phuket Trip Analysis"
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Краткое описание проекта"
                />
              </div>
            </div>

            {/* File Selection */}
            <div>
              <Label>Файлы для анализа *</Label>
              <div className="mt-2">
                <Button variant="outline" onClick={handleSelectFiles} className="w-full h-20 border-dashed">
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    <p>Выберите медиафайлы</p>
                    <p className="text-xs text-muted-foreground">Поддерживаются видео, аудио и изображения</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <Label>Выбранные файлы ({selectedFiles.length})</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileVideo className="h-4 w-4" />
                        <span className="text-sm">{file.split("/").pop()}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Analysis Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Виды анализа</CardTitle>
                  <CardDescription>Выберите какие виды анализа выполнять</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scene-detection">Детекция сцен</Label>
                    <Switch
                      id="scene-detection"
                      checked={config.enable_scene_detection}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_scene_detection: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="person-recognition">Распознавание персон</Label>
                    <Switch
                      id="person-recognition"
                      checked={config.enable_person_recognition}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_person_recognition: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="object-detection">Детекция объектов</Label>
                    <Switch
                      id="object-detection"
                      checked={config.enable_object_detection}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_object_detection: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="emotion-analysis">Анализ эмоций</Label>
                    <Switch
                      id="emotion-analysis"
                      checked={config.enable_emotion_analysis}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_emotion_analysis: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="audio-analysis">Анализ аудио</Label>
                    <Switch
                      id="audio-analysis"
                      checked={config.enable_audio_analysis}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_audio_analysis: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality-analysis">Анализ качества</Label>
                    <Switch
                      id="quality-analysis"
                      checked={config.enable_quality_analysis}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_quality_analysis: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Производительность</CardTitle>
                  <CardDescription>Настройки скорости и качества анализа</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Режим качества</Label>
                    <Select
                      value={config.quality_mode}
                      onValueChange={(value: QualityMode) => setConfig({ ...config, quality_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={QualityMode.Fast}>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Быстрый
                          </div>
                        </SelectItem>
                        <SelectItem value={QualityMode.Balanced}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Сбалансированный
                          </div>
                        </SelectItem>
                        <SelectItem value={QualityMode.Detailed}>
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Детальный
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Использовать GPU</Label>
                    <Switch
                      checked={config.use_gpu}
                      onCheckedChange={(checked) => setConfig({ ...config, use_gpu: checked })}
                    />
                  </div>

                  <div>
                    <Label>Пропуск кадров: {config.frame_skip}</Label>
                    <Slider
                      value={[config.frame_skip]}
                      onValueChange={([value]) => setConfig({ ...config, frame_skip: value })}
                      min={1}
                      max={60}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Анализировать каждый {config.frame_skip}-й кадр
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thresholds */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Пороги детекции</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Порог изменения сцены: {config.scene_change_threshold}</Label>
                    <Slider
                      value={[config.scene_change_threshold]}
                      onValueChange={([value]) => setConfig({ ...config, scene_change_threshold: value })}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Порог уверенности лиц: {config.face_confidence_threshold}</Label>
                    <Slider
                      value={[config.face_confidence_threshold]}
                      onValueChange={([value]) => setConfig({ ...config, face_confidence_threshold: value })}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Порог детекции объектов: {config.object_confidence_threshold}</Label>
                    <Slider
                      value={[config.object_confidence_threshold]}
                      onValueChange={([value]) => setConfig({ ...config, object_confidence_threshold: value })}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Output Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Опции вывода</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Генерировать миниатюры</Label>
                    <Switch
                      checked={config.generate_thumbnails}
                      onCheckedChange={(checked) => setConfig({ ...config, generate_thumbnails: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Генерировать превью</Label>
                    <Switch
                      checked={config.generate_previews}
                      onCheckedChange={(checked) => setConfig({ ...config, generate_previews: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Сохранять ключевые кадры</Label>
                    <Switch
                      checked={config.save_keyframes}
                      onCheckedChange={(checked) => setConfig({ ...config, save_keyframes: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Включать сырые данные</Label>
                    <Switch
                      checked={config.include_raw_data}
                      onCheckedChange={(checked) => setConfig({ ...config, include_raw_data: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate} className="gap-2">
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
            Создать проект
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
