import { AuthService } from "../auth";
import { TokenCollection } from "@jasonatepaint/cognito-sso-client";

export class ClientState {
    /**
     *
     * @param authentication - object that holds authentication tokens {accessToken, identityToken, refreshToken}
     */
    static getCurrentUser(authentication: TokenCollection) {
        if (!authentication || !authentication.accessToken) {
            return;
        }

        return AuthService.getCurrentUser(authentication.idToken);
    }
}
