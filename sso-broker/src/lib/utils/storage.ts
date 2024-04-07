import Cookies from "universal-cookie";

const localStorage = window.localStorage;
const cookies = new Cookies();

export const getLocalStorage = (name: string) => {
    const data = localStorage.getItem(name);
    return data ? JSON.parse(data) : undefined;
};

export const getLocalStorageWithExpiration = (name: string) => {
    const item = getLocalStorage(name);
    if (item) {
        if (item.expiration > new Date().getTime()) {
            return item.value;
        } else {
            removeFromLocalStorage(name);
            return null;
        }
    }
};

export const setLocalStorage = (name: string, value: any) => {
    const data = JSON.stringify(value);
    localStorage.setItem(name, data);
};

/***
 * Puts an item in storage with a TTL
 * @param name - key of item
 * @param value - item value
 * @param ttl - Time to Live in seconds
 */
export const setLocalStorageWithExpiration = (name: string, value: string, ttl: number) => {
    const now = new Date();
    const item = {
        value: value,
        expiration: now.getTime() + ttl * 1000,
    };
    setLocalStorage(name, item);
};

export const removeFromLocalStorage = (name: string) => {
    localStorage.removeItem(name);
};

export const getCookie = (key: string) => {
    return cookies.get(key);
};

export const removeCookie = (key: string) => {
    setCookie(key, null, "Thu, 01 Jan 1970 00:00:00 UTC");
};

export const setCookie = (name: string, value: string | null, expire: string) => {
    document.cookie = `${name}=${
        !value ? "" : encodeURIComponent(value)
    }; SameSite=None; Secure; Expires=${expire}; Path=/;`;
};
