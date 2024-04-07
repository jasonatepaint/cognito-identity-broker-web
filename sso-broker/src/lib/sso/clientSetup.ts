import { processMessage } from "./messageHandler";

export const setupCommunication = () => {
    if (window.location === window.parent.location) {
        // not in an iframe
        /* istanbul ignore next */
        return;
    }
    window.addEventListener("message", eventListenerCallback, false);
};

export const eventListenerCallback = async (message: MessageEvent) => {
    await processMessage(message);
};
