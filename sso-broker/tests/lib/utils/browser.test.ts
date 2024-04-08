import { launchUri } from "../../../src/lib/utils/browser";

describe("Launch Uri", () => {
    const url = "https://domain.com";

    test("as expected", async () => {
        window.open = vi.fn().mockReturnValue({});
        await launchUri(url);
        expect(window.open).toHaveBeenCalledWith(url, "_self");
    });

    test("no proxy", async () => {
        window.open = vi.fn().mockReturnValue(undefined);
        let failed = false;
        await launchUri(url).catch(() => {
            failed = true;
        });
        expect(failed).toBeTruthy();
    });
});
