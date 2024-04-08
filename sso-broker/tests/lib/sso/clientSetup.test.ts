import { setupCommunication, eventListenerCallback } from "../../../src/lib/sso/clientSetup";
import { processMessage } from "../../../src/lib/sso/messageHandler";

vi.mock("../../../src/lib/sso/messageHandler");

let windowSpy: any;
beforeEach(() => {
    windowSpy = vi.spyOn(global, "window", "get");
});

afterEach(() => {
    windowSpy.mockRestore();
});

describe("Initialize Communication", () => {
    test("should add postmessage event listener if in an iframe", async () => {
        const addEventListener = vi.fn();
        windowSpy.mockImplementation(() => ({
            location: {
                href: "https://child.location.com",
            },
            parent: {
                location: {
                    href: "https://parent.location.com",
                },
            },
            addEventListener,
        }));

        setupCommunication();
        expect(addEventListener).toHaveBeenCalledTimes(1);
    });

    it("should not add postmessage event listener if not in an iframe", async () => {
        const addEventListener = vi.fn();
        const location = {
            href: "https://my.location.com",
        };
        windowSpy.mockImplementation(() => ({
            location,
            parent: {
                location,
            },
            addEventListener,
        }));

        setupCommunication();
        expect(addEventListener).toHaveBeenCalledTimes(0);
    });
});

describe("Event Listener Callback", () => {
    test("as expected", async () => {
        const message = { msg: "something" };
        await eventListenerCallback(<any>message);
        expect(processMessage).toHaveBeenCalledWith(message);
    });
});
