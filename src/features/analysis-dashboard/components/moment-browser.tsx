// Moment browser component

import { Bookmark, Camera, Clock, Eye, Heart, Star, Zap } from "lucide-react"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyMoment, MomentType } from "../types/analysis"

interface MomentBrowserProps {
  moments: KeyMoment[]
  onMomentSelect: (moment: KeyMoment) => void
}

export function MomentBrowser({ moments, onMomentSelect }: MomentBrowserProps) {
  const getMomentTypeInfo = (type: MomentType) => {
    switch (type) {
      case MomentType.ActionClimax:
        return { icon: Zap, color: "bg-red-100 text-red-800", label: "Экшен" }
      case MomentType.EmotionalPeak:
        return { icon: Heart, color: "bg-pink-100 text-pink-800", label: "Эмоции" }
      case MomentType.VisualStunning:
        return { icon: Camera, color: "bg-purple-100 text-purple-800", label: "Визуал" }
      case MomentType.AudioPeak:
        return { icon: Star, color: "bg-orange-100 text-orange-800", label: "Аудио" }
      case MomentType.QualityPeak:
        return { icon: Star, color: "bg-green-100 text-green-800", label: "Качество" }
      case MomentType.ComedicMoment:
        return { icon: Star, color: "bg-yellow-100 text-yellow-800", label: "Комедия" }
      default:
        return { icon: Star, color: "bg-gray-100 text-gray-800", label: "Момент" }
    }
  }

  if (moments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет ключевых моментов</h3>
          <p className="text-muted-foreground">Ключевые моменты появятся после завершения анализа проекта</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ключевые моменты ({moments.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moments.map((moment) => {
          const typeInfo = getMomentTypeInfo(moment.moment_type)
          const IconComponent = typeInfo.icon

          return (
            <Card
              key={moment.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => onMomentSelect(moment)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    {moment.timestamp.toFixed(1)}с
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    {moment.is_bookmarked && <Bookmark className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{moment.duration.toFixed(1)}с</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    <span>{Math.round(moment.importance_score * 100)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Важность</span>
                    <span>{Math.round(moment.importance_score * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-orange-500 h-1 rounded-full"
                      style={{ width: `${moment.importance_score * 100}%` }}
                    />
                  </div>
                </div>

                {moment.description && <p className="text-sm line-clamp-2">{moment.description}</p>}

                {moment.auto_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{moment.auto_description}</p>
                )}

                {moment.content_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {moment.content_tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {moment.content_tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{moment.content_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {moment.involved_persons.length > 0 && <span>{moment.involved_persons.length} персон</span>}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMomentSelect(moment)
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
