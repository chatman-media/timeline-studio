/**
 * Example: Using Node.js Backend for Media Processing
 *
 * This example demonstrates how to use the Node.js backend
 * for media file scanning and processing
 */

import { useState } from "react"
import { useNodeBackend } from "../hooks/use-node-backend"
import type { ScannedMediaFile } from "@/core/ports/media.port"

export function NodeBackendExample() {
  const [files, setFiles] = useState<ScannedMediaFile[]>([])
  const [folderPath, setFolderPath] = useState("/path/to/media")

  const {
    scanFolder,
    isScanning,
    error,
    checkHealth,
    getCacheStats,
  } = useNodeBackend({
    onError: (err) => {
      console.error("Backend error:", err.message)
    },
  })

  const handleScanFolder = async () => {
    try {
      const scannedFiles = await scanFolder(folderPath, {
        width: 320,
        height: 180,
      })
      setFiles(scannedFiles)
      console.log(`Scanned ${scannedFiles.length} files`)
    } catch (err) {
      console.error("Failed to scan folder:", err)
    }
  }

  const handleCheckHealth = async () => {
    try {
      const health = await checkHealth()
      console.log("Backend health:", health)
      alert(
        `Backend: ${health.available ? "✅" : "❌"}\nFFmpeg: ${health.ffmpegAvailable ? "✅" : "❌"}`
      )
    } catch (err) {
      console.error("Health check failed:", err)
    }
  }

  const handleCacheStats = async () => {
    try {
      const stats = await getCacheStats()
      console.log("Cache stats:", stats)
      alert(`Memory: ${stats.memorySize}\nDatabase: ${stats.dbSize}`)
    } catch (err) {
      console.error("Failed to get cache stats:", err)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Node.js Backend Example</h2>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error.message}
        </div>
      )}

      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium">Folder Path:</span>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border rounded"
            placeholder="/path/to/media"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={handleScanFolder}
            disabled={isScanning}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isScanning ? "Scanning..." : "Scan Folder"}
          </button>

          <button
            onClick={handleCheckHealth}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Check Health
          </button>

          <button
            onClick={handleCacheStats}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Cache Stats
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            Scanned Files ({files.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="p-3 border rounded hover:shadow-lg transition"
              >
                {file.thumbnailBase64 && (
                  <img
                    src={file.thumbnailBase64}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-gray-500">{file.type}</p>
                  {file.metadata?.type === "Video" && (
                    <p className="text-gray-500">
                      {file.metadata.width}x{file.metadata.height}
                      {file.metadata.duration &&
                        ` • ${Math.round(file.metadata.duration)}s`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Usage in your application:
 *
 * 1. Start the Node.js backend:
 *    cd src-node
 *    bun run dev
 *
 * 2. Add the component to your page:
 *    import { NodeBackendExample } from '@/features/browser/examples/node-backend-example'
 *
 *    export default function Page() {
 *      return <NodeBackendExample />
 *    }
 *
 * 3. Configure backend URL (optional):
 *    Add to .env.local:
 *    NEXT_PUBLIC_NODE_BACKEND_URL=http://localhost:3001
 */
