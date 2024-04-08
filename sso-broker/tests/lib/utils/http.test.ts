import {
    getQueryStringParams,
    addOrReplaceQueryStringValue,
    encodeQueryStringToState,
    decodeClientStateFromQS,
    addOrReplaceQueryStringValues,
} from "../../../src/lib/utils/http";
import qs from "query-string";
import { base64Encode } from "../../../src/lib/utils/encoding";

const search = "?user=one&other=two";

beforeEach(function () {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {
        assign: vi.fn(),
        search,
    };
});

describe("Get Querystring params", () => {
    test("as expected", () => {
        expect(getQueryStringParams()).toEqual({
            user: "one",
            other: "two",
        });
    });
});

describe("Add or Replace QueryString Param", () => {
    let params: any;
    beforeEach(function () {
        params = getQueryStringParams();
    });

    test("replaces as expected", async () => {
        expect(addOrReplaceQueryStringValue("user", "three")).toEqual(
            qs.stringify({
                ...params,
                user: "three",
            }),
        );
        expect(addOrReplaceQueryStringValue("other", "four")).toEqual(
            qs.stringify({
                ...params,
                other: "four",
            }),
        );
    });

    test("adds", async () => {
        expect(addOrReplaceQueryStringValue("newParam", "value")).toEqual(
            qs.stringify({
                ...params,
                newParam: "value",
            }),
        );
    });

    test("multiple values", async () => {
        const email = "user@email.com";
        const referrer = "https://domain.com";

        const queryString = addOrReplaceQueryStringValues({
            user: email,
            other: true,
            referrer,
        });
        expect(queryString).toEqual(
            qs.stringify({
                user: email,
                other: true,
                referrer: referrer,
            }),
        );
    });
});

describe("Encode Querystring to State", () => {
    test("as expected", async () => {
        window.location.search = "?clientId=123456&redirectUri=https://app.com&state=xxxxxxxxx";

        const state = encodeQueryStringToState();

        const params = getQueryStringParams();
        expect(state).toEqual(base64Encode(JSON.stringify(params)));
    });

    test("no querystring", async () => {
        window.location.search = "";

        const state = encodeQueryStringToState();
        expect(state).toEqual(base64Encode(JSON.stringify({})));
    });
});

describe("Decode ClientState from Querystring", () => {
    test("as expected", async () => {
        const state = {
            referrer: "https://client.app.com",
        };
        const encodedState = base64Encode(JSON.stringify(state));
        window.location.search = `?clientId=123456&redirectUri=https://app.com&state=${encodedState}`;

        const clientState = decodeClientStateFromQS();
        expect(clientState).toEqual(state);
    });

    test("no state", async () => {
        const clientState = decodeClientStateFromQS();
        expect(clientState).toEqual({});
    });
});
