import { describe, expect, it } from "vitest"
import * as RecognitionModule from "../index"

describe("recognition feature exports", () => {
  it("должен экспортировать YoloDataService", () => {
    expect(RecognitionModule.YoloDataService).toBeDefined()
    expect(typeof RecognitionModule.YoloDataService).toBe("function")
  })

  it("должен экспортировать SceneContextService", () => {
    expect(RecognitionModule.SceneContextService).toBeDefined()
    expect(typeof RecognitionModule.SceneContextService).toBe("function")
  })

  it("должен экспортировать YoloDataOverlay компонент", () => {
    expect(RecognitionModule.YoloDataOverlay).toBeDefined()
  })

  it("должен экспортировать YoloDataVisualization компонент", () => {
    expect(RecognitionModule.YoloDataVisualization).toBeDefined()
  })

  it("должен экспортировать YoloGraphOverlay компонент", () => {
    expect(RecognitionModule.YoloGraphOverlay).toBeDefined()
  })

  it("должен экспортировать YoloTrackOverlay компонент", () => {
    expect(RecognitionModule.YoloTrackOverlay).toBeDefined()
  })

  it("должен экспортировать useYoloData хук", () => {
    expect(RecognitionModule.useYoloData).toBeDefined()
    expect(typeof RecognitionModule.useYoloData).toBe("function")
  })

  it("должен иметь все ожидаемые экспорты", () => {
    const expectedExports = [
      "YoloDataService",
      "SceneContextService",
      "YoloDataOverlay",
      "YoloDataVisualization",
      "YoloGraphOverlay",
      "YoloTrackOverlay",
      "useYoloData",
    ]

    expectedExports.forEach((exportName) => {
      expect(RecognitionModule).toHaveProperty(exportName)
    })
  })
})
