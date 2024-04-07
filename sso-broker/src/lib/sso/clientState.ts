import { AuthService } from "../auth";
import { TokenCollection, User } from "@jasonatepaint/cognito-sso-client";

export class ClientState {
    /**
     *
     * @param authentication - object that holds authentication tokens {accessToken, identityToken, refreshToken}
     */
    static async getCurrentUser(authentication: TokenCollection) {
        if (!authentication || !authentication.accessToken) {
            return;
        }

        let currentUser = AuthService.getCurrentUser(authentication.idToken);

        return <User>(<unknown>currentUser);
    }
}
