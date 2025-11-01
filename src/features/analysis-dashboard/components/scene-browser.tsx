// Scene browser component

import { Clock, Eye, Star, Users } from "lucide-react"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalysisScene, SceneType } from "../types/analysis"

interface SceneBrowserProps {
  scenes: AnalysisScene[]
  onSceneSelect: (scene: AnalysisScene) => void
}

export function SceneBrowser({ scenes, onSceneSelect }: SceneBrowserProps) {
  const getSceneTypeColor = (type: SceneType) => {
    switch (type) {
      case SceneType.Cinematic:
        return "bg-purple-100 text-purple-800"
      case SceneType.Dynamic:
        return "bg-red-100 text-red-800"
      case SceneType.Closeup:
        return "bg-blue-100 text-blue-800"
      case SceneType.Wide:
        return "bg-green-100 text-green-800"
      case SceneType.Medium:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (scenes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет сцен</h3>
          <p className="text-muted-foreground">Сцены появятся после завершения анализа проекта</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Обнаруженные сцены ({scenes.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene) => (
          <Card
            key={scene.id}
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => onSceneSelect(scene)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base line-clamp-1">
                  Сцена {scene.start_time.toFixed(1)}с - {scene.end_time.toFixed(1)}с
                </CardTitle>
                <Badge className={getSceneTypeColor(scene.scene_type)}>{scene.scene_type}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{scene.duration.toFixed(1)}с</span>
                </div>

                {scene.has_faces && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Лица</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Качество</span>
                  <span>{Math.round(scene.quality_score * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${scene.quality_score * 100}%` }} />
                </div>
              </div>

              {scene.auto_description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{scene.auto_description}</p>
              )}

              {scene.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {scene.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {scene.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{scene.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
