#!/bin/bash

# Script to run Tauri dev with correct FFmpeg and ONNX Runtime paths
# This ensures the application can find all required libraries

echo "🔧 Setting up FFmpeg and ONNX Runtime environment..."

# FFmpeg Configuration
export FFMPEG_DIR=/opt/homebrew/Cellar/ffmpeg/8.0_2
export FFMPEG_LIBS_DIR=/opt/homebrew/Cellar/ffmpeg/8.0_2/lib
export FFMPEG_INCLUDE_DIR=/opt/homebrew/Cellar/ffmpeg/8.0_2/include
export PKG_CONFIG_PATH=/opt/homebrew/Cellar/ffmpeg/8.0_2/lib/pkgconfig

# ONNX Runtime Configuration
export ORT_DYLIB_PATH=/opt/homebrew/Cellar/onnxruntime/1.22.2_5/lib/libonnxruntime.dylib

echo "✅ Environment variables set:"
echo "   FFMPEG_DIR=$FFMPEG_DIR"
echo "   FFMPEG_LIBS_DIR=$FFMPEG_LIBS_DIR"
echo "   FFMPEG_INCLUDE_DIR=$FFMPEG_INCLUDE_DIR"
echo "   PKG_CONFIG_PATH=$PKG_CONFIG_PATH"
echo "   ORT_DYLIB_PATH=$ORT_DYLIB_PATH"
echo ""
echo "🚀 Starting Tauri development server..."

# Run Tauri dev
bun run tauri dev
