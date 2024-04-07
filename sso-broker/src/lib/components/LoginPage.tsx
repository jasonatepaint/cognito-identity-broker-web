import React, { useState } from "react";
import { AuthService } from "../auth";
import { getQueryStringParams } from "../utils/http.ts";
import { BeatLoader } from "react-spinners";
import { useAsync } from "react-async-hook";

const initialUsername = import.meta.env.VITE_USERNAME;
const initialPassword = import.meta.env.VITE_PASSWORD;
const defaultClientAppRedirectUri = "http://localhost:3001";

const LoginPage: React.FC<any> = () => {
    const isAuthenticated = !AuthService.tokenExpired();
    const [loading, setLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string>(initialUsername);
    const [password, setPassword] = useState<string>(initialPassword);
    const [error, setError] = useState<string | undefined>(undefined);
    const params = getQueryStringParams();

    useAsync(async () => {
        if (isAuthenticated) {
            setLoading(true);
        }
        await AuthService.checkAuthenticationState(params, defaultClientAppRedirectUri);
        setLoadingOff(true);
    }, []);

    const setLoadingOff = (delay = false) => {
        return delay
            ? setTimeout(() => {
                  setLoading(false);
              }, 1000)
            : setLoading(false);
    };

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(undefined);
        setLoading(true);
        const params = getQueryStringParams();
        const response = await AuthService.login(username, password);
        if (response.success) {
            const redirectUri = params["redirectUri"] || params["referrer"];
            if (redirectUri) {
                await AuthService.authorizeClient({ ...params, redirectUri });
            }
            setLoadingOff(true);
        } else {
            setError(response.error);
            setLoadingOff();
        }
    };

    return (
        <div>
            {loading && (
                <div className="overlay">
                    <div className="overlay-content">
                        <BeatLoader loading={true} />
                        <div style={{ color: "black" }}>Authenticating...</div>
                    </div>
                </div>
            )}
            <div className="container">
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            autoComplete="username"
                            onChange={handleUsernameChange}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <button type="submit">Login</button>
                    {error && <div className="error">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
