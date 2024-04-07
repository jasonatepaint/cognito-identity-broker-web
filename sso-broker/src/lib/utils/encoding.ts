import { Buffer } from "buffer";
import sha256 from "crypto-js/sha256";
import Base64 from "crypto-js/enc-base64";

/**
 * Encodes a string into a base64 string
 */
export const base64Encode = (unEncodedValue: string) => {
    if (!unEncodedValue) {
        return undefined;
    }
    return Buffer.from(unEncodedValue).toString("base64");
};

/**
 * Decodes a base84 string back to its original value
 */
export const base64Decode = (encodedValue: string) => {
    if (!encodedValue) {
        return undefined;
    }
    return Buffer.from(encodedValue, "base64").toString("ascii");
};

/* istanbul ignore next */
export const generateChallenge = (code: string) => {
    return base64URL(sha256(code));
};

/* istanbul ignore next */
export const base64URL = (value: any) => {
    return value.toString(Base64).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

/* istanbul ignore next */
export const generateRandom = (size: number) => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const buffer = new Uint8Array(size);
    if (typeof window !== "undefined" && !!window.crypto) {
        window.crypto.getRandomValues(buffer);
    } else {
        for (let i = 0; i < size; i += 1) {
            buffer[i] = (Math.random() * CHARSET.length) | 0;
        }
    }
    return bufferToString(buffer);
};

/* istanbul ignore next */
export const bufferToString = (buffer: any) => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join("");
};
