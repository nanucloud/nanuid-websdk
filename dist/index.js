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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import Cookies from "js-cookie";
export class OAuthSDK {
    static get axiosInstance() {
        return axios.create({
            baseURL: this.AUTH_BASE_URL,
            timeout: 10000,
            headers: { "Content-Type": "application/json" },
        });
    }
    static parseJwt(token) {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""));
            return JSON.parse(jsonPayload);
        }
        catch (_a) {
            return null;
        }
    }
    static validateToken(token) {
        const tokenToValidate = token || Cookies.get(this.ACCESS_TOKEN_KEY);
        if (!tokenToValidate)
            return { isValid: false, error: "No token provided" };
        const decoded = this.parseJwt(tokenToValidate);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.exp))
            return { isValid: false, error: "Invalid token format" };
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - currentTime;
        return {
            isValid: timeUntilExpiry > this.TOKEN_EXPIRY_BUFFER,
            expiresIn: timeUntilExpiry,
        };
    }
    static getToken(token) {
        return token || Cookies.get(this.ACCESS_TOKEN_KEY);
    }
    static getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    static setTokens(accessToken, refreshToken, days = 1) {
        Cookies.set(this.ACCESS_TOKEN_KEY, accessToken, {
            expires: days,
            path: "/",
        });
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    static reissueToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenToUse = refreshToken || this.getRefreshToken();
            if (!tokenToUse)
                return null;
            try {
                const response = yield this.axiosInstance.post("/auth/reissue", {
                    refreshToken: tokenToUse,
                });
                const { access_token, refresh_token } = response.data;
                if (!refreshToken) {
                    this.setTokens(access_token, refresh_token);
                }
                return access_token;
            }
            catch (error) {
                console.error("Token reissue failed:", error);
                if (!refreshToken) {
                    this.logout();
                }
                return null;
            }
        });
    }
    static logout(redirectUrl) {
        Cookies.remove(this.ACCESS_TOKEN_KEY, { path: "/" });
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    }
    static createAuthorizedClient(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const authToken = this.getToken(token);
            return axios.create({
                headers: { Authorization: `Bearer ${authToken}` },
            });
        });
    }
}
OAuthSDK.AUTH_BASE_URL = "https://auth.nanu.cc";
OAuthSDK.ACCESS_TOKEN_KEY = "ACCESS";
OAuthSDK.REFRESH_TOKEN_KEY = "REFRESH";
OAuthSDK.TOKEN_EXPIRY_BUFFER = 300;
export default OAuthSDK;
