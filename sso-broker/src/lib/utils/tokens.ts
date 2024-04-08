import jwt, { JwtPayload } from "jsonwebtoken";
import dayjs from "dayjs";

export const TOKEN_REFRESH_EXPIRATION_BUFFER_SECONDS = 60;

export const decodeToken = (token?: string) => {
    try {
        if (!token) {
            return;
        }
        return <JwtPayload>jwt.decode(token, {});
    } catch (e) {
        /* istanbul ignore next */
    }
};

/**
 * Determines if the token is expired
 * @param accessToken - The user's access JWT token
 */
export const isTokenExpired = (accessToken?: string) => {
    try {
        if (!accessToken) {
            return true;
        }
        const decodedToken = <JwtPayload>jwt.decode(accessToken, {});
        return dayjs().isAfter(
            dayjs.unix(<number>decodedToken.exp).subtract(TOKEN_REFRESH_EXPIRATION_BUFFER_SECONDS, "second"),
        );
    } catch (e) {
        return true;
    }
};
