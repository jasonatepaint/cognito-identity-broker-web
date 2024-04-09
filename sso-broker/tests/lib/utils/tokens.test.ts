import { isTokenExpired, decodeToken } from "../../../src/lib/utils/tokens";
//import { verifyTokens } from "../../../src/lib/sso/utils.js";
import { defaultAuthentication } from "../../data.js";
import jwt from "jsonwebtoken";
import { Mock } from "vitest";
import dayjs from "dayjs";

vi.mock("jsonwebtoken");

const mockDecode = jwt.decode as Mock;

const date = new Date();
const authentication = defaultAuthentication();

beforeEach(function () {
    vi.clearAllMocks();

    //expires in 30 mins
    mockDecode.mockReturnValue({
        exp: dayjs(date).add(30, "minute").unix(),
    });
});

describe("is Token Expired", () => {
    test("is not expired", async () => {
        expect(isTokenExpired(authentication.accessToken)).toBeFalsy();
        expect(jwt.decode).toHaveBeenCalledWith(authentication.accessToken, {});
    });

    test("is expired", async () => {
        //expired 30 mins ago
        mockDecode.mockReturnValue({
            exp: dayjs(date).subtract(30, "minute").unix(),
        });
        expect(isTokenExpired(authentication.accessToken)).toBeTruthy();
        expect(jwt.decode).toHaveBeenCalledWith(authentication.accessToken, {});
    });

    test("no token", async () => {
        expect(isTokenExpired(undefined)).toBeTruthy();
        expect(jwt.decode).toHaveBeenCalledTimes(0);
    });

    test("decode token throws exception", async () => {
      mockDecode.mockImplementation(() => {
        throw new Error('some-error');
      });
      expect(isTokenExpired(authentication.accessToken)).toBeTruthy();
      expect(jwt.decode).toHaveBeenCalledTimes(1);
    });
});

describe("decode token", () => {
    const token = {
        exp: dayjs(date).unix(),
        name: "user",
        email: "user@email.com",
    };
    beforeEach(() => {
        mockDecode.mockReturnValue(token);
    });

    test("as expected", async () => {
        expect(decodeToken(authentication.idToken)).toEqual(token);
        expect(jwt.decode).toHaveBeenCalledWith(authentication.idToken, {});
    });

    test("no token", async () => {
        expect(decodeToken(undefined)).toBeUndefined();
        expect(jwt.decode).toHaveBeenCalledTimes(0);
    });
});
