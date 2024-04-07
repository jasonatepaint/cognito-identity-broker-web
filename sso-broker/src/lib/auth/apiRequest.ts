import axios, { AxiosRequestConfig, Method } from "axios";

const baseURL = "/";
const timeout = 30000;

axios.defaults.validateStatus = (status) => {
    return status < 500;
};

const execute = async (
    method: Method,
    partialPath: string,
    data: AxiosRequestConfig["data"] = undefined,
    params: AxiosRequestConfig["params"] = undefined,
    headers: AxiosRequestConfig["headers"] = undefined,
) => {
    const options: AxiosRequestConfig = {
        method,
        url: partialPath,
        withCredentials: true,
        baseURL,
        timeout,
    };
    if (data) {
        options.data = data;
    }
    if (params) {
        options.params = params;
    }
    if (headers) {
        options.headers = headers;
    }
    const result = await axios.request(options);
    return result.data;
};

const post = async (
    path: string,
    data: AxiosRequestConfig["data"],
    headers: AxiosRequestConfig["headers"] = undefined,
) => {
    return execute("POST", path, data, headers);
};

export const ApiRequest = {
    post,
};
