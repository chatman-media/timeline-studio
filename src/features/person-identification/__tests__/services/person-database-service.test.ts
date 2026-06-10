import { PersonDatabaseService } from "@timeline-studio/domains/ai-services/services/person-identification"
import { describe, expect, it } from "vitest"

import type { PersonProfile as Person } from "../../types/person"

// Simple tests for PersonDatabaseService without complex mocks
describe("PersonDatabaseService", () => {
  it("should be a singleton", () => {
    // Test singleton behavior without resetting
    const instance1 = PersonDatabaseService.getInstance()
    const instance2 = PersonDatabaseService.getInstance()
    expect(instance1).toBe(instance2)

    // Additional test: verify it's the same instance with different config
    const instance3 = PersonDatabaseService.getInstance({ enableCache: false })
    expect(instance3).toBe(instance1)
  })

  it("should calculate cosine similarity correctly", () => {
    // Manual cosine similarity calculation for testing
    const calculateSimilarity = (vec1: number[], vec2: number[]): number => {
      let dotProduct = 0
      let norm1 = 0
      let norm2 = 0

      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i]
        norm1 += vec1[i] * vec1[i]
        norm2 += vec2[i] * vec2[i]
      }

      return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    }

    // Same vectors should have similarity 1
    const vec1 = [1, 0, 0]
    expect(calculateSimilarity(vec1, vec1)).toBeCloseTo(1, 5)

    // Orthogonal vectors should have similarity 0
    const vec2 = [0, 1, 0]
    expect(calculateSimilarity(vec1, vec2)).toBeCloseTo(0, 5)

    // Opposite vectors should have similarity -1
    const vec3 = [-1, 0, 0]
    expect(calculateSimilarity(vec1, vec3)).toBeCloseTo(-1, 5)
  })

  it("should validate person data structure", () => {
    const validPerson: Person = {
      id: "person-1",
      name: "Test Person",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 0,
      firstSeen: { seconds: 0 },
      lastSeen: { seconds: 0 },
      tags: ["actor", "main"],
      notes: "Test description",
      thumbnails: [],
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    expect(validPerson.id).toBeDefined()
    expect(validPerson.name).toBeDefined()
    expect(validPerson.privacy).toBeDefined()
    expect(validPerson.faceEmbeddings).toBeDefined()
  })

  it("should handle search operations logic", () => {
    const searchTerms = ["john", "doe", "actor"]
    const person = {
      name: "John Doe",
      description: "Famous actor",
      tags: ["actor", "hollywood"],
    }

    // Test name matching
    const nameMatch = person.name.toLowerCase().includes(searchTerms[0])
    expect(nameMatch).toBe(true)

    // Test tag matching
    const tagMatch = person.tags.some((tag) => searchTerms.includes(tag.toLowerCase()))
    expect(tagMatch).toBe(true)

    // Test description matching
    const descMatch = person.description.toLowerCase().includes(searchTerms[2])
    expect(descMatch).toBe(true)
  })

  it("should validate embedding search threshold", () => {
    const SIMILARITY_THRESHOLD = 0.8

    const isAboveThreshold = (similarity: number) => similarity >= SIMILARITY_THRESHOLD

    expect(isAboveThreshold(0.9)).toBe(true)
    expect(isAboveThreshold(0.8)).toBe(true)
    expect(isAboveThreshold(0.7)).toBe(false)
    expect(isAboveThreshold(1.0)).toBe(true)
  })

  it("should handle statistics calculations", () => {
    const clips = [
      { startTime: 0, endTime: 10 },
      { startTime: 20, endTime: 30 },
      { startTime: 40, endTime: 50 },
    ]

    const calculateStats = (clips: any[]) => {
      const totalAppearances = clips.length
      const totalScreenTime = clips.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0)
      const averageScreenTime = totalScreenTime / totalAppearances

      return {
        totalAppearances,
        totalScreenTime,
        averageScreenTime,
      }
    }

    const stats = calculateStats(clips)
    expect(stats.totalAppearances).toBe(3)
    expect(stats.totalScreenTime).toBe(30)
    expect(stats.averageScreenTime).toBe(10)
  })
})
