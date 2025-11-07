import { useCallback, useRef, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"
import { DEFAULT_FRAGMENT_SHADER, DEFAULT_VERTEX_SHADER } from "../components/shader-editor/shader-editor"

import type { ShaderCompilationResult, ShaderProject, ShaderType, ShaderUniform } from "../types/shader-system"

const logger = createLogger("useShaderEditor")

/**
 * Hook for managing shader editor state
 */
export function useShaderEditor(initialProject?: ShaderProject) {
  void logger.info("Initializing shader editor")

  const [project, setProject] = useState<ShaderProject>(() => {
    if (initialProject) {
      void logger.info(`Loading existing shader project: ${initialProject.id}`)
      return { ...initialProject, isDirty: false }
    }

    return {
      id: `shader-${Date.now()}`,
      name: "New Shader",
      description: "",
      vertexShader: DEFAULT_VERTEX_SHADER,
      fragmentShader: DEFAULT_FRAGMENT_SHADER,
      uniforms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      isDirty: false,
      compilationResult: undefined,
    }
  })

  // Track undo/redo history
  const historyRef = useRef<ShaderProject[]>([])
  const historyIndexRef = useRef(0)

  // Update shader source
  const updateShader = useCallback((type: ShaderType, source: string) => {
    void logger.info(`Updating ${type} shader`)
    setProject((prev) => ({
      ...prev,
      [type === "vertex" ? "vertexShader" : "fragmentShader"]: source,
      updatedAt: new Date(),
      isDirty: true,
    }))
  }, [])

  // Update uniform value
  const updateUniform = useCallback((name: string, value: any) => {
    setProject((prev) => ({
      ...prev,
      uniforms: prev.uniforms.map((u) => (u.name === name ? { ...u, value } : u)),
      isDirty: true,
    }))
  }, [])

  // Add uniform
  const addUniform = useCallback((uniform: ShaderUniform) => {
    void logger.info(`Adding uniform: ${uniform.name}`)
    setProject((prev) => ({
      ...prev,
      uniforms: [...prev.uniforms, uniform],
      isDirty: true,
    }))
  }, [])

  // Remove uniform
  const removeUniform = useCallback((name: string) => {
    void logger.info(`Removing uniform: ${name}`)
    setProject((prev) => ({
      ...prev,
      uniforms: prev.uniforms.filter((u) => u.name !== name),
      isDirty: true,
    }))
  }, [])

  // Set compilation result
  const setCompilationResult = useCallback((result: ShaderCompilationResult) => {
    setProject((prev) => ({
      ...prev,
      compilationResult: result,
    }))
  }, [])

  // Mark as dirty
  const markDirty = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      isDirty: true,
      updatedAt: new Date(),
    }))
  }, [])

  // Mark as clean
  const markClean = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      isDirty: false,
    }))
  }, [])

  // Save to history
  const saveToHistory = useCallback(() => {
    void logger.info("Saving to history")
    const currentState = { ...project }
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(currentState)
    historyIndexRef.current = historyRef.current.length - 1
  }, [project])

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      void logger.info(`Undoing - moving to history index ${historyIndexRef.current - 1}`)
      historyIndexRef.current--
      setProject(historyRef.current[historyIndexRef.current])
    }
  }, [])

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      void logger.info(`Redoing - moving to history index ${historyIndexRef.current + 1}`)
      historyIndexRef.current++
      setProject(historyRef.current[historyIndexRef.current])
    }
  }, [])

  // Reset project
  const resetProject = useCallback(() => {
    void logger.info("Resetting project")
    setProject({
      id: `shader-${Date.now()}`,
      name: "New Shader",
      description: "",
      vertexShader: DEFAULT_VERTEX_SHADER,
      fragmentShader: DEFAULT_FRAGMENT_SHADER,
      uniforms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
      isDirty: false,
      compilationResult: undefined,
    })
    historyRef.current = []
    historyIndexRef.current = 0
  }, [])

  // Load project
  const loadProject = useCallback((newProject: ShaderProject) => {
    void logger.info(`Loading project: ${newProject.id}`)
    setProject({
      ...newProject,
      isDirty: false,
      compilationResult: undefined,
    })
    historyRef.current = []
    historyIndexRef.current = 0
  }, [])

  return {
    project,
    updateShader,
    updateUniform,
    addUniform,
    removeUniform,
    setCompilationResult,
    markDirty,
    markClean,
    saveToHistory,
    undo,
    redo,
    resetProject,
    loadProject,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  }
}
