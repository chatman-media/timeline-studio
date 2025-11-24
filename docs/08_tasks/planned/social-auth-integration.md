# Интеграция аутентификации через социальные сети

## 📋 Информация
- **ID**: TASK-USER-002
- **Тип**: feature
- **Приоритет**: высокий
- **Оценка**: 4-5 недель
- **Веха**: v1.0

## 📝 Описание

Реализация полноценной системы аутентификации через популярные социальные сети и сервисы для Timeline Studio. Расширение базовой OAuth интеграции из системы API ключей до полноценной системы входа и регистрации.

## 🎯 Цели

1. **Универсальный вход** - один клик для входа через любимый сервис
2. **Безопасность** - OAuth 2.0 / OpenID Connect стандарты
3. **Синхронизация профиля** - автоматический импорт данных из соцсетей
4. **Множественные аккаунты** - связывание нескольких соцсетей с одним профилем
5. **Бесшовная интеграция** - автоматическое получение разрешений для публикации

## ✅ Критерии готовности

- [ ] Реализована OAuth 2.0 инфраструктура
- [ ] Интегрированы минимум 6 провайдеров
- [ ] Создан единый UI для входа
- [ ] Реализовано связывание аккаунтов
- [ ] Автоматический импорт профиля
- [ ] Безопасное хранение токенов
- [ ] Обработка всех edge cases (отзыв доступа, истечение токенов)
- [ ] Тесты написаны и проходят
- [ ] Документация обновлена
- [ ] Code review пройден

## 🔧 Техническая информация

### Поддерживаемые провайдеры

```typescript
enum AuthProvider {
  GOOGLE = 'google',
  YOUTUBE = 'youtube',      // Через Google OAuth с YouTube scope
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',  // Через Facebook OAuth
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  VIMEO = 'vimeo',
  TWITCH = 'twitch',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',    // Telegram Login Widget
  APPLE = 'apple',         // Sign in with Apple
  MICROSOFT = 'microsoft'
}

interface OAuthConfig {
  provider: AuthProvider
  clientId: string
  clientSecret?: string    // Не для всех провайдеров
  redirectUri: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
}
```

### Архитектура аутентификации

```typescript
// OAuth State Machine
const authMachine = createMachine({
  id: 'auth',
  initial: 'idle',
  
  context: {
    provider: null,
    authWindow: null,
    tokens: null,
    profile: null,
    error: null
  },
  
  states: {
    idle: {
      on: {
        SIGN_IN: 'authenticating'
      }
    },
    
    authenticating: {
      entry: 'openAuthWindow',
      
      on: {
        AUTH_SUCCESS: {
          target: 'exchangingToken',
          actions: 'saveAuthCode'
        },
        AUTH_ERROR: {
          target: 'error',
          actions: 'setError'
        },
        AUTH_CANCELLED: 'idle'
      }
    },
    
    exchangingToken: {
      invoke: {
        src: 'exchangeCodeForToken',
        onDone: {
          target: 'fetchingProfile',
          actions: 'saveTokens'
        },
        onError: 'error'
      }
    },
    
    fetchingProfile: {
      invoke: {
        src: 'fetchUserProfile',
        onDone: {
          target: 'authenticated',
          actions: 'saveProfile'
        },
        onError: 'error'
      }
    },
    
    authenticated: {
      entry: 'notifySuccess',
      
      on: {
        LINK_ACCOUNT: 'linkingAccount',
        REFRESH_TOKEN: 'refreshingToken',
        SIGN_OUT: 'signingOut'
      }
    },
    
    linkingAccount: {
      // Процесс связывания дополнительного аккаунта
    },
    
    refreshingToken: {
      invoke: {
        src: 'refreshAccessToken',
        onDone: 'authenticated',
        onError: 'error'
      }
    },
    
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  }
})
```

### Backend OAuth Handler (Rust)

```rust
// src-tauri/src/auth/oauth.rs
use oauth2::{
    AuthorizationCode, AuthUrl, ClientId, ClientSecret, CsrfToken,
    PkceCodeChallenge, RedirectUrl, Scope, TokenUrl,
};

pub struct OAuthService {
    providers: HashMap<String, OAuthProvider>,
}

impl OAuthService {
    pub async fn start_auth_flow(
        &self,
        provider: &str,
        scopes: Vec<String>
    ) -> Result<AuthFlowResponse> {
        let oauth_provider = self.providers.get(provider)
            .ok_or(Error::ProviderNotFound)?;
        
        // PKCE для дополнительной безопасности
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        
        let (auth_url, csrf_token) = oauth_provider.client
            .authorize_url(CsrfToken::new_random)
            .add_scopes(scopes.into_iter().map(Scope::new))
            .set_pkce_challenge(pkce_challenge)
            .url();
        
        // Сохраняем verifier и CSRF token для последующей проверки
        self.store_auth_state(AuthState {
            provider: provider.to_string(),
            csrf_token,
            pkce_verifier,
            timestamp: Utc::now(),
        }).await?;
        
        Ok(AuthFlowResponse {
            auth_url: auth_url.to_string(),
            state: csrf_token.secret().clone(),
        })
    }
    
    pub async fn handle_callback(
        &self,
        code: String,
        state: String
    ) -> Result<TokenResponse> {
        // Проверяем CSRF token
        let auth_state = self.get_auth_state(&state).await?;
        
        // Обмениваем код на токены
        let token_response = oauth_provider.client
            .exchange_code(AuthorizationCode::new(code))
            .set_pkce_verifier(auth_state.pkce_verifier)
            .request_async(async_http_client)
            .await?;
        
        // Сохраняем токены безопасно
        self.store_tokens(SecureTokens {
            provider: auth_state.provider,
            access_token: token_response.access_token().secret().clone(),
            refresh_token: token_response.refresh_token().map(|t| t.secret().clone()),
            expires_at: calculate_expiry(token_response.expires_in()),
            scopes: token_response.scopes().clone(),
        }).await?;
        
        Ok(token_response)
    }
}

// Безопасное хранение токенов
#[derive(Serialize, Deserialize)]
struct SecureTokens {
    provider: String,
    access_token: String,
    refresh_token: Option<String>,
    expires_at: DateTime<Utc>,
    scopes: Vec<String>,
}

impl SecureTokens {
    // Шифрование токенов перед сохранением
    pub fn encrypt(&self, key: &[u8]) -> Result<Vec<u8>> {
        let cipher = Aes256Gcm::new(key.into());
        let nonce = Nonce::from_slice(b"unique nonce");
        
        let plaintext = serde_json::to_vec(self)?;
        cipher.encrypt(nonce, plaintext.as_ref())
            .map_err(|e| Error::Encryption(e.to_string()))
    }
}
```

### Frontend компоненты

```tsx
// Универсальный компонент входа
const SocialAuthModal: React.FC = () => {
  const { signIn, linkAccount, providers } = useSocialAuth()
  const [loading, setLoading] = useState<AuthProvider | null>(null)
  
  return (
    <Modal title="Войти в Timeline Studio">
      <div className="social-auth-grid">
        {/* Основные провайдеры */}
        <div className="primary-providers">
          <SocialButton
            provider="google"
            icon={<GoogleIcon />}
            label="Войти через Google"
            onClick={() => signIn('google')}
            loading={loading === 'google'}
          />
          
          <SocialButton
            provider="apple"
            icon={<AppleIcon />}
            label="Войти через Apple"
            onClick={() => signIn('apple')}
            loading={loading === 'apple'}
            variant="dark"
          />
        </div>
        
        {/* Социальные сети для создателей контента */}
        <div className="content-providers">
          <h3>Для создателей контента</h3>
          
          <SocialButton
            provider="youtube"
            icon={<YouTubeIcon />}
            label="YouTube"
            onClick={() => signIn('youtube')}
            compact
          />
          
          <SocialButton
            provider="tiktok"
            icon={<TikTokIcon />}
            label="TikTok"
            onClick={() => signIn('tiktok')}
            compact
          />
          
          <SocialButton
            provider="instagram"
            icon={<InstagramIcon />}
            label="Instagram"
            onClick={() => signIn('instagram')}
            compact
          />
          
          <SocialButton
            provider="twitch"
            icon={<TwitchIcon />}
            label="Twitch"
            onClick={() => signIn('twitch')}
            compact
          />
        </div>
        
        {/* Дополнительные опции */}
        <div className="other-options">
          <Button variant="ghost" onClick={useLocalAccount}>
            Продолжить без входа
          </Button>
        </div>
      </div>
      
      {/* Преимущества входа */}
      <div className="auth-benefits">
        <h4>Преимущества входа:</h4>
        <ul>
          <li>☁️ Синхронизация проектов между устройствами</li>
          <li>📤 Прямая публикация в социальные сети</li>
          <li>🎨 Импорт медиа из ваших аккаунтов</li>
          <li>👥 Совместная работа над проектами</li>
        </ul>
      </div>
    </Modal>
  )
}

// Компонент связанных аккаунтов в профиле
const LinkedAccountsSection: React.FC = () => {
  const { user, linkedAccounts, linkAccount, unlinkAccount } = useUser()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Связанные аккаунты</CardTitle>
        <CardDescription>
          Подключите социальные сети для быстрой публикации
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="linked-accounts-list">
          {SUPPORTED_PROVIDERS.map(provider => {
            const linked = linkedAccounts.find(a => a.provider === provider)
            
            return (
              <LinkedAccountItem
                key={provider}
                provider={provider}
                linked={linked}
                onLink={() => linkAccount(provider)}
                onUnlink={() => unlinkAccount(provider)}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Обработка токенов и автообновление

```typescript
import { createLogger } from '@/lib/tauri-logger'
const logger = createLogger('SocialAuthIntegration')

// Token Manager Service
class TokenManager {
  private refreshTimers = new Map<string, NodeJS.Timeout>()
  
  async getValidToken(provider: AuthProvider): Promise<string> {
    const tokens = await this.loadTokens(provider)
    
    // Проверяем срок действия
    if (this.isTokenExpired(tokens)) {
      return await this.refreshToken(provider, tokens)
    }
    
    return tokens.accessToken
  }
  
  private setupAutoRefresh(provider: AuthProvider, tokens: SecureTokens) {
    // Очищаем существующий таймер
    const existingTimer = this.refreshTimers.get(provider)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // Обновляем за 5 минут до истечения
    const refreshIn = tokens.expiresAt.getTime() - Date.now() - 5 * 60 * 1000
    
    if (refreshIn > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.refreshToken(provider, tokens)
        } catch (error) {
          logger.errorSync(`Failed to refresh token for ${provider}:`, error)
          // Уведомляем пользователя о необходимости повторной авторизации
          this.notifyReauthRequired(provider)
        }
      }, refreshIn)
      
      this.refreshTimers.set(provider, timer)
    }
  }
  
  private async refreshToken(
    provider: AuthProvider,
    tokens: SecureTokens
  ): Promise<string> {
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await invoke('refresh_oauth_token', {
      provider,
      refreshToken: tokens.refreshToken
    })
    
    const newTokens = {
      ...tokens,
      accessToken: response.accessToken,
      expiresAt: new Date(Date.now() + response.expiresIn * 1000)
    }
    
    await this.saveTokens(provider, newTokens)
    this.setupAutoRefresh(provider, newTokens)
    
    return newTokens.accessToken
  }
}
```

### Интеграция с публикацией

```typescript
// Автоматическое использование токенов для публикации
class SocialPublisher {
  constructor(
    private tokenManager: TokenManager,
    private publishers: Map<AuthProvider, PublisherService>
  ) {}
  
  async publish(
    video: ExportedVideo,
    platforms: PublishTarget[]
  ): Promise<PublishResult[]> {
    const results = await Promise.allSettled(
      platforms.map(async (target) => {
        // Получаем актуальный токен
        const token = await this.tokenManager.getValidToken(target.provider)
        
        // Используем специфичный для платформы публикатор
        const publisher = this.publishers.get(target.provider)
        if (!publisher) {
          throw new Error(`Publisher not found for ${target.provider}`)
        }
        
        return await publisher.publish({
          video,
          token,
          options: target.options
        })
      })
    )
    
    return results.map((result, index) => ({
      platform: platforms[index].provider,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}
```

### Обработка edge cases

```typescript
// Обработчик различных сценариев
class AuthErrorHandler {
  handle(error: AuthError): AuthRecoveryAction {
    switch (error.type) {
      case 'TOKEN_EXPIRED':
        return { action: 'REFRESH_TOKEN' }
        
      case 'REFRESH_TOKEN_EXPIRED':
        return { action: 'REAUTH_REQUIRED' }
        
      case 'PERMISSIONS_REVOKED':
        return { action: 'REQUEST_PERMISSIONS' }
        
      case 'ACCOUNT_SUSPENDED':
        return { action: 'SHOW_ERROR', message: 'Аккаунт заблокирован' }
        
      case 'RATE_LIMIT':
        return { action: 'RETRY_LATER', retryAfter: error.retryAfter }
        
      case 'NETWORK_ERROR':
        return { action: 'RETRY_NOW' }
        
      default:
        return { action: 'SHOW_ERROR', message: error.message }
    }
  }
}
```

### Затрагиваемые модули
- `src/features/auth/` - новый модуль для аутентификации
- `src/features/user-settings/` - интеграция с профилем пользователя
- `src/features/export/` - добавление прямой публикации
- `src-tauri/src/auth/` - backend для OAuth
- `src-tauri/src/security/` - безопасное хранение токенов

### Зависимости
- [TASK-USER-001](user-identity-system.md) - Система идентификации пользователя
- [API Keys Management](../completed/api-keys-management.md) - Расширение существующей OAuth базы
- OAuth2 библиотеки для Rust и TypeScript
- Crypto библиотеки для безопасного хранения

## 🧪 Тестирование

### Тест-кейсы
1. **Успешная аутентификация**:
   - Шаги: Выбрать провайдера → Авторизоваться → Вернуться в приложение
   - Ожидаемый результат: Пользователь авторизован, профиль загружен

2. **Отмена аутентификации**:
   - Шаги: Начать вход → Закрыть окно браузера
   - Ожидаемый результат: Возврат к экрану входа без ошибок

3. **Истечение токена**:
   - Шаги: Подождать истечения токена → Выполнить действие
   - Ожидаемый результат: Автоматическое обновление токена

4. **Связывание аккаунтов**:
   - Шаги: Войти через Google → Связать YouTube
   - Ожидаемый результат: Оба аккаунта связаны с профилем

### Регрессионное тестирование
- Проверить работу существующих API ключей
- Убедиться в корректной работе локальных пользователей
- Проверить миграцию от ручных API ключей к OAuth

## 📊 Прогресс

- [x] Анализ требований
- [x] Дизайн решения
- [ ] OAuth инфраструктура
- [ ] Интеграция провайдеров
- [ ] UI компоненты
- [ ] Token management
- [ ] Публикация через OAuth
- [ ] Edge cases обработка
- [ ] Тестирование
- [ ] Документация
- [ ] Review
- [ ] Merge

## 💬 Обсуждение

Ключевые решения:
- Использование PKCE для дополнительной безопасности
- Хранение refresh токенов в зашифрованном виде
- Автоматическое обновление токенов в фоне
- Graceful degradation при проблемах с аутентификацией

## 🔗 Ссылки

- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OpenID Connect](https://openid.net/connect/)
- [Platform-specific OAuth docs](https://developers.google.com/identity/protocols/oauth2)