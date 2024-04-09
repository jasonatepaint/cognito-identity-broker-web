import { ApiRequest } from "../../../src/lib/auth/apiRequest";
import axios from "axios";
import {defaultAuthentication} from "../../data.ts";
import {Mock} from "vitest";

vi.mock("axios");

const mockAxios = axios.request as Mock;

beforeEach(function () {
    vi.clearAllMocks();
    // @ts-ignore
    axios.defaults.validateStatus(200);
});

describe("Post Method", () => {
    let response: any;

    beforeEach(function () {
        response = {
            data: {
                success: true,
                result: "logged_in",
                authentication: defaultAuthentication()
            }
        };
        mockAxios.mockResolvedValue(response);
    });

    test("successful request", async () => {
        const path = "/auth/login";
        const data = {
            username: "user@email.com",
            password: "password"
        };
        const headers = {
            "Content-Type": "application/json"
        };
        const r = await ApiRequest.post(path, data, headers);
        expect(r).toEqual(response.data);

        expect(axios.request).toHaveBeenCalledWith({
            method: "POST",
            url: path,
            withCredentials: true,
            baseURL: "/",
            timeout: 5000,
            data,
            headers
        });
    });

});
