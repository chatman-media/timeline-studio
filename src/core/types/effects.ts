export interface UserPreset {
  id: string
  effectId: string
  name: string
  description?: string
  params: Record<string, any>
  tags?: string[]
  createdAt: string
  updatedAt: string
  favorite?: boolean
}
