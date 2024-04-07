const levels = ["debug", "info", "warn", "error"];

const noop = function () {}; // eslint-disable-line
let logLevel: LogLevel | undefined, logger: any;

export enum LogLevel {
    debug = "debug",
    info = "info",
    warn = "warn",
    error = "error",
    critical = "critical",
}

export class Logger {
    private static get instance() {
        if (!logger) {
            Logger.setLogLevel(LogLevel.info); //default if not set
        }
        return logger;
    }

    static get prefix() {
        return "SSO Broker:";
    }

    static format(message: string) {
        return `${Logger.prefix} ${message}`;
    }

    static reset() {
        logger = undefined;
        logLevel = undefined;
    }

    static setLogLevel(level: LogLevel) {
        if (logger && logLevel === level) {
            return;
        }
        logger = {};
        logLevel = level;
        const shouldLog = function (lvl: string) {
            return levels.indexOf(lvl) >= levels.indexOf(level);
        };

        levels.forEach(function (lvl: string) {
            logger[lvl] = shouldLog(lvl) ? log : noop;

            function log() {
                arguments[0] = Logger.format(arguments[0]); // eslint-disable-line
                const con = console as any;
                con[lvl](...arguments); // eslint-disable-line
            }
        });
    }

    static debug(...data: any[]) {
        return Logger.instance.debug(...data);
    }
    static info(...data: any[]) {
        return Logger.instance.info(...data);
    }
    static log(...data: any[]) {
        return Logger.instance.info(...data);
    }
    static warn(...data: any[]) {
        return Logger.instance.warn(...data);
    }
    static error(...data: any[]) {
        return Logger.instance.error(...data);
    }
}
