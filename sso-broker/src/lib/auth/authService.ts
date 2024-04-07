import { ApiRequest } from "./apiRequest";
import { ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./consts";
import { getCookie, removeCookie } from "../utils/storage";
import { launchUri } from "../utils/browser";
import { decodeToken, isTokenExpired } from "./utils.ts";
import { Logger } from "../utils/logging";
import { User, TokenCollection } from "@jasonatepaint/cognito-sso-client";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;

export class AuthService {
    static get accessToken() {
        return getCookie(ACCESS_TOKEN_KEY);
    }

    /**
     * Checks the authentication of the user and initiates the refresh/code-flow process for client portals
     */
    static async checkAuthenticationState(params: any, defaultUri: string) {
        const { error } = params;
        const result = {
            cachedAuth: false,
            forceLogout: false,
            redirectPath: undefined,
            error: undefined,
        };

        // Case 1 - We have an error. Stop all processing and return the error
        if (error) {
            return {
                ...result,
                error,
            };
        }

        // Case 2 - User has valid credentials and can initiate the client code-flow
        const { accessToken, idToken, refreshToken } = await AuthService.getTokens(true);
        if (accessToken && idToken && refreshToken) {
            // handle cached login from client app - begin code flow
            if (params.redirectUri) {
                await AuthService.authorizeClient(params);
            } else {
                // force back to a default client app
                window.location.href = defaultUri;
            }
            return {
                ...result,
                cachedAuth: true,
            };
        }
    }

    static async getTokens(refreshIfRequired = false) {
        let accessToken = getCookie(ACCESS_TOKEN_KEY);
        let idToken = getCookie(ID_TOKEN_KEY);
        const refreshToken = getCookie(REFRESH_TOKEN_KEY);
        if (refreshIfRequired && isTokenExpired(accessToken) && refreshToken) {
            try {
                const tokens = await AuthService.tokenRefresh();
                if (tokens) {
                    accessToken = tokens.accessToken;
                    idToken = tokens.idToken;
                }
            } catch (e) {
                Logger.log("Failed to refresh tokens", e);
            }
        }
        return <TokenCollection>{ accessToken, idToken, refreshToken };
    }

    /**
     * Determines if the token is expired
     */
    static tokenExpired() {
        const accessToken = getCookie(ACCESS_TOKEN_KEY);
        return isTokenExpired(accessToken);
    }

    /**
     * Attempts to refresh the user's tokens, based on their refreshToken
     */
    static async tokenRefresh() {
        let tokens: TokenCollection | undefined = undefined;
        try {
            const refreshToken = getCookie(REFRESH_TOKEN_KEY);
            if (refreshToken) {
                const ret = <any>await ApiRequest.post(`/auth/token/refresh`, { clientId: CLIENT_ID, refreshToken });
                if (ret.success && ret.authentication) {
                    tokens = {
                        accessToken: ret.authentication.accessToken,
                        idToken: ret.authentication.idToken,
                        refreshToken: ret.authentication.refreshToken ?? refreshToken,
                    };
                }
            }
        } finally {
            if (!tokens) {
                AuthService.logout();
            }
        }
        return tokens;
    }

    /***
     * Returns the current user based on the authenticated user's credentials within cookies.
     * If we have an explicit accessToken passed in, we will attach that to the authorization header;
     * this allows our client portals to access this method. Clients won't have access to the unified
     * site's cookies
     */
    static getCurrentUser(idToken: string = getCookie(ID_TOKEN_KEY)): User | undefined {
        const token = <any>decodeToken(idToken);
        if (!token) return;
        return <User>{
            email: token.email,
            name: token.name,
        };
    }

    static async login(username: string, password: string) {
        const { success, result, error } = await ApiRequest.post(`/auth/login`, {
            clientId: CLIENT_ID,
            username,
            password,
        });
        return {
            success,
            result,
            error,
        };
    }

    static async authorizeClient(params: any) {
        const { clientId, redirectUri, state, codeChallenge } = params;

        const searchParams = new URLSearchParams({
            clientId,
            redirectUri,
            ...(codeChallenge ? { codeChallenge } : {}),
            ...(state ? { state } : {}),
        });
        return launchUri(`/auth/client/authorize?${searchParams.toString()}`);
    }

    /**
     * @param clientId
     * @param redirectUri
     * @param code
     * @param codeVerifier
     */
    static async getTokensForClient(clientId: string, redirectUri: string, code: string, codeVerifier?: string) {
        return await ApiRequest.post(`/auth/client/token`, {
            grantType: "authorization_code",
            clientId,
            redirectUri,
            code,
            ...(codeVerifier ? { codeVerifier } : {}),
        });
    }

    static async refreshTokensForClient(clientId: string, refreshToken: string) {
        return await ApiRequest.post(`/auth/client/token`, {
            grantType: "refresh_token",
            clientId,
            refreshToken,
        });
    }

    static logout() {
        removeCookie(ID_TOKEN_KEY);
        removeCookie(ACCESS_TOKEN_KEY);
        removeCookie(REFRESH_TOKEN_KEY);
    }
}
