"use client"

import { MediaStudio } from "@/features/media-studio/components/media-studio"
import { WorkspaceLayoutProvider } from "@/features/workspace"

import "@/lib/dayjs"
import "@/lib/tauri-init"

export default function Home() {
  return (
    <WorkspaceLayoutProvider>
      <MediaStudio data-oid="bjqz:v7" />
    </WorkspaceLayoutProvider>
  )
}
