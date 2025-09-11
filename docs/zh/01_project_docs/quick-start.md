# QUICK START GUIDE

## 🚀 Getting Started with Timeline Studio

This guide will help you get Timeline Studio up and running in just a few minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **Bun** (latest version)
- **Rust** 1.81.0 or higher
- **FFmpeg** 6.0 or higher

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Platform-Specific Setup

#### macOS
```bash
# Install FFmpeg
brew install ffmpeg

# Install ONNX Runtime (for AI features)
brew install onnxruntime

# Set environment variable (add to ~/.zshrc or ~/.bashrc)
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### Windows
```powershell
# Run the setup script
./scripts/setup-rust-env-windows.ps1

# Or manually install FFmpeg
# Download from https://www.gyan.dev/ffmpeg/builds/
# Extract to C:\ffmpeg
# Add C:\ffmpeg\bin to PATH
```

#### Linux
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev
```

## 🎮 Running Timeline Studio

### Development Mode

```bash
bun run tauri dev
```

This will:
- Start the Next.js development server
- Launch the Tauri application window
- Enable hot reload for both frontend and backend

### Production Build

```bash
bun run tauri build
```

This creates an optimized production build for your platform.

## 🎬 Creating Your First Project

1. **Launch Timeline Studio**
   - Run `bun run tauri dev`
   - The application window will open

2. **Create a New Project**
   - Click "New Project" on the welcome screen
   - Choose project settings (resolution, framerate)
   - Click "Create"

3. **Import Media**
   - Click the "Import" button in the media browser
   - Select your video files
   - Wait for import to complete

4. **Edit Your Video**
   - Drag media from browser to timeline
   - Use the toolbar for cutting, transitions, effects
   - Preview your edits in the video player

5. **Export Your Project**
   - Click "Export" in the top menu
   - Choose format and quality settings
   - Select destination
   - Click "Start Export"

## 🤖 Using AI Features

### Claude/OpenAI Integration

1. **Set up API Keys**
   - Go to Settings → AI Configuration
   - Enter your Claude or OpenAI API key
   - Keys are securely stored in your system keychain

2. **Using AI Assistant**
   - Click the AI chat icon in the sidebar
   - Ask questions about editing techniques
   - Get suggestions for your project

3. **Automatic Features**
   - Scene detection
   - Object recognition
   - Auto-subtitles with Whisper

## 🚀 Advanced Features

### AI-Powered Tools

#### AI Content Intelligence
Smart content analysis using artificial intelligence:

- **Automatic scene detection** - Identifies scene changes and key frames
- **Object recognition** - Detects objects in video using YOLO/ONNX models
- **Script generation** - Automatically creates descriptions and dialogues
- **Platform adaptation** - Optimizes content for YouTube, TikTok, Instagram
- **OCR capabilities** - Text recognition in video frames

#### Smart Montage Planner
AI-driven editing assistant for automatic professional video creation:

- **Material analysis** - Automatic analysis of all imported files
- **Plan generation** - Creates montage plans in various styles
- **Best moments detection** - Automatically finds interesting shots
- **Rhythm recommendations** - Suggests optimal pacing
- **Timeline integration** - Apply plans with one click

#### Person Identification
Face recognition and character identification system:

- **Automatic face detection** - Finds all faces in video
- **Character identification** - Matches with known profiles
- **Profile management** - Create and edit character cards
- **Appearance statistics** - Analyze screen time per character
- **Timeline integration** - Character markers on clips

### Professional Tools

#### Fairlight Audio
Professional audio mixing suite with comprehensive tools:

- **7-band parametric EQ** - Precise frequency control
- **Effects suite** - Compressor, reverb, AI noise reduction
- **Surround Sound** - Support for Stereo, 5.1, 7.1
- **MIDI integration** - Full MIDI controller support
- **Professional meters** - LUFS, spectrum analyzer, phase correlation

#### Color Grading
Professional color correction at DaVinci Resolve level:

- **Color wheels** - Lift/Gamma/Gain/Offset controls
- **Curves** - RGB and tonal curves with Bézier interpolation
- **HSL adjustments** - Temperature, tint, contrast, saturation
- **LUT support** - Import .cube files
- **Professional scopes** - Waveform, Vectorscope, Histogram

#### Motion Graphics
Keyframe-based animation system:

- **Complete keyframe system** - Animate any parameter
- **Interpolation types** - Linear, Bezier, Ease, Bounce, Elastic
- **Expression engine** - JavaScript for procedural animation
- **Preset library** - Ready-to-use animation effects
- **Visual curve editor** - Fine-tune animations

### Additional Features

#### Multicam Editing
Professional multi-camera project support:

- **Quick switching** - Hotkeys 1-9 for angle changes
- **Synchronization** - By timecode or audio
- **Visual grid** - Preview all cameras simultaneously
- **Manual adjustment** - Offset correction per camera
- **Linked clips** - Automatic timeline synchronization

#### Camera Capture
Record video directly in Timeline Studio:

- **Device selection** - Choose camera and microphone
- **Quality settings** - Resolution and FPS control
- **Screen recording** - Capture screen, window, or browser tab
- **Real-time preview** - Monitor while recording
- **WebM format** - Optimal quality and size

#### Voice Recording
Professional voiceover recording:

- **Microphone selection** - From all available devices
- **Countdown timer** - 0 to 10 seconds before recording
- **Visual indicators** - Signal level and recording time
- **Up to 5 minutes** - Optimal for commentary
- **Auto-save** - Directly to project media library

## 🔧 Common Issues

### FFmpeg Not Found
```bash
# Verify FFmpeg installation
ffmpeg -version

# If not found, reinstall FFmpeg for your platform
```

### Build Failures
- Ensure all prerequisites are installed
- Clear cache: `cargo clean && bun install --force`
- Check Rust version: `rustc --version`

### Performance Issues
- Enable GPU acceleration in Settings
- Use proxy files for 4K footage
- Close other resource-intensive applications

## 📚 Next Steps

- Read the [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- Explore [Features Documentation](../02_REQUIREMENTS/FUNCTIONAL_requirements.md)
- Join our [Discord Community](https://discord.gg/gwJUYxck)
- Check out [Video Tutorials](https://www.youtube.com/@chatman-media)

## 💡 Tips

- Use keyboard shortcuts for faster editing (press `?` to see all)
- Enable auto-save in Settings to prevent data loss
- GPU acceleration significantly improves export speed
- Regular backups of your projects are recommended

---

*Need help? Visit our [troubleshooting guide](../05_DEVELOPMENT/TROUBLESHOOTING.md) or ask in our [community chat](https://t.me/timelinestudio)*