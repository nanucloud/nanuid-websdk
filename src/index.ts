/**
 * ███╗   ██╗ █████╗ ███╗   ██╗██╗   ██╗██╗██████╗
 * ████╗  ██║██╔══██╗████╗  ██║██║   ██║██║██╔══██╗
 * ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║██║██║  ██║
 * ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║██║██║  ██║
 * ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝██║██████╔╝
 * ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═════╝
 *
 * NanuID OAuth SDK
 * Version: 1.9.4
 * A comprehensive SDK for handling OAuth authentication with NanuID services
 *
 * Provided by NANU Cloud Holdings (나누클라우드서비스) https://nanu.cc
 */

import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

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
  private static readonly AUTH_BASE_URL = "https://auth.nanu.cc";
  private static readonly ACCESS_TOKEN_KEY = "ACCESS";
  private static readonly REFRESH_TOKEN_KEY = "REFRESH";
  private static readonly TOKEN_EXPIRY_BUFFER = 300;
  private static get axiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.AUTH_BASE_URL,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
  }

  private static parseJwt(token: string): { exp: number } | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  static validateToken(token?: string): TokenValidationResult {
    const tokenToValidate = token || Cookies.get(this.ACCESS_TOKEN_KEY);
    if (!tokenToValidate) return { isValid: false, error: "No token provided" };

    const decoded = this.parseJwt(tokenToValidate);
    if (!decoded?.exp) return { isValid: false, error: "Invalid token format" };

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;

    return {
      isValid: timeUntilExpiry > this.TOKEN_EXPIRY_BUFFER,
      expiresIn: timeUntilExpiry,
    };
  }

  static getToken(token?: string): string | undefined {
    return token || Cookies.get(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(
    accessToken: string,
    refreshToken: string,
    days: number = 1
  ): void {
    Cookies.set(this.ACCESS_TOKEN_KEY, accessToken, {
      expires: days,
      path: "/",
    });
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static async reissueToken(refreshToken?: string): Promise<string | null> {
    const tokenToUse = refreshToken || this.getRefreshToken();
    if (!tokenToUse) return null;

    try {
      const response = await this.axiosInstance.post<TokenResponse>(
        "/auth/reissue",
        {
          refreshToken: tokenToUse,
        }
      );

      const { access_token, refresh_token } = response.data;
      if (!refreshToken) {
        this.setTokens(access_token, refresh_token);
      }
      return access_token;
    } catch (error) {
      console.error("Token reissue failed:", error);
      if (!refreshToken) {
        this.logout();
      }
      return null;
    }
  }

  static logout(redirectUrl?: string): void {
    Cookies.remove(this.ACCESS_TOKEN_KEY, { path: "/" });
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  static async createAuthorizedClient(token?: string): Promise<AxiosInstance> {
    const authToken = this.getToken(token);
    return axios.create({
      headers: { Authorization: `Bearer ${authToken}` },
    });
  }
}

export default OAuthSDK;
