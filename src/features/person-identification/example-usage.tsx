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

  if (isLoading) return <div data-oid="9:7_dr7">Загрузка...</div>
  if (error) return <div data-oid="4c5kz5i">Ошибка: {error}</div>

  return (
    <div className="p-4" data-oid="z352efr">
      <h2 className="text-xl font-bold mb-4" data-oid="c.stnyv">
        Person Identification
      </h2>

      <div className="mb-4" data-oid="ldszwje">
        <h3 className="font-semibold" data-oid="32c1fz7">
          Статистика
        </h3>
        <ul className="text-sm" data-oid="p:dwaab">
          <li data-oid="hwtyk41">Всего персон: {stats.totalPersons}</li>
          <li data-oid="dzmygs:">Всего лиц: {stats.totalFaces}</li>
          <li data-oid="ayd2.4g">Всего появлений: {stats.totalAppearances}</li>
          <li data-oid="7l7s5o:">В среднем лиц на персону: {stats.averageFacesPerPerson.toFixed(1)}</li>
        </ul>
      </div>

      <div className="mb-4" data-oid="xd_3-se">
        <h3 className="font-semibold mb-2" data-oid="3fcrkk2">
          Персоны
        </h3>
        <div className="grid grid-cols-3 gap-2" data-oid="2u5k632">
          {persons.map((person) => (
            <div key={person.id} className="border p-2 rounded" data-oid=":3a:ext">
              <h4 className="font-medium" data-oid="z:a53_1">
                {person.name || "Без имени"}
              </h4>
              <p className="text-xs text-gray-600" data-oid="xozvprs">
                Лиц: {person.faceEmbeddings?.length || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreatePerson}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        data-oid="b3wx8ro"
      >
        Создать персону
      </button>
    </div>
  )
}
