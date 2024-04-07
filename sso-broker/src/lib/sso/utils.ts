import { AuthService, isTokenExpired } from "../auth";
import { TokenCollection } from "@jasonatepaint/cognito-sso-client";

/**
 * Checks to see if tokens are expired and returns refreshed tokens
 * @param authentication - current tokens to check in the form { accessToken:...,  idToken:..., refreshToken:... }
 * @param clientId - the client type for the portal
 * @returns refreshed tokens in the form { accessToken:...,  idToken:..., refreshToken:... }
 */
export const verifyTokens = async (authentication: TokenCollection, clientId: string) => {
    const tokenExpired = isTokenExpired(authentication.accessToken);
    const missingIdToken = !authentication.idToken;
    if ((tokenExpired || missingIdToken) && authentication?.refreshToken) {
        try {
            const { data } = await AuthService.refreshTokensForClient(clientId, authentication.refreshToken);
            if (data) {
                return {
                    ...data.authentication,
                    refreshToken: authentication.refreshToken,
                };
            }
        } catch (e) {
            throw new Error("Unable to refresh tokens");
        }
    }
    return authentication;
};
