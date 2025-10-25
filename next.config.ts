import { codecovWebpackPlugin } from "@codecov/webpack-plugin"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  images: {
    unoptimized: true,
  },
  distDir: "dist",
  webpack: (config, { isServer }) => {
    // Minimize memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: "async",
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          // Отдельный чанк для больших JSON ресурсов
          browserResources: {
            test: /[\\/](effects|filters|transitions)[\\/]data[\\/].*\.json$/,
            name: "browser-resources",
            chunks: "async",
            priority: 20,
            enforce: true,
          },
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    }

    // Limit parallelism to reduce memory usage
    config.parallelism = 1

    // Limit memory usage for terser
    if (config.optimization.minimizer) {
      config.optimization.minimizer.forEach((minimizer: any) => {
        if (minimizer.constructor.name === "TerserPlugin") {
          minimizer.options.parallel = 1
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        }
      })
    }

    // Generate webpack stats for bundle analysis
    if (process.env.ANALYZE === "true") {
      config.stats = {
        all: false,
        assets: true,
        chunks: true,
        modules: true,
        timings: true,
        warnings: true,
        errors: true,
        errorDetails: true,
        entrypoints: true,
        chunkGroups: true,
      }
    }

    // Codecov bundle analysis plugin - DISABLED
    // if (process.env.CODECOV_TOKEN && !isServer) {
    //   config.plugins = config.plugins || []
    //   config.plugins.push(
    //     codecovWebpackPlugin({
    //       enableBundleAnalysis: true,
    //       bundleName: "timeline-studio",
    //       uploadToken: process.env.CODECOV_TOKEN,
    //       gitService: "github",
    //       telemetry: false,
    //       ...(process.env.CI && {
    //         uploadOverrides: {
    //           sha: process.env.GITHUB_SHA,
    //           branch: process.env.GITHUB_REF_NAME?.replace("refs/heads/", ""),
    //           pr: process.env.GITHUB_PR_NUMBER,
    //           build: process.env.GITHUB_RUN_ID,
    //         },
    //       }),
    //     }),
    //   )
    // }

    return config
  },
  experimental: {
    // Disable webpack build worker to prevent memory issues
    webpackBuildWorker: false,
    // Reduce memory usage
    workerThreads: false,
    cpus: 1,
    // Conditionally disable CSS features that require lightningcss on Windows CI
    ...(process.env.DISABLE_LIGHTNINGCSS === "true" && {
      cssChunking: false,
      optimizeCss: false,
    }),
  },
  // Disable type checking during build to save memory
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add empty turbopack config to silence the error
  // We'll use webpack for now as we have custom webpack configuration
  turbopack: {},
}

export default nextConfig
