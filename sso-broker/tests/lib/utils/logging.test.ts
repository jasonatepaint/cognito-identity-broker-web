import { LogLevel, Logger } from "../../../src/lib/utils/logging";

const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
const info = vi.spyOn(console, "info").mockImplementation(() => {});
const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
const error = vi.spyOn(console, "error").mockImplementation(() => {});

describe("Logger", () => {
    beforeEach(function () {
        vi.clearAllMocks();
        Logger.reset();
    });

    const logIt = (level: LogLevel) => {
        Logger.setLogLevel(level);
        Logger.debug("debug");
        Logger.info("info");
        Logger.log("log");
        Logger.warn("warn");
        Logger.error("error");
    };

	test("log as debug", async () => {
        logIt(LogLevel.debug);

        expect(debug).toHaveBeenCalledWith(Logger.format("debug"));
        expect(info).toHaveBeenCalledWith(Logger.format("log"));
        expect(info).toHaveBeenCalledWith(Logger.format("info"));
        expect(warn).toHaveBeenCalledWith(Logger.format("warn"));
        expect(error).toHaveBeenCalledWith(Logger.format("error"));
    });

    test("log as info", async () => {
        logIt(LogLevel.info);

        expect(debug).toHaveBeenCalledTimes(0);
        expect(info).toHaveBeenCalledWith(Logger.format("log"));
        expect(info).toHaveBeenCalledWith(Logger.format("info"));
        expect(warn).toHaveBeenCalledWith(Logger.format("warn"));
        expect(error).toHaveBeenCalledWith(Logger.format("error"));
    });

    test("log as warn", async () => {
        logIt(LogLevel.warn);

        expect(debug).toHaveBeenCalledTimes(0);
        expect(info).toHaveBeenCalledTimes(0);
        expect(info).toHaveBeenCalledTimes(0);
        expect(warn).toHaveBeenCalledWith(Logger.format("warn"));
        expect(error).toHaveBeenCalledWith(Logger.format("error"));
    });

    test("log as error", async () => {
        logIt(LogLevel.error);

        expect(debug).toHaveBeenCalledTimes(0);
        expect(info).toHaveBeenCalledTimes(0);
        expect(info).toHaveBeenCalledTimes(0);
        expect(warn).toHaveBeenCalledTimes(0);
        expect(error).toHaveBeenCalledWith(Logger.format("error"));
    });

    test("handles rest parameters", async () => {
        Logger.setLogLevel(LogLevel.debug);
        Logger.debug("debug", { some: "thing" }, ["test"]);
        expect(debug).toHaveBeenCalledWith(Logger.format("debug"), { some: "thing" }, ["test"]);
    });

	test('set logLevel returns', async () => {
		Logger.setLogLevel(LogLevel.debug);
		Logger.setLogLevel(LogLevel.debug); //second setting
		Logger.debug("debug");
		expect(debug).toHaveBeenCalledWith(Logger.format("debug"))
	});
});
