/**
 * Media Types - Shared across all domains
 *
 * Canonical source for MediaType enum
 */

// IMPORTANT: Backend expects "Video", "Audio", "Image" (capitalized)
export enum MediaType {
  // Video formats
  Video = "Video",
  VideoWithAudio = "video_with_audio",

  // Image formats
  StillImage = "Image",
  ImageSequence = "image_sequence",

  // Audio formats
  Audio = "Audio",
  Music = "music",
  Voiceover = "voiceover",
  SFX = "sfx",
  Ambient = "ambient",

  // Text and graphics
  Subtitle = "subtitle",
  Title = "title",
  Graphics = "graphics",

  // Special types
  LUT = "lut", // Color lookup table
  Project = "project",
  Unknown = "unknown",
}
