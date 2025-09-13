# Timeline Studio Alpha Testing Guide

*Version: 0.60.0-alpha | Date: August 3, 2025*

## 🎯 Welcome, Tester!

Thank you for participating in Timeline Studio alpha testing! Your help is critical to creating a quality product.

## 🖥️ Installation and Setup

### Windows 10/11

#### 1. System Requirements
- **OS**: Windows 10 version 1809+ or Windows 11
- **RAM**: minimum 8GB, recommended 16GB
- **Disk Space**: 10GB free space
- **Processor**: 4 cores, 2.5GHz+
- **GPU**: DirectX 11 compatible (optional for acceleration)

#### 2. Installing Timeline Studio
```powershell
# 1. Download installer from GitHub Releases
# https://github.com/chatman-media/timeline-studio/releases/tag/v0.60.0-alpha

# 2. Run installer (Timeline-Studio-Setup-0.60.0.exe)
# 3. Follow installer instructions
# 4. Application will be installed to C:\Program Files\Timeline Studio
```

#### 3. Installing Ollama (for AI features)
```powershell
# Download Ollama installer
# https://ollama.ai/download/windows

# After installation, open PowerShell and run:
ollama pull llama3.2

# Verify Ollama is working:
ollama list
```

#### 4. First Launch
1. Launch Timeline Studio from Start Menu
2. Select interface language on first launch
3. Verify Ollama connection (should be automatic)
4. Create a test project

### macOS 12+

#### 1. System Requirements
- **OS**: macOS 12 Monterey or newer
- **RAM**: minimum 8GB, recommended 16GB  
- **Disk Space**: 10GB free space
- **Processor**: Apple Silicon (M1/M2/M3) or Intel
- **GPU**: Metal compatible (built-in)

#### 2. Installing Timeline Studio
```bash
# 1. Download DMG file from GitHub Releases
# https://github.com/chatman-media/timeline-studio/releases/tag/v0.60.0-alpha

# 2. Open Timeline-Studio-0.60.0.dmg
# 3. Drag to Applications folder
# 4. On first launch: right-click → Open (to bypass Gatekeeper)
```

#### 3. Installing Ollama
```bash
# Via Homebrew
brew install ollama

# Start Ollama server
ollama serve

# In new terminal, download model
ollama pull llama3.2

# Verify installation
ollama list
```

#### 4. First Launch
1. Open Timeline Studio from Launchpad or Applications
2. Allow camera/microphone access if prompted
3. Select interface language
4. Create a test project

## 📋 Test Scenarios

### Scenario 1: Basic Video Editing
**Goal**: Test core editing functionality

1. **Media Import**
   - [ ] Create new project
   - [ ] Import 3-5 video files (different formats: MP4, MOV, AVI)
   - [ ] Check preview in media browser
   - [ ] Drag files to timeline

2. **Editing**
   - [ ] Trim clips
   - [ ] Rearrange clips
   - [ ] Add transition between clips
   - [ ] Apply effect to clip

3. **Export**
   - [ ] Export to MP4 (1080p)
   - [ ] Check result quality
   - [ ] Ensure audio is synced

**Expected Result**: All operations complete without crashes, export successful

### Scenario 2: AI Video Analysis with Ollama
**Goal**: Test local AI integration

1. **Preparation**
   - [ ] Ensure Ollama is running (`ollama serve`)
   - [ ] Verify model is available (`ollama list`)
   - [ ] Load video with people talking

2. **Content Analysis**
   - [ ] Open AI Content Intelligence
   - [ ] Select video for analysis
   - [ ] Run "Scene Analysis"
   - [ ] Wait for results (may take 1-3 minutes)

3. **Results**
   - [ ] Check scene detection
   - [ ] Check key moments
   - [ ] Export results to JSON
   - [ ] Save report

**Expected Result**: AI successfully analyzes video and generates metadata

### Scenario 3: Subtitle Generation
**Goal**: Test automatic subtitle generation

1. **Preparation**
   - [ ] Load video with clear speech (Russian/English)
   - [ ] Duration 2-5 minutes

2. **Generation**
   - [ ] Select "Generate Subtitles" from AI menu
   - [ ] Select language
   - [ ] Start process
   - [ ] Wait for completion

3. **Review and Export**
   - [ ] Review subtitles on timeline
   - [ ] Fix errors if any
   - [ ] Export to SRT format
   - [ ] Check timings

**Expected Result**: Subtitles generated with acceptable accuracy

### Scenario 4: Performance Stress Test
**Goal**: Test stability under load

1. **Large Project**
   - [ ] Import 20+ video files
   - [ ] Create timeline with 50+ clips
   - [ ] Add effects to 10+ clips
   - [ ] Work for 30+ minutes without restart

2. **Monitoring**
   - [ ] Monitor RAM usage
   - [ ] Check CPU temperature
   - [ ] Time operations
   - [ ] Note any freezes

**Expected Result**: Application remains stable

## 🐛 What to Look For (Common Issues)

### Critical Bugs
- ❌ Application crashes
- ❌ Project data loss
- ❌ Unable to export
- ❌ Freezes longer than 30 seconds

### Important Bugs
- ⚠️ Audio/video desync
- ⚠️ Rendering artifacts
- ⚠️ Effects not working properly
- ⚠️ Ollama connection issues

### Minor Bugs
- 📝 UI glitches and artifacts
- 📝 Translation inaccuracies
- 📝 Slow performance
- 📝 UX inconveniences

## 📊 How to Collect Information

### Application Logs

#### Windows
```powershell
# Logs located at:
%APPDATA%\timeline-studio\logs\

# Copy latest log:
copy "%APPDATA%\timeline-studio\logs\*.log" Desktop\
```

#### macOS
```bash
# Logs located at:
~/Library/Application Support/timeline-studio/logs/

# Copy latest log:
cp ~/Library/Application\ Support/timeline-studio/logs/*.log ~/Desktop/
```

### System Information
Always include in reports:
- Exact OS version
- RAM amount
- Processor model
- Discrete GPU presence
- Ollama version and model

### Screenshots and Videos
- Use built-in OS tools for screenshots
- For video recording: OBS Studio or built-in tools
- Highlight problem areas in screenshots

## 💬 Where to Send Reports

### GitHub Issues (Preferred)
1. Go to https://github.com/chatman-media/timeline-studio/issues
2. Click "New Issue"
3. Select "Bug Report" template
4. Fill all fields
5. Attach logs and screenshots

### Email
If no GitHub account:
- Email: ak.chatman.media@gmail.com
- Subject: "Alpha Test Report - [brief description]"
- Attach logs and screenshots

### Report Format
```
=== BUG REPORT ===

DESCRIPTION:
[What happened]

STEPS TO REPRODUCE:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED:
[What should have happened]

ACTUAL:
[What actually happened]

SYSTEM:
- OS: [Windows 11 Pro 23H2]
- RAM: [16GB]
- CPU: [Intel i7-12700K]
- GPU: [NVIDIA RTX 3060]
- Ollama: [v0.1.45, model llama3.2]

ATTACHMENTS:
- Logs (attached)
- Screenshots (attached)
- Video (link)
```

## 🎁 Rewards

### For Active Testing Participation
- Mention in application credits
- Early access to beta version
- Priority technical support
- Ability to influence product development

### For Critical Bugs
- Monetary reward (discussed individually)
- Special "Bug Hunter" badge
- Lifetime Pro license (upon release)

## ❓ FAQ

**Q: Ollama won't connect, what to do?**
A: Check that Ollama is running (`ollama serve`), restart Timeline Studio.

**Q: Application lags with large files?**
A: This is a known alpha issue. Try reducing preview resolution in settings.

**Q: Can I use other AI models?**
A: Yes! Try `ollama pull gemma2:2b` for a faster model.

**Q: Export stuck at 99%?**
A: Wait, finalization can take time. If more than 10 minutes - it's a bug.

**Q: Where to get test videos?**
A: You can use your own videos or download samples from Pexels/Pixabay.

## 📞 Contacts

**Alexander Kireev** - Lead Developer
- Email: ak.chatman.media@gmail.com
- Telegram: @[to be added]
- GitHub: @chatman-media

**Response Time**: Usually within 24-48 hours

---

*Thank you for helping make Timeline Studio better! 🚀*