import axios, { AxiosRequestConfig, Method } from "axios";

const baseURL = "/";
const timeout = 5000;

//Don't throw exceptions for 40x calls, instead process them
axios.defaults.validateStatus = (status) => {
    return status < 500;
};

const execute = async (
    method: Method,
    partialPath: string,
    data: AxiosRequestConfig["data"] = undefined,
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
    if (headers) {
        options.headers = headers;
    }
    const result = await axios.request(options);
    return result.data;
};

export class ApiRequest {
    static async post(
        path: string,
        data: AxiosRequestConfig["data"],
        headers: AxiosRequestConfig["headers"] = undefined,
    ) {
        return execute("POST", path, data, headers);
    }
}
