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
import { AxiosInstance } from "axios";
interface TokenValidationResult {
    isValid: boolean;
    expiresIn?: number;
    error?: string;
}
export declare class OAuthSDK {
    private static readonly AUTH_BASE_URL;
    private static readonly ACCESS_TOKEN_KEY;
    private static readonly REFRESH_TOKEN_KEY;
    private static readonly TOKEN_EXPIRY_BUFFER;
    private static get axiosInstance();
    private static parseJwt;
    static validateToken(token?: string): TokenValidationResult;
    static getToken(token?: string): string | undefined;
    static getRefreshToken(): string | null;
    static setTokens(accessToken: string, refreshToken: string, days?: number): void;
    static reissueToken(refreshToken?: string): Promise<string | null>;
    static logout(redirectUrl?: string): void;
    static createAuthorizedClient(token?: string): Promise<AxiosInstance>;
}
export default OAuthSDK;
