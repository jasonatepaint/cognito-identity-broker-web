import {
    Action,
    ResponseMessage,
    TokenCollection,
    AuthenticationActionDetails,
    LogoutActionDetails,
    RedeemCodeActionDetails,
} from "@jasonatepaint/cognito-sso-client";
import { AuthService } from "../auth";
import { isNullOrEmpty } from "../utils/strings";
import { Logger } from "../utils/logging";

/**
 * Processes authentication messages
 */
export const processMessage = async (message: MessageEvent<Action>) => {
    if (!validateMessage(message)) {
        return;
    }

    const { action, details, clientId } = <Action>message.data;
    const {
        id,
        authentication,
        redirectUnauthenticated,
        redirectUri,
        clientState = "",
    } = <AuthenticationActionDetails>details;
    if (action) {
        Logger.debug("processMessage", message.data);
    }

    let response: ResponseMessage;
    switch (action) {
        case "initialize":
            response = processInitialize();
            break;
        case "authenticate":
            response = await processAuthentication(authentication, clientId);
            break;
        case "logout":
            const { clientOnlyLogout } = <LogoutActionDetails>details;
            response = processLogout(clientOnlyLogout);
            break;
        case "redeemCode":
            const { code, redirectUri, codeVerifier } = <RedeemCodeActionDetails>details;
            response = await processRedeemCode(clientId, redirectUri || "", code, codeVerifier);
            break;
        case "refreshTokens":
            response = await processRefreshTokens(clientId, (authentication || {}).refreshToken);
            break;
        default:
            return;
    }

    if (response) {
        response.details = {
            ...response.details,
            clientState, //encoded ClientState
            id,
        };
        Logger.debug("processMessage", response);
        window.parent.postMessage(response, "*");
    }

    if (redirectUnauthenticated && response?.details?.isAuthenticated === false && !isNullOrEmpty(redirectUri)) {
        redirectToLoginPage(id, clientState);
    }
};

const processInitialize = () => {
    return <ResponseMessage>{
        response: "initialized",
        details: {
            success: true,
            isAuthenticated: false,
        },
    };
};

const processAuthentication = async (
    authentication: TokenCollection,
    clientId: string,
): Promise<ResponseMessage> => {
    Logger.debug("processCheckAuthentication", clientId);
    const msg = <ResponseMessage>{
        response: "authenticate",
    };
    try {
        const verifiedTokens = await AuthService.verifyTokens(authentication, clientId);
        const isAuthenticated = !isNullOrEmpty(verifiedTokens?.accessToken);
        const user = AuthService.getCurrentUser(verifiedTokens?.idToken);
        msg.details = {
            isAuthenticated,
            authentication: verifiedTokens,
            user,
            success: true,
        };
    } catch (err: any) {
        AuthService.logout();
        return createFailedResponseDetails(msg, err.message);
    }
    return msg;
};

/**
 * Process 'logout' commands:
 * @param clientOnlyLogout - Determines if the user is logged out of both the SSO and the client portal, or just the portal.
 */
const processLogout = (clientOnlyLogout: boolean) => {
    Logger.debug("processLogout");
    if (!clientOnlyLogout) {
        AuthService.logout();
    }
    return <ResponseMessage>{
        response: "logout",
        details: {
            isAuthenticated: false,
            success: true,
        },
    };
};

/**
 * Redeems a auth code for auth tokens
 * @param clientId - the client type for the portal
 * @param redirectUri - a registered uri for the client
 * @param code
 * @param codeVerifier - the original codeVerifier (PKCE key) used for the code challenge=
 */
const processRedeemCode = async (clientId: string, redirectUri: string, code: string, codeVerifier?: string) => {
    Logger.debug("processRedeemCode", code);
    const msg = <ResponseMessage>{
        response: "redeemCode",
    };
    try {
        const { error, data } = await AuthService.getTokensForClient(clientId, redirectUri, code, codeVerifier);
        if (error) {
            return createFailedResponseDetails(msg, error);
        }
        const { authentication } = data;
        const user = AuthService.getCurrentUser(authentication.idToken);
        msg.details = {
            success: true,
            isAuthenticated: true,
            authentication,
            user,
        };
    } catch (error: any) {
        return createFailedResponseDetails(msg, error.message);
    }
    return msg;
};

/**
 * Refreshes and returns tokens if necessary otherwise
 * @param clientId - the client type for the portal
 * @param refreshToken - The JWT Refresh token
 */
const processRefreshTokens = async (clientId: string, refreshToken: string) => {
    const msg = <ResponseMessage>{
        response: "refreshTokens",
    };
    try {
        const { data, error } = await AuthService.refreshTokensForClient(clientId, refreshToken);
        if (data && (!data.success || !data.authentication)) {
            return createFailedResponseDetails(msg, "Missing Authentication");
        }
        if (error) {
            return createFailedResponseDetails(msg, error);
        }

        const authentication = <TokenCollection>{
            ...data.authentication,
            refreshToken,
        };
        const user = AuthService.getCurrentUser(authentication.idToken);
        msg.details = {
            isAuthenticated: authentication?.accessToken !== undefined,
            authentication,
            user,
            success: authentication?.accessToken !== undefined,
        };
    } catch (error: any) {
        return createFailedResponseDetails(msg, error.message);
    }
    return msg;
};

/**
 * Method that tells the client to redirect to login page
 */
const redirectToLoginPage = (id: string, clientState: string) => {
    const responseMessage = {
        response: "redirectToLogin",
        details: {
            id,
            isAuthenticated: false,
            clientState,
            success: true,
        },
    };
    Logger.debug("redirectToLoginPage", responseMessage);
    window.parent.postMessage(responseMessage, "*");
};

/**
 * Validates that the message is a valid action message
 */
const validateMessage = (message: MessageEvent<Action>) => {
    return !(
        typeof message?.data !== "object" ||
        !message.data.action ||
        (message?.origin === window.location.origin && message.source === window)
    );
};

const createFailedResponseDetails = (msg: ResponseMessage, error: string) => {
    msg.details = {
        isAuthenticated: false,
        success: false,
        error,
    };
    return msg;
};
