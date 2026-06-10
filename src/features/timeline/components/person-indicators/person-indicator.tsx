/**
 * Индикатор персон на Timeline клипе
 * Показывает маленькие аватары персон, обнаруженных в клипе
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { User, Users } from "lucide-react"
import { useState } from "react"

import type { PersonProfile } from "../../../person-identification/types/person"
import type { TimelinePersonAppearance } from "../../hooks/state/use-timeline-persons"

interface PersonIndicatorProps {
  persons: PersonProfile[]
  appearances?: TimelinePersonAppearance[]
  clipId: string
  compact?: boolean
  maxVisible?: number
  onClick?: (personId: string) => void
}

export function PersonIndicator({
  persons,
  appearances = [],
  clipId,
  compact = false,
  maxVisible = 3,
  onClick,
}: PersonIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Фильтруем персон, которые появляются в этом клипе
  const clipAppearances = appearances.filter((app) => app.clipId === clipId)
  const personsInClip = persons.filter((person) => clipAppearances.some((app) => app.personId === person.id))

  if (personsInClip.length === 0) {
    return null
  }

  const visiblePersons = personsInClip.slice(0, maxVisible)
  const hiddenCount = Math.max(0, personsInClip.length - maxVisible)

  if (compact) {
    return (
      <Tooltip data-oid="l8b2w28">
        <TooltipTrigger asChild data-oid="4m87tdo">
          <Badge
            variant="secondary"
            className="h-5 px-1 text-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              if (personsInClip.length === 1) {
                onClick?.(personsInClip[0].id)
              }
            }}
            data-oid="nxfyrii"
          >
            {personsInClip.length === 1 ? (
              <User className="h-3 w-3" data-oid="xvl3v:r" />
            ) : (
              <>
                <Users className="h-3 w-3" data-oid="fzj3c9x" />
                <span className="ml-1" data-oid="y82uhbi">
                  {personsInClip.length}
                </span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-48" data-oid="amrkxgk">
          <div className="space-y-1" data-oid="5oab_rp">
            {personsInClip.map((person) => (
              <div key={person.id} className="text-xs" data-oid="3qxs3m1">
                {person.name || "Безымянная персона"}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="flex items-center space-x-1" data-oid="2lyd9i7">
      {visiblePersons.map((person, index) => {
        const appearance = clipAppearances.find((app) => app.personId === person.id)
        const confidence = appearance ? Math.round(appearance.confidence * 100) : 0

        return (
          <Tooltip key={person.id} data-oid="q1g.g3_">
            <TooltipTrigger asChild data-oid="eovqehg">
              <div
                className="relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.(person.id)
                }}
                style={{ zIndex: visiblePersons.length - index }}
                data-oid="yfz:d5v"
              >
                <div
                  className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center overflow-hidden"
                  data-oid="i68okow"
                >
                  {person.thumbnails && person.thumbnails.length > 0 ? (
                    <img
                      src={person.thumbnails[0].imageUrl}
                      alt={person.name || "Person"}
                      className="h-6 w-6 object-cover"
                      data-oid=".xhhx-v"
                    />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" data-oid="d5i5irh" />
                  )}
                </div>

                {/* Индикатор уверенности */}
                {confidence > 0 && (
                  <div
                    className={`
                      absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-background
                      ${confidence >= 80 ? "bg-green-500" : confidence >= 60 ? "bg-yellow-500" : "bg-red-500"}
                    `}
                    data-oid="fvexbxz"
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" data-oid="2o44-a9">
              <div className="text-xs" data-oid="gbz7xlr">
                <div className="font-medium" data-oid="za9:63.">
                  {person.name || "Безымянная персона"}
                </div>
                {confidence > 0 && (
                  <div className="text-muted-foreground" data-oid="83lg46f">
                    Уверенность: {confidence}%
                  </div>
                )}
                {appearance && (
                  <div className="text-muted-foreground" data-oid="ci.pkcr">
                    {Math.round(appearance.startTime)}с - {Math.round(appearance.endTime)}с
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}

      {hiddenCount > 0 && (
        <Tooltip data-oid="qkd29ks">
          <TooltipTrigger asChild data-oid="k54-2:w">
            <Badge variant="outline" className="h-6 w-6 p-0 text-xs rounded-full" data-oid="zki23c1">
              +{hiddenCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" data-oid="iwb:ytc">
            <div className="space-y-1" data-oid="ogh:c5t">
              {personsInClip.slice(maxVisible).map((person) => (
                <div key={person.id} className="text-xs" data-oid="w:bdn16">
                  {person.name || "Безымянная персона"}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
