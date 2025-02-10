import { AxiosInstance } from "axios";

declare module "nanuid-websdk" {
  interface TokenResponse {
    access_token: string;
    refresh_token: string;
  }

  interface TokenValidationResult {
    isValid: boolean;
    expiresIn?: number;
    error?: string;
  }

  export class OAuthSDK {
    static validateToken(token?: string): TokenValidationResult;
    static getToken(token?: string): string | undefined;
    static getRefreshToken(): string | null;
    static setTokens(
      accessToken: string,
      refreshToken: string,
      days?: number
    ): void;
    static reissueToken(refreshToken?: string): Promise<string | null>;
    static logout(redirectUrl?: string): void;
    static createAuthorizedClient(token?: string): Promise<AxiosInstance>;
  }
}
