import { AuthService } from "../../../src/lib/auth";
import { ApiRequest } from "../../../src/lib/auth/apiRequest";
import { ACCESS_TOKEN_KEY, ID_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../../../src/lib/auth/consts";
import {
    getLocalStorage,
    getCookie,
    removeCookie,
    removeFromLocalStorage,
    setLocalStorage,
    setLocalStorageWithExpiration,
} from "../../../src/lib/utils/storage";
import { isTokenExpired, decodeToken } from "../../../src/lib/utils/tokens";
import { launchUri } from "../../../src/lib/utils/browser";
import { defaultAuthentication } from "../../data";
import { Mock } from "vitest";
import { User } from "@jasonatepaint/cognito-sso-client";

vi.mock("../../../src/lib/auth/apiRequest");
vi.mock("../../../src/lib/utils/storage");
vi.mock("../../../src/lib/utils/browser");
vi.mock("../../../src/lib/utils/tokens");

const mockGetLocalStorage = getLocalStorage as Mock;
const mockSetLocalStorageWithExpiration = setLocalStorageWithExpiration as Mock;
const mockSetLocalStorage = setLocalStorage as Mock;
const mockRemoveFromLocalStorage = removeFromLocalStorage as Mock;
const mockGetCookie = getCookie as Mock;
const mockIsTokenExpired = isTokenExpired as Mock;
const mockApiRequestPost = ApiRequest.post as Mock;
const mockDecodeToken = decodeToken as Mock;
const mockLaunchUri = launchUri as Mock;

const defaultUri = "https://default.clientapp.com";
const authentication = defaultAuthentication();
const authResult = {
    success: true,
    result: "logged_in",
    data: {
        authentication,
    },
};

let clientId: string, redirectUri: string;

beforeEach(function () {
    vi.clearAllMocks();
    clientId = import.meta.env.VITE_CLIENT_ID;
    redirectUri = "https://client.com";

    mockIsTokenExpired.mockReturnValue(false);
    mockSetLocalStorageWithExpiration.mockReturnValue({});
    mockSetLocalStorage.mockReturnValue({});
    mockRemoveFromLocalStorage.mockReturnValue({});

    mockGetCookie.mockImplementation((key) => {
        switch (key) {
            case ACCESS_TOKEN_KEY:
                return authentication.accessToken;
            case ID_TOKEN_KEY:
                return authentication.idToken;
            case REFRESH_TOKEN_KEY:
                return authentication.refreshToken;
            default:
                return "";
        }
    });

    const searchParams = new URLSearchParams({
        clientType: clientId,
        redirectUri,
    });
    window.location.pathname = "/path/to/destination";
    window.location.search = `?${searchParams.toString()}`;
    Object.defineProperty(window, "location", {
        configurable: true,
        value: {
            ...window.location,
            reload: vi.fn(),
        },
    });
});

test("Access Token", async () => {
    expect(AuthService.accessToken).toEqual(authentication.accessToken);
});

describe("Check Authentication State", () => {
    const logoutSpy = vi.spyOn(AuthService, "logout");
    const getTokensSpy = vi.spyOn(AuthService, "getTokens");
    const authorizeClientSpy = vi.spyOn(AuthService, "authorizeClient");
    let params: any;
    beforeEach(function () {
        params = {};
        mockLaunchUri.mockClear();
        logoutSpy.mockClear();
    });

    test("has error", async () => {
        params.error = "some-error";
        const result = await AuthService.checkAuthenticationState(params, defaultUri);
        expect(result?.error).toEqual(params.error);
        expect(logoutSpy).toHaveBeenCalledTimes(0);
        expect(getTokensSpy).toHaveBeenCalledTimes(0);
        expect(authorizeClientSpy).toHaveBeenCalledTimes(0);
    });

    test("has existing tokens with client sso params", async () => {
        params.redirectUri = redirectUri;
        const result = await AuthService.checkAuthenticationState(params, defaultUri);
        expect(result?.error).toBeUndefined();
        expect(result?.cachedAuth).toBeTruthy();
        expect(logoutSpy).toHaveBeenCalledTimes(0);
        expect(getTokensSpy).toHaveBeenCalledWith(true);
        expect(authorizeClientSpy).toHaveBeenCalledWith(params);
        expect(launchUri).toHaveBeenCalledTimes(1);
    });

    test("uses defaultUri when no redirectUri", async () => {
        delete params.redirectUri;
        const result = await AuthService.checkAuthenticationState(params, defaultUri);
        expect(result?.error).toBeUndefined();
        expect(result?.cachedAuth).toBeTruthy();
        expect(logoutSpy).toHaveBeenCalledTimes(0);
        expect(getTokensSpy).toHaveBeenCalledWith(true);
        expect(authorizeClientSpy).toHaveBeenCalledTimes(0);
        expect(launchUri).toHaveBeenCalledWith(defaultUri);
    });

    test("not authenticated - without forced logout", async () => {
        mockGetLocalStorage.mockReturnValue(undefined);
        mockGetCookie.mockReturnValue(undefined);

        const result = await AuthService.checkAuthenticationState(params, defaultUri);
        expect(result?.forceLogout).toBeFalsy();
        expect(result?.error).toBeUndefined();
        expect(result?.cachedAuth).toBeFalsy();
        expect(logoutSpy).toHaveBeenCalledTimes(0);
        expect(getTokensSpy).toHaveBeenCalledWith(true);
        expect(authorizeClientSpy).toHaveBeenCalledTimes(0);
        expect(launchUri).toHaveBeenCalledTimes(0);
    });
});

describe("Token Expired", () => {
    test("is Expired", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        expect(AuthService.tokenExpired()).toBeTruthy();
        expect(isTokenExpired).toHaveBeenCalledWith(authentication.accessToken);
    });
});

describe("Get Tokens", () => {
    let newAuthentication: any;

    beforeEach(function () {
        vi.clearAllMocks();

        newAuthentication = {
            accessToken: "newAccessToken",
            idToken: "newIdToken",
        };
        mockApiRequestPost.mockResolvedValue({
            success: true,
            authentication: newAuthentication,
        });
    });

    test("without refresh", async () => {
        mockIsTokenExpired.mockReturnValue(false);
        const tokens = await AuthService.getTokens(false);
        expect(tokens).toEqual(authentication);

        expect(getCookie).toHaveBeenCalledTimes(3);
        expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);

        expect(ApiRequest.post).toHaveBeenCalledTimes(0);
    });

    test("with refresh - not required", async () => {
        mockIsTokenExpired.mockReturnValue(false);
        const tokens = await AuthService.getTokens(true);
        expect(tokens).toEqual(authentication);

        expect(getCookie).toHaveBeenCalledTimes(3);
        expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);

        expect(ApiRequest.post).toHaveBeenCalledTimes(0);
    });

    test("with refresh - refresh required", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        const tokens = await AuthService.getTokens(true);
        expect(tokens).toEqual({
            ...authentication,
            ...newAuthentication,
        });

        expect(getCookie).toHaveBeenCalledTimes(4);
        expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);

        expect(ApiRequest.post).toHaveBeenCalledTimes(1);
    });

    test("fails with exception", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        mockApiRequestPost.mockRejectedValue(new Error());

        const tokens = await AuthService.getTokens(true);
        expect(tokens).toEqual(authentication); //returns what it had from cookies

        expect(getCookie).toHaveBeenCalledTimes(4);
        expect(getCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);

        expect(ApiRequest.post).toHaveBeenCalledTimes(1);
    });
});

describe("Refresh Tokens", () => {
    let newAuthentication: any;
    beforeEach(function () {
        newAuthentication = {
            accessToken: "newAccessToken",
            idToken: "newIdToken",
        };
        mockApiRequestPost.mockClear();
        mockApiRequestPost.mockResolvedValue({
            success: true,
            authentication: newAuthentication,
        });
    });

    test("successful", async () => {
        const result = await AuthService.tokenRefresh();
        expect(result).toEqual({ ...authentication, ...newAuthentication });

        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
        expect(ApiRequest.post).toHaveBeenCalledWith("/auth/token/refresh", {
            clientId,
            refreshToken: authentication.refreshToken,
        });
        expect(removeCookie).toHaveBeenCalledTimes(0);
    });

    test("no refresh token", async () => {
        mockGetCookie.mockReturnValue(undefined);

        const result = await AuthService.tokenRefresh();
        expect(result).toBeUndefined();

        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
        expect(ApiRequest.post).toHaveBeenCalledTimes(0);
        expect(removeCookie).toHaveBeenCalledTimes(3);
        expect(removeCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(removeCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(removeCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    });

    test("refresh without success", async () => {
        mockApiRequestPost.mockResolvedValue({
            success: false,
            authentication: newAuthentication,
        });

        const result = await AuthService.tokenRefresh();
        expect(result).toBeUndefined();

        expect(getCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
        expect(ApiRequest.post).toHaveBeenCalledWith("/auth/token/refresh", {
            clientId,
            refreshToken: authentication.refreshToken,
        });
        expect(removeCookie).toHaveBeenCalledTimes(3);
        expect(removeCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
        expect(removeCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
        expect(removeCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
    });
});

describe("Get Current User", () => {
    const user = <User>{
        name: "user name",
        email: "user@email.com",
    };
    const jwt = {
        ...user,
        exp: 99999,
        aud: "xxxxxx",
    };
    beforeEach(() => {
        mockDecodeToken.mockClear();
        mockDecodeToken.mockReturnValue(jwt);
    });

    test("get with token", async () => {
        expect(AuthService.getCurrentUser(authentication.idToken)).toEqual(user);
        expect(decodeToken).toHaveBeenCalledWith(authentication.idToken);
    });

    test("get without token", async () => {
        expect(AuthService.getCurrentUser()).toEqual(user);
        expect(decodeToken).toHaveBeenCalledWith(authentication.idToken);
    });

    test("get without no available token", async () => {
        mockGetCookie.mockReturnValue(undefined);
        mockDecodeToken.mockReturnValue(undefined);
        expect(AuthService.getCurrentUser()).toBeUndefined();
        expect(decodeToken).toHaveBeenCalledWith(undefined);
    });
});

describe("Login", () => {
    let username: string, password: string;
    beforeEach(async function () {
        username = "user@email.com";
        password = "p@$$w0rd";

        mockApiRequestPost.mockClear();
        mockApiRequestPost.mockResolvedValue(authResult);
    });

    test("successful login", async () => {
        const res = await AuthService.login(username, password);
        expect(res).toEqual({
            success: authResult.success,
            result: authResult.result,
        });

        expect(ApiRequest.post).toHaveBeenCalledWith("/auth/login", {
            clientId,
            username,
            password,
        });
    });
});

describe("Authorize Client", () => {
    let params: any;

    beforeEach(function () {
        params = {
            clientId,
            redirectUri,
            codeChallenge: "1234234234234",
            state: "someState",
        };
    });

    test("as expected", async () => {
        await AuthService.authorizeClient(params);

        const searchParams = new URLSearchParams(params);
        expect(launchUri).toHaveBeenCalledWith(`/auth/client/authorize?${searchParams.toString()}`);
    });

    test("no state", async () => {
        delete params.state;
        await AuthService.authorizeClient(params);

        const searchParams = new URLSearchParams(params);
        expect(launchUri).toHaveBeenCalledWith(`/auth/client/authorize?${searchParams.toString()}`);
    });

    test("no codeChallenge", async () => {
        delete params.codeChallenge;
        await AuthService.authorizeClient(params);

        const searchParams = new URLSearchParams(params);
        expect(launchUri).toHaveBeenCalledWith(`/auth/client/authorize?${searchParams.toString()}`);
    });
});

describe("Get Tokens for Client", () => {
    test("as expected", async () => {
        const code = "1234";
        const codeVerifier = "codeVerifier";

        await AuthService.getTokensForClient(clientId, redirectUri, code, codeVerifier);
        expect(ApiRequest.post).toHaveBeenCalledWith("/auth/client/token", {
            grantType: "authorization_code",
            clientId,
            redirectUri,
            code,
            codeVerifier,
        });
    });

    test("no codeVerifier", async () => {
        const code = "1234";
        await AuthService.getTokensForClient(clientId, redirectUri, code);
        expect(ApiRequest.post).toHaveBeenCalledWith("/auth/client/token", {
            grantType: "authorization_code",
            clientId,
            redirectUri,
            code,
        });
    });
});

test("Refresh Tokens for Client", async () => {
    await AuthService.refreshTokensForClient(clientId, authentication.refreshToken);
    expect(ApiRequest.post).toHaveBeenCalledWith("/auth/client/token", {
        grantType: "refresh_token",
        clientId,
        refreshToken: authentication.refreshToken,
    });
});

test("Logout", async () => {
    AuthService.logout();
    expect(removeCookie).toHaveBeenCalledTimes(3);
    expect(removeCookie).toHaveBeenCalledWith(ACCESS_TOKEN_KEY);
    expect(removeCookie).toHaveBeenCalledWith(ID_TOKEN_KEY);
    expect(removeCookie).toHaveBeenCalledWith(REFRESH_TOKEN_KEY);
});

describe("Verify Tokens", () => {
    let authentication: any;
    let spyRefreshTokensForClient: any;
    beforeEach(function () {
        authentication = defaultAuthentication();
        spyRefreshTokensForClient = vi.spyOn(AuthService, "refreshTokensForClient");
    });

    test("not expired", async () => {
        mockIsTokenExpired.mockReturnValue(false);

        const verified = await AuthService.verifyTokens(authentication, clientId);
        expect(verified).toEqual(authentication);

        expect(spyRefreshTokensForClient).toHaveBeenCalledTimes(0);
    });

    test("expired with refreshToken", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        const newTokens = {
            accessToken: "newAccessToken",
            idToken: "newIdToken",
        };
        mockApiRequestPost.mockResolvedValue({
            ...authResult,
            data: {
                authentication: newTokens,
            },
        });

        const verified = await AuthService.verifyTokens(authentication, clientId);
        expect(verified).toEqual({
            ...authentication,
            ...newTokens,
        });

        expect(spyRefreshTokensForClient).toHaveBeenCalledWith(clientId, authentication.refreshToken);
    });

    test("expired without refreshToken", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        delete authentication.refreshToken;

        const verified = await AuthService.verifyTokens(authentication, clientId);
        expect(verified).toEqual(authentication);

        expect(spyRefreshTokensForClient).toHaveBeenCalledTimes(0);
    });

    test("missing idToken", async () => {
        delete authentication.idToken;
        const newTokens = {
            accessToken: "newAccessToken",
            idToken: "newIdToken",
        };
        mockApiRequestPost.mockResolvedValue({
            ...authResult,
            data: {
                authentication: newTokens,
            },
        });

        const verified = await AuthService.verifyTokens(authentication, clientId);
        expect(verified).toEqual({
            ...authentication,
            ...newTokens,
        });

        expect(spyRefreshTokensForClient).toHaveBeenCalledWith(clientId, authentication.refreshToken);
    });

    test("missing idToken and refreshToken", async () => {
        delete authentication.idToken;
        delete authentication.refreshToken;

        const verified = await AuthService.verifyTokens(authentication, clientId);
        expect(verified).toEqual(authentication);

        expect(spyRefreshTokensForClient).toHaveBeenCalledTimes(0);
    });

    test("handles refresh exception", async () => {
        mockIsTokenExpired.mockReturnValue(true);
        mockApiRequestPost.mockRejectedValue(new Error());

        await expect(AuthService.verifyTokens(authentication, clientId)).rejects.toThrowError();
        expect(spyRefreshTokensForClient).toHaveBeenCalledWith(clientId, authentication.refreshToken);
    });
});
