# Security Module Architecture

## Overview

Timeline Studio's security module ensures protection of sensitive user data, such as API keys and access tokens. The module uses modern cryptographic algorithms and integrates with system password stores.

## Module Components

### 1. SecureStorage (`secure_storage.rs`)

Primary component for secure data storage.

#### Functionality:
- **Data Encryption**: AES-256-GCM for symmetric encryption
- **Key Management**: Argon2 for key derivation from passwords
- **System Integration**: 
  - macOS: Keychain Services
  - Windows: Credential Manager
  - Linux: Secret Service API

#### Storage Architecture:
```rust
pub struct SecureStorage {
    app_handle: AppHandle,
    keyring: Keyring,
    salt: [u8; 32],
}
```

#### Encryption Process:
1. Generate random salt (32 bytes)
2. Derive key from master password via Argon2
3. Encrypt data with AES-256-GCM
4. Save to system keystore

### 2. API Validator (`api_validator.rs`, `api_validator_service.rs`)

Validation of external API service keys.

#### Supported Services:
- OpenAI (GPT-3.5, GPT-4)
- Anthropic (Claude)
- Google AI (Gemini)
- Replicate
- Hugging Face

#### Validation Architecture:
```rust
#[async_trait]
pub trait ApiValidatorService: Service {
    async fn validate_api_key(&self, service: &str, key: &str) -> Result<bool>;
    async fn validate_all_keys(&self, keys: HashMap<String, String>) -> Result<HashMap<String, bool>>;
}
```

#### Features:
- Asynchronous validation with timeouts
- Result caching
- Graceful degradation when services unavailable

### 3. OAuth Handler (`oauth_handler.rs`)

Handles OAuth authorization for social media platforms.

#### Supported Platforms:
- YouTube (Google OAuth 2.0)
- Instagram (Facebook OAuth)
- TikTok

#### Authorization Process:
1. Generate authorization URL with PKCE
2. Open browser for authorization
3. Intercept callback via deep link
4. Exchange code for tokens
5. Securely save tokens

### 4. Environment Importer (`env_importer.rs`)

Import existing keys from environment files.

#### Functionality:
- Search for .env files in project
- Parse various variable formats
- Validate found keys
- Secure migration to SecureStorage

#### Supported Formats:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

## Security

### Cryptographic Primitives

1. **AES-256-GCM**
   - Symmetric encryption
   - Authenticated encryption
   - Protection against data modification

2. **Argon2id**
   - Timing attack resistance
   - Configurable memory/time parameters
   - Protection against GPU/ASIC attacks

3. **CSPRNG**
   - Cryptographically secure random number generation
   - Used for salts and nonces

### Memory Protection

- Clear sensitive data after use
- Use `zeroize` for secure zeroing
- Minimize decrypted data retention time

### Audit and Logging

- Log operations without revealing data
- Track access attempts
- Monitor anomalous activity

## Application Integration

### Tauri Commands

```rust
#[tauri::command]
async fn store_api_key(
    storage: State<'_, Mutex<SecureStorage>>,
    service: String,
    api_key: String,
) -> Result<(), String>

#[tauri::command]
async fn validate_api_key(
    validator: State<'_, ApiValidatorService>,
    service: String,
    key: String,
) -> Result<bool, String>
```

### Security Events

- `security:key-stored` - Key saved
- `security:key-validated` - Key validated
- `security:oauth-complete` - OAuth authorization complete

## Best Practices

1. **Never log keys**
2. **Use minimal privileges**
3. **Regularly rotate keys**
4. **Validate keys before saving**
5. **Use system password stores**

## Testing

The module includes comprehensive tests:

- Unit tests for cryptographic functions
- Integration tests for system stores
- Mock tests for API validation
- E2E tests for OAuth flow

## Future Improvements

1. **Hardware Security Modules (HSM) support**
2. **Biometric authentication**
3. **Distributed key storage**
4. **Automatic key rotation**
5. **Additional OAuth provider support**