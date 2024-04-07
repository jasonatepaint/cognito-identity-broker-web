/***
 *  Do not import anything that references react u/i or any visual components.
 *  The goal here is to limit the size of the js scripts imported on this page.
 */
import "regenerator-runtime/runtime";

import ReactDOM from "react-dom";
import React from "react";
import { LogLevel, Logger } from "./lib/utils/logging";
import { setupCommunication } from "./lib/sso";

Logger.setLogLevel(LogLevel.debug);
setupCommunication();

ReactDOM.render(
    <React.StrictMode></React.StrictMode>,

    document.getElementById("root"),
);
