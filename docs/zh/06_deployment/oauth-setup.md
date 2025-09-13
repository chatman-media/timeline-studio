# OAuth Setup for Social Networks

This guide describes the process of setting up OAuth authorization for Timeline Studio integration with social platforms.

## 📋 Overview

Timeline Studio supports video export and publishing to the following social networks:
- **YouTube** (via Google OAuth 2.0)
- **TikTok** (via TikTok for Developers API)
- **Vimeo** (via Vimeo Developer API OAuth 2.0)
- **Telegram** (via Telegram Bot API)

## 🎯 YouTube OAuth Setup

### 1. Creating Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 2. OAuth 2.0 Credentials Setup

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select application type: **Web application**
4. Configure parameters:
   - **Name**: Timeline Studio
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/oauth/callback` (for development)
     - `https://yourdomain.com/oauth/callback` (for production)

### 3. OAuth Consent Screen Setup

1. Go to "OAuth consent screen"
2. Select **External** (for testing with real accounts)
3. Fill required fields:
   - **App name**: Timeline Studio
   - **User support email**: your email
   - **Developer contact information**: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`

### 4. Getting Client ID and Client Secret

1. In the "Credentials" section, find your created OAuth 2.0 Client ID
2. Copy **Client ID** and **Client Secret**
3. Add them to `.env.local`:
   ```bash
   NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=your_google_client_secret
   ```

## 🎵 TikTok OAuth Setup

### 1. TikTok for Developers Registration

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Register as a developer
3. Create a new application

### 2. Application Setup

1. In "My Apps" section, create a new application
2. Fill the information:
   - **App name**: Timeline Studio
   - **App description**: Video editing and export tool
   - **Category**: Media & Entertainment
3. Add products:
   - **Login Kit** (for authorization)
   - **Video Kit** (for video upload)

### 3. Redirect URL Setup

1. In application settings, find "Login Kit" section
2. Add Redirect URLs:
   - `http://localhost:3000/oauth/callback`
   - `https://yourdomain.com/oauth/callback` (for production)

### 4. Getting Client Key and Client Secret

1. In "Basic Information" section, find:
   - **Client Key** (analog of Client ID)
   - **Client Secret**
2. Add them to `.env.local`:
   ```bash
   NEXT_PUBLIC_TIKTOK_CLIENT_ID=your_tiktok_client_key
   NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
   ```

## 📺 Vimeo OAuth Setup

### 1. Creating Vimeo Developer App

1. Go to [Vimeo Developer Console](https://developer.vimeo.com/)
2. Sign in to your Vimeo account or create a new one
3. Click "Create App" and fill the form:
   - **App Name**: Timeline Studio
   - **App Description**: Video editing and export application
   - **App Category**: Media & Entertainment

### 2. OAuth 2.0 Setup for Vimeo

1. After creating the application, go to "Authentication" section
2. Find your **Client ID** and **Client Secret**
3. Configure Redirect URIs:
   - `http://localhost:3000/oauth/callback` (for development)
   - `https://yourdomain.com/oauth/callback` (for production)

### 3. Requesting Upload Access

1. In "General Information" section, find "Upload Access"
2. Click "Request Upload Access"
3. Fill the form about your application purpose
4. Wait for approval from Vimeo (may take several days)

### 4. Generating Personal Access Token

1. In "Authentication" section, find "Generate a personal access token"
2. Select required scopes:
   - `public` - access to public videos
   - `private` - access to private videos
   - `edit` - video editing
   - `upload` - video upload
   - `video_files` - access to video files
3. Click "Generate"

### 5. Environment Variables Setup

Add to `.env.local`:
```bash
NEXT_PUBLIC_VIMEO_CLIENT_ID=your_vimeo_client_id
NEXT_PUBLIC_VIMEO_CLIENT_SECRET=your_vimeo_client_secret
NEXT_PUBLIC_VIMEO_ACCESS_TOKEN=your_personal_access_token
```

## 💬 Telegram Bot Setup

### 1. Creating Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Choose a name for your bot (e.g., Timeline Studio Bot)
4. Choose a username (must end with "bot")
5. Save the received **Bot Token**

### 2. Bot Permissions Setup

1. Send `/setcommands` to BotFather
2. Select your bot
3. Configure commands:
   ```
   upload - Upload video
   status - Check upload status
   help - Get help
   ```

### 3. Webhook Setup (optional)

For production, you can set up a webhook:
1. Get SSL certificate for your domain
2. Set webhook URL: `https://yourdomain.com/api/telegram/webhook`
3. Set webhook via API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
   ```

### 4. Getting Chat ID for Channels

For publishing to channels:
1. Add bot to channel as administrator
2. Send any message to the channel
3. Make request: `https://api.telegram.org/bot<token>/getUpdates`
4. Find `chat.id` in response (will be negative for channels)

### 5. Environment Variables for Telegram

Add to `.env.local`:
```bash
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_or_channel
NEXT_PUBLIC_TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
```

## ⚙️ Application Configuration

### 1. Environment Variables

Make sure all necessary variables are specified in `.env.local`:

```bash
# YouTube OAuth
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=your_google_client_secret

# TikTok OAuth  
NEXT_PUBLIC_TIKTOK_CLIENT_ID=your_tiktok_client_key
NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Vimeo OAuth
NEXT_PUBLIC_VIMEO_CLIENT_ID=your_vimeo_client_id
NEXT_PUBLIC_VIMEO_CLIENT_SECRET=your_vimeo_client_secret
NEXT_PUBLIC_VIMEO_ACCESS_TOKEN=your_personal_access_token

# Telegram Bot
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_or_channel
NEXT_PUBLIC_TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# OAuth Redirect URI
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback

# API Environment
NEXT_PUBLIC_API_ENV=development
```

### 2. Configuration Testing

1. Start the application: `bun run dev`
2. Go to Export module
3. Select "Social Networks" tab
4. Try to authorize with YouTube/TikTok/Vimeo
5. Check Telegram Bot functionality in settings

## 🧪 OAuth Testing

### 1. YouTube Testing

1. In export interface, select YouTube
2. Click "Connect to YouTube"
3. Authorize through Google OAuth
4. Check that status shows "Connected"

### 2. TikTok Testing  

1. Select TikTok in interface
2. Click "Connect to TikTok"
3. Authorize through TikTok
4. Check connection

### 3. Vimeo Testing

1. Select Vimeo in export interface
2. Click "Connect to Vimeo"
3. Authorize through Vimeo OAuth
4. Check connection status

### 4. Telegram Testing

1. Send `/start` command to your bot
2. Try sending a test file
3. Check `/upload`, `/status` commands work
4. Ensure bot responds correctly

### 5. Upload Testing

1. Prepare test video (small size)
2. Fill metadata (title, description, tags)
3. Start export to selected platform:
   - **YouTube**: Videos up to 15 minutes (without verification)
   - **TikTok**: Videos up to 60 seconds
   - **Vimeo**: Videos up to 500MB (Basic plan)
   - **Telegram**: Videos up to 50MB
4. Check result on corresponding platform

## 🔒 Security

### Security Recommendations:

1. **Never commit** real Client ID/Secret to Git
2. Use **different applications** for development/production
3. Limit **scopes** to only necessary permissions
4. Regularly **rotate secrets** in production
5. Monitor **API usage** and set limits

### Production Deploy:

1. Create separate OAuth applications for production
2. Update Redirect URIs to production domain
3. Use server environment variables (not NEXT_PUBLIC_)
4. Set up rate limiting and monitoring

## 🚨 Troubleshooting

### Common Issues:

#### 1. "Invalid redirect URI"
- Check exact URI match in OAuth application settings
- Ensure protocol (http/https) matches

#### 2. "Invalid client ID"
- Check environment variables are correct
- Ensure Client ID is copied completely

#### 3. "Insufficient permissions"
- Check scopes settings in OAuth consent screen
- Ensure application is not in "Testing" mode for external users

#### 4. "API quota exceeded"
- YouTube: check limits in Google Cloud Console
- TikTok: check limits in TikTok Developer Portal
- Vimeo: check limits in Vimeo Developer Dashboard

#### 5. "Upload failed" for Vimeo
- Ensure Upload Access is approved
- Check file size (limits depend on account type)
- Check video format (MP4 recommended)

#### 6. "Bot token invalid" for Telegram
- Check Bot Token correctness
- Ensure bot wasn't deleted
- Check bot is added to channel as administrator

### Logs and Debugging:

1. Open Developer Tools → Console
2. Check Network tab for OAuth requests
3. Enable debug mode: `NEXT_PUBLIC_API_ENV=development`

## 📚 Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/)
- [Vimeo API Documentation](https://developer.vimeo.com/api/guides)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Timeline Studio Export Architecture](../01_project_docs/project_structure.md)

## ✅ Checklist

### YouTube
- [ ] Created Google Cloud Project and enabled YouTube Data API v3
- [ ] Set up OAuth 2.0 Credentials for YouTube
- [ ] Tested YouTube authorization

### TikTok
- [ ] Registered application in TikTok for Developers  
- [ ] Got Client ID/Secret for TikTok
- [ ] Tested TikTok authorization

### Vimeo
- [ ] Created application in Vimeo Developer Console
- [ ] Got Upload Access for video upload
- [ ] Generated Personal Access Token with required scopes
- [ ] Tested Vimeo authorization

### Telegram
- [ ] Created Telegram Bot via @BotFather
- [ ] Got Bot Token
- [ ] Set up bot commands
- [ ] Got Chat ID for channels (if needed)
- [ ] Tested sending video via bot

### General Settings
- [ ] Set up Redirect URIs for all OAuth platforms
- [ ] Updated `.env.local` file with real values
- [ ] Tested uploading test video to all platforms
- [ ] Checked API limits for all services