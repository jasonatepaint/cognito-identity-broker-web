import { isNullOrEmpty } from "../../../src/lib/utils/strings";

describe("Is Null or Empty", () => {
    test("undefined", async () => {
        expect(isNullOrEmpty()).toBeTruthy();
    });

    test("null", async () => {
        expect(isNullOrEmpty(<any>null)).toBeTruthy();
    });

    test("empty", async () => {
        expect(isNullOrEmpty("")).toBeTruthy();
    });

    test("valid", async () => {
        expect(isNullOrEmpty("hello")).toBeFalsy();
    });
});
