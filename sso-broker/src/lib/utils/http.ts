import qs from "query-string";
import { base64Decode, base64Encode } from "./encoding";

/**
 * Returns a JSON object from the querystring parameters on the window.location.search
 */
export const getQueryStringParams = () => {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
};

/**
 * Returns a query string with parameter value added or replaced
 */
export const addOrReplaceQueryStringValue = (parameterName: string, parameterValue: string) => {
    const params = getQueryStringParams();
    params[parameterName] = parameterValue;
    return qs.stringify(params);
};

export const addOrReplaceQueryStringValues = (values: Record<string, any>) => {
    const params = getQueryStringParams();
    const modifiedParams = { ...params, ...values };
    return qs.stringify(modifiedParams);
};

export const encodeQueryStringToState = () => {
    const params = getQueryStringParams();
    return base64Encode(JSON.stringify(params));
};

export const decodeClientStateFromQS = () => {
    const params = getQueryStringParams();
    return params.state ? JSON.parse(base64Decode(params.state) || "{}") : {};
};
