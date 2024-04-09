import { Buffer } from "buffer";

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
