import { base64Decode, base64Encode } from "../../../src/lib/utils/encoding";

describe("Base64 Encoding", () => {
    const value = "This is the Original Value";
    const encoded = "VGhpcyBpcyB0aGUgT3JpZ2luYWwgVmFsdWU=";

    test("encodes", async () => {
        expect(base64Encode(value)).toEqual(encoded);

        //invalid types
        expect(base64Encode(<any>undefined)).toEqual(undefined);
        expect(base64Encode(<any>null)).toEqual(undefined);
    });

    test("decodes", async () => {
        expect(base64Decode(encoded)).toEqual(value);

        expect(base64Decode(<any>undefined)).toEqual(undefined);
        expect(base64Decode(<any>null)).toEqual(undefined);
    });
});
