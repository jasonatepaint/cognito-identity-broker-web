import "./App.css";
import { useState, useEffect, useRef } from "react";
import { SsoClient, LogLevel, ResponseMessage } from "@jasonatepaint/cognito-sso-client";
import { getClientState } from "./clientState";
import { BeatLoader } from "react-spinners";
import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const BROKER_URL = import.meta.env.VITE_BROKER_URL;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const BROKER_CLIENT_URL = `${BROKER_URL}/client/`;

function App() {
    const authFrameRef = useRef<HTMLIFrameElement>(null);
    const isAuthenticated = SsoClient.authentication !== undefined;
    const [authenticated, setAuthenticated] = useState(isAuthenticated.toString());
    const [responseMessage, setResponse] = useState<object | undefined>(undefined);
    const [checkAuthRedirect, setCheckAuthRedirect] = useState(true);
    const [logoutRedirect, setLogoutRedirect] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
        setAuthenticated(isAuthenticated.toString());
        SsoClient.initialize(
            BROKER_URL,
            CLIENT_ID,
            REDIRECT_URI,
            authFrameRef.current as HTMLIFrameElement,
            {
                logLevel: LogLevel.info,
            },
            () => {
                const state = getClientState();
                SsoClient.checkAuthentication({ redirect: true }, state);
            },
        );
        SsoClient.registerCallback("default", onAuthResponse);
    }, []);

    /**
     * A generic callback where we'll catch all messages and set u/i elements
     * @param r - command response
     */
    const onAuthResponse = (r: ResponseMessage) => {
        const { user, isAuthenticated = false } = r.details;
        setIsProcessing(false);
        setAuthenticated(isAuthenticated.toString());
        setEmail(user?.email || "");
        setName(user?.name || "");
        setResponse(r);
    };

    const onCheckAuthenticationClick = () => {
        setIsProcessing(true);
        const state = getClientState();
        const options = {
            redirect: checkAuthRedirect,
        };
        SsoClient.checkAuthentication(options, state);
    };

    const onLogoutClick = () => {
        setIsProcessing(true);
        const state = getClientState();
        const options = {
            clientOnly: false,
            redirect: logoutRedirect,
        };
        SsoClient.logout(options, state);
    };

    const onRefreshTokensClick = () => {
        setIsProcessing(true);
        const state = getClientState();
        SsoClient.refreshTokens(state);
    };

    return (
        <div>
            <iframe
                style={{ display: "none" }}
                ref={authFrameRef}
                id="authFrame"
                sandbox="allow-same-origin allow-scripts"
                src={BROKER_CLIENT_URL}
            ></iframe>
            {isProcessing && (
                <div className="overlay">
                    {/* Your overlay content goes here */}
                    <div className="overlay-content">
                        <BeatLoader loading={true} />
                    </div>
                </div>
            )}
            <div className="container">
                <main role="main" className="pb-3">
                    <div className="text-center">
                        <div className="grid-container">
                            <div className="grid-item-header grid-header"></div>
                            <div className="grid-item">
                                <span className="grid-item-label">Authenticated:</span>
                                <span className="grid-item-data">{authenticated}</span>
                            </div>
                            <div className="grid-item">
                                <span className="grid-item-label">Email:</span>
                                <span className="grid-item-data">{email}</span>
                            </div>
                            <div className="grid-item">
                                <span className="grid-item-label">Name:</span>
                                <span className="grid-item-data">{name}</span>
                            </div>
                        </div>
                        <div className="grid-container">
                            <div className="grid-item-header grid-header">SSO Broker Response</div>
                        </div>
                        {responseMessage && <JsonView value={responseMessage} style={githubLightTheme} />}
                    </div>
                    <div className="grid-container">
                        <div className="grid-item">
                            <div className="function-label">Check Authentication</div>
                            <span className="grid-item-label">Redirect to Login:</span>
                            <input
                                type="checkbox"
                                defaultChecked={checkAuthRedirect}
                                onChange={(e) => setCheckAuthRedirect(e.target.checked)}
                            />
                            <div className="button-wrap">
                                <button type="button" onClick={onCheckAuthenticationClick}>
                                    Test
                                </button>
                            </div>
                        </div>
                        <div className="grid-item">
                            <div className="function-label">Logout</div>
                            <span className="grid-item-label">Redirect to Login:</span>
                            <input
                                type="checkbox"
                                id="cb-logout-redirect"
                                defaultChecked={logoutRedirect}
                                onChange={(e) => setLogoutRedirect(e.target.checked)}
                            />
                            <div className="button-wrap">
                                <button type="button" onClick={onLogoutClick}>
                                    Test
                                </button>
                            </div>
                        </div>
                        <div className="grid-item">
                            <div className="function-label">Refresh Token</div>
                            <div style={{ padding: "10px" }}></div>
                            <div className="button-wrap">
                                <button type="button" onClick={onRefreshTokensClick}>
                                    Test
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
