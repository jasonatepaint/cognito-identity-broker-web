import { TokenCollection } from "@jasonatepaint/cognito-sso-client";

const accessToken = "accessToken";
const idToken = "idToken";
const refreshToken = "refreshToken";

export const defaultAuthentication = () => {
    return <TokenCollection>{ accessToken, idToken, refreshToken };
};

export const defaultUser = () => {
    return {
        name: "firstName LastName",
        email: "user@email.com",
    };
};
