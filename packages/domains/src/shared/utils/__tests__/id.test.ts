/**
 * ID Generation Utilities Tests
 */

import { describe, expect, it } from "vitest"
import { generateId, generatePrefixedId, generateShortId, generateUUID } from "../id"

describe("id utils", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it("should generate ID with timestamp and random parts", () => {
      const id = generateId()
      const parts = id.split("-")

      expect(parts).toHaveLength(2)
      expect(parts[0]).toMatch(/^\d+$/) // timestamp
      expect(parts[1]).toMatch(/^[a-z0-9]+$/) // random part
    })

    it("should generate IDs with increasing timestamps", () => {
      const id1 = generateId()
      const id2 = generateId()

      const timestamp1 = Number.parseInt(id1.split("-")[0], 10)
      const timestamp2 = Number.parseInt(id2.split("-")[0], 10)

      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1)
    })
  })

  describe("generateUUID", () => {
    it("should generate valid UUID v4 format", () => {
      const uuid = generateUUID()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuid).toMatch(uuidRegex)
    })

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()

      expect(uuid1).not.toBe(uuid2)
    })

    it("should generate UUIDs with correct version", () => {
      const uuid = generateUUID()
      const versionChar = uuid.charAt(14)

      expect(versionChar).toBe("4")
    })

    it("should generate multiple unique UUIDs", () => {
      const uuids = new Set()
      const count = 100

      for (let i = 0; i < count; i++) {
        uuids.add(generateUUID())
      }

      expect(uuids.size).toBe(count)
    })
  })

  describe("generateShortId", () => {
    it("should generate short IDs", () => {
      const id = generateShortId()

      expect(id).toBeTruthy()
      expect(id.length).toBeGreaterThanOrEqual(8)
      expect(id.length).toBeLessThanOrEqual(10)
    })

    it("should generate unique short IDs", () => {
      const id1 = generateShortId()
      const id2 = generateShortId()

      expect(id1).not.toBe(id2)
    })

    it("should generate alphanumeric IDs", () => {
      const id = generateShortId()
      expect(id).toMatch(/^[a-z0-9]+$/)
    })

    it("should generate multiple unique short IDs", () => {
      const ids = new Set()
      const count = 50

      for (let i = 0; i < count; i++) {
        ids.add(generateShortId())
      }

      // Allow for small collision probability with short IDs
      expect(ids.size).toBeGreaterThan(count * 0.95)
    })
  })

  describe("generatePrefixedId", () => {
    it("should generate ID with prefix", () => {
      const id = generatePrefixedId("clip")

      expect(id).toMatch(/^clip-\d+-[a-z0-9]+$/)
    })

    it("should generate unique prefixed IDs", () => {
      const id1 = generatePrefixedId("test")
      const id2 = generatePrefixedId("test")

      expect(id1).not.toBe(id2)
      expect(id1).toContain("test-")
      expect(id2).toContain("test-")
    })

    it("should work with different prefixes", () => {
      const clipId = generatePrefixedId("clip")
      const trackId = generatePrefixedId("track")
      const sectionId = generatePrefixedId("section")

      expect(clipId).toMatch(/^clip-/)
      expect(trackId).toMatch(/^track-/)
      expect(sectionId).toMatch(/^section-/)
    })

    it("should work with empty prefix", () => {
      const id = generatePrefixedId("")

      expect(id).toMatch(/^-\d+-[a-z0-9]+$/)
    })

    it("should work with special characters in prefix", () => {
      const id = generatePrefixedId("my_prefix")

      expect(id).toContain("my_prefix-")
    })
  })
})
