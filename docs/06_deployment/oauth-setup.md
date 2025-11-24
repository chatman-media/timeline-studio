# Настройка OAuth для социальных сетей

Данное руководство описывает процесс настройки OAuth авторизации для интеграции Timeline Studio с социальными платформами.

## 📋 Обзор

Timeline Studio поддерживает экспорт и публикацию видео в следующие социальные сети:
- **YouTube** (через Google OAuth 2.0)
- **TikTok** (через TikTok for Developers API)
- **Vimeo** (через Vimeo Developer API OAuth 2.0)
- **Telegram** (через Telegram Bot API)

## 🎯 YouTube OAuth Setup

### 1. Создание Google Cloud Project

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **YouTube Data API v3**:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "YouTube Data API v3"
   - Нажмите "Enable"

### 2. Настройка OAuth 2.0 Credentials

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth 2.0 Client ID"
3. Выберите тип приложения: **Web application**
4. Настройте параметры:
   - **Name**: Timeline Studio
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/oauth/callback` (для разработки)
     - `https://yourdomain.com/oauth/callback` (для продакшена)

### 3. Настройка OAuth Consent Screen

1. Перейдите в "OAuth consent screen"
2. Выберите **External** (для тестирования с реальными аккаунтами)
3. Заполните обязательные поля:
   - **App name**: Timeline Studio
   - **User support email**: ваш email
   - **Developer contact information**: ваш email
4. Добавьте scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`

### 4. Получение Client ID и Client Secret

1. В разделе "Credentials" найдите созданный OAuth 2.0 Client ID
2. Скопируйте **Client ID** и **Client Secret**
3. Добавьте их в `.env.local`:
   ```bash
   NEXT_PUBLIC_YOUTUBE_CLIENT_ID=ваш_google_client_id
   NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=ваш_google_client_secret
   ```

## 🎵 TikTok OAuth Setup

### 1. Регистрация в TikTok for Developers

1. Перейдите на [TikTok for Developers](https://developers.tiktok.com/)
2. Зарегистрируйтесь как разработчик
3. Создайте новое приложение

### 2. Настройка приложения

1. В разделе "My Apps" создайте новое приложение
2. Заполните информацию:
   - **App name**: Timeline Studio
   - **App description**: Video editing and export tool
   - **Category**: Media & Entertainment
3. Добавьте продукты:
   - **Login Kit** (для авторизации)
   - **Video Kit** (для загрузки видео)

### 3. Настройка Redirect URL

1. В настройках приложения найдите раздел "Login Kit"
2. Добавьте Redirect URLs:
   - `http://localhost:3000/oauth/callback`
   - `https://yourdomain.com/oauth/callback` (для продакшена)

### 4. Получение Client Key и Client Secret

1. В разделе "Basic Information" найдите:
   - **Client Key** (аналог Client ID)
   - **Client Secret**
2. Добавьте их в `.env.local`:
   ```bash
   NEXT_PUBLIC_TIKTOK_CLIENT_ID=ваш_tiktok_client_key
   NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=ваш_tiktok_client_secret
   ```

## 📺 Vimeo OAuth Setup

### 1. Создание Vimeo Developer App

1. Перейдите на [Vimeo Developer Console](https://developer.vimeo.com/)
2. Войдите в свой Vimeo аккаунт или создайте новый
3. Нажмите "Create App" и заполните форму:
   - **App Name**: Timeline Studio
   - **App Description**: Video editing and export application
   - **App Category**: Media & Entertainment

### 2. Настройка OAuth 2.0 для Vimeo

1. После создания приложения перейдите в раздел "Authentication"
2. Найдите свои **Client ID** и **Client Secret**
3. Настройте Redirect URIs:
   - `http://localhost:3000/oauth/callback` (для разработки)
   - `https://yourdomain.com/oauth/callback` (для продакшена)

### 3. Запрос Upload Access

1. В разделе "General Information" найдите "Upload Access"
2. Нажмите "Request Upload Access"
3. Заполните форму о назначении вашего приложения
4. Дождитесь одобрения от Vimeo (может занять несколько дней)

### 4. Генерация Personal Access Token

1. В разделе "Authentication" найдите "Generate a personal access token"
2. Выберите необходимые scopes:
   - `public` - доступ к публичным видео
   - `private` - доступ к приватным видео
   - `edit` - редактирование видео
   - `upload` - загрузка видео
   - `video_files` - доступ к файлам видео
3. Нажмите "Generate"

### 5. Настройка Environment Variables

Добавьте в `.env.local`:
```bash
NEXT_PUBLIC_VIMEO_CLIENT_ID=ваш_vimeo_client_id
NEXT_PUBLIC_VIMEO_CLIENT_SECRET=ваш_vimeo_client_secret
NEXT_PUBLIC_VIMEO_ACCESS_TOKEN=ваш_personal_access_token
```

## 💬 Telegram Bot Setup

### 1. Создание Telegram Bot

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Выберите имя для бота (например: Timeline Studio Bot)
4. Выберите username (должен заканчиваться на "bot")
5. Сохраните полученный **Bot Token**

### 2. Настройка Bot Permissions

1. Отправьте `/setcommands` BotFather
2. Выберите вашего бота
3. Настройте команды:
   ```
   upload - Загрузить видео
   status - Проверить статус загрузки
   help - Получить помощь
   ```

### 3. Настройка Webhook (опционально)

Для продакшена можно настроить webhook:
1. Получите SSL сертификат для вашего домена
2. Настройте webhook URL: `https://yourdomain.com/api/telegram/webhook`
3. Установите webhook через API:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
   ```

### 4. Получение Chat ID для каналов

Для публикации в каналы:
1. Добавьте бота в канал как администратора
2. Отправьте любое сообщение в канал
3. Сделайте запрос: `https://api.telegram.org/bot<token>/getUpdates`
4. Найдите `chat.id` в ответе (будет отрицательным для каналов)

### 5. Environment Variables для Telegram

Добавьте в `.env.local`:
```bash
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=ваш_bot_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=ваш_chat_id_или_канала
NEXT_PUBLIC_TELEGRAM_WEBHOOK_SECRET=ваш_webhook_secret
```

## ⚙️ Конфигурация приложения

### 1. Environment Variables

Убедитесь, что в файле `.env.local` указаны все необходимые переменные:

```bash
# YouTube OAuth
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=ваш_google_client_id
NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=ваш_google_client_secret

# TikTok OAuth  
NEXT_PUBLIC_TIKTOK_CLIENT_ID=ваш_tiktok_client_key
NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=ваш_tiktok_client_secret

# Vimeo OAuth
NEXT_PUBLIC_VIMEO_CLIENT_ID=ваш_vimeo_client_id
NEXT_PUBLIC_VIMEO_CLIENT_SECRET=ваш_vimeo_client_secret
NEXT_PUBLIC_VIMEO_ACCESS_TOKEN=ваш_personal_access_token

# Telegram Bot
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=ваш_bot_token
NEXT_PUBLIC_TELEGRAM_CHAT_ID=ваш_chat_id_или_канала
NEXT_PUBLIC_TELEGRAM_WEBHOOK_SECRET=ваш_webhook_secret

# OAuth Redirect URI
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback

# API Environment
NEXT_PUBLIC_API_ENV=development
```

### 2. Проверка конфигурации

1. Запустите приложение: `bun run dev`
2. Перейдите в модуль Export
3. Выберите вкладку "Social Networks"
4. Попробуйте авторизоваться в YouTube/TikTok/Vimeo
5. Проверьте работу Telegram Bot в настройках

## 🧪 Тестирование OAuth

### 1. YouTube тестирование

1. В интерфейсе экспорта выберите YouTube
2. Нажмите "Connect to YouTube"
3. Авторизуйтесь через Google OAuth
4. Проверьте, что статус показывает "Connected"

### 2. TikTok тестирование  

1. Выберите TikTok в интерфейсе
2. Нажмите "Connect to TikTok"
3. Авторизуйтесь через TikTok
4. Проверьте подключение

### 3. Vimeo тестирование

1. Выберите Vimeo в интерфейсе экспорта
2. Нажмите "Connect to Vimeo"
3. Авторизуйтесь через Vimeo OAuth
4. Проверьте статус подключения

### 4. Telegram тестирование

1. Отправьте команду `/start` вашему боту
2. Попробуйте отправить тестовый файл
3. Проверьте работу команд `/upload`, `/status`
4. Убедитесь что бот отвечает корректно

### 5. Тестирование загрузки

1. Подготовьте тестовое видео (небольшого размера)
2. Заполните метаданные (название, описание, теги)
3. Запустите экспорт в выбранную платформу:
   - **YouTube**: Видео до 15 минут (без верификации)
   - **TikTok**: Видео до 60 секунд
   - **Vimeo**: Видео до 500MB (Basic план)
   - **Telegram**: Видео до 50MB
4. Проверьте результат на соответствующей платформе

## 🔒 Безопасность

### Рекомендации по безопасности:

1. **Никогда не коммитьте** реальные Client ID/Secret в Git
2. Используйте **разные приложения** для development/production
3. Ограничивайте **scopes** только необходимыми разрешениями
4. Регулярно **ротируйте secrets** в продакшене
5. Мониторьте **API usage** и устанавливайте лимиты

### Production Deploy:

1. Создайте отдельные OAuth приложения для продакшена
2. Обновите Redirect URIs на продакшен домен
3. Используйте переменные окружения сервера (не NEXT_PUBLIC_)
4. Настройте rate limiting и мониторинг

## 🚨 Troubleshooting

### Частые проблемы:

#### 1. "Invalid redirect URI"
- Проверьте точное соответствие URI в настройках OAuth приложения
- Убедитесь что протокол (http/https) совпадает

#### 2. "Invalid client ID"
- Проверьте правильность переменных окружения
- Убедитесь что Client ID скопирован полностью

#### 3. "Insufficient permissions"
- Проверьте настройки scopes в OAuth consent screen
- Убедитесь что приложение не в "Testing" режиме для внешних пользователей

#### 4. "API quota exceeded"
- YouTube: проверьте лимиты в Google Cloud Console
- TikTok: проверьте лимиты в TikTok Developer Portal
- Vimeo: проверьте лимиты в Vimeo Developer Dashboard

#### 5. "Upload failed" для Vimeo
- Убедитесь что Upload Access одобрен
- Проверьте размер файла (лимиты зависят от типа аккаунта)
- Проверьте формат видео (рекомендуется MP4)

#### 6. "Bot token invalid" для Telegram
- Проверьте корректность Bot Token
- Убедитесь что бот не был удален
- Проверьте что бот добавлен в канал как администратор

### Логи и отладка:

1. Откройте Developer Tools → Console
2. Проверьте Network вкладку для OAuth запросов
3. Включите debug режим: `NEXT_PUBLIC_API_ENV=development`

## 📚 Дополнительные ресурсы

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/)
- [Vimeo API Documentation](https://developer.vimeo.com/api/guides)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Timeline Studio Export Architecture](../01-getting-started/project-structure.md)

## ✅ Checklist

### YouTube
- [ ] Создано Google Cloud Project и включен YouTube Data API v3
- [ ] Настроены OAuth 2.0 Credentials для YouTube
- [ ] Протестирована авторизация для YouTube

### TikTok
- [ ] Зарегистрировано приложение в TikTok for Developers  
- [ ] Получены Client ID/Secret для TikTok
- [ ] Протестирована авторизация для TikTok

### Vimeo
- [ ] Создано приложение в Vimeo Developer Console
- [ ] Получен Upload Access для загрузки видео
- [ ] Сгенерирован Personal Access Token с необходимыми scopes
- [ ] Протестирована авторизация для Vimeo

### Telegram
- [ ] Создан Telegram Bot через @BotFather
- [ ] Получен Bot Token
- [ ] Настроены команды бота
- [ ] Получен Chat ID для каналов (если нужен)
- [ ] Протестирована отправка видео через бота

### Общие настройки
- [ ] Настроены Redirect URIs для всех OAuth платформ
- [ ] Обновлен файл `.env.local` с реальными значениями
- [ ] Протестирована загрузка тестового видео на все платформы
- [ ] Проверены лимиты API для всех сервисов