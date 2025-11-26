import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import type { CodeCompletionItem, ShaderError, ShaderType } from "../../types/shader-system"

interface GLSLCodeEditorProps {
  value: string
  onChange: (value: string) => void
  onCompile?: () => void
  shaderType: ShaderType
  errors?: ShaderError[]
  readOnly?: boolean
  className?: string
}

// GLSL keywords for syntax highlighting
const GLSL_KEYWORDS = [
  // Storage qualifiers
  "const",
  "attribute",
  "uniform",
  "varying",
  "in",
  "out",
  "inout",
  // Precision qualifiers
  "highp",
  "mediump",
  "lowp",
  "precision",
  // Control flow
  "if",
  "else",
  "for",
  "while",
  "do",
  "break",
  "continue",
  "return",
  "discard",
  // Types
  "void",
  "bool",
  "int",
  "uint",
  "float",
  "double",
  "vec2",
  "vec3",
  "vec4",
  "ivec2",
  "ivec3",
  "ivec4",
  "uvec2",
  "uvec3",
  "uvec4",
  "bvec2",
  "bvec3",
  "bvec4",
  "dvec2",
  "dvec3",
  "dvec4",
  "mat2",
  "mat3",
  "mat4",
  "dmat2",
  "dmat3",
  "dmat4",
  "sampler2D",
  "sampler3D",
  "samplerCube",
  "sampler2DShadow",
  // Layout qualifiers
  "layout",
  "location",
  "binding",
  "offset",
  // Other
  "struct",
  "true",
  "false",
]

const GLSL_BUILTIN_FUNCTIONS = [
  // Math functions
  "abs",
  "sign",
  "floor",
  "ceil",
  "fract",
  "mod",
  "min",
  "max",
  "clamp",
  "mix",
  "step",
  "smoothstep",
  "length",
  "distance",
  "dot",
  "cross",
  "normalize",
  "reflect",
  "refract",
  "pow",
  "exp",
  "log",
  "exp2",
  "log2",
  "sqrt",
  "inversesqrt",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  // Matrix functions
  "matrixCompMult",
  "transpose",
  "inverse",
  // Vector functions
  "lessThan",
  "lessThanEqual",
  "greaterThan",
  "greaterThanEqual",
  "equal",
  "notEqual",
  "any",
  "all",
  "not",
  // Texture functions
  "texture",
  "texture2D",
  "textureCube",
  "textureProj",
  // Derivative functions
  "dFdx",
  "dFdy",
  "fwidth",
  // Noise functions
  "noise",
  "noise1",
  "noise2",
  "noise3",
  "noise4",
]

const GLSL_BUILTIN_VARIABLES = [
  // Vertex shader
  "gl_Position",
  "gl_PointSize",
  "gl_ClipDistance",
  // Fragment shader
  "gl_FragCoord",
  "gl_FrontFacing",
  "gl_PointCoord",
  "gl_FragColor",
  "gl_FragData",
  // Both
  "gl_VertexID",
  "gl_InstanceID",
  "gl_PrimitiveID",
]

export function GLSLCodeEditor({
  value,
  onChange,
  onCompile,
  shaderType,
  errors = [],
  readOnly = false,
  className,
}: GLSLCodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedText, setSelectedText] = useState("")
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [autoCompleteItems, setAutoCompleteItems] = useState<CodeCompletionItem[]>([])

  // Update line numbers
  useEffect(() => {
    if (lineNumbersRef.current) {
      const lines = value.split("\n").length
      const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join("\n")
      lineNumbersRef.current.textContent = lineNumbers
    }
  }, [value])

  // Handle cursor position
  const updateCursorPosition = useCallback(() => {
    if (!editorRef.current) return

    const { selectionStart } = editorRef.current
    const lines = value.substring(0, selectionStart).split("\n")
    const line = lines.length
    const column = lines[lines.length - 1].length + 1

    setCursorPosition({ line, column })

    // Update selected text
    const { selectionEnd } = editorRef.current
    if (selectionStart !== selectionEnd) {
      setSelectedText(value.substring(selectionStart, selectionEnd))
    } else {
      setSelectedText("")
    }
  }, [value])

  // Handle text change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      updateCursorPosition()
    },
    [onChange, updateCursorPosition],
  )

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab handling
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault()
        const { selectionStart, selectionEnd } = e.currentTarget
        const newValue = `${value.substring(0, selectionStart)}  ${value.substring(selectionEnd)}`
        onChange(newValue)

        // Restore cursor position
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = selectionStart + 2
            editorRef.current.selectionEnd = selectionStart + 2
          }
        }, 0)
      }

      // Compile shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        onCompile?.()
      }

      // Auto-complete trigger
      if (e.key === "." || (e.ctrlKey && e.key === " ")) {
        // Trigger autocomplete
        const currentWord = getCurrentWord()
        if (currentWord) {
          generateAutoCompleteItems(currentWord)
          setShowAutoComplete(true)
        }
      }

      // Close autocomplete
      if (e.key === "Escape") {
        setShowAutoComplete(false)
      }
    },
    [value, onChange, onCompile],
  )

  // Get current word at cursor
  const getCurrentWord = useCallback(() => {
    if (!editorRef.current) return ""

    const { selectionStart } = editorRef.current
    const beforeCursor = value.substring(0, selectionStart)
    const afterCursor = value.substring(selectionStart)

    const beforeMatch = /[\w.]+$/.exec(beforeCursor)
    const afterMatch = /^[\w.]+/.exec(afterCursor)

    const before = beforeMatch ? beforeMatch[0] : ""
    const after = afterMatch ? afterMatch[0] : ""

    return before + after
  }, [value])

  // Generate autocomplete items
  const generateAutoCompleteItems = useCallback((prefix: string) => {
    const items: CodeCompletionItem[] = []

    // Add matching keywords
    GLSL_KEYWORDS.filter((k) => k.startsWith(prefix)).forEach((keyword) => {
      items.push({
        label: keyword,
        kind: "keyword",
        insertText: keyword,
        sortText: `1${keyword}`,
      })
    })

    // Add matching functions
    GLSL_BUILTIN_FUNCTIONS.filter((f) => f.startsWith(prefix)).forEach((func) => {
      items.push({
        label: func,
        kind: "function",
        insertText: `${func}(`,
        detail: "Built-in function",
        sortText: `2${func}`,
      })
    })

    // Add matching variables
    GLSL_BUILTIN_VARIABLES.filter((v) => v.startsWith(prefix)).forEach((variable) => {
      items.push({
        label: variable,
        kind: "variable",
        insertText: variable,
        detail: "Built-in variable",
        sortText: `3${variable}`,
      })
    })

    setAutoCompleteItems(items)
  }, [])

  // Syntax highlighting (simplified)
  const getHighlightedCode = useCallback(() => {
    let highlighted = value

    // Highlight keywords
    GLSL_KEYWORDS.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g")
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
    })

    // Highlight functions
    GLSL_BUILTIN_FUNCTIONS.forEach((func) => {
      const regex = new RegExp(`\\b${func}\\b`, "g")
      highlighted = highlighted.replace(regex, `<span class="function">${func}</span>`)
    })

    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')

    // Highlight strings
    highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')

    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')

    return highlighted
  }, [value])

  // Get error decorations
  const getErrorDecorations = useCallback(() => {
    return errors.map((error) => ({
      line: error.line,
      className: "error-line",
      message: error.message,
    }))
  }, [errors])

  return (
    <div className={cn("relative flex h-full bg-gray-900 rounded-lg overflow-hidden", className)}>
      {/* Line numbers */}
      <div className="shrink-0 w-12 bg-gray-950 text-gray-500 text-right pr-2 pt-4 pb-4 text-sm font-mono select-none">
        <div ref={lineNumbersRef} className="leading-6">
          1
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={updateCursorPosition}
          onClick={updateCursorPosition}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={cn(
            "absolute inset-0 w-full h-full bg-transparent text-transparent caret-white",
            "font-mono text-sm leading-6 resize-none outline-none",
            "pt-4 pb-4 pl-4 pr-4",
            readOnly && "cursor-not-allowed",
          )}
          style={{
            tabSize: 2,
            MozTabSize: 2,
            WebkitTextFillColor: "transparent",
          }}
        />

        {/* Syntax highlighted overlay */}
        <div
          className="absolute inset-0 pointer-events-none font-mono text-sm leading-6 pt-4 pb-4 pl-4 pr-4 overflow-auto whitespace-pre"
          dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
        />

        {/* Error indicators */}
        {errors.map((error, index) => (
          <div
            key={index}
            className="absolute left-0 right-0 h-6 bg-red-500/10 border-l-2 border-red-500 pointer-events-none"
            style={{ top: `${(error.line - 1) * 24 + 16}px` }}
            title={error.message}
          />
        ))}

        {/* Autocomplete dropdown */}
        {showAutoComplete && autoCompleteItems.length > 0 && (
          <div className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-48 overflow-auto">
            {autoCompleteItems.map((item, index) => (
              <button
                key={index}
                className="flex items-center gap-2 w-full px-3 py-1 text-sm text-left hover:bg-gray-700"
                onClick={() => {
                  // Insert completion
                  if (editorRef.current) {
                    const { selectionStart } = editorRef.current
                    const beforeCursor = value.substring(0, selectionStart)
                    const afterCursor = value.substring(selectionStart)

                    // Remove partial word
                    const beforeMatch = /[\w.]+$/.exec(beforeCursor)
                    const newBefore = beforeMatch
                      ? beforeCursor.substring(0, beforeCursor.length - beforeMatch[0].length)
                      : beforeCursor

                    const newValue = newBefore + item.insertText + afterCursor
                    onChange(newValue)
                    setShowAutoComplete(false)
                  }
                }}
              >
                <span
                  className={cn(
                    "text-xs px-1 py-0.5 rounded",
                    item.kind === "keyword" && "bg-blue-600 text-white",
                    item.kind === "function" && "bg-green-600 text-white",
                    item.kind === "variable" && "bg-purple-600 text-white",
                  )}
                >
                  {item.kind}
                </span>
                <span className="text-white">{item.label}</span>
                {item.detail && <span className="text-gray-400 text-xs ml-auto">{item.detail}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1 bg-gray-950 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{shaderType === "vertex" ? "Vertex Shader" : "Fragment Shader"}</span>
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          {selectedText && <span>{selectedText.length} selected</span>}
        </div>
        <div className="flex items-center gap-4">
          {errors.length > 0 && <span className="text-red-400">{errors.length} errors</span>}
          <span>GLSL ES 3.0</span>
        </div>
      </div>

      <style jsx>{`
        .keyword {
          color: #569cd6;
        }
        .function {
          color: #dcdcaa;
        }
        .number {
          color: #b5cea8;
        }
        .string {
          color: #ce9178;
        }
        .comment {
          color: #6a9955;
        }
      `}</style>
    </div>
  )
}
