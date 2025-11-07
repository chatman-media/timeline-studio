/**
 * Пример использования Person Identification
 */

import { createLogger } from "@/lib/tauri-logger"
import { usePersonIdentification } from "./hooks/use-person-identification"
import type { DetectedFace } from "./types/person"

const logger = createLogger("ExampleUsage")

export function PersonIdentificationExample() {
  const {
    persons,
    isLoading,
    error,
    addPerson,
    identifyPerson,
    createPersonFromFace,
    clusterUnknownFaces,
    getStatistics,
  } = usePersonIdentification()

  // Пример 1: Создание новой персоны
  const handleCreatePerson = async () => {
    const newPerson = await addPerson({
      name: "Иван Иванов",
      description: "Актер в главной роли",
      tags: ["actor", "main_role"],
    })
    logger.infoSync("Создана персона:", { newPerson })
  }

  // Пример 2: Идентификация лица
  const handleIdentifyFace = async (detectedFace: DetectedFace) => {
    const result = await identifyPerson(detectedFace)

    if (result) {
      logger.infoSync(`Опознан: ${result.person.name} с уверенностью ${result.confidence}`)
    } else {
      logger.infoSync("Лицо не опознано")

      // Создаем новую персону из неопознанного лица
      const newPerson = await createPersonFromFace(detectedFace, {
        name: "Неизвестный",
        tags: ["unidentified"],
      })
      logger.infoSync("Создана новая персона:", { newPerson })
    }
  }

  // Пример 3: Кластеризация неопознанных лиц
  const handleClusterFaces = async (unidentifiedFaces: DetectedFace[]) => {
    const newPersons = await clusterUnknownFaces(unidentifiedFaces, 0.8)
    logger.infoSync(`Создано ${newPersons.length} персон из кластеров`)
  }

  // Пример 4: Получение статистики
  const stats = getStatistics()

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Person Identification</h2>

      <div className="mb-4">
        <h3 className="font-semibold">Статистика</h3>
        <ul className="text-sm">
          <li>Всего персон: {stats.totalPersons}</li>
          <li>Всего лиц: {stats.totalFaces}</li>
          <li>Всего появлений: {stats.totalAppearances}</li>
          <li>В среднем лиц на персону: {stats.averageFacesPerPerson.toFixed(1)}</li>
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Персоны</h3>
        <div className="grid grid-cols-3 gap-2">
          {persons.map((person) => (
            <div key={person.id} className="border p-2 rounded">
              <h4 className="font-medium">{person.name || "Без имени"}</h4>
              <p className="text-xs text-gray-600">Лиц: {person.faceEmbeddings?.length || 0}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleCreatePerson} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Создать персону
      </button>
    </div>
  )
}
