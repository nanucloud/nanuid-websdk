# NanuID OAuth SDK

NanuID OAuth SDK는 간편하고 빠르게 OAuth 인증을 구현할 수 있도록 지원하는 라이브러리입니다.  
NanuID OAuth SDK is a library designed to facilitate quick and easy OAuth authentication implementation.

## ⚡️ 특징 (Features)

- JWT 토큰 검증 및 자동 갱신  
  JWT token validation and automatic refresh
- 쿠키 및 수동 토큰 관리 지원  
  Cookie-based and manual token management
- TypeScript 완벽 지원  
  Full TypeScript support
- Axios를 활용한 인증된 HTTP 클라이언트 제공  
  Provides an authorized HTTP client using Axios

---

## 🛠️ 설치 (Installation)

```bash
npm install nanuid-websdk
```

---

## ⚖️ 사용 방법 (Usage)

### 🔒 토큰 검증 (Token Validation)
```typescript
// 쿠키에 저장된 토큰 검증
// Validate token from cookie
const result = OAuthSDK.validateToken();

// 특정 토큰 검증
// Validate specific token
const result = OAuthSDK.validateToken('your-token');
```

### 🛠️ 토큰 관리 (Token Management)
```typescript
// 저장된 액세스 토큰 가져오기
// Get stored access token
const token = OAuthSDK.getToken();
const token = OAuthSDK.getToken('manual-token');

// 토큰 갱신 (Refresh)
// Reissue access token
const newToken = await OAuthSDK.reissueToken();
const newToken = await OAuthSDK.reissueToken('refresh-token');

// 토큰 설정
// Set access and refresh tokens
OAuthSDK.setTokens(accessToken, refreshToken);

// 로그아웃 (토큰 삭제 및 리디렉션 가능)
// Logout and optionally redirect
OAuthSDK.logout();
OAuthSDK.logout('/login');
```

### 🛡️ HTTP 클라이언트 (Authorized HTTP Client)
```typescript
// 인증된 Axios 클라이언트 생성
// Create authorized Axios client
const client = await OAuthSDK.createAuthorizedClient();
const client = await OAuthSDK.createAuthorizedClient('manual-token');
```

---

## 📘 API 레퍼런스 (API Reference)

### `validateToken(token?: string): TokenValidationResult`
- JWT 토큰의 유효성을 검사합니다. (형식 및 만료 여부 확인)  
  Validates JWT token format and expiration.
- 토큰이 제공되지 않으면 쿠키에서 자동으로 가져옵니다.  
  Uses cookie token if none is provided.

### `getToken(token?: string): string | undefined`
- 특정 토큰을 반환합니다. 토큰이 제공되지 않으면 쿠키에서 가져옵니다.  
  Returns the provided token or retrieves it from cookies if none is given.

### `reissueToken(refreshToken?: string): Promise<string | null>`
- 저장된 리프레시 토큰을 사용하여 새 액세스 토큰을 발급합니다.  
  Issues a new access token using the stored refresh token.
- 리프레시 토큰이 명시적으로 제공되지 않으면 저장된 값을 사용합니다.  
  Uses stored refresh token if none is provided.

### `setTokens(accessToken: string, refreshToken: string, days: number = 1): void`
- 액세스 토큰을 쿠키에, 리프레시 토큰을 localStorage에 저장합니다.  
  Stores the access token in cookies and the refresh token in localStorage.
- 기본적으로 1일 동안 유지됩니다.  
  Defaults to 1-day storage.

### `logout(redirectUrl?: string): void`
- 저장된 모든 인증 토큰을 제거합니다.  
  Clears stored authentication tokens.
- `redirectUrl`이 제공되면 해당 URL로 리디렉션됩니다.  
  Redirects to the specified URL if provided.

### `createAuthorizedClient(token?: string): Promise<AxiosInstance>`
- `Authorization` 헤더가 자동으로 추가된 Axios 인스턴스를 생성합니다.  
  Creates an Axios instance with an `Authorization` header.
- 토큰이 제공되지 않으면 쿠키에서 가져온 값을 사용합니다.  
  Uses the cookie token if none is provided.

---

## 🔖 타입 정의 (Types)

```typescript
interface TokenValidationResult {
  isValid: boolean;
  expiresIn?: number;
  error?: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}
```
