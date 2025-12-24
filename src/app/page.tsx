"use client"

import { MediaStudio } from "@/features/media-studio/components/media-studio"
import { WorkspaceLayoutProvider } from "@/features/workspace"

import "@/lib/dayjs"
import "@/lib/tauri-init"

export default function Home() {
  return (
    <WorkspaceLayoutProvider>
      <div className="relative min-h-screen bg-[#f7f8f9] dark:bg-[#252526]" data-oid="796pqg-">
        <MediaStudio data-oid="bjqz:v7" />
      </div>
    </WorkspaceLayoutProvider>
  )
}
