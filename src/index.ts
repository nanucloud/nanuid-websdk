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

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
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

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export class OAuthSDK {
  private static readonly AUTH_BASE_URL = "https://auth.nanu.cc";
  private static readonly ACCESS_TOKEN_KEY = "ACCESS";
  private static readonly REFRESH_TOKEN_KEY = "REFRESH";
  private static readonly TOKEN_EXPIRY_BUFFER = 300;
  private static isRefreshing = false;
  private static refreshSubscribers: Array<(token: string) => void> = [];

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
    days: number = 3650
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

  static async createAuthorizedClient(baseURL?: string, token?: string): Promise<AxiosInstance> {
    const authToken = this.getToken(token);
    const instance = axios.create({
      baseURL,
      headers: { 
        "Content-Type": "application/json",
        Authorization: authToken ? `Bearer ${authToken}` : undefined 
      },
    });

    this.setupInterceptors(instance);
    return instance;
  }

  private static onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private static addRefreshSubscriber(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  private static setupInterceptors(instance: AxiosInstance): void {
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig;
        const status = error.response?.status;

        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        if ((status === 401 || status === 403) && originalRequest) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            return new Promise<AxiosResponse>((resolve) => {
              this.addRefreshSubscriber((token: string) => {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(instance(originalRequest));
              });
            });
          }

          this.isRefreshing = true;

          try {
            const newToken = await this.reissueToken();
            
            if (!newToken) {
              this.logout();
              return Promise.reject(error);
            }

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            this.onTokenRefreshed(newToken);
            
            return instance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export default OAuthSDK;
