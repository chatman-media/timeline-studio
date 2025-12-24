import { z } from "zod"
import { router, publicProcedure } from "../trpc"

/**
 * Media operations router
 */
export const mediaRouter = router({
  /**
   * Get metadata for a single file
   */
  getMetadata: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input, ctx }) => {
      const metadata = await ctx.mediaService.getMetadata(input.filePath)

      ctx.logger.debug("Metadata retrieved", { filePath: input.filePath })

      return metadata
    }),

  /**
   * Scan folder for media files
   */
  scanFolder: publicProcedure
    .input(
      z.object({
        folderPath: z.string(),
        recursive: z.boolean().default(false),
        includeHidden: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const files = await ctx.mediaService.scanFolder(input.folderPath, {
        recursive: input.recursive,
        includeHidden: input.includeHidden,
      })

      ctx.logger.info("Folder scanned", {
        folderPath: input.folderPath,
        fileCount: files.length,
      })

      return files
    }),

  /**
   * Scan folder with thumbnail generation
   */
  scanWithThumbnails: publicProcedure
    .input(
      z.object({
        folderPath: z.string(),
        width: z.number().default(320),
        height: z.number().default(180),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.mediaService.scanFolderWithThumbnails(
        input.folderPath,
        input.width,
        input.height
      )

      ctx.logger.info("Folder scanned with thumbnails", {
        folderPath: input.folderPath,
      })

      return result
    }),

  /**
   * Process multiple files
   */
  processFiles: publicProcedure
    .input(
      z.object({
        filePaths: z.array(z.string()),
        generateThumbnails: z.boolean().default(true),
        width: z.number().default(320),
        height: z.number().default(180),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = input.generateThumbnails
        ? await ctx.mediaService.processFilesWithThumbnails(
            input.filePaths,
            input.width,
            input.height
          )
        : await ctx.mediaService.processFiles(input.filePaths)

      ctx.logger.info("Files processed", {
        fileCount: input.filePaths.length,
        generateThumbnails: input.generateThumbnails,
      })

      return result
    }),

  /**
   * Import files into project
   */
  importFiles: publicProcedure
    .input(
      z.object({
        paths: z.array(z.string()),
        options: z
          .object({
            generateThumbnails: z.boolean().optional(),
            copyToProject: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.mediaService.importFiles(
        input.paths,
        input.options
      )

      ctx.logger.info("Files imported", { fileCount: input.paths.length })

      return result
    }),
})
