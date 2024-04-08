import { processMessage } from "../../../src/lib/sso/messageHandler";
import { AuthService } from "../../../src/lib/auth";
import { getQueryStringParams } from "../../../src/lib/utils/http";
import { defaultAuthentication, defaultUser } from "../../data";
import { Mock } from "vitest";
import { Action, ResponseMessage } from "@jasonatepaint/cognito-sso-client";

vi.mock("../../../src/lib/auth/authService");
vi.mock("../../../src/lib/utils/http");
vi.mock("../../../src/lib/utils/browser");
vi.mock("../../../src/lib/sso/clientState");

const mockTokenExpired = AuthService.tokenExpired as Mock;
const mockGetCurrentUser = AuthService.getCurrentUser as Mock;
const mockVerifyTokens = AuthService.verifyTokens as Mock;
const mockGetTokensForClient = AuthService.getTokensForClient as Mock;
const mockRefreshTokensForClient = AuthService.refreshTokensForClient as Mock;
const mockGetQueryStringParams = getQueryStringParams as Mock;

const clientId = "123456";
const authentication = defaultAuthentication();
const state = "some-state";
const id = "message-id";

const postMessage = vi.fn();
const user = defaultUser();
const redirectUri = "https://redirect.uri";
const clientState = "eyJyZWZlcnJlciI6IiJ9"; // encoded { referrer: '' }

let message: any;
let windowSpy: any;

beforeEach(() => {
    // mock window
    windowSpy = vi.spyOn(global, "window", "get");
    windowSpy.mockImplementation(() => ({
        location: { origin: "window origin" },
        parent: {
            postMessage,
            location: {
                href: "https://start.url.com",
            },
        },
    }));

    // mock auth service
    mockTokenExpired.mockReturnValue(false);
    mockGetCurrentUser.mockReturnValue(user);

    // mock getQueryStringParams
    mockGetQueryStringParams.mockImplementation(() => {
        return { redirectUri, state };
    });

    mockVerifyTokens.mockReturnValue(authentication);

    // create command message
    message = {
        data: <Action>{
            clientId,
            details: {
                id,
                authentication,
                redirectUnauthenticated: true,
                redirectUri,
                clientState,
            },
        },
        origin,
        source: "not the window",
    };
});

afterEach(() => {
    vi.resetAllMocks();
});

describe("Process Message", () => {
    test("not a valid message", async () => {
        await processMessage(<any>undefined);
        await processMessage(<any>{});
        await processMessage(<any>{ data: {} });

        message.origin = "https://other.origin.com";
        await processMessage(message);

        expect(postMessage).toHaveBeenCalledTimes(0);
    });

    test("not a valid command", async () => {
        message.data.action = "invalid-command";
        await processMessage(message);
        expect(postMessage).toHaveBeenCalledTimes(0);
    });

    test("empty command", async () => {
        message.data.action = "";
        await processMessage(message);
        expect(postMessage).toHaveBeenCalledTimes(0);
    });

    test("clientState is put on response", async () => {
        message.data.action = "authenticate";
        await processMessage(message);
        const action = postMessage.mock.calls[0][0];
        expect(action.details.clientState).toEqual(clientState);
    });

    test("logout and redirect to login", async () => {
        message.data.details.redirectUnauthenticated = true;
        message.data.action = "logout";
        await processMessage(message);
        expect(postMessage).toHaveBeenCalledTimes(2);
        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "logout",
                details: {
                    id,
                    isAuthenticated: false,
                    success: true,
                    clientState,
                },
            },
            "*",
        );
        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "redirectToLogin",
                details: {
                    id,
                    isAuthenticated: false,
                    clientState,
                    success: true,
                },
            },
            "*",
        );
    });

    test("redirectToLogin action not called", async () => {
        message.data.details.redirectUnauthenticated = false;
        message.data.action = "logout";
        await processMessage(message);
        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(postMessage).not.toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "redirectToLogin",
                details: {
                    success: true,
                },
            },
            "*",
        );
    });
});

describe("Initialize", () => {
    beforeEach(function () {
        message.data.action = "initialize";
    });

    test("returns client portals", async () => {
        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "initialized",
                details: {
                    id,
                    success: true,
                    isAuthenticated: false,
                    clientState,
                },
            },
            "*",
        );
    });
});

describe("Authenticate", () => {
    beforeEach(function () {
        message.data.action = "authenticate";
    });

    test("authenticated and responding", async () => {
        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "authenticate",
                details: {
                    id,
                    isAuthenticated: true,
                    authentication: message.data.details.authentication,
                    user,
                    clientState,
                    success: true,
                },
            },
            "*",
        );

        expect(AuthService.verifyTokens).toHaveBeenCalledWith(authentication, clientId);
        expect(AuthService.getCurrentUser).toHaveBeenCalledWith(authentication.idToken);
        expect(AuthService.logout).toHaveBeenCalledTimes(0);
    });

    test("not authenticated", async () => {
        mockVerifyTokens.mockResolvedValue(undefined);
        mockGetCurrentUser.mockReturnValue(undefined);

        message.data.details.redirectUnauthenticated = false;
        await processMessage(message);

        // assert
        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "authenticate",
                details: {
                    id,
                    isAuthenticated: false,
                    authentication: undefined,
                    clientState,
                    success: true,
                },
            },
            "*",
        );

        expect(AuthService.verifyTokens).toHaveBeenCalledWith(authentication, clientId);
        expect(AuthService.getCurrentUser).toHaveBeenCalledWith(undefined);
        expect(AuthService.logout).toHaveBeenCalledTimes(0);
    });

    test("handles exceptions", async () => {
        const error = new Error("some error");
        mockVerifyTokens.mockRejectedValue(error);

        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "authenticate",
                details: {
                    id,
                    isAuthenticated: false,
                    success: false,
                    clientState,
                    error: error.message,
                },
            },
            "*",
        );

        expect(AuthService.verifyTokens).toHaveBeenCalledWith(authentication, clientId);
        expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(0);
        expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });
});

describe("Logout", () => {
    beforeEach(function () {
        message.data.action = "logout";
        message.data.details.clientOnlyLogout = false;
    });

    it("as expected", async () => {
        await processMessage(message);

        // assert
        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "logout",
                details: {
                    id,
                    isAuthenticated: false,
                    clientState,
                    success: true,
                },
            },
            "*",
        );
        expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });

    it("client only logout", async () => {
        message.data.details.clientOnlyLogout = true;
        await processMessage(message);

        // assert
        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "logout",
                details: {
                    id,
                    isAuthenticated: false,
                    clientState,
                    success: true,
                },
            },
            "*",
        );
        expect(AuthService.logout).toHaveBeenCalledTimes(0);
    });
});

describe("Redeem Code", () => {
    const code = "1234";
    const codeVerifier = "wequwyretqwf";
    let apiResult: any;

    beforeEach(function () {
        message.data.action = "redeemCode";
        message.data.details = {
            ...message.data.details,
            code,
            codeVerifier,
            redirectUri,
            clientState,
        };

        apiResult = {
            data: {
                success: true,
                result: "logged_in",
                authentication,
            },
        };
        mockGetTokensForClient.mockResolvedValue(apiResult);
    });

    test("as expected", async () => {
        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "redeemCode",
                details: {
                    id,
                    isAuthenticated: true,
                    authentication,
                    user,
                    clientState,
                    success: true,
                },
            },
            "*",
        );

        expect(AuthService.getTokensForClient).toHaveBeenCalledWith(clientId, redirectUri, code, codeVerifier);
        expect(AuthService.getCurrentUser).toHaveBeenCalledWith(authentication.idToken);
    });

    test("handles exception", async () => {
        const error = new Error("some error");
        mockGetTokensForClient.mockRejectedValue(error);

        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "redeemCode",
                details: {
                    id,
                    isAuthenticated: false,
                    success: false,
                    error: error.message,
                    clientState,
                },
            },
            "*",
        );

        expect(AuthService.getTokensForClient).toHaveBeenCalledWith(clientId, redirectUri, code, codeVerifier);
        expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(0);
    });
});

describe("Refresh Tokens", () => {
    let refreshToken: string;
    const newTokens = {
        accessToken: "newAccessToken",
        idToken: "newIdToken",
    };
    beforeEach(function () {
        refreshToken = authentication.refreshToken;
        message.data.action = "refreshTokens";
        message.data.details.refreshToken = refreshToken;
        mockRefreshTokensForClient.mockResolvedValue({
            data: { success: true, authentication: newTokens },
        });
    });

    test("as expected", async () => {
        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "refreshTokens",
                details: {
                    id,
                    isAuthenticated: true,
                    authentication: {
                        ...newTokens,
                        refreshToken,
                    },
                    user,
                    clientState,
                    success: true,
                },
            },
            "*",
        );

        expect(AuthService.refreshTokensForClient).toHaveBeenCalledWith(clientId, refreshToken);
        expect(AuthService.getCurrentUser).toHaveBeenCalledWith(newTokens.idToken);
    });

    test("not authenticated", async () => {
        mockRefreshTokensForClient.mockResolvedValue({
            data: { success: false },
        });
        mockGetCurrentUser.mockResolvedValue(undefined);

        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "refreshTokens",
                details: {
                    id,
                    isAuthenticated: false,
                    clientState,
                    success: false,
                    error: "Missing Authentication",
                },
            },
            "*",
        );

        expect(AuthService.refreshTokensForClient).toHaveBeenCalledWith(clientId, refreshToken);
        expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(0);
    });

    test("handles exception", async () => {
        const error = new Error("some error");
        mockRefreshTokensForClient.mockRejectedValue(error);

        await processMessage(message);

        expect(postMessage).toHaveBeenCalledWith(
            <ResponseMessage>{
                response: "refreshTokens",
                details: {
                    id,
                    isAuthenticated: false,
                    success: false,
                    clientState,
                    error: error.message,
                },
            },
            "*",
        );

        expect(AuthService.refreshTokensForClient).toHaveBeenCalledWith(clientId, refreshToken);
        expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(0);
    });
});
