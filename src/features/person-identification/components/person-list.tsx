/**
 * Компонент списка персон
 * Отображает список всех персон с возможностью поиска и фильтрации
 */

import { Edit, Search, Trash2, User } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { PersonProfile } from "../types/person"

interface PersonListProps {
  persons: PersonProfile[]
  selectedPersonId?: string
  onSelectPerson: (personId: string) => void
  onEditPerson: (personId: string) => void
  onDeletePerson: (personId: string) => void
  onCreatePerson: () => void
  isLoading?: boolean
}

export function PersonList({
  persons,
  selectedPersonId,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onCreatePerson,
  isLoading = false,
}: PersonListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTag, setFilterTag] = useState<string | null>(null)

  // Фильтрация персон по поисковому запросу и тегам
  const filteredPersons = persons.filter((person) => {
    const matchesSearch =
      (person.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (person.notes?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    const matchesTag = !filterTag || person.tags?.includes(filterTag)

    return matchesSearch && matchesTag
  })

  // Получаем все уникальные теги
  const allTags = Array.from(new Set(persons.flatMap((p) => p.tags || [])))

  return (
    <div className="flex h-full flex-col space-y-4 p-4" data-oid="9p38j49">
      {/* Заголовок и кнопка создания */}
      <div className="flex items-center justify-between" data-oid="l_ce60l">
        <h2 className="text-lg font-semibold" data-oid=".wd8nc:">
          Персоны
        </h2>
        <Button onClick={onCreatePerson} size="sm" data-oid="4wlwthn">
          <User className="h-4 w-4 mr-2" data-oid="e43guxy" />
          Добавить
        </Button>
      </div>

      {/* Поиск */}
      <div className="relative" data-oid="6eomqah">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" data-oid="2po8u5f" />
        <Input
          placeholder="Поиск персон..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-oid="2qqkyeg"
        />
      </div>

      {/* Фильтры по тегам */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2" data-oid="q28:m4.">
          <Button
            variant={filterTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTag(null)}
            data-oid="_:4ir1-"
          >
            Все
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={filterTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTag(tag)}
              data-oid="dj__.hl"
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Список персон */}
      <ScrollArea className="flex-1" data-oid="faqfo_3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8" data-oid="krbz8re">
            <div className="text-sm text-muted-foreground" data-oid="l5faz:k">
              Загрузка...
            </div>
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center" data-oid="4klvty_">
            <User className="h-12 w-12 text-muted-foreground mb-2" data-oid="f8pk8r4" />
            <p className="text-sm text-muted-foreground" data-oid="ydgmyzp">
              {searchQuery || filterTag ? "Персоны не найдены" : "Пока нет добавленных персон"}
            </p>
          </div>
        ) : (
          <div className="space-y-2" data-oid="c354b9c">
            {filteredPersons.map((person) => (
              <div
                key={person.id}
                className={`
                  group flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors
                  ${selectedPersonId === person.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}
                `}
                onClick={() => onSelectPerson(person.id)}
                data-oid="zvos31w"
              >
                {/* Аватар */}
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center" data-oid="ri3na-r">
                  {person.thumbnails && person.thumbnails.length > 0 && person.thumbnails[0].imageUrl ? (
                    <img
                      src={person.thumbnails[0].imageUrl}
                      alt={person.name}
                      className="h-10 w-10 rounded-full object-cover"
                      data-oid="zsg_cvi"
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" data-oid="g9ihpf5" />
                  )}
                </div>

                {/* Информация о персоне */}
                <div className="flex-1 min-w-0" data-oid="cs_6imi">
                  <p className="font-medium text-sm truncate" data-oid="avqxm02">
                    {person.name || "Без имени"}
                  </p>
                  {person.notes && (
                    <p className="text-xs text-muted-foreground truncate" data-oid="78hider">
                      {person.notes}
                    </p>
                  )}

                  {/* Теги */}
                  {person.tags && person.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1" data-oid="s04:.9w">
                      {person.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs" data-oid="vrdwozi">
                          {tag}
                        </Badge>
                      ))}
                      {person.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs" data-oid="ie..atj">
                          +{person.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="text-xs text-muted-foreground text-right" data-oid="phjc9w.">
                  <div data-oid="nsu0fjq">{person.faceEmbeddings?.length || 0} лиц</div>
                  <div data-oid="2d0xtsp">{person.appearances?.length || 0} появлений</div>
                </div>

                {/* Действия */}
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity" data-oid="e.tjbob">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditPerson(person.id)
                    }}
                    data-oid="tgrol:f"
                  >
                    <Edit className="h-4 w-4" data-oid="-vg80el" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeletePerson(person.id)
                    }}
                    data-oid="3zp:-x1"
                  >
                    <Trash2 className="h-4 w-4" data-oid="k:tfif5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
