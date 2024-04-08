import {
    getLocalStorageWithExpiration,
    setLocalStorageWithExpiration,
    removeFromLocalStorage,
    getCookie,
    setCookie,
    removeCookie,
    getLocalStorage,
    setLocalStorage,
} from "../../../src/lib/utils/storage";

const date = new Date();
vi.useFakeTimers().setSystemTime(date);

const key = "theKey";
const value = JSON.stringify({ item: "theValue" });
let localStorage: Storage;

beforeAll(() => {
    localStorage = window.localStorage;
});

describe("Local Storage", () => {
    test("Get", async () => {
        localStorage.setItem(key, JSON.stringify(value));
        expect(getLocalStorage(key)).toEqual(value);
    });

    test("Get With Expiration", async () => {
        localStorage.setItem(
            key,
            JSON.stringify({
                value,
                expiration: new Date(new Date().getFullYear() + 1, 1, 1).getTime(),
            }),
        );
        expect(getLocalStorageWithExpiration(key)).toEqual(value);
        expect(localStorage.getItem(key)).toBeDefined();
    });

    test("Get With Expiration - expired", async () => {
        localStorage.setItem(
            key,
            JSON.stringify({
                value,
                expiration: Date.now() - 100, //expired 100ms ago
            }),
        );
        expect(getLocalStorageWithExpiration(key)).toBeNull();
        expect(localStorage.getItem(key)).toBeNull();
    });

    test("Set", async () => {
        setLocalStorage(key, value);
        const item = JSON.parse(<string>localStorage.getItem(key));
        expect(item).toEqual(value);
    });

    test("Set with Expiration", async () => {
        setLocalStorageWithExpiration(key, value, 5);
        const item = JSON.parse(<string>localStorage.getItem(key));
        expect(item.value).toEqual(value);
        expect(item.expiration).toEqual(date.getTime() + 5000);
    });

    test("Remove from storage", async () => {
        setLocalStorageWithExpiration(key, value, 5);
        removeFromLocalStorage(key);
        expect(localStorage.getItem(key)).toBeNull();
    });
});

describe("Cookies", () => {
    const name = "myCookie";
    const value = "myValue";
    const expiration = new Date(date.getTime() + 5000).toISOString();
    const getFn = vi.fn();
    const setFn = vi.fn();
    let cookie;

    beforeEach(function () {
        vi.clearAllMocks();
        Object.defineProperty(document, "cookie", {
            get: getFn,
            set: setFn,
        });

        cookie = `cookieOne=1234abc; ${name}=${value}; cookie2=4567def;`;

        getFn.mockReturnValue(cookie);
        setFn.mockReturnValue({});
    });

    test("Get Cookie", async () => {
        const v = getCookie(name);
        expect(v).toEqual(value);
        expect(getFn).toHaveBeenCalled();

        expect(getCookie("cookieOne")).toEqual("1234abc");
        expect(getCookie("cookie2")).toEqual("4567def");
    });

    test("Get Cookie - no value", async () => {
        getFn.mockReturnValue("");
        const v = getCookie(name);
        expect(v).toBeUndefined();
        expect(getFn).toHaveBeenCalled();
    });

    test("Remove Cookie", async () => {
        removeCookie(name);
        expect(setFn).toHaveBeenCalled();

        const param = setFn.mock.calls[0][0];
        console.log(param);

        expect(param).toContain(`${name}=;`);
        expect(param).toContain(`Expires=Thu, 01 Jan 1970 00:00:00 UTC;`);
    });

    test("Set Cookie", async () => {
        setCookie(name, value, expiration);

        expect(setFn).toHaveBeenCalled();
        const param = setFn.mock.calls[0][0];
        console.log(param);

        expect(param).toContain(`${name}=${value};`);
        expect(param).toContain(`Expires=${expiration}`);
    });
});
